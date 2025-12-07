import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { Network, GitGraph, Search, ArrowDown } from 'lucide-react';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'network' | 'tree'>('tree');
  const [focusId, setFocusId] = useState<string | null>(null);

  // Imposta un focus iniziale (Capostipite)
  useEffect(() => {
    if (data.length > 0 && !focusId) {
        // Cerca qualcuno che non ha padre né madre nel dataset (Capostipite)
        // Oppure qualcuno con il maggior numero di discendenti
        const potentialRoot = data.find(p => !data.some(d => d.id === p.fatherId) && !data.some(d => d.id === p.motherId));
        
        if (potentialRoot) {
            setFocusId(potentialRoot.id);
        } else {
            // Fallback: il nodo con più figli
            const root = data.reduce((prev, current) => 
                (current.childrenIds.length > prev.childrenIds.length) ? current : prev
            , data[0]);
            setFocusId(root.id);
        }
    }
  }, [data, focusId]);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || !wrapperRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 
    
    const width = wrapperRef.current.clientWidth || 800;
    const height = wrapperRef.current.clientHeight || 600;

    const g = svg.append("g");
    
    const zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom as any);

    if (viewMode === 'network') {
        // --- VISTA RETE (FORCE) ---
        // Utile per vedere gruppi scollegati
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
            .force("collide", d3.forceCollide(50));

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
            .style("font-size", "10px")
            .style("pointer-events", "none");

        simulation.on("tick", () => {
            link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
            node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

        function dragstarted(event: any, d: any) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
        function dragged(event: any, d: any) { d.fx = event.x; d.fy = event.y; }
        function dragended(event: any, d: any) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

    } else {
        // --- VISTA ALBERO VERTICALE (GERARCHICO) ---
        
        const buildNode = (id: string, depth: number): any => {
            if (depth > 50) return null; // Safety break
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

        const hierarchyData = buildNode(focusId || data[0]?.id, 0);
        
        if (hierarchyData) {
            const root = d3.hierarchy(hierarchyData);
            
            // Configurazione Dimensioni Verticali
            const nodeWidth = 200;
            const nodeHeight = 80;
            const verticalGap = 100;
            
            // nodeSize([width, height]) -> x (orizzontale), y (verticale)
            const treeLayout = d3.tree().nodeSize([nodeWidth + 20, nodeHeight + verticalGap]);
            
            treeLayout(root);

            // Centra l'albero in alto
            const initialTransform = d3.zoomIdentity.translate(width/2, 80).scale(0.85);
            svg.call(zoom.transform as any, initialTransform);

            const gTree = g.append("g");

            // Links (Linee curve verticali)
            gTree.selectAll(".link")
                .data(root.links())
                .enter()
                .append("path")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke", "#94a3b8")
                .attr("stroke-width", 1.5)
                .attr("d", d3.linkVertical()
                    .x((d: any) => d.x)
                    .y((d: any) => d.y) as any
                );

            // Nodes (Rettangoli)
            const node = gTree.selectAll(".node")
                .data(root.descendants())
                .enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
                .style("cursor", "pointer")
                .on("click", (event, d: any) => {
                    event.stopPropagation();
                    onSelectPerson(d.data.data);
                });

            // Card Rettangolare
            node.append("rect")
                .attr("width", nodeWidth)
                .attr("height", nodeHeight)
                .attr("x", -nodeWidth / 2)
                .attr("y", -nodeHeight / 2)
                .attr("rx", 4)
                .attr("fill", "#ffffff")
                .attr("stroke", (d: any) => {
                    if (d.data.data.id === selectedPersonId) return "#2563eb"; // Selected Blue
                    return d.data.data.gender === Gender.Male ? "#93c5fd" : (d.data.data.gender === Gender.Female ? "#f9a8d4" : "#cbd5e1");
                })
                .attr("stroke-width", (d: any) => d.data.data.id === selectedPersonId ? 3 : 1)
                .attr("filter", "drop-shadow(0px 2px 3px rgba(0,0,0,0.1))");

            // Nome
            node.append("text")
                .attr("dy", -5)
                .attr("text-anchor", "middle")
                .style("font-weight", "bold")
                .style("font-family", "sans-serif")
                .style("font-size", "14px")
                .style("fill", "#1e293b")
                .text((d: any) => d.data.name);
            
            // Dati (Nascita - Morte)
            node.append("text")
                .attr("dy", 15)
                .attr("text-anchor", "middle")
                .style("font-size", "11px")
                .style("fill", "#64748b")
                .text((d: any) => {
                    const b = d.data.data.birthDate || '?';
                    const dth = d.data.data.deathDate || (d.data.data.isLiving ? '' : '?');
                    return `${b} - ${dth}`;
                });
            
            // Icona Coniuge (se presente)
            node.each(function(d: any) {
                if (d.data.data.spouseIds && d.data.data.spouseIds.length > 0) {
                     d3.select(this).append("text")
                        .attr("dy", 30)
                        .attr("text-anchor", "middle")
                        .style("font-size", "10px")
                        .style("fill", "#ef4444")
                        .text("❤");
                }
            });

            // Bottone "Rendi Radice" (sopra il box)
            const btn = node.append("g")
                .attr("transform", `translate(${nodeWidth/2 - 20}, ${-nodeHeight/2 - 10})`)
                .on("click", (e, d: any) => {
                    e.stopPropagation();
                    setFocusId(d.data.data.id);
                });
            btn.append("rect").attr("width", 20).attr("height", 20).attr("fill", "transparent");
            btn.append("path")
               .attr("d", "M12 5v14M5 12l7 7 7-7") // Arrow down icon path approx
               .attr("stroke", "#64748b")
               .attr("stroke-width", 2)
               .attr("fill", "none")
               .attr("transform", "scale(0.8)");
        }
    }

  }, [data, viewMode, focusId, selectedPersonId, onSelectPerson]);

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
            <ArrowDown size={16} /> Albero (Dall'alto)
        </button>
        <button 
            onClick={() => setViewMode('network')}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition ${viewMode === 'network' ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            <Network size={16} /> Globale (Rete)
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-10 bg-white/90 p-1 rounded-lg shadow border border-slate-200 text-xs text-slate-500 px-3 py-1">
          Totale persone: {data.length}
      </div>

      <svg ref={svgRef} className="w-full h-full touch-none" style={{cursor: 'grab'}}></svg>
    </div>
  );
};