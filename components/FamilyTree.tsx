import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { 
  ArrowUp, 
  Search, 
  GitMerge,
  Filter,
  Users
} from 'lucide-react';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
}

type ViewType = 'descendants' | 'ancestors';
type FilterType = 'all' | 'direct_line' | 'nuclear';

interface HierarchyNode {
  id: string;
  person: Person;
  spouse?: Person;
  children: HierarchyNode[];
  hasHiddenChildren?: boolean;
  isDirectLine?: boolean; // Per evidenziare il percorso
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const [viewMode, setViewMode] = useState<ViewType>('descendants');
  const [filterMode, setFilterMode] = useState<FilterType>('all');
  
  const [rootId, setRootId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Ricerca
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

  // Inizializzazione Root
  useEffect(() => {
      if (!rootId && data.length > 0) {
          // Seleziona il più anziano senza padre come root di default
          const roots = data.filter(p => !p.fatherId);
          const bestRoot = roots.length > 0 
            ? roots.sort((a, b) => (a.birthDate || '9999').localeCompare(b.birthDate || '9999'))[0] 
            : data[0];
          
          setRootId(bestRoot.id);
          setExpandedIds(new Set([bestRoot.id]));
      }
  }, [data, rootId]);

  // Se cambio modalità filtro in nucleo, imposto la radice sulla persona selezionata (se c'è)
  useEffect(() => {
      if (filterMode === 'nuclear' && selectedPersonId) {
          setRootId(selectedPersonId);
      }
  }, [filterMode, selectedPersonId]);

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

  // --- HELPER PER LINEA DIRETTA ---
  // Trova il percorso (Set di ID) dal root al target
  const getDirectLineIds = (root: string, target: string | undefined): Set<string> => {
      const ids = new Set<string>();
      if (!target) return ids;
      
      let curr: Person | undefined = data.find(p => p.id === target);
      while (curr) {
          ids.add(curr.id);
          if (curr.id === root) break;
          // Risali
          if (curr.fatherId) curr = data.find(p => p.id === curr.fatherId);
          else if (curr.motherId) curr = data.find(p => p.id === curr.motherId);
          else curr = undefined;
      }
      return ids;
  };

  // --- COSTRUZIONE DATI ALBERO ---
  const treeData = useMemo(() => {
      if (!rootId) return null;

      // Calcola ID linea diretta se necessario
      const directLineIds = filterMode === 'direct_line' ? getDirectLineIds(rootId, selectedPersonId) : new Set<string>();

      const buildDescendants = (id: string, depth: number): HierarchyNode | null => {
          const p = data.find(x => x.id === id);
          if (!p) return null;

          // Filtro Linea Diretta:
          // Se siamo in modalità direct_line, includiamo il nodo SOLO se fa parte del percorso diretto 
          // OPPURE se è un figlio diretto del target selezionato (per vedere i figli dell'ultimo nodo)
          if (filterMode === 'direct_line' && selectedPersonId) {
             const isAncestorPath = directLineIds.has(id);
             // Se non è nel percorso antenati e il genitore non è la persona selezionata, salta
             // Eccezione: Mostriamo sempre il root
             if (id !== rootId && !isAncestorPath) {
                 // Controlliamo se è figlio del selezionato (per mostrare i figli finali)
                 const parentIsSelected = p.fatherId === selectedPersonId || p.motherId === selectedPersonId;
                 if (!parentIsSelected) return null; 
             }
          }

          // Filtro Nucleo Familiare:
          // Limita profondità a 1 (Figli immediati)
          if (filterMode === 'nuclear' && depth > 1) {
              return null;
          }

          // Trova coniuge
          let spouse: Person | undefined;
          if (p.spouseIds.length > 0) {
              spouse = data.find(s => s.id === p.spouseIds[0]);
          }

          // Espansione nodi
          // In modalità 'all', usa expandedIds.
          // In modalità 'direct_line' o 'nuclear', espandi tutto automaticamente per chiarezza.
          const isExpanded = filterMode !== 'all' ? true : (expandedIds.has(id) || depth === 0);
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
              hasHiddenChildren: hasChildren && !isExpanded,
              isDirectLine: directLineIds.has(id) || id === selectedPersonId
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
  }, [data, rootId, expandedIds, viewMode, filterMode, selectedPersonId]);


  // --- RENDERING D3 ---
  useEffect(() => {
      if (!treeData || !svgRef.current || !dimensions.width) return;

      const { width, height } = dimensions;

      // --- LOGICA RESPONSIVE ---
      const isMobile = width < 640; 
      
      const CARD_WIDTH = isMobile ? 140 : 200;
      const CARD_HEIGHT = isMobile ? 60 : 70;
      const FONT_SIZE_NAME = isMobile ? "12px" : "14px";
      const FONT_SIZE_DATE = isMobile ? "9px" : "10px";
      
      const H_GAP = isMobile ? 15 : 40;
      const V_GAP = isMobile ? 80 : 120;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const g = svg.append("g");

      const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 2.5])
          .on("zoom", (e) => g.attr("transform", e.transform));
      
      // Posizione iniziale ottimizzata in base alla view
      const initialY = viewMode === 'ancestors' ? height - 150 : 80;
      svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(width/2, initialY).scale(isMobile ? 0.6 : 0.85));

      const root = d3.hierarchy<HierarchyNode>(treeData);
      
      const treeLayout = d3.tree<HierarchyNode>()
          .nodeSize([CARD_WIDTH + H_GAP, CARD_HEIGHT + V_GAP])
          .separation((a, b) => a.parent === b.parent ? 1.05 : 1.25);

      treeLayout(root);

      // Links
      g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", (d) => d.target.data.isDirectLine && filterMode === 'direct_line' ? "#059669" : "#94a3b8")
        .attr("stroke-width", (d) => d.target.data.isDirectLine && filterMode === 'direct_line' ? 3 : 1.5)
        .attr("d", (d) => {
            const sx = d.source.x;
            const sy = d.source.y;
            const tx = d.target.x;
            const ty = d.target.y;

            if (viewMode === 'ancestors') {
                const midY = (sy + ty) / 2;
                return `M${sx},${sy - CARD_HEIGHT/2} V${midY} H${tx} V${ty + CARD_HEIGHT/2}`;
            } else {
                const midY = (sy + ty) / 2;
                return `M${sx},${sy + CARD_HEIGHT/2} V${midY} H${tx} V${ty - CARD_HEIGHT/2}`;
            }
        });

      // Nodes
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
          
          const showSpouse = !!s && viewMode !== 'ancestors';
          const totalWidth = showSpouse ? (CARD_WIDTH * 2) + 20 : CARD_WIDTH;
          const isSelected = p.id === selectedPersonId;
          const isHighlight = d.data.isDirectLine && filterMode === 'direct_line';

          // Box
          gNode.append("rect")
             .attr("x", -totalWidth / 2)
             .attr("y", -CARD_HEIGHT / 2)
             .attr("width", totalWidth)
             .attr("height", CARD_HEIGHT)
             .attr("rx", 6)
             .attr("fill", isHighlight ? "#ecfdf5" : "white")
             .attr("stroke", isSelected ? "#059669" : (isHighlight ? "#6ee7b7" : "#cbd5e1"))
             .attr("stroke-width", isSelected ? 3 : (isHighlight ? 2 : 1))
             .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.05))")
             .style("cursor", "pointer")
             .on("click", (e) => {
                 e.stopPropagation();
                 onSelectPerson(p);
                 // Se siamo in nuclear mode, un click cambia il centro del nucleo
                 if (filterMode === 'nuclear') {
                     setRootId(p.id);
                 }
             });

          const drawPersonInfo = (person: Person, centerX: number) => {
             gNode.append("text")
                .attr("x", centerX)
                .attr("y", -CARD_HEIGHT/2 + (isMobile ? 22 : 25))
                .attr("text-anchor", "middle")
                .style("font-weight", "600")
                .style("font-family", "Inter, sans-serif")
                .style("font-size", FONT_SIZE_NAME)
                .style("fill", "#1e293b")
                .text(person.firstName);
            
             gNode.append("text")
                .attr("x", centerX)
                .attr("y", -CARD_HEIGHT/2 + (isMobile ? 36 : 42))
                .attr("text-anchor", "middle")
                .style("font-family", "Inter, sans-serif")
                .style("font-size", FONT_SIZE_NAME)
                .style("fill", "#1e293b")
                .text(person.lastName);

             gNode.append("text")
                .attr("x", centerX)
                .attr("y", CARD_HEIGHT/2 - (isMobile ? 8 : 10))
                .attr("text-anchor", "middle")
                .style("font-size", FONT_SIZE_DATE)
                .style("fill", "#64748b")
                .text(person.birthDate ? person.birthDate.split(' ').pop() : '');

             gNode.append("circle")
                .attr("cx", centerX - (isMobile ? 40 : 60))
                .attr("cy", -CARD_HEIGHT/2 + 12)
                .attr("r", isMobile ? 3 : 4)
                .attr("fill", person.gender === Gender.Male ? "#3b82f6" : "#ec4899");
          };

          if (showSpouse) {
              drawPersonInfo(p, -totalWidth/4);
              drawPersonInfo(s, totalWidth/4);
              gNode.append("line").attr("x1", 0).attr("y1", -CARD_HEIGHT/2 + 10).attr("x2", 0).attr("y2", CARD_HEIGHT/2 - 10).attr("stroke", "#e2e8f0");
              gNode.append("circle").attr("r", isMobile ? 8 : 10).attr("fill", "white").attr("cy", 0);
              gNode.append("text").attr("y", isMobile ? 3 : 4).attr("text-anchor", "middle").style("font-size", "10px").style("fill", "#94a3b8").text("&");
          } else {
              drawPersonInfo(p, 0);
          }

          // Expand Button (Only for 'all' mode)
          if (filterMode === 'all' && viewMode === 'descendants' && p.childrenIds.length > 0) {
              const hasVisibleChildren = d.children && d.children.length > 0;
              const btnY = CARD_HEIGHT / 2;
              const btnGroup = gNode.append("g")
                .attr("transform", `translate(0, ${btnY})`)
                .style("cursor", "pointer")
                .on("click", (e) => {
                    e.stopPropagation();
                    toggleNode(p.id);
                });

              btnGroup.append("circle")
                .attr("r", isMobile ? 8 : 10)
                .attr("fill", hasVisibleChildren ? "#fff" : "#10b981")
                .attr("stroke", hasVisibleChildren ? "#cbd5e1" : "#059669")
                .attr("stroke-width", 1.5);
              
              if (hasVisibleChildren) {
                 btnGroup.append("path").attr("d", "M-3 0 H3").attr("stroke", "#64748b").attr("stroke-width", 2);
              } else {
                 btnGroup.append("path").attr("d", "M-3 0 H3 M0 -3 V3").attr("stroke", "white").attr("stroke-width", 2);
              }
          }
      });

  }, [treeData, viewMode, selectedPersonId, dimensions, filterMode]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 relative overflow-hidden font-sans">
      
      {/* HEADER CONTROLS */}
      <div className="absolute top-4 left-4 z-20 w-full max-w-xs flex flex-col gap-2 pointer-events-none">
          
          {/* SEARCH */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 pointer-events-auto">
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
                  <div className="border-t border-slate-100 max-h-48 overflow-y-auto bg-white rounded-b-lg">
                      {searchResults.map(p => (
                          <div 
                             key={p.id}
                             className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-50 last:border-0 flex justify-between items-center"
                             onClick={() => {
                                 setRootId(p.id);
                                 setExpandedIds(new Set([p.id]));
                                 setShowSearch(false);
                                 setSearchText("");
                                 onSelectPerson(p); // Seleziona anche per attivare filtri nucleo
                             }}
                          >
                              <span className="font-medium text-slate-700">{p.firstName} {p.lastName}</span>
                              <span className="text-xs text-slate-400">{p.birthDate?.slice(-4)}</span>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-1 pointer-events-auto flex flex-col gap-1">
              
              {/* Direzione */}
              <div className="flex border-b border-slate-100 pb-1 mb-1">
                <button 
                    onClick={() => setViewMode('descendants')}
                    className={`flex-1 py-1.5 px-2 rounded text-[10px] uppercase font-bold transition ${viewMode === 'descendants' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Discendenti
                </button>
                <button 
                    onClick={() => setViewMode('ancestors')}
                    className={`flex-1 py-1.5 px-2 rounded text-[10px] uppercase font-bold transition ${viewMode === 'ancestors' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Antenati
                </button>
              </div>

              {/* Filtri Tipologia */}
              {viewMode === 'descendants' && (
                  <div className="space-y-1">
                      <button 
                        onClick={() => setFilterMode('all')}
                        className={`w-full text-left px-3 py-2 rounded text-xs font-medium flex items-center gap-2 ${filterMode === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          <GitMerge size={14} className="rotate-90" />
                          Albero Completo
                      </button>
                      
                      <button 
                        onClick={() => {
                            if(!selectedPersonId) alert("Seleziona prima una persona nell'albero per vederne la linea diretta.");
                            else setFilterMode('direct_line');
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-xs font-medium flex items-center gap-2 ${filterMode === 'direct_line' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          <Filter size={14} />
                          Solo Linea Diretta
                      </button>

                      <button 
                        onClick={() => {
                            if(!selectedPersonId) alert("Seleziona prima una persona.");
                            else setFilterMode('nuclear');
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-xs font-medium flex items-center gap-2 ${filterMode === 'nuclear' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          <Users size={14} />
                          Nucleo Familiare (2 gen)
                      </button>
                  </div>
              )}
          </div>
      </div>

      {/* BACK TO PARENT BUTTON */}
      {viewMode === 'descendants' && data.find(p => p.id === rootId)?.fatherId && filterMode !== 'nuclear' && (
          <div className="absolute top-4 right-4 z-10 pointer-events-auto">
              <button 
                onClick={goUpToParent}
                className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition"
              >
                  <ArrowUp size={14} />
                  Sali di livello
              </button>
          </div>
      )}

      {/* SVG CANVAS */}
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