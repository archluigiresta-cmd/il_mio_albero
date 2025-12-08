import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { 
  ArrowUp, 
  Search, 
  GitMerge,
  Maximize,
  Minimize,
  Edit2,
  Network
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
  const [viewMode, setViewMode] = useState<ViewType>('descendants');
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
      // Risaliamo finché troviamo un padre registrato nel sistema
      while (current && current.fatherId && data.find(p => p.id === current?.fatherId)) {
          const next = data.find(p => p.id === current?.fatherId);
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
  }, [data, rootId]); 

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
      const H_GAP = isMobile ? 20 : 60; 
      const V_GAP = isMobile ? 60 : 100;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      const g = svg.append("g");

      const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.05, 2]) 
          .on("zoom", (e) => g.attr("transform", e.transform));
      
      svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(width/2, 80).scale(isMobile ? 0.4 : 0.6));

      const root = d3.hierarchy<HierarchyNode>(treeData);
      const treeLayout = d3.tree<HierarchyNode>()
          .nodeSize([CARD_WIDTH + H_GAP, CARD_HEIGHT + V_GAP])
          .separation((a, b) => (a.parent === b.parent ? 1.2 : 2.5));

      treeLayout(root);

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
          
          const drawCard = (person: Person, offsetX: number) => {
              const card = gNode.append("g").attr("transform", `translate(${offsetX},0)`);
              const isSelected = person.id === selectedPersonId;

              // Border codificato
              card.append("rect")
                 .attr("x", -CARD_WIDTH/2)
                 .attr("y", -CARD_HEIGHT/2)
                 .attr("width", CARD_WIDTH)
                 .attr("height", CARD_HEIGHT)
                 .attr("rx", 8)
                 .attr("fill", isSelected ? "#f0fdfa" : "white")
                 .attr("stroke", isSelected ? "#059669" : (person.gender === Gender.Male ? "#93c5fd" : "#f9a8d4"))
                 .attr("stroke-width", isSelected ? 3 : 1.5)
                 .style("cursor", "pointer")
                 .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

              // Photo
              card.append("clipPath").attr("id", `avatar-${person.id}`).append("circle").attr("cx", -CARD_WIDTH/2 + 35).attr("cy", 0).attr("r", 25);
              card.append("image")
                 .attr("xlink:href", person.photoUrl || PLACEHOLDER_IMAGE)
                 .attr("x", -CARD_WIDTH/2 + 10)
                 .attr("y", -25)
                 .attr("width", 50).attr("height", 50).attr("clip-path", `url(#avatar-${person.id})`);

              // Info
              card.append("text").attr("x", -CARD_WIDTH/2 + 70).attr("y", -10).style("font-size", "13px").style("font-weight", "bold").style("fill", "#1e293b").text(person.firstName);
              card.append("text").attr("x", -CARD_WIDTH/2 + 70).attr("y", 6).style("font-size", "12px").style("fill", "#1e293b").text(person.lastName);
              card.append("text").attr("x", -CARD_WIDTH/2 + 70).attr("y", 22).style("font-size", "10px").style("fill", "#64748b").text(`${person.birthDate?.slice(-4) || '?'} - ${person.deathDate?.slice(-4) || (person.isLiving ? 'Viv' : '?')}`);

              // Jump Icon
              if (person.fatherId || person.motherId) {
                  const jump = card.append("g")
                    .attr("transform", `translate(0, -${CARD_HEIGHT/2})`)
                    .style("cursor", "pointer")
                    .on("click", (e) => {
                        e.stopPropagation();
                        const old = findOldestAncestor(person.id);
                        setFilterMode('focused');
                        setRootId(old);
                    });
                  jump.append("circle").attr("r", 12).attr("fill", "white").attr("stroke", "#cbd5e1");
                  jump.append("path").attr("d", "M-4 2 L0 -2 L4 2 M0 -2 V4").attr("stroke", "#059669").attr("stroke-width", 2).attr("fill", "none");
              }

              // Edit Button (Solo se selezionato)
              if (isSelected) {
                  const edit = card.append("g")
                    .attr("transform", `translate(${CARD_WIDTH/2}, ${-CARD_HEIGHT/2})`)
                    .style("cursor", "pointer")
                    .on("click", (e) => { e.stopPropagation(); onOpenEditor(person); });
                  edit.append("circle").attr("r", 14).attr("fill", "#059669");
                  edit.append("text").attr("x", -5).attr("y", 5).style("fill", "white").style("font-size", "10px").style("font-family", "monospace").text("✎");
              }
          };

          if (s) {
              drawCard(p, -CARD_WIDTH/2 - 10);
              drawCard(s, CARD_WIDTH/2 + 10);
              gNode.append("line").attr("x1", -10).attr("x2", 10).attr("stroke", "#cbd5e1").attr("stroke-dasharray", "3");
          } else {
              drawCard(p, 0);
          }
      });
  }, [treeData, dimensions, selectedPersonId, rootId]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 relative flex flex-col">
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-white rounded-lg shadow border pointer-events-auto p-1 flex">
              <button onClick={() => setFilterMode('all')} className={`flex-1 py-1.5 px-3 rounded text-[10px] font-bold ${filterMode === 'all' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500'}`}>TUTTI</button>
              <button onClick={() => setFilterMode('focused')} className={`flex-1 py-1.5 px-3 rounded text-[10px] font-bold ${filterMode === 'focused' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500'}`}>FOCUS</button>
          </div>
          <div className="bg-white rounded-lg shadow border pointer-events-auto p-2">
              <div className="flex items-center gap-2">
                  <Search size={14} className="text-slate-400" />
                  <input className="outline-none text-xs w-full" placeholder="Cerca..." value={searchText} onChange={e => { setSearchText(e.target.value); setShowSearch(true); }} />
              </div>
          </div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};