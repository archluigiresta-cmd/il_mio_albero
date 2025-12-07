import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { 
  ArrowUp, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Users,
  GitMerge
} from 'lucide-react';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
}

type ViewType = 'descendants' | 'ancestors' | 'family';

interface HierarchyNode {
  id: string;
  person: Person;
  spouse?: Person;
  children: HierarchyNode[];
  hasHiddenChildren?: boolean; // Per indicare se ci sono figli non caricati nel nodo corrente (per logica expand)
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Stati di visualizzazione
  const [viewMode, setViewMode] = useState<ViewType>('descendants');
  const [rootId, setRootId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Ricerca
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // --- 1. DATA PROCESSING ---

  // Calcolo Root Iniziale (il più anziano o il primo)
  useEffect(() => {
      if (!rootId && data.length > 0) {
          // Default: Cerca qualcuno senza padre (capostipite)
          const roots = data.filter(p => !p.fatherId);
          const bestRoot = roots.length > 0 
            ? roots.sort((a, b) => (a.birthDate || '9999').localeCompare(b.birthDate || '9999'))[0] 
            : data[0];
          
          setRootId(bestRoot.id);
          // Espandi la root di default
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
      ).slice(0, 10); // Limit results
      setSearchResults(res);
  }, [searchText, data]);

  const handleSelectSearchResult = (p: Person) => {
      setRootId(p.id);
      setExpandedIds(new Set([p.id])); // Reset espansione per focus
      setShowSearch(false);
      setSearchText("");
  };

  // Funzione Toggle Espansione
  const toggleNode = (id: string) => {
      const next = new Set(expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setExpandedIds(next);
  };

  // Navigazione verso l'alto (Genitore)
  const goUpToParent = () => {
      if (!rootId) return;
      const current = data.find(p => p.id === rootId);
      if (current?.fatherId) setRootId(current.fatherId);
      else if (current?.motherId) setRootId(current.motherId);
  };

  // --- COSTRUZIONE GERARCHIA ---

  const buildTree = useMemo(() => {
      if (!rootId) return null;

      const buildDescendants = (id: string, depth: number): HierarchyNode | null => {
          const p = data.find(x => x.id === id);
          if (!p) return null;

          // Trova coniuge principale
          let spouse: Person | undefined;
          if (p.spouseIds.length > 0) {
              spouse = data.find(s => s.id === p.spouseIds[0]);
          }

          // Se collassato, non generare figli nella struttura D3
          const isExpanded = expandedIds.has(id) || depth === 0; // Root sempre espansa se depth 0
          
          let childrenNodes: HierarchyNode[] = [];
          const hasChildren = p.childrenIds.length > 0;

          if (isExpanded) {
             childrenNodes = p.childrenIds
                .map(cid => buildDescendants(cid, depth + 1))
                .filter((n): n is HierarchyNode => n !== null);
          }

          return {
              id: p.id,
              person: p,
              spouse: spouse,
              children: childrenNodes,
              hasHiddenChildren: hasChildren && !isExpanded
          };
      };

      const buildAncestors = (id: string, depth: number): HierarchyNode | null => {
          const p = data.find(x => x.id === id);
          if (!p) return null;

          const parents: HierarchyNode[] = [];
          if (p.fatherId) {
              const f = buildAncestors(p.fatherId, depth + 1);
              if (f) parents.push(f);
          }
          if (p.motherId) {
              const m = buildAncestors(p.motherId, depth + 1);
              if (m) parents.push(m);
          }

          return {
              id: p.id,
              person: p,
              children: parents, // D3 usa "children" per la struttura, semanticamente sono genitori qui
              hasHiddenChildren: false
          };
      };

      if (viewMode === 'ancestors') return buildAncestors(rootId, 0);
      
      // Default: Descendants or Family view (Family view is just a restricted descendant tree technically for D3)
      return buildDescendants(rootId, 0);

  }, [data, rootId, expandedIds, viewMode]);


  // --- RENDERING D3 ---

  useEffect(() => {
      if (!buildTree || !svgRef.current || !wrapperRef.current) return;

      const width = wrapperRef.current.clientWidth;
      const height = wrapperRef.current.clientHeight;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const g = svg.append("g");

      // Setup Zoom
      const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 2])
          .on("zoom", (event) => g.attr("transform", event.transform));
      
      // Initial Transform
      const initialY = viewMode === 'ancestors' ? height - 100 : 80;
      svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(width/2, initialY).scale(0.85));


      // --- LAYOUT ---
      const CARD_WIDTH = 240;
      const CARD_HEIGHT = 90;
      const H_SPACING = 40;
      const V_SPACING = 100;

      const hierarchy = d3.hierarchy<HierarchyNode>(buildTree);
      
      const treeLayout = d3.tree<HierarchyNode>()
          .nodeSize([CARD_WIDTH + H_SPACING, CARD_HEIGHT + V_SPACING])
          .separation((a, b) => a.parent === b.parent ? 1.1 : 1.3);

      const root = treeLayout(hierarchy);

      // --- DISEGNO LINKS SQUADRATI ---
      // Logica personalizzata per linee ortogonali stile "Bus"
      
      g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1.5)
        .attr("d", (d) => {
            const sx = d.source.x;
            const sy = d.source.y;
            const tx = d.target.x;
            const ty = d.target.y;

            if (viewMode === 'ancestors') {
                // Bottom to Top logic
                const midY = (sy + ty) / 2;
                return `M${sx},${sy - CARD_HEIGHT/2} 
                        V${midY} 
                        H${tx} 
                        V${ty + CARD_HEIGHT/2}`;
            } else {
                // Top to Bottom logic (Descendants)
                const midY = (sy + ty) / 2;
                return `M${sx},${sy + CARD_HEIGHT/2} 
                        V${midY} 
                        H${tx} 
                        V${ty - CARD_HEIGHT/2}`;
            }
        });

