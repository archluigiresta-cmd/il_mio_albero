import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { 
  ArrowDown, 
  ArrowLeft, 
  Users, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  ChevronRight,
  Filter
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
  spouse?: Person; // Visualizziamo il coniuge principale nel nodo
  children: HierarchyNode[];
  isSpousePlaceholder?: boolean;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewType>('descendants');
  const [rootId, setRootId] = useState<string | null>(null);

  // --- 1. DATA PROCESSING ---

  // Trova il capostipite assoluto (il più anziano senza genitori noti)
  const absoluteRoot = useMemo(() => {
      if (!data.length) return null;
      // Cerca qualcuno senza genitori
      const roots = data.filter(p => !p.fatherId && !p.motherId);
      // Se ce ne sono più di uno, prendi quello con più discendenti o il più vecchio
      if (roots.length > 0) {
          return roots.sort((a, b) => (a.birthDate || '9999') > (b.birthDate || '9999') ? 1 : -1)[0];
      }
      return data[0];
  }, [data]);

  // Imposta la root iniziale se non c'è
  useEffect(() => {
      if (!rootId && absoluteRoot) {
          setRootId(absoluteRoot.id);
      }
  }, [absoluteRoot, rootId]);

  // Sincronizza selezione esterna con root se necessario (opzionale, per ora lasciamo navigazione manuale)
  
  // COSTRUZIONE ALBERO: DISCENDENTI (Dall'alto in basso)
  const buildDescendantTree = (id: string, depth: number = 0): HierarchyNode | null => {
      if (depth > 20) return null; // Safety break
      const p = data.find(x => x.id === id);
      if (!p) return null;

      // Trova coniuge (il primo o quello rilevante per i figli)
      // Per semplicità grafica, mostriamo il primo coniuge o quello che è genitore dei figli
      let spouse: Person | undefined = undefined;
      if (p.spouseIds.length > 0) {
          spouse = data.find(s => s.id === p.spouseIds[0]);
      }

      // Figli
      const childrenNodes = p.childrenIds
        .map(cid => buildDescendantTree(cid, depth + 1))
        .filter((n): n is HierarchyNode => n !== null)
        .sort((a, b) => (a.person.birthDate || '9999').localeCompare(b.person.birthDate || '9999'));

      return {
          id: p.id,
          person: p,
          spouse: spouse,
          children: childrenNodes
      };
  };

  // COSTRUZIONE ALBERO: ANTENATI (Dal basso in alto - visualizzato orizzontalmente)
  const buildAncestorTree = (id: string, depth: number = 0): HierarchyNode | null => {
      if (depth > 20) return null;
      const p = data.find(x => x.id === id);
      if (!p) return null;

      const parents: HierarchyNode[] = [];
      if (p.fatherId) {
          const f = buildAncestorTree(p.fatherId, depth + 1);
          if (f) parents.push(f);
      }
      if (p.motherId) {
          const m = buildAncestorTree(p.motherId, depth + 1);
          if (m) parents.push(m);
      }

      return {
          id: p.id,
          person: p,
          children: parents // Invertiamo semanticamente: i "children" del nodo D3 sono i genitori
      };
  };

  // --- 2. RENDERING ---

  useEffect(() => {
      if (!data.length || !svgRef.current || !wrapperRef.current || !rootId) return;

      const width = wrapperRef.current.clientWidth;
      const height = wrapperRef.current.clientHeight;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const g = svg.append("g");

      // Setup Zoom
      const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 3])
          .on("zoom", (event) => g.attr("transform", event.transform));
      svg.call(zoom);

      // --- CONFIGURAZIONE LAYOUT ---
      // Dimensioni Nodo
      const cardWidth = 220;
      const cardHeight = 80;
      const nodeW = viewMode === 'descendants' ? 250 : 280; // Spaziatura orizzontale
      const nodeH = viewMode === 'descendants' ? 150 : 100; // Spaziatura verticale

      let rootData: HierarchyNode | null = null;
      
      if (viewMode === 'ancestors') {
          rootData = buildAncestorTree(rootId);
      } else {
          // Descendants o Family
          rootData = buildDescendantTree(rootId);
      }

      if (!rootData) return;

      const hierarchy = d3.hierarchy<HierarchyNode>(rootData);
      
      // Calcola layout
      let treeLayout;
      if (viewMode === 'ancestors') {
          // Layout Orizzontale per antenati (Sinistra -> Destra)
          treeLayout = d3.tree<HierarchyNode>()
            .nodeSize([cardHeight + 40, cardWidth + 60]) // Invertito per orizzontale
            .separation(() => 1);
      } else {
          // Layout Verticale per discendenti
          treeLayout = d3.tree<HierarchyNode>()
            .nodeSize([nodeW, nodeH])
            .separation((a, b) => a.parent === b.parent ? 1.1 : 1.2);
      }

      const root = treeLayout(hierarchy);

      // Centra inizialmente
      const initialX = width / 2;
      const initialY = viewMode === 'ancestors' ? height / 2 : 100;
      // Per ancestors, ruotiamo mentalmente: x è y, y è x
      
      svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(0.8));

      // --- DISEGNO CONNESSIONI (LINKS) ---
      const linkGen = g.selectAll(".link")
          .data(root.links())
          .enter()
          .append("path")
          .attr("class", "link")
          .attr("fill", "none")
          .attr("stroke", "#94a3b8")
          .attr("stroke-width", 1.5)
          .attr("d", (d) => {
              if (viewMode === 'ancestors') {
                  // Orizzontale: da Destra a Sinistra (Antenati) o Sinistra a Destra
                  // Qui visualizziamo: Root a Sinistra, Genitori a Destra
                  return `M${d.source.y},${d.source.x}
                          H${(d.source.y + d.target.y) / 2}
                          V${d.target.x}
                          H${d.target.y}`;
              } else {
                  // Verticale (Standard)
                  return `M${d.source.x},${d.source.y + cardHeight/2}
                          V${(d.source.y + d.target.y) / 2}
                          H${d.target.x}
                          V${d.target.y - cardHeight/2}`;
              }
          });

      // --- DISEGNO NODI ---
      const node = g.selectAll(".node")
          .data(root.descendants())
          .enter()
          .append("g")
          .attr("class", "node")
          .attr("transform", d => `translate(${viewMode === 'ancestors' ? d.y : d.x},${viewMode === 'ancestors' ? d.x : d.y})`)
          .style("cursor", "pointer")
          .on("click", (e, d) => {
              e.stopPropagation();
              onSelectPerson(d.data.person);
          });

      // Definizioni grafiche
      const getNodeColor = (gender: Gender) => {
          if (gender === Gender.Male) return "#e0f2fe"; // Sky 100
          if (gender === Gender.Female) return "#fce7f3"; // Pink 100
          return "#f1f5f9";
      };
      
      const getStrokeColor = (gender: Gender, isSelected: boolean) => {
          if (isSelected) return "#0f172a";
          if (gender === Gender.Male) return "#3b82f6";
          if (gender === Gender.Female) return "#ec4899";
          return "#94a3b8";
      };

      // Costruiamo la "Card"
      // Se c'è un coniuge (e non siamo in Ancestor mode dove visualizziamo singolo), allarghiamo il box
      // In Ancestor mode, visualizziamo solo la persona del sangue per chiarezza, o entrambi se vogliamo.
      // Qui facciamo: Descendants = Doppia Card se sposati. Ancestors = Singola.
      
      node.each(function(d) {
          const gNode = d3.select(this);
          const p = d.data.person;
          const s = d.data.spouse;
          const isSelected = p.id === selectedPersonId;

          // Se modalità discendenti e c'è un coniuge, disegniamo il box doppio
          if (viewMode === 'descendants' && s) {
              const totalW = cardWidth + 20; // Un po' più largo
              
              // Box Contenitore (Ombra)
              gNode.append("rect")
                .attr("x", -totalW / 2)
                .attr("y", -cardHeight / 2)
                .attr("width", totalW)
                .attr("height", cardHeight)
                .attr("rx", 4)
                .attr("fill", "white")
                .attr("stroke", isSelected ? "#000" : "#cbd5e1")
                .attr("stroke-width", isSelected ? 2 : 1)
                .attr("filter", "drop-shadow(2px 2px 3px rgba(0,0,0,0.1))");

              // Linea divisoria verticale
              gNode.append("line")
                .attr("x1", 0)
                .attr("y1", -cardHeight/2 + 5)
                .attr("x2", 0)
                .attr("y2", cardHeight/2 - 5)
                .attr("stroke", "#cbd5e1")
                .attr("stroke-dasharray", "4");

              // Persona (Sinistra)
              const gLeft = gNode.append("g").attr("transform", `translate(${-totalW/4}, 0)`);
              
              gLeft.append("text")
                  .text(p.firstName)
                  .attr("y", -10)
                  .attr("text-anchor", "middle")
                  .style("font-weight", "bold")
                  .style("font-size", "12px");
              gLeft.append("text")
                  .text(p.lastName)
                  .attr("y", 5)
                  .attr("text-anchor", "middle")
                  .style("font-size", "12px");
              gLeft.append("text")
                  .text(p.birthDate?.split(' ').pop() || '?')
                  .attr("y", 20)
                  .attr("text-anchor", "middle")
                  .style("font-size", "10px")
                  .style("fill", "#64748b");
              
              // Icona Sesso Left
              gLeft.append("circle")
                   .attr("r", 4)
                   .attr("cx", -30)
                   .attr("cy", -15)
                   .attr("fill", p.gender === Gender.Male ? "#3b82f6" : "#ec4899");

              // Coniuge (Destra)
              const gRight = gNode.append("g").attr("transform", `translate(${totalW/4}, 0)`);
              gRight.append("text")
                  .text(s.firstName)
                  .attr("y", -10)
                  .attr("text-anchor", "middle")
                  .style("font-weight", "bold")
                  .style("font-size", "12px");
              gRight.append("text")
                  .text(s.lastName)
                  .attr("y", 5)
                  .attr("text-anchor", "middle")
                  .style("font-size", "12px");
               
              // Pulsante "Focus Qui" (Sotto al centro)
              const btn = gNode.append("g")
                 .attr("transform", `translate(0, ${cardHeight/2 + 10})`)
                 .style("cursor", "pointer")
                 .on("click", (evt) => {
                     evt.stopPropagation();
                     setRootId(p.id);
                 });
               
              btn.append("circle").attr("r", 8).attr("fill", "#e2e8f0");
              btn.append("path").attr("d", "M-4 -2 L0 4 L4 -2").attr("fill", "none").attr("stroke", "#475569").attr("stroke-width", 1.5);
              btn.append("title").text("Mostra discendenti di questa coppia");

          } else {
              // Box Singolo (Ancestors o Single Person)
              const w = 160;
              gNode.append("rect")
                .attr("x", -w / 2)
                .attr("y", -cardHeight / 2)
                .attr("width", w)
                .attr("height", cardHeight)
                .attr("rx", 4)
                .attr("fill", getNodeColor(p.gender))
                .attr("stroke", getStrokeColor(p.gender, isSelected))
                .attr("stroke-width", isSelected ? 3 : 1)
                .attr("filter", "drop-shadow(2px 2px 3px rgba(0,0,0,0.1))");

              gNode.append("text")
                  .text(`${p.firstName} ${p.lastName}`)
                  .attr("y", -5)
                  .attr("text-anchor", "middle")
                  .style("font-weight", "bold")
                  .style("font-size", "13px")
                  .style("fill", "#1e293b");

              gNode.append("text")
                  .text(`${p.birthDate || ''}`)
                  .attr("y", 15)
                  .attr("text-anchor", "middle")
                  .style("font-size", "11px")
                  .style("fill", "#64748b");

              // Pulsante per espandere/cambiare root
              const btn = gNode.append("g")
                 .attr("transform", `translate(${w/2}, 0)`) // A destra
                 .style("opacity", 0) // Invisibile default, visibile hover gestito via CSS o logica
                 .attr("class", "action-btn");

              // Logica Focus
              gNode.on("mouseenter", function() {
                  d3.select(this).append("g")
                    .attr("class", "hover-ctrl")
                    .attr("transform", `translate(${w/2 - 10}, ${-cardHeight/2})`)
                    .call(g => {
                         g.append("circle").attr("r", 10).attr("fill", "white").attr("stroke", "#334155");
                         g.append("path").attr("d", "M-3 -3 L3 3 M-3 3 L3 -3").attr("stroke", "#334155"); // Crosshair simulation
                    })
                    .on("click", (ev) => {
                        ev.stopPropagation();
                        setRootId(p.id);
                    });
              }).on("mouseleave", function() {
                  d3.select(this).select(".hover-ctrl").remove();
              });
          }
      });

  }, [data, viewMode, rootId, selectedPersonId, onSelectPerson]);


  // --- UI CONTROLS ---

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 border-l border-slate-200 relative overflow-hidden">
      
      {/* HEADER CONTROLS */}
      <div className="absolute top-4 left-4 z-10 flex flex-col sm:flex-row gap-2">
          
          <div className="bg-white p-1 rounded-lg shadow border border-slate-200 flex gap-1">
              <button 
                onClick={() => setViewMode('descendants')}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition ${viewMode === 'descendants' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                title="Visualizza discendenza (Dall'alto in basso)"
              >
                  <ArrowDown size={16} /> Discendenti
              </button>
              <button 
                onClick={() => setViewMode('ancestors')}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition ${viewMode === 'ancestors' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                title="Visualizza antenati (Da sinistra a destra)"
              >
                  <ArrowLeft size={16} /> Antenati
              </button>
          </div>

          <div className="bg-white p-1 rounded-lg shadow border border-slate-200 flex gap-1 items-center px-3">
              <span className="text-xs font-bold text-slate-400 uppercase mr-2">Focus:</span>
              <span className="text-sm font-bold text-slate-700">
                  {data.find(p => p.id === rootId)?.firstName} {data.find(p => p.id === rootId)?.lastName}
              </span>
              {rootId !== absoluteRoot?.id && (
                  <button 
                    onClick={() => absoluteRoot && setRootId(absoluteRoot.id)}
                    className="ml-2 p-1 hover:bg-slate-100 rounded text-emerald-600"
                    title="Torna al Capostipite"
                  >
                      <Maximize size={14} />
                  </button>
              )}
          </div>

      </div>

      {/* HELP TEXT BOTTOM */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <div className="bg-white/80 backdrop-blur p-3 rounded-lg border border-slate-200 shadow-sm text-xs text-slate-500 max-w-sm">
             <p className="font-bold mb-1 text-slate-700">Legenda Visualizzazione</p>
             <ul className="list-disc pl-4 space-y-1">
                 <li>I nodi mostrano <strong>Persona</strong> e eventuale <strong>Coniuge</strong>.</li>
                 <li>Le linee sono ortogonali per massimizzare la chiarezza.</li>
                 <li>Passa il mouse su una casella per fare <strong>Focus</strong> su quel ramo.</li>
                 <li>Usa la rotellina per Zoomare e Trascina per spostarti.</li>
             </ul>
          </div>
      </div>

      <svg ref={svgRef} className="w-full h-full touch-none bg-slate-50 cursor-grab active:cursor-grabbing"></svg>
    </div>
  );
};