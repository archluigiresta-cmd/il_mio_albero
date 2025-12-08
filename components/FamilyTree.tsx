import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { 
  Search, 
  Edit2,
  Maximize,
  Minimize,
  GitBranch
} from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../constants';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
  onOpenEditor: (person: Person) => void;
}

type FilterType = 'all' | 'focused';

interface HierarchyNode {
  id: string;
  person: Person;
  spouse?: Person;
  children: HierarchyNode[];
}

const VIRTUAL_ROOT_ID = 'VIRTUAL_ROOT';

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId, onOpenEditor }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [filterMode, setFilterMode] = useState<FilterType>('all');
  const [rootId, setRootId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleResize = () => {
        if (wrapperRef.current) {
            setDimensions({
                width: wrapperRef.current.clientWidth,
                height: wrapperRef.current.clientHeight
            });
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const findOldestAncestor = (id: string): string => {
      let current = data.find(p => p.id === id);
      if (!current) return id;
      while (current && current.fatherId) {
          const next = data.find(p => p.id === current.fatherId);
          if (next) current = next; else break;
      }
      return current?.id || id;
  };

  // Pulizia automatica expandedIds all'avvio
  useEffect(() => {
    if (data.length > 0) {
      setExpandedIds(new Set(data.map(p => p.id)));
      if (!rootId) setRootId(findOldestAncestor(data[0].id));
    }
  }, [data]);

  const treeData = useMemo(() => {
      const buildDescendants = (id: string, depth: number, visited = new Set()): HierarchyNode | null => {
          if (visited.has(id)) return null;
          visited.add(id);

          const p = data.find(x => x.id === id);
          if (!p) return null;
          
          let spouse: Person | undefined;
          if (p.spouseIds.length > 0) spouse = data.find(s => s.id === p.spouseIds[0]);

          const isExpanded = expandedIds.has(id) || depth === 0;
          let childrenNodes: HierarchyNode[] = [];
          
          if (isExpanded) {
             childrenNodes = p.childrenIds
                .map(cid => buildDescendants(cid, depth + 1, visited))
                .filter((n): n is HierarchyNode => n !== null);
          }

          return {
              id: p.id,
              person: p,
              spouse,
              children: childrenNodes
          };
      };

      if (filterMode === 'all') {
          // LOGICA SMART ROOTS: Filtra per evitare che i coniugi appaiano come radici separate se sono già nel ramo di qualcuno
          const potentialRoots = data.filter(p => !p.fatherId && !p.motherId);
          const roots = potentialRoots.filter(r => {
              // Se r è coniuge di qualcuno che HA genitori, non è una radice "vera" per la foresta (è già dentro un altro albero)
              const isSpouseOfLinked = data.some(other => 
                  other.spouseIds.includes(r.id) && (other.fatherId || other.motherId)
              );
              return !isSpouseOfLinked;
          }).sort((a, b) => (a.birthDate || '9').localeCompare(b.birthDate || '9'));

          const visitedGlobal = new Set();
          return {
              id: VIRTUAL_ROOT_ID,
              person: { id: VIRTUAL_ROOT_ID } as Person,
              children: roots.map(r => buildDescendants(r.id, 0, visitedGlobal)).filter((n): n is HierarchyNode => n !== null),
          };
      }

      if (!rootId) return null;
      return buildDescendants(rootId, 0);
  }, [data, rootId, expandedIds, filterMode]);

  useEffect(() => {
      if (!treeData || !svgRef.current || !dimensions.width) return;

      const { width, height } = dimensions;
      const CARD_WIDTH = 220;
      const CARD_HEIGHT = 90;
      const H_GAP = 60;
      const V_GAP = 120;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      const g = svg.append("g");

      const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.05, 2])
          .on("zoom", (e) => g.attr("transform", e.transform));
      
      svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(width/2, 100).scale(0.6));

      const root = d3.hierarchy<HierarchyNode>(treeData);
      
      const treeLayout = d3.tree<HierarchyNode>()
          .nodeSize([CARD_WIDTH + H_GAP, CARD_HEIGHT + V_GAP])
          .separation((a, b) => {
              const aWidth = a.data.spouse ? 2.5 : 1.2;
              const bWidth = b.data.spouse ? 2.5 : 1.2;
              const base = (aWidth + bWidth) / 2;
              return a.parent === b.parent ? base : base + 1;
          });

      treeLayout(root);

      // Links ortogonali puliti
      g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 1.5)
        .attr("opacity", d => d.source.data.id === VIRTUAL_ROOT_ID ? 0 : 0.8)
        .attr("d", d => {
            const sx = d.source.x, sy = d.source.y;
            const tx = d.target.x, ty = d.target.y;
            const my = (sy + ty) / 2;
            return `M${sx},${sy + CARD_HEIGHT/2} V${my} H${tx} V${ty - CARD_HEIGHT/2}`;
        });

      // Nodes
      const nodes = g.selectAll(".node")
          .data(root.descendants())
          .enter()
          .append("g")
          .attr("transform", d => `translate(${d.x},${d.y})`);

      nodes.each(function(d) {
          if (d.data.id === VIRTUAL_ROOT_ID) return;
          const gNode = d3.select(this);
          const p = d.data.person;
          const s = d.data.spouse;

          const drawPerson = (person: Person, cardX: number) => {
              const card = gNode.append("g").attr("transform", `translate(${cardX},0)`);
              const isSelected = person.id === selectedPersonId;

              card.append("rect")
                 .attr("x", -CARD_WIDTH/2)
                 .attr("y", -CARD_HEIGHT/2)
                 .attr("width", CARD_WIDTH)
                 .attr("height", CARD_HEIGHT)
                 .attr("rx", 10)
                 .attr("fill", isSelected ? "#f0fdf4" : "white")
                 .attr("stroke", isSelected ? "#059669" : (person.gender === Gender.Male ? "#3b82f6" : "#ec4899"))
                 .attr("stroke-width", isSelected ? 3 : 2)
                 .style("cursor", "pointer")
                 .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

              // Avatar
              card.append("clipPath").attr("id", `cp-${person.id}`).append("circle").attr("r", 20).attr("cx", -CARD_WIDTH/2 + 28).attr("cy", 0);
              card.append("image")
                 .attr("xlink:href", person.photoUrl || PLACEHOLDER_IMAGE)
                 .attr("x", -CARD_WIDTH/2 + 8).attr("y", -20).attr("width", 40).attr("height", 40)
                 .attr("clip-path", `url(#cp-${person.id})`);

              // Text
              card.append("text").attr("x", -CARD_WIDTH/2 + 55).attr("y", -10).style("font-size", "13px").style("font-weight", "bold").style("fill", "#0f172a").text(person.firstName);
              card.append("text").attr("x", -CARD_WIDTH/2 + 55).attr("y", 6).style("font-size", "11px").style("fill", "#334155").text(person.lastName);
              card.append("text").attr("x", -CARD_WIDTH/2 + 55).attr("y", 22).style("font-size", "9px").style("fill", "#64748b").text(`${person.birthDate?.slice(-4) || '?'} - ${person.deathDate?.slice(-4) || (person.isLiving ? 'Viv' : '?')}`);

              // Jump Icon
              if (person.fatherId || person.motherId) {
                  const j = card.append("g")
                    .attr("transform", `translate(0, -${CARD_HEIGHT/2})`)
                    .style("cursor", "pointer")
                    .on("click", (e) => { e.stopPropagation(); setFilterMode('focused'); setRootId(findOldestAncestor(person.id)); });
                  j.append("circle").attr("r", 10).attr("fill", "white").attr("stroke", "#cbd5e1");
                  j.append("path").attr("d", "M-3 1 L0 -2 L3 1 M0 -2 V3").attr("stroke", "#059669").attr("stroke-width", 1.5).attr("fill", "none");
              }

              // Edit Button
              if (isSelected) {
                  const ed = card.append("g")
                    .attr("transform", `translate(${CARD_WIDTH/2}, ${-CARD_HEIGHT/2})`)
                    .style("cursor", "pointer")
                    .on("click", (e) => { e.stopPropagation(); onOpenEditor(person); });
                  ed.append("circle").attr("r", 14).attr("fill", "#059669").attr("stroke", "white").attr("stroke-width", 2);
                  ed.append("text").attr("x", -4).attr("y", 4).style("fill", "white").style("font-size", "10px").text("✎");
              }
          };

          if (s) {
              const offset = CARD_WIDTH/2 + 10;
              drawPerson(p, -offset);
              drawPerson(s, offset);
              gNode.append("line").attr("x1", -10).attr("x2", 10).attr("stroke", "#cbd5e1").attr("stroke-dasharray", "4");
          } else {
              drawPerson(p, 0);
          }

          // Expand/Collapse
          if (p.childrenIds.length > 0 && filterMode !== 'focused') {
              const tog = gNode.append("g")
                 .attr("transform", `translate(0, ${CARD_HEIGHT/2})`)
                 .style("cursor", "pointer")
                 .on("click", (e) => { 
                    e.stopPropagation(); 
                    const n = new Set(expandedIds); 
                    if (n.has(p.id)) n.delete(p.id); else n.add(p.id); 
                    setExpandedIds(n); 
                 });
              tog.append("circle").attr("r", 10).attr("fill", expandedIds.has(p.id) ? "white" : "#059669").attr("stroke", "#059669");
              tog.append("text").attr("y", 4).attr("text-anchor", "middle").style("font-size", "12px").style("fill", expandedIds.has(p.id) ? "#059669" : "white").style("font-weight", "bold")
                 .text(expandedIds.has(p.id) ? "-" : "+");
          }
      });
  }, [treeData, dimensions, selectedPersonId, filterMode, expandedIds]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-[#f8fafc] relative flex flex-col">
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 pointer-events-auto p-1 flex">
              <button onClick={() => setFilterMode('all')} className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition ${filterMode === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <Maximize size={14} /> TUTTI
              </button>
              <button onClick={() => setFilterMode('focused')} className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition ${filterMode === 'focused' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <Minimize size={14} /> FOCUS
              </button>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 pointer-events-auto p-3 min-w-[200px]">
              <div className="flex items-center gap-2">
                  <Search size={16} className="text-slate-400" />
                  <input className="outline-none text-sm w-full" placeholder="Cerca persona..." value={searchText} onChange={e => { setSearchText(e.target.value); setShowSearch(true); }} />
              </div>
              {showSearch && searchText && (
                  <div className="mt-2 border-t pt-2 max-h-40 overflow-y-auto">
                      {data.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchText.toLowerCase())).slice(0,8).map(p => (
                          <div key={p.id} className="text-xs p-2 hover:bg-slate-50 cursor-pointer rounded flex items-center gap-2" onClick={() => { setRootId(findOldestAncestor(p.id)); onSelectPerson(p); setShowSearch(false); }}>
                              <GitBranch size={12} className="text-emerald-500" />
                              <span>{p.firstName} {p.lastName}</span>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};