      // --- DISEGNO NODI ---
      const nodes = g.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

      // 1. Disegna Card
      nodes.each(function(d) {
          const gNode = d3.select(this);
          const p = d.data.person;
          const s = d.data.spouse;
          const isSelected = p.id === selectedPersonId;

          const isPair = !!s && viewMode !== 'ancestors';
          const totalW = isPair ? CARD_WIDTH + 120 : CARD_WIDTH; // Allarga se coppia
          
          // Ombra
          gNode.append("rect")
            .attr("x", -totalW/2)
            .attr("y", -CARD_HEIGHT/2)
            .attr("width", totalW)
            .attr("height", CARD_HEIGHT)
            .attr("rx", 6)
            .attr("fill", "#ffffff")
            .attr("stroke", isSelected ? "#059669" : "#cbd5e1")
            .attr("stroke-width", isSelected ? 3 : 1)
            .style("filter", "drop-shadow(0 4px 6px -1px rgb(0 0 0 / 0.1))")
            .style("cursor", "pointer")
            .on("click", (e) => {
                e.stopPropagation();
                onSelectPerson(p);
            });

          // Contenuto Persona (Sinistra o Centro)
          const cx = isPair ? -totalW/4 : 0;
          
          // Nome
          gNode.append("text")
             .attr("x", cx)
             .attr("y", -15)
             .attr("text-anchor", "middle")
             .style("font-weight", "bold")
             .style("font-size", "14px")
             .style("fill", "#1e293b")
             .text(p.firstName);
          
          gNode.append("text")
             .attr("x", cx)
             .attr("y", 5)
             .attr("text-anchor", "middle")
             .style("font-size", "14px")
             .style("fill", "#1e293b")
             .text(p.lastName);

          // Date
          gNode.append("text")
             .attr("x", cx)
             .attr("y", 25)
             .attr("text-anchor", "middle")
             .style("font-size", "11px")
             .style("fill", "#64748b")
             .text(`${p.birthDate || ''} ${p.deathDate ? '- ' + p.deathDate : ''}`);

          // Indicatore Sesso (barra colorata laterale o dot)
          gNode.append("circle")
             .attr("cx", isPair ? (-totalW/2 + 15) : (-totalW/2 + 15))
             .attr("cy", -CARD_HEIGHT/2 + 15)
             .attr("r", 5)
             .attr("fill", p.gender === Gender.Male ? "#3b82f6" : "#ec4899");

          // Contenuto Coniuge (Se presente)
          if (isPair) {
             const sx = totalW/4;
             // Linea divisoria
             gNode.append("line")
                .attr("x1", 0)
                .attr("y1", -CARD_HEIGHT/2 + 10)
                .attr("x2", 0)
                .attr("y2", CARD_HEIGHT/2 - 10)
                .attr("stroke", "#e2e8f0")
                .attr("stroke-width", 1);

             // Simbolo Matrimonio
             gNode.append("circle").attr("r", 8).attr("fill", "white").attr("stroke", "#e2e8f0").attr("cy", 0);
             gNode.append("text").attr("y", 3).attr("text-anchor", "middle").style("font-size", "10px").text("&");

             gNode.append("text")
                .attr("x", sx)
                .attr("y", -15)
                .attr("text-anchor", "middle")
                .style("font-weight", "bold")
                .style("font-size", "14px")
                .style("fill", "#1e293b")
                .text(s.firstName);

             gNode.append("text")
                .attr("x", sx)
                .attr("y", 5)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("fill", "#1e293b")
                .text(s.lastName);
          }

          // --- PULSANTE EXPAND/COLLAPSE ---
          // Solo se ha figli (o genitori in modo Antenati) e NON siamo in view 'family' che è statica
          const canExpand = (p.childrenIds.length > 0 && viewMode !== 'ancestors') || 
                            ((p.fatherId || p.motherId) && viewMode === 'ancestors');
          
          if (canExpand) {
              const isCollapsed = d.data.hasHiddenChildren; // Nella mia logica, se hasHiddenChildren è true, è tecnicamente collassato "visivamente" rispetto ai dati totali
              
              // In view Descendants, se ho figli ma non sono caricati nel grafo D3 (children vuoti), mostro +
              // Se invece ci sono figli nel grafo D3, mostro -
              const hasVisibleChildren = d.children && d.children.length > 0;
              const hasRealChildren = p.childrenIds.length > 0;

              // Mostriamo il toggle solo se ci sono "Real Children"
              if (hasRealChildren && viewMode === 'descendants') {
                  const btnGroup = gNode.append("g")
                      .attr("transform", `translate(0, ${CARD_HEIGHT/2})`)
                      .style("cursor", "pointer")
                      .on("click", (e) => {
                          e.stopPropagation();
                          toggleNode(p.id);
                      });
                  
                  // Cerchio Sfondo
                  btnGroup.append("circle")
                      .attr("r", 10)
                      .attr("fill", hasVisibleChildren ? "#fff" : "#10b981")
                      .attr("stroke", hasVisibleChildren ? "#94a3b8" : "#059669")
                      .attr("stroke-width", 1.5);
                  
                  // Icona (+ o -)
                  const iconSize = 8;
                  if (hasVisibleChildren) {
                      // Minus
                      btnGroup.append("path")
                          .attr("d", `M-${iconSize/2} 0 H${iconSize/2}`)
                          .attr("stroke", "#64748b")
                          .attr("stroke-width", 2);
                  } else {
                      // Plus
                      btnGroup.append("path")
                          .attr("d", `M-${iconSize/2} 0 H${iconSize/2} M0 -${iconSize/2} V${iconSize/2}`)
                          .attr("stroke", "white")
                          .attr("stroke-width", 2);
                  }
              }
          }
      });

  }, [buildTree, selectedPersonId, onSelectPerson]);

  const currentRootPerson = data.find(p => p.id === rootId);
  const hasParents = currentRootPerson && (currentRootPerson.fatherId || currentRootPerson.motherId);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-100 relative overflow-hidden font-sans">
      
      {/* HEADER CONTROLS */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-3 w-64">
          
          {/* SEARCH BOX */}
          <div className="relative">
              <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 px-3 py-2">
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
                  <div className="absolute top-full left-0 w-full bg-white mt-1 rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto z-30">
                      {searchResults.map(p => (
                          <div 
                             key={p.id}
                             className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-50 last:border-0"
                             onClick={() => handleSelectSearchResult(p)}
                          >
                              <div className="font-bold text-slate-700">{p.firstName} {p.lastName}</div>
                              <div className="text-xs text-slate-400">{p.birthDate}</div>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* VIEW TOGGLES */}
          <div className="bg-white p-1 rounded-lg shadow border border-slate-200 flex gap-1">
              <button 
                onClick={() => setViewMode('descendants')}
                className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded text-xs font-medium transition ${viewMode === 'descendants' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <GitMerge size={14} className="rotate-180" /> Discendenti
              </button>
              <button 
                onClick={() => setViewMode('ancestors')}
                className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded text-xs font-medium transition ${viewMode === 'ancestors' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <GitMerge size={14} /> Antenati
              </button>
          </div>
          
      </div>

      {/* PARENT NAVIGATION HELPER */}
      {hasParents && viewMode === 'descendants' && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 animate-bounce">
              <button 
                onClick={goUpToParent}
                className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-emerald-200 text-emerald-700 text-sm font-bold hover:bg-emerald-50 transition"
              >
                  <ArrowUp size={16} />
                  Sali al Genitore
              </button>
          </div>
      )}

      {/* SVG AREA */}
      <svg ref={svgRef} className="w-full h-full touch-none bg-[#f8fafc] cursor-grab active:cursor-grabbing">
          <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {/* FOOTER INFO */}
      <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-mono bg-white/50 p-1 rounded">
          Root ID: {rootId} | Mode: {viewMode}
      </div>

    </div>
  );
};