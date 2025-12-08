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

type ViewType = 'descendants' | 'ancestors';
type FilterType = 'all' | 'focused';

interface HierarchyNode {
  id: string;
  person: Person;
  spouse?: Person;
  children: HierarchyNode[];
  hasHiddenChildren?: boolean;
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

  const findOldestAncestor = (startId: string): string => {
      let current = data.find(p => p.id === startId);
      if (!current) return startId;
      while (current && current.fatherId) {
          const next = data.find(p => p.id === current.fatherId);
          if (next) current = next; else break;
      }
      return current?.id || startId;
  };

  useEffect(() => {
      if (!rootId && data.length > 0) {
          const roots = data.filter(p => !p.fatherId && !p.motherId);
          setRootId(roots[0]?.id || data[0].id);
          setExpandedIds(new Set(data.map(p => p.id)));
      }
  }, [data]); 

  const treeData = useMemo(() => {
      const buildDescendants = (id: string, depth: number): HierarchyNode | null => {
          const p = data.find(x => x.id === id);
          if (!p) return null;
          let spouse: Person | undefined;
          if (p.spouseIds.length > 0) spouse = data.find(s => s.id === p.spouseIds[0]);

          const isExpanded = expandedIds.has(id) || depth === 0;
          let childrenNodes: HierarchyNode[] = [];
          if (isExpanded) {
             childrenNodes = p.childrenIds
                .map(cid => buildDescendants(cid, depth + 1))
                .filter((n): n is HierarchyNode => n !== null);
          }

          return {
              id: p.id,
              person: p,
              spouse,
              children: childrenNodes,
              hasHiddenChildren: p.childrenIds.length > 0 && !isExpanded
          };
      };

      if (filterMode === 'all') {
          const roots = data.filter(p => !p.fatherId && !p.motherId)
                            .sort((a, b) => (a.birthDate || '9').localeCompare(b.birthDate || '9'));
          return {
              id: VIRTUAL_ROOT_ID,
              person: { id: VIRTUAL_ROOT_ID } as Person,
              children: roots.map(r => buildDescendants(r.id, 0)).filter((n): n is HierarchyNode => n !== null),
          };
      }

      if (!rootId) return null;
      return buildDescendants(rootId, 0);
  }, [data, rootId, expandedIds, filterMode]);

  useEffect(() => {
      if (!treeData || !svgRef.current || !dimensions.width) return;

      const { width, height } = dimensions;
      const isMobile = width < 640; 
      
      const CARD_WIDTH = isMobile ? 180 : 240;
      const CARD_HEIGHT = isMobile ? 80 : 100;
      const H_GAP = isMobile ? 40 : 100; 
      const V_GAP = isMobile ? 80 : 140;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      const g = svg.append("g");

      const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.05, 1.5]) 
          .on("zoom", (e) => g.attr("transform", e.transform));
      
      svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(width/2, 120).scale(isMobile ? 0.4 : 0.6));

      const root = d3.hierarchy<HierarchyNode>(treeData);
      
      // LOGICA DI SEPARAZIONE ANTICOLLISIONE
      const treeLayout = d3.tree<HierarchyNode>()
          .nodeSize([CARD_WIDTH + H_GAP, CARD_HEIGHT + V_GAP])
          .separation((a, b) => {
              const aHasSpouse = !!a.data.spouse;
              const bHasSpouse = !!b.data.spouse;
              
              // Se siamo al primo livello sotto il virtual root (famiglie diverse)
              if (a.parent?.data.id === VIRTUAL_ROOT_ID) return 3.5;
              
              let factor = 1.3;
              if (aHasSpouse && bHasSpouse) factor = 2.6;
              else if (aHasSpouse || bHasSpouse) factor = 1.8;
              
              return a.parent === b.parent ? factor : factor + 0.8;
          });

      treeLayout(root);

      // Links
      g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 1.5)
        .attr("opacity", d => d.source.data.id === VIRTUAL_ROOT_ID ? 0 : 1)
        .attr("d", d => {
            const sx = d.source.x, sy = d.source.y;
            const tx = d.target.x, ty = d.target.y;
            const midY = (sy + ty) / 2;
            return `M${sx},${sy + CARD_HEIGHT/2} V${midY} H${tx} V${ty - CARD_HEIGHT/2}`;
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
          
          const drawCard = (person: Person, cardX: number) => {
              const card = gNode.append("g").attr("transform", `translate(${cardX},0)`);
              const isSelected = person.id === selectedPersonId;

              // Border codificato per sesso
              card.append("rect")
                 .attr("x", -CARD_WIDTH/2)
                 .attr("y", -CARD_HEIGHT/2)
                 .attr("width", CARD_WIDTH)
                 .attr("height", CARD_HEIGHT)
                 .attr("rx", 12)
                 .attr("fill", isSelected ? "#f0fdfa" : "white")
                 .attr("stroke", isSelected ? "#059669" : (person.gender === Gender.Male ? "#3b82f6" : "#ec4899"))
                 .attr("stroke-width", isSelected ? 3 : 2)
                 .style("cursor", "pointer")
                 .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

              // Avatar Circle
              const avatarSize = isMobile ? 40 : 50;
              card.append("clipPath").attr("id", `avatar-${person.id}`).append("circle").attr("cx", -CARD_WIDTH/2 + 35).attr("cy", 0).attr("r", avatarSize/2);
              card.append("image")
                 .attr("xlink:href", person.photoUrl || PLACEHOLDER_IMAGE)
                 .attr("x", -CARD_WIDTH/2 + 35 - avatarSize/2)
                 .attr("y", -avatarSize/2)
                 .attr("width", avatarSize).attr("height", avatarSize).attr("clip-path", `url(#avatar-${person.id})`);

              // Info
              card.append("text").attr("x", -CARD_WIDTH/2 + 70).attr("y", -12).style("font-size", "14px").style("font-weight", "bold").style("fill", "#1e293b").text(person.firstName);
              card.append("text").attr("x", -CARD_WIDTH/2 + 70).attr("y", 4).style("font-size", "12px").style("fill", "#334155").text(person.lastName);
              card.append("text").attr("x", -CARD_WIDTH/2 + 70).attr("y", 22).style("font-size", "10px").style("fill", "#64748b").text(`${person.birthDate?.slice(-4) || '?'} - ${person.deathDate?.slice(-4) || (person.isLiving ? 'Viv' : '?')}`);

              // Icona Salto Famiglia Origine
              if (person.fatherId || person.motherId) {
                  const jump = card.append("g")
                    .attr("transform", `translate(0, -${CARD_HEIGHT/2})`)
                    .style("cursor", "pointer")
                    .on("click", (e) => {
                        e.stopPropagation();
                        const root = findOldestAncestor(person.id);
                        setFilterMode('focused');
                        setRootId(root);
                    });
                  jump.append("circle").attr("r", 12).attr("fill", "white").attr("stroke", "#059669");
                  jump.append("path").attr("d", "M-4 2 L0 -2 L4 2").attr("stroke", "#059669").attr("stroke-width", 2).attr("fill", "none");
                  jump.append("line").attr("x1", 0).attr("y1", -2).attr("x2", 0).attr("y2", 4).attr("stroke", "#059669").attr("stroke-width", 2);
              }

              // Edit Icon (Solo se selezionata)
              if (isSelected) {
                  const editBtn = card.append("g")
                    .attr("transform", `translate(${CARD_WIDTH/2}, ${-CARD_HEIGHT/2})`)
                    .style("cursor", "pointer")
                    .on("click", (e) => { e.stopPropagation(); onOpenEditor(person); });
                  editBtn.append("circle").attr("r", 15).attr("fill", "#059669").attr("stroke", "white").attr("stroke-width", 2);
                  editBtn.append("text").attr("x", -5).attr("y", 5).style("fill", "white").style("font-size", "12px").text("✎");
              }
          };

          if (s) {
              const halfTotal = CARD_WIDTH + 10;
              drawCard(p, -halfTotal/2);
              drawCard(s, halfTotal/2);
              // Linea coniugi
              gNode.append("line").attr("x1", -10).attr("x2", 10).attr("y1", 0).attr("y2", 0).attr("stroke", "#cbd5e1").attr("stroke-dasharray", "4 2");
          } else {
              drawCard(p, 0);
          }

          // Expand/Collapse Toggle
          if (p.childrenIds.length > 0 && filterMode !== 'focused') {
              const toggle = gNode.append("g")
                .attr("transform", `translate(0, ${CARD_HEIGHT/2})`)
                .style("cursor", "pointer")
                .on("click", (e) => { e.stopPropagation(); const next = new Set(expandedIds); if (next.has(p.id)) next.delete(p.id); else next.add(p.id); setExpandedIds(next); });
              
              toggle.append("circle").attr("r", 10).attr("fill", expandedIds.has(p.id) ? "white" : "#059669").attr("stroke", "#059669").attr("stroke-width", 1.5);
              toggle.append("text")
                .attr("y", 4).attr("text-anchor", "middle")
                .style("font-size", "14px").style("font-weight", "bold").style("fill", expandedIds.has(p.id) ? "#059669" : "white")
                .text(expandedIds.has(p.id) ? "-" : "+");
          }
      });
  }, [treeData, dimensions, selectedPersonId, filterMode, expandedIds]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-[#f8fafc] relative flex flex-col">
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 pointer-events-auto p-1 flex">
              <button 
                onClick={() => setFilterMode('all')} 
                className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition ${filterMode === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <Maximize size={14} /> TUTTI
              </button>
              <button 
                onClick={() => setFilterMode('focused')} 
                className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition ${filterMode === 'focused' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <Minimize size={14} /> FOCUS
              </button>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 pointer-events-auto p-3 min-w-[200px]">
              <div className="flex items-center gap-2">
                  <Search size={16} className="text-slate-400" />
                  <input 
                    className="outline-none text-sm w-full" 
                    placeholder="Cerca..." 
                    value={searchText} 
                    onChange={e => { setSearchText(e.target.value); setShowSearch(true); }} 
                  />
              </div>
              {showSearch && searchText && (
                  <div className="mt-2 border-t pt-2 max-h-40 overflow-y-auto">
                      {data.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchText.toLowerCase())).slice(0,5).map(p => (
                          <div key={p.id} className="text-xs p-2 hover:bg-slate-50 cursor-pointer rounded flex items-center gap-2" onClick={() => { setRootId(findOldestAncestor(p.id)); onSelectPerson(p); setShowSearch(false); }}>
                              <GitBranch size={12} className="text-emerald-500" />
                              <span>{p.firstName} {p.lastName}</span>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};