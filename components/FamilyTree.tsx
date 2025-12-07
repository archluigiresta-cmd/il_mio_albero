import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { Network, GitGraph, Maximize, ZoomIn, ZoomOut } from 'lucide-react';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'network' | 'tree'>('tree'); // Default su 'tree' come richiesto indirettamente
  const [focusId, setFocusId] = useState<string | null>(null);

  // Imposta un focus iniziale se necessario (solo per la vista albero)
  useEffect(() => {
    if (data.length > 0 && !focusId) {
        // Cerca il "patriarca" (qualcuno con più discendenti possibili) per la vista albero
        const root = data.reduce((prev, current) => 
            (current.childrenIds.length > prev.childrenIds.length) ? current : prev
        , data[0]);
        setFocusId(root.id);
    }
  }, [data, focusId]);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || !wrapperRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Pulizia
    
    const width = wrapperRef.current.clientWidth || 800;
    const height = wrapperRef.current.clientHeight || 600;

    // Gruppo principale per Zoom/Pan
    const g = svg.append("g");
    
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom as any);

    // --- RENDERIZZAZIONE IN BASE ALLA MODALITÀ ---

    if (viewMode === 'network') {
        // === VISTA RETE (FORCE DIRECTED GRAPH) ===
        // Mostra TUTTI i nodi e le relazioni

        // 1. Preparazione Nodi e Link
        const nodes = data.map(d => ({ ...d })); // Copia per D3 simulation
        const links: any[] = [];

        data.forEach(p => {
            // Link Genitore -> Figlio
            p.childrenIds.forEach(childId => {
                if (data.find(x => x.id === childId)) {
                    links.push({ source: p.id, target: childId, type: 'parent-child' });
                }
            });
            // Link Coniuge <-> Coniuge
            p.spouseIds.forEach(spouseId => {
                // Evita duplicati (A->B e B->A)
                if (p.id < spouseId && data.find(x => x.id === spouseId)) {
                    links.push({ source: p.id, target: spouseId, type: 'spouse' });
                }
            });
        });

        // 2. Simulazione Fisica
        const simulation = d3.forceSimulation(nodes as any)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80))
            .force("charge", d3.forceManyBody().strength(-300)) // Repulsione nodi
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(35)); // Evita sovrapposizioni

        // 3. Disegno Link
        const link = g.append("g")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke-width", (d: any) => d.type === 'spouse' ? 1 : 2)
            .attr("stroke", (d: any) => d.type === 'spouse' ? "#ef4444" : "#94a3b8") // Rosso per coniugi, Grigio per figli
            .attr("stroke-dasharray", (d: any) => d.type === 'spouse' ? "4 2" : "0");

        // 4. Disegno Nodi
        const node = g.append("g")
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended) as any);

        // Cerchio Sesso
        node.append("circle")
            .attr("r", 20)
            .attr("fill", (d: any) => d.gender === Gender.Male ? "#dbeafe" : (d.gender === Gender.Female ? "#fce7f3" : "#f3f4f6"))
            .attr("stroke", (d: any) => d.id === selectedPersonId ? "#2563eb" : (d.gender === Gender.Male ? "#93c5fd" : "#fbcfe8"))
            .attr("stroke-width", (d: any) => d.id === selectedPersonId ? 3 : 1)
            .style("cursor", "pointer")
            .on("click", (event, d: any) => {
                event.stopPropagation(); // Evita conflitti col drag
                onSelectPerson(d);
            });

        // Etichetta Nome
        node.append("text")
            .text((d: any) => d.firstName)
            .attr("x", 24)
            .attr("y", 4)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#334155")
            .style("pointer-events", "none"); // Click passano sotto

        // Update ad ogni tick
        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node
                .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

        // Drag functions
        function dragstarted(event: any, d: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: any, d: any) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event: any, d: any) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        // Posizione iniziale ottimale
        svg.call(zoom.transform as any, d3.zoomIdentity.translate(width/2, height/2).scale(0.6));

    } else {
        // === VISTA ALBERO ORIZZONTALE (TREE HIERARCHY) ===
        // Generazioni da Sinistra a Destra
        
        const buildNode = (id: string, depth: number): any => {
            if (depth > 20) return null; // Limite profondità per sicurezza
            const p = data.find(x => x.id === id);
            if (!p) return null;

            const childrenNodes = p.childrenIds
                .map(cid => buildNode(cid, depth + 1))
                .filter(c => c !== null);

            return {
                name: `${p.firstName} ${p.lastName}`,
                data: p,
                children: childrenNodes.length > 0 ? childrenNodes : null
            };
        };

        const hierarchyData = buildNode(focusId || data[0].id, 0);
        
        if (hierarchyData) {
            const root = d3.hierarchy(hierarchyData);
            
            // Configurazione Dimensioni
            const nodeWidth = 180;
            const nodeHeight = 60;
            
            // NodeSize([y, x]) -> In D3 tree, se vogliamo orizzontale, invertiamo mentalmente le dimensioni qui
            // Primo parametro: distanza VERTICALE tra i nodi fratelli
            // Secondo parametro: distanza ORIZZONTALE tra le generazioni
            const treeLayout = d3.tree().nodeSize([nodeHeight + 30, nodeWidth + 100]);
            
            treeLayout(root);

            // Centra l'albero inizialmente sul lato SINISTRO
            // Trasliamo verso il centro in altezza, e un po' marginato a sinistra
            const initialTransform = d3.zoomIdentity.translate(100, height/2).scale(0.8);
            svg.call(zoom.transform as any, initialTransform);

            const gTree = g.append("g");

            // Links (Linee curve)
            gTree.selectAll(".link")
                .data(root.links())
                .enter()
                .append("path")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke", "#cbd5e1")
                .attr("stroke-width", 1.5)
                // linkHorizontal usa (y, x) per disegnare da sinistra a destra
                .attr("d", d3.linkHorizontal()
                    .x((d: any) => d.y)
                    .y((d: any) => d.x) as any
                );

            // Nodes (Rettangoli)
            const node = gTree.selectAll(".node")
                .data(root.descendants())
                .enter()
                .append("g")
                .attr("class", "node")
                // Scambiamo X e Y nel translate: d.y è la profondità (Orizzontale), d.x è la posizione topologica (Verticale)
                .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
                .style("cursor", "pointer")
                .on("click", (event, d: any) => {
                    onSelectPerson(d.data.data);
                });

            // Ombra rettangolo
            node.append("rect")
                .attr("width", nodeWidth)
                .attr("height", nodeHeight)
                .attr("y", -nodeHeight / 2) // Centra verticalmente rispetto al punto d.x
                .attr("rx", 6)
                .attr("fill", (d: any) => d.data.data.gender === Gender.Male ? "#eff6ff" : (d.data.data.gender === Gender.Female ? "#fdf2f8" : "#fff"))
                .attr("stroke", (d: any) => d.data.data.id === selectedPersonId ? "#2563eb" : "#e2e8f0")
                .attr("stroke-width", (d: any) => d.data.data.id === selectedPersonId ? 2 : 1)
                .attr("filter", "drop-shadow(0px 1px 2px rgba(0,0,0,0.1))");

            // Nome
            node.append("text")
                .attr("dy", -5)
                .attr("x", 10)
                .style("font-weight", "600")
                .style("font-family", "sans-serif")
                .style("fill", "#1e293b")
                .text((d: any) => d.data.name);
            
            // Dati Nascita
            node.append("text")
                .attr("dy", 12)
                .attr("x", 10)
                .style("font-size", "11px")
                .style("fill", "#64748b")
                .text((d: any) => d.data.data.birthDate ? `Nato: ${d.data.data.birthDate}` : '');

            // Bottone "Rendi Radice"
            const btn = node.append("g")
                .attr("transform", `translate(${nodeWidth - 25}, ${-nodeHeight/2 + 5})`)
                .on("click", (e, d: any) => {
                    e.stopPropagation();
                    setFocusId(d.data.data.id);
                });
            btn.append("rect").attr("width", 20).attr("height", 20).attr("fill", "transparent");
            btn.append("text").text("⚓").attr("dy", 14).style("font-size", "14px").attr("fill", "#64748b")
               .append("title").text("Imposta come capostipite vista");
        }
    }

  }, [data, viewMode, focusId, selectedPersonId, onSelectPerson]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 border overflow-hidden relative">
      {/* Controlli Vista */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white/90 p-2 rounded-lg shadow-lg backdrop-blur-sm border border-slate-200">
        <div className="flex items-center gap-1 mb-1 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase px-1">Modalità Vista</span>
        </div>
        <button 
            onClick={() => setViewMode('network')}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition ${viewMode === 'network' ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            <Network size={16} /> Globale (Rete)
        </button>
        <button 
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition ${viewMode === 'tree' ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            <GitGraph size={16} /> Albero (Orizzontale)
        </button>
        
        {viewMode === 'network' && (
             <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400 px-1">
                 <div>🔵 Maschi</div>
                 <div>🟣 Femmine</div>
                 <div>🔴 Coniugi</div>
                 <div>⚪ Figli</div>
                 <div className="mt-1"><i>Trascina i nodi per riordinare</i></div>
             </div>
        )}
        {viewMode === 'tree' && (
             <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400 px-1">
                 Clicca ⚓ per cambiare radice
             </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 z-10 bg-white/90 p-1 rounded-lg shadow border border-slate-200 text-xs text-slate-500 px-3 py-1">
          Totale persone: {data.length}
      </div>

      <svg ref={svgRef} className="w-full h-full touch-none" style={{cursor: viewMode === 'network' ? 'grab' : 'default'}}></svg>
    </div>
  );
};