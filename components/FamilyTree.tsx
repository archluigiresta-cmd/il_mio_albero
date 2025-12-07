import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { Network, GitGraph, Search, ArrowDown, ZoomIn, Crosshair, RotateCcw, Maximize } from 'lucide-react';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'network' | 'tree'>('tree');
  
  // State per gestire la radice visuale corrente (Totale vs Parziale)
  const [visualRootId, setVisualRootId] = useState<string | null>(null);
  const [historyIds, setHistoryIds] = useState<string[]>([]); // Per tornare indietro passo passo se necessario

  // Trova il capostipite assoluto (o il migliore candidato)
  const findAbsoluteRoot = (people: Person[]) => {
      if (!people || people.length === 0) return null;
      // Cerca qualcuno senza genitori nel dataset
      const root = people.find(p => 
          !people.some(d => d.id === p.fatherId) && 
          !people.some(d => d.id === p.motherId)
      );
      // Fallback: nodo con più discendenti diretti
      if (!root) {
          return people.reduce((prev, current) => 
            (current.childrenIds.length > prev.childrenIds.length) ? current : prev
          , people[0]);
      }
      return root;
  };

  const handleSetFocus = (id: string) => {
      setVisualRootId(id);
      // Opzionale: scroll up o reset zoom se necessario, ma D3 lo gestirà
  };

  const handleResetFocus = () => {
      setVisualRootId(null);
  };

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || !wrapperRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 
    
    const width = wrapperRef.current.clientWidth || 1000;
    const height = wrapperRef.current.clientHeight || 800;

    const g = svg.append("g");
    
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom as any);

    if (viewMode === 'network') {
        // --- VISTA RETE (FORCE) ---
        // (Invariata per compatibilità, utile per debug relazioni)
        const nodes = data.map(d => ({ ...d }));
        const links: any[] = [];

        data.forEach(p => {
            p.childrenIds.forEach(childId => {
                if (data.find(x => x.id === childId)) links.push({ source: p.id, target: childId, type: 'child' });
            });
            p.spouseIds.forEach(spouseId => {
                if (p.id < spouseId && data.find(x => x.id === spouseId)) links.push({ source: p.id, target: spouseId, type: 'spouse' });
            });
        });

        const simulation = d3.forceSimulation(nodes as any)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(60));

        const link = g.append("g").selectAll("line")
            .data(links).enter().append("line")
            .attr("stroke", "#cbd5e1").attr("stroke-width", 2);

        const node = g.append("g").selectAll("g")
            .data(nodes).enter().append("g")
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any);

        node.append("circle")
            .attr("r", 25)
            .attr("fill", (d: any) => d.gender === Gender.Male ? "#eff6ff" : (d.gender === Gender.Female ? "#fdf2f8" : "#f1f5f9"))
            .attr("stroke", (d: any) => d.id === selectedPersonId ? "#2563eb" : "#94a3b8")
            .attr("stroke-width", (d: any) => d.id === selectedPersonId ? 3 : 1)
            .on("click", (e, d: any) => { e.stopPropagation(); onSelectPerson(d); });

        node.append("text")
            .text((d: any) => d.firstName)
            .attr("text-anchor", "middle")
            .attr("dy", 4)
            .style("font-size", "10px");

        simulation.on("tick", () => {
            link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
            node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

        function dragstarted(event: any, d: any) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
        function dragged(event: any, d: any) { d.fx = event.x; d.fy = event.y; }
        function dragended(event: any, d: any) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

    } else {
        // --- VISTA ALBERO PROFESSIONALE (Schematico Ortogonale) ---
        
        // 1. Determina la radice corrente
        let rootPerson = visualRootId ? data.find(p => p.id === visualRootId) : findAbsoluteRoot(data);
        if (!rootPerson && data.length > 0) rootPerson = data[0];

        // 2. Costruisci la gerarchia ricorsiva
        const buildNode = (id: string, depth: number): any => {
            if (depth > 50) return null; // Break loop
            const p = data.find(x => x.id === id);
            if (!p) return null;

            // Raccogli i figli
            // Nota: Ordiniamo per data di nascita se possibile per coerenza visuale
            const childrenNodes = p.childrenIds
                .map(cid => buildNode(cid, depth + 1))
                .filter(c => c !== null)
                .sort((a, b) => {
                    const dateA = a.data.birthDate || "9999";
                    const dateB = b.data.birthDate || "9999";
                    return dateA.localeCompare(dateB);
                });

            return {
                name: `${p.firstName} ${p.lastName}`,
                data: p,
                children: childrenNodes.length > 0 ? childrenNodes : null
            };
        };

        const hierarchyData = rootPerson ? buildNode(rootPerson.id, 0) : null;
        
        if (hierarchyData) {
            const root = d3.hierarchy(hierarchyData);
            
            // Configurazione Dimensioni
            const nodeWidth = 220;
            const nodeHeight = 70;
            const horizontalSpacing = 40;
            const verticalSpacing = 120; // Aumentato per le linee ortogonali
            
            const treeLayout = d3.tree()
                .nodeSize([nodeWidth + horizontalSpacing, nodeHeight + verticalSpacing]);
            
            treeLayout(root);

            // Centra l'albero inizialmente
            const initialTransform = d3.zoomIdentity.translate(width/2, 100).scale(0.8);
            svg.call(zoom.transform as any, initialTransform);

            const gTree = g.append("g");

            // --- DISEGNO LINK ORTOGONALI (Angolo Retto) ---
            gTree.selectAll(".link")
                .data(root.links())
                .enter()
                .append("path")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke", "#64748b") // Slate-500
                .attr("stroke-width", 1.5)
                .attr("d", (d: any) => {
                    // Logica percorso: Start(Bottom Middle) -> Giù a metà -> Orizzontale -> Giù a Top Target
                    const sourceX = d.source.x;
                    const sourceY = d.source.y + nodeHeight / 2; // Parte dal fondo del genitore
                    const targetX = d.target.x;
                    const targetY = d.target.y - nodeHeight / 2; // Arriva in cima al figlio
                    const midY = (sourceY + targetY) / 2;

                    return `M${sourceX},${sourceY} 
                            V${midY} 
                            H${targetX} 
                            V${targetY}`;
                });

            // --- DISEGNO NODI ---
            const node = gTree.selectAll(".node")
                .data(root.descendants())
                .enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
                .style("cursor", "pointer")
                .on("click", (event, d: any) => {
                    event.stopPropagation();
                    // Seleziona per la sidebar
                    onSelectPerson(d.data.data);
                });

            // Box Rettangolare (Stile Schematico)
            node.append("rect")
                .attr("width", nodeWidth)
                .attr("height", nodeHeight)
                .attr("x", -nodeWidth / 2)
                .attr("y", -nodeHeight / 2)
                .attr("rx", 0) // Spigoli vivi per look tecnico, o poco smussati
                .attr("ry", 0)
                .attr("fill", "#ffffff")
                // Bordo colorato in base al sesso, più scuro se selezionato
                .attr("stroke", (d: any) => {
                    if (d.data.data.id === selectedPersonId) return "#000000";
                    return d.data.data.gender === Gender.Male ? "#3b82f6" : (d.data.data.gender === Gender.Female ? "#ec4899" : "#94a3b8");
                })
                .attr("stroke-width", (d: any) => d.data.data.id === selectedPersonId ? 2 : 1)
                // Ombra leggera
                .attr("filter", "drop-shadow(2px 2px 2px rgba(0,0,0,0.05))");

            // Indicatore laterale colorato (Banda sinistra)
            node.append("rect")
                .attr("width", 4)
                .attr("height", nodeHeight)
                .attr("x", -nodeWidth / 2)
                .attr("y", -nodeHeight / 2)
                .attr("fill", (d: any) => d.data.data.gender === Gender.Male ? "#3b82f6" : (d.data.data.gender === Gender.Female ? "#ec4899" : "#94a3b8"));

            // Nome Persona
            node.append("text")
                .attr("dy", -5)
                .attr("x", -nodeWidth / 2 + 15) // Allineato a sinistra
                .attr("text-anchor", "start")
                .style("font-weight", "600")
                .style("font-family", "sans-serif")
                .style("font-size", "13px")
                .style("fill", "#1e293b")
                .text((d: any) => {
                    // Tronca se troppo lungo
                    const name = d.data.name;
                    return name.length > 25 ? name.substring(0, 22) + '...' : name;
                });
            
            // Dati Date
            node.append("text")
                .attr("dy", 12)
                .attr("x", -nodeWidth / 2 + 15)
                .attr("text-anchor", "start")
                .style("font-size", "11px")
                .style("fill", "#64748b")
                .text((d: any) => {
                    const b = d.data.data.birthDate || '';
                    const dth = d.data.data.deathDate || (d.data.data.isLiving ? '' : '†');
                    if (!b && !dth) return '';
                    return `${b} - ${dth}`;
                });

            // --- PULSANTI AZIONE SUL NODO ---
            
            // 1. FOCUS BUTTON (Mirino)
            // Mostra solo se il nodo ha figli (ha senso fare focus per vedere i discendenti) o se non siamo già sulla radice visuale
            node.each(function(d: any) {
                // Posizione in basso a destra del nodo
                const btnGroup = d3.select(this).append("g")
                    .attr("transform", `translate(${nodeWidth/2 - 25}, ${nodeHeight/2 - 25})`)
                    .style("cursor", "pointer")
                    .on("click", (e) => {
                        e.stopPropagation();
                        handleSetFocus(d.data.data.id);
                    });

                // Sfondo bottone
                btnGroup.append("rect")
                    .attr("width", 24)
                    .attr("height", 24)
                    .attr("rx", 4)
                    .attr("fill", "#f1f5f9")
                    .attr("stroke", "#cbd5e1");

                // Icona Focus (Cerchio e mirino stilizzato)
                btnGroup.append("circle").attr("cx", 12).attr("cy", 12).attr("r", 6).attr("stroke", "#475569").attr("fill", "none");
                btnGroup.append("line").attr("x1", 12).attr("y1", 4).attr("x2", 12).attr("y2", 7).attr("stroke", "#475569");
                btnGroup.append("line").attr("x1", 12).attr("y1", 17).attr("x2", 12).attr("y2", 20).attr("stroke", "#475569");
                btnGroup.append("line").attr("x1", 4).attr("y1", 12).attr("x2", 7).attr("y2", 12).attr("stroke", "#475569");
                btnGroup.append("line").attr("x1", 17).attr("y1", 12).attr("x2", 20).attr("y2", 12).attr("stroke", "#475569");
                
                // Tooltip
                btnGroup.append("title").text("Focalizza vista su questo ramo");
            });

            // Icona Coniuge (Se presente)
            node.each(function(d: any) {
                if (d.data.data.spouseIds && d.data.data.spouseIds.length > 0) {
                     d3.select(this).append("text")
                        .attr("dx", nodeWidth/2 - 10)
                        .attr("dy", -nodeHeight/2 + 15)
                        .attr("text-anchor", "end")
                        .style("font-size", "12px")
                        .style("fill", "#ef4444")
                        .text("❤");
                }
            });
        }
    }

  }, [data, viewMode, visualRootId, selectedPersonId, onSelectPerson]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 border overflow-hidden relative">
      {/* Controlli Vista */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white/90 p-2 rounded-lg shadow-lg backdrop-blur-sm border border-slate-200">
        <div className="flex items-center gap-1 mb-1 pb-2 border-b border-slate-100">
            <Search size={14} className="text-slate-400"/>
            <span className="text-xs font-bold text-slate-500 uppercase px-1">Vista</span>
        </div>
        <button 
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition ${viewMode === 'tree' ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            <ArrowDown size={16} /> Albero (Schematico)
        </button>
        <button 
            onClick={() => setViewMode('network')}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition ${viewMode === 'network' ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            <Network size={16} /> Globale (Rete)
        </button>
      </div>

      {/* Pulsante RESET FOCUS (appare solo se siamo in vista parziale) */}
      {viewMode === 'tree' && visualRootId && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <button 
                onClick={handleResetFocus}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-emerald-700 transition font-medium animate-bounce-in"
              >
                  <Maximize size={16} />
                  Torna all'Albero Completo
              </button>
          </div>
      )}

      <div className="absolute bottom-4 right-4 z-10 bg-white/90 p-1 rounded-lg shadow border border-slate-200 text-xs text-slate-500 px-3 py-1 flex items-center gap-2">
          <span>Totale: {data.length}</span>
          {visualRootId && <span className="text-emerald-600 font-bold">(Vista Parziale)</span>}
      </div>

      <svg ref={svgRef} className="w-full h-full touch-none" style={{cursor: 'grab'}}></svg>
    </div>
  );
};