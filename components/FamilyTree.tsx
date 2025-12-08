import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { 
  ArrowUp, 
  Search, 
  GitMerge,
  Users,
  Maximize,
  Minimize,
  BookUser,
  GitFork,
  User,
  ExternalLink
} from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../constants';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
}

type ViewType = 'descendants' | 'ancestors';
type FilterType = 'all' | 'direct_line' | 'nuclear' | 'paternal_line' | 'maternal_line';

interface HierarchyNode {
  id: string;
  person: Person;
  spouse?: Person;
  children: HierarchyNode[];
  hasHiddenChildren?: boolean;
  isDirectLine?: boolean; 
}

const VIRTUAL_ROOT_ID = 'VIRTUAL_ROOT';

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewMode, setViewMode] = useState<ViewType>('descendants');
  const [filterMode, setFilterMode] = useState<FilterType>('all');
  const [rootId, setRootId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
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

  const expandAll = (personList: Person[]) => {
      const allIds = new Set(personList.map(p => p.id));
      setExpandedIds(allIds);
  };

  const collapseAll = () => {
      if (rootId) {
          setExpandedIds(new Set([rootId]));
      } else {
          setExpandedIds(new Set());
      }
  };

  const findOldestAncestor = (startId: string): string => {
      let current = data.find(p => p.id === startId);
      if (!current) return startId;
      while (current && current.fatherId) {
          const next = data.find(p => p.id === current.fatherId);
          if (next) current = next; else break;
      }
      return current?.id || startId;
  };

  const handleFilterChange = (mode: FilterType) => {
      setFilterMode(mode);
      if (mode === 'all') expandAll(data);
      if (selectedPersonId && mode !== 'all') {
          if (mode === 'nuclear') setRootId(selectedPersonId);
          else if (mode === 'paternal_line') setRootId(findOldestAncestor(selectedPersonId));
      }
  };

  useEffect(() => {
      if (!rootId && data.length > 0) {
          const roots = data.filter(p => !p.fatherId && !p.motherId);
          const bestRoot = roots.length > 0 ? roots[0] : data[0];
          setRootId(bestRoot.id);
          expandAll(data);
      }
  }, [data, rootId]); 

  const toggleNode = (id: string) => {
      const next = new Set(expandedIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      setExpandedIds(next);
  };

  const treeData = useMemo(() => {
      const buildDescendants = (id: string, depth: number): HierarchyNode | null => {
          const p = data.find(x => x.id === id);
          if (!p) return null;
          let spouse: Person | undefined;
          if (p.spouseIds.length > 0) spouse = data.find(s => s.id === p.spouseIds[0]);

          const isExpanded = (filterMode !== 'all' && filterMode !== 'paternal_line') ? true : (expandedIds.has(id) || depth === 0);
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
              hasHiddenChildren: p.childrenIds.length > 0 && !isExpanded,
              isDirectLine: id === selectedPersonId
          };
      };

      if (filterMode === 'all' && viewMode === 'descendants') {
          const roots = data.filter(p => !p.fatherId && !p.motherId)
                            .sort((a, b) => (a.birthDate || '9999').localeCompare(b.birthDate || '9999'));
          if (roots.length > 0) {
             return {
                 id: VIRTUAL_ROOT_ID,
                 person: { id: VIRTUAL_ROOT_ID, firstName: '', lastName: '' } as Person,
                 children: roots.map(r => buildDescendants(r.id, 0)).filter((n): n is HierarchyNode => n !== null),
             };
          }
      }

      if (!rootId) return null;
      return buildDescendants(rootId, 0);
  }, [data, rootId, expandedIds, viewMode, filterMode, selectedPersonId]);

  useEffect(() => {
      if (!treeData || !svgRef.current || !dimensions.width) return;

      const { width, height } = dimensions;
      const isMobile = width < 640; 
      
      const CARD_WIDTH = isMobile ? 180 : 260;
      const CARD_HEIGHT = isMobile ? 80 : 100;
      const H_GAP = isMobile ? 40 : 100; 
      const V_GAP = isMobile ? 80 : 120;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      const g = svg.append("g");

      const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 2]) 
          .on("zoom", (e) => g.attr("transform", e.transform));
      
      const isForest = treeData.id === VIRTUAL_ROOT_ID;
      svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(width/2, 100).scale(isMobile ? 0.4 : 0.6));

      const root = d3.hierarchy<HierarchyNode>(treeData);
      const treeLayout = d3.tree<HierarchyNode>()
          .nodeSize([CARD_WIDTH + H_GAP, CARD_HEIGHT + V_GAP])
          .separation((a, b) => a.parent === b.parent ? 1.2 : 2.0);

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
          const showSpouse = !!s;
          const totalWidth = showSpouse ? (CARD_WIDTH * 2) + 20 : CARD_WIDTH;

          const hasOriginFamily = (personId: string) => {
              const pers = data.find(x => x.id === personId);
              return !!(pers?.fatherId || pers?.motherId);
          };

          const drawPersonCard = (person: Person, offsetX: number) => {
              const card = gNode.append("g").attr("transform", `translate(${offsetX},0)`);
              const isSelected = person.id === selectedPersonId;

              // Shadow
              card.append("rect")
                 .attr("x", -CARD_WIDTH/2 + 3)
                 .attr("y", -CARD_HEIGHT/2 + 3)
                 .attr("width", CARD_WIDTH)
                 .attr("height", CARD_HEIGHT)
                 .attr("rx", 10)
                 .attr("fill", "black")
                 .attr("opacity", 0.05);

              // Background
              card.append("rect")
                 .attr("x", -CARD_WIDTH/2)
                 .attr("y", -CARD_HEIGHT/2)
                 .attr("width", CARD_WIDTH)
                 .attr("height", CARD_HEIGHT)
                 .attr("rx", 10)
                 .attr("fill", "white")
                 .attr("stroke", isSelected ? "#059669" : (person.gender === Gender.Male ? "#bfdbfe" : "#fbcfe8"))
                 .attr("stroke-width", isSelected ? 3 : 2)
                 .style("cursor", "pointer")
                 .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

              // Avatar Circle
              card.append("clipPath")
                 .attr("id", `clip-${person.id}`)
                 .append("circle")
                 .attr("cx", -CARD_WIDTH/2 + 45)
                 .attr("cy", 0)
                 .attr("r", 30);

              card.append("image")
                 .attr("xlink:href", person.photoUrl || PLACEHOLDER_IMAGE)
                 .attr("x", -CARD_WIDTH/2 + 15)
                 .attr("y", -30)
                 .attr("width", 60)
                 .attr("height", 60)
                 .attr("clip-path", `url(#clip-${person.id})`);

              // Name
              card.append("text")
                 .attr("x", -CARD_WIDTH/2 + 85)
                 .attr("y", -15)
                 .style("font-size", isMobile ? "11px" : "13px")
                 .style("font-weight", "bold")
                 .style("fill", "#1e293b")
                 .text(`${person.firstName} ${person.lastName}`);

              // Life Dates
              const dates = `${person.birthDate ? person.birthDate.slice(-4) : '?'} - ${person.deathDate ? person.deathDate.slice(-4) : (person.isLiving ? 'Viv.' : '?')}`;
              card.append("text")
                 .attr("x", -CARD_WIDTH/2 + 85)
                 .attr("y", 5)
                 .style("font-size", "10px")
                 .style("fill", "#64748b")
                 .text(dates);

              // Birth Place
              if (person.birthPlace) {
                  card.append("text")
                     .attr("x", -CARD_WIDTH/2 + 85)
                     .attr("y", 22)
                     .style("font-size", "9px")
                     .style("fill", "#94a3b8")
                     .text(person.birthPlace.length > 20 ? person.birthPlace.slice(0, 17) + "..." : person.birthPlace);
              }

              // Origin Jump Icon
              if (hasOriginFamily(person.id)) {
                  const jump = card.append("g")
                    .attr("transform", `translate(0, -${CARD_HEIGHT/2})`)
                    .style("cursor", "pointer")
                    .on("click", (e) => {
                        e.stopPropagation();
                        setRootId(findOldestAncestor(person.id));
                        setFilterMode('all');
                    });
                  jump.append("circle").attr("r", 12).attr("fill", "white").attr("stroke", "#cbd5e1");
                  jump.append("path").attr("d", "M-4 2 L0 -2 L4 2 M0 -2 V4").attr("stroke", "#059669").attr("stroke-width", 2).attr("fill", "none");
                  jump.append("title").text("Vedi famiglia di origine");
              }
          };

          if (showSpouse) {
              drawPersonCard(p, -CARD_WIDTH/2 - 10);
              drawPersonCard(s, CARD_WIDTH/2 + 10);
              gNode.append("line").attr("x1", -10).attr("y1", 0).attr("x2", 10).attr("y2", 0).attr("stroke", "#cbd5e1").attr("stroke-dasharray", "4");
          } else {
              drawPersonCard(p, 0);
          }

          // Expand Toggle
          if (p.childrenIds.length > 0 && viewMode === 'descendants') {
              const toggle = gNode.append("g")
                .attr("transform", `translate(0, ${CARD_HEIGHT/2})`)
                .style("cursor", "pointer")
                .on("click", (e) => { e.stopPropagation(); toggleNode(p.id); });
              
              toggle.append("circle").attr("r", 10).attr("fill", expandedIds.has(p.id) ? "#f1f5f9" : "#10b981");
              toggle.append("text")
                .attr("y", 3.5).attr("text-anchor", "middle")
                .style("font-size", "14px").style("fill", expandedIds.has(p.id) ? "#64748b" : "white")
                .style("font-weight", "bold")
                .text(expandedIds.has(p.id) ? "-" : "+");
          }
      });
  }, [treeData, dimensions, selectedPersonId, expandedIds, data]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 relative overflow-hidden flex flex-col">
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-white rounded-lg shadow-md border border-slate-200 pointer-events-auto p-1 flex">
              <button onClick={() => handleFilterChange('all')} className={`flex-1 py-1.5 px-3 rounded text-[10px] uppercase font-bold transition ${filterMode === 'all' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500'}`}>Tutti</button>
              <button onClick={() => setViewMode('descendants')} className={`flex-1 py-1.5 px-3 rounded text-[10px] uppercase font-bold transition ${viewMode === 'descendants' ? 'bg-blue-100 text-blue-800' : 'text-slate-500'}`}>Discendenza</button>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-slate-200 pointer-events-auto p-2">
              <div className="flex items-center text-slate-400 gap-2 mb-2">
                  <Search size={14} />
                  <input className="outline-none text-xs w-full" placeholder="Cerca..." value={searchText} onChange={e => { setSearchText(e.target.value); setShowSearch(true); }} />
              </div>
              {showSearch && searchResults.length > 0 && (
                  <div className="border-t pt-2 max-h-40 overflow-y-auto">
                      {data.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchText.toLowerCase())).slice(0,5).map(p => (
                          <div key={p.id} className="text-[10px] p-1.5 hover:bg-slate-50 cursor-pointer rounded" onClick={() => { onSelectPerson(p); setRootId(findOldestAncestor(p.id)); setShowSearch(false); }}>
                              {p.firstName} {p.lastName}
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
      <svg ref={svgRef} className="w-full h-full bg-[#f8fafc] cursor-grab active:cursor-grabbing" />
    </div>
  );
};