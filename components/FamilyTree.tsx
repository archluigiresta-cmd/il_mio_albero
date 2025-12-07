import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { 
  ArrowUp, 
  Search, 
  GitMerge,
  Minus,
  Plus
} from 'lucide-react';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
}

type ViewType = 'descendants' | 'ancestors';

interface HierarchyNode {
  id: string;
  person: Person;
  spouse?: Person;
  children: HierarchyNode[];
  hasHiddenChildren?: boolean;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [viewMode, setViewMode] = useState<ViewType>('descendants');
  const [rootId, setRootId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Ricerca
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Inizializzazione Root
  useEffect(() => {
      if (!rootId && data.length > 0) {
          // Trova il capostipite ideale (senza padre)
          const roots = data.filter(p => !p.fatherId);
          const bestRoot = roots.length > 0 
            ? roots.sort((a, b) => (a.birthDate || '9999').localeCompare(b.birthDate || '9999'))[0] 
            : data[0];
          
          setRootId(bestRoot.id);
          setExpandedIds(new Set([bestRoot.id]));
      }
  }, [data, rootId]);

  // Gestione Ricerca
  useEffect(() => {
      if (!searchText.trim()) {
          setSearchResults([]);
          return;
      }
      const lower = searchText.toLowerCase();
      const res = data.filter(p => 
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(lower)
      ).slice(0, 8);
      setSearchResults(res);
  }, [searchText, data]);

  const toggleNode = (id: string) => {
      const next = new Set(expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setExpandedIds(next);
  };

  const goUpToParent = () => {
      if (!rootId) return;
      const current = data.find(p => p.id === rootId);
      if (current?.fatherId) setRootId(current.fatherId);
      else if (current?.motherId) setRootId(current.motherId);
  };

  // --- COSTRUZIONE DATI ALBERO ---
  const treeData = useMemo(() => {
      if (!rootId) return null;

      const buildDescendants = (id: string, depth: number): HierarchyNode | null => {
          const p = data.find(x => x.id === id);
          if (!p) return null;

          // Trova coniuge
          let spouse: Person | undefined;
          if (p.spouseIds.length > 0) {
              spouse = data.find(s => s.id === p.spouseIds[0]);
          }

          const isExpanded = expandedIds.has(id) || depth === 0;
          const hasChildren = p.childrenIds.length > 0;

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
              hasHiddenChildren: hasChildren && !isExpanded
          };
      };

      const buildAncestors = (id: string): HierarchyNode | null => {
          const p = data.find(x => x.id === id);
          if (!p) return null;

          const parents: HierarchyNode[] = [];
          if (p.fatherId) {
              const f = buildAncestors(p.fatherId);
              if (f) parents.push(f);
          }
          if (p.motherId) {
              const m = buildAncestors(p.motherId);
              if (m) parents.push(m);
          }

          return {
              id: p.id,
              person: p,
              children: parents, 
              hasHiddenChildren: false
          };
      };

      return viewMode === 'ancestors' ? buildAncestors(rootId) : buildDescendants(rootId, 0);
  }, [data, rootId, expandedIds, viewMode]);


  // --- RENDERING D3 ---
  useEffect(() => {
      if (!treeData || !svgRef.current || !wrapperRef.current) return;

      const width = wrapperRef.current.clientWidth;
      const height = wrapperRef.current.clientHeight;

      // Pulizia
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const g = svg.append("g");

      const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 2.5])
          .on("zoom", (e) => g.attr("transform", e.transform));
      
      const initialY = viewMode === 'ancestors' ? height - 150 : 80;
      svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(width/2, initialY).scale(0.8));

      // Configurazione Layout
      const CARD_WIDTH = 200;
      const CARD_HEIGHT = 70;
      const H_GAP = 20; // Ridotto per compattare
      const V_GAP = 100;

      const root = d3.hierarchy<HierarchyNode>(treeData);
      
      const treeLayout = d3.tree<HierarchyNode>()
          .nodeSize([CARD_WIDTH + H_GAP, CARD_HEIGHT + V_GAP])
          .separation((a, b) => a.parent === b.parent ? 1.05 : 1.15); // Ridotta separazione per alberi larghi

      treeLayout(root);

      // --- DISEGNO CONNESSIONI (LINKS) ---
      g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#64748b")
        .attr("stroke-width", 1.5)
        .attr("d", (d) => {
            const sx = d.source.x;
            const sy = d.source.y;
            const tx = d.target.x;
            const ty = d.target.y;

            if (viewMode === 'ancestors') {
                // Bottom-Up
                const midY = (sy + ty) / 2;
                return `M${sx},${sy - CARD_HEIGHT/2} V${midY} H${tx} V${ty + CARD_HEIGHT/2}`;
            } else {
                // Top-Down (Standard)
                const midY = (sy + ty) / 2;
                return `M${sx},${sy + CARD_HEIGHT/2} V${midY} H${tx} V${ty - CARD_HEIGHT/2}`;
            }
        });

      // --- DISEGNO NODI ---
      const nodes = g.selectAll(".node")
          .data(root.descendants())
          .enter()
          .append("g")
          .attr("class", "node")
          .attr("transform", d => `translate(${d.x},${d.y})`);

      nodes.each(function(d) {
          const gNode = d3.select(this);
          const p = d.data.person;
          const s = d.data.spouse;
          
          // Determina se mostrare la coppia
          const showSpouse = !!s && viewMode !== 'ancestors';
          const boxWidth = showSpouse ? CARD_WIDTH + 140 : CARD_WIDTH;
          
          // Rettangolo Base
          gNode.append("rect")
             .attr("x", -boxWidth / 2)
             .attr("y", -CARD_HEIGHT / 2)
             .attr("width", boxWidth)
             .attr("height", CARD_HEIGHT)
             .attr("rx", 6)
             .attr("fill", "white")
             .attr("stroke", p.id === selectedPersonId ? "#059669" : "#cbd5e1")
             .attr("stroke-width", p.id === selectedPersonId ? 3 : 1)
             .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.05))")
             .style("cursor", "pointer")
             .on("click", (e) => {
                 e.stopPropagation();
                 onSelectPerson(p);
             });

          // Funzione helper per disegnare testo
          const drawText = (person: Person, offsetX: number) => {
             // Nome
             gNode.append("text")
                .attr("x", offsetX)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-weight", "600")
                .style("font-family", "Inter, sans-serif")
                .style("font-size", "14px")
                .style("fill", "#1e293b")
                .text(person.firstName);
            
             // Cognome
             gNode.append("text")
                .attr("x", offsetX)
                .attr("y", 8)
                .attr("text-anchor", "middle")
                .style("font-family", "Inter, sans-serif")
                .style("font-size", "14px")
                .style("fill", "#1e293b")
                .text(person.lastName);

             // Date
             gNode.append("text")
                .attr("x", offsetX)
                .attr("y", 24)
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .style("fill", "#94a3b8")
                .text(person.birthDate ? person.birthDate.split(' ').pop() : ''); // Solo anno approssimativo per pulizia

             // Indicatore Genere
             gNode.append("circle")
                .attr("cx", offsetX - 35)
                .attr("cy", -20)
                .attr("r", 3)
                .attr("fill", person.gender === Gender.Male ? "#3b82f6" : "#ec4899");
          };

          if (showSpouse) {
              // Disegna Persona a sinistra e Coniuge a destra
              drawText(p, -boxWidth / 4);
              drawText(s, boxWidth / 4);

              // Linea divisoria
              gNode.append("line")
                 .attr("x1", 0)
                 .attr("y1", -CARD_HEIGHT/2 + 10)
                 .attr("x2", 0)
                 .attr("y2", CARD_HEIGHT/2 - 10)
                 .attr("stroke", "#e2e8f0");
              
              // Simbolo '&'
              gNode.append("circle").attr("r", 10).attr("fill", "white").attr("cy", 0);
              gNode.append("text").attr("y", 4).attr("text-anchor", "middle").style("font-size", "10px").style("fill", "#94a3b8").text("&");

          } else {
              drawText(p, 0);
          }

          // Pulsante Expand/Collapse
          if (viewMode === 'descendants' && p.childrenIds.length > 0) {
              const isCollapsed = d.data.hasHiddenChildren;
              const hasVisibleChildren = d.children && d.children.length > 0;
              
              // Disegna il bottone solo se ha senso (ha figli reali)
              const btnY = CARD_HEIGHT / 2;
              
              const btnGroup = gNode.append("g")
                .attr("transform", `translate(0, ${btnY})`)
                .style("cursor", "pointer")
                .on("click", (e) => {
                    e.stopPropagation();
                    toggleNode(p.id);
                });

              btnGroup.append("circle")
                .attr("r", 9)
                .attr("fill", "white")
                .attr("stroke", "#64748b")
                .attr("stroke-width", 1);
              
              // Icona
              if (hasVisibleChildren) {
                 btnGroup.append("path").attr("d", "M-4 0 H4").attr("stroke", "#64748b").attr("stroke-width", 1.5);
              } else {
                 btnGroup.append("path").attr("d", "M-4 0 H4 M0 -4 V4").attr("stroke", "#059669").attr("stroke-width", 1.5);
                 // Se collassato, evidenzia il bordo del cerchio
                 btnGroup.select("circle").attr("stroke", "#059669");
              }
          }
      });

  }, [treeData, viewMode, selectedPersonId]);


  // --- UI LAYOUT ---
  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 relative overflow-hidden font-sans">
      
      {/* HEADER DI NAVIGAZIONE */}
      <div className="absolute top-4 left-4 z-20 w-full max-w-xs flex flex-col gap-2 pointer-events-none">
          
          {/* SEARCH (Pointer events auto per interagire) */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 pointer-events-auto">
              <div className="flex items-center px-3 py-2">
                  <Search size={16} className="text-slate-400 mr-2" />
                  <input 
                      className="bg-transparent outline-none text-sm w-full"
                      placeholder="Cerca persona..."
                      value={searchText}
                      onChange={e => { setSearchText(e.target.value); setShowSearch(true); }}
                      onFocus={() => setShowSearch(true)}
                  />
              </div>
              {showSearch && searchResults.length > 0 && (
                  <div className="border-t border-slate-100 max-h-48 overflow-y-auto">
                      {searchResults.map(p => (
                          <div 
                             key={p.id}
                             className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-50 last:border-0 flex justify-between items-center"
                             onClick={() => {
                                 setRootId(p.id);
                                 setExpandedIds(new Set([p.id]));
                                 setShowSearch(false);
                                 setSearchText("");
                             }}
                          >
                              <span className="font-medium text-slate-700">{p.firstName} {p.lastName}</span>
                              <span className="text-xs text-slate-400">{p.birthDate?.slice(-4)}</span>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* VIEW SWITCHER */}
          <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1 pointer-events-auto">
              <button 
                onClick={() => setViewMode('descendants')}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition ${viewMode === 'descendants' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                 Discendenti
              </button>
              <button 
                onClick={() => setViewMode('ancestors')}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition ${viewMode === 'ancestors' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                 Antenati
              </button>
          </div>
      </div>

      {/* SALI AL GENITORE */}
      {viewMode === 'descendants' && data.find(p => p.id === rootId)?.fatherId && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 animate-bounce pointer-events-auto">
              <button 
                onClick={goUpToParent}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition"
              >
                  <ArrowUp size={14} />
                  Sali di livello
              </button>
          </div>
      )}

      <svg ref={svgRef} className="w-full h-full touch-none bg-[#f8fafc] cursor-grab active:cursor-grabbing">
          <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#cbd5e1" opacity="0.3" />
              </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
    </div>
  );
};