import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  // Imposta un focus iniziale sicuro
  useEffect(() => {
    if (data.length > 0 && !focusId) {
        // Cerca qualcuno che abbia figli ma non genitori (un capostipite)
        const root = data.find(p => !p.fatherId && !p.motherId && p.childrenIds.length > 0) || data[0];
        setFocusId(root.id);
    }
  }, [data, focusId]);

  useEffect(() => {
    if (!data || data.length === 0 || !focusId || !svgRef.current || !wrapperRef.current) return;

    // PULIZIA
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    try {
        const width = wrapperRef.current.clientWidth || 800;
        const height = wrapperRef.current.clientHeight || 600;

        // 1. COSTRUZIONE GERARCHIA (SOLO DISCENDENTI per stabilità)
        // D3 Tree layout supporta solo alberi, non grafi ciclici.
        // Costruiamo un albero temporaneo per la visualizzazione partendo dal focusId.
        
        const buildNode = (id: string, depth: number): any => {
            if (depth > 10) return null; // Limite profondità per sicurezza
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

        const hierarchyData = buildNode(focusId, 0);
        if (!hierarchyData) return;

        const root = d3.hierarchy(hierarchyData);
        
        const nodeWidth = 200;
        const nodeHeight = 80;
        
        // Layout ad albero
        const treeLayout = d3.tree().nodeSize([nodeHeight + 40, nodeWidth + 50]);
        treeLayout(root);

        // Disegno
        const g = svg.append("g");
        
        // Zoom e Pan
        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => g.attr("transform", event.transform));
            
        svg.call(zoom as any)
           .call(zoom.transform as any, d3.zoomIdentity.translate(width/2, 50).scale(0.8));

        // Links
        g.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 2)
            .attr("d", d3.linkHorizontal()
                .x((d: any) => d.y)
                .y((d: any) => d.x) as any
            );

        // Nodes
        const node = g.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
            .style("cursor", "pointer")
            .on("click", (event, d: any) => {
                onSelectPerson(d.data.data);
            });

        // Rettangolo Nodo
        node.append("rect")
            .attr("width", nodeWidth)
            .attr("height", nodeHeight)
            .attr("y", -nodeHeight / 2)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("fill", (d: any) => d.data.data.gender === Gender.Male ? "#ebf8ff" : "#fff5f5")
            .attr("stroke", (d: any) => d.data.data.id === selectedPersonId ? "#3182ce" : "#cbd5e0")
            .attr("stroke-width", (d: any) => d.data.data.id === selectedPersonId ? 3 : 1);

        // Testo Nome
        node.append("text")
            .attr("dy", -5)
            .attr("x", 10)
            .style("font-weight", "bold")
            .style("font-family", "serif")
            .text((d: any) => d.data.name);

        // Testo Date
        node.append("text")
            .attr("dy", 15)
            .attr("x", 10)
            .style("font-size", "12px")
            .style("fill", "#666")
            .text((d: any) => {
                const b = d.data.data.birthDate || '?';
                return `Nascita: ${b}`;
            });

        // Pulsante "Rendi Radice"
        const btn = node.append("g")
            .attr("transform", `translate(${nodeWidth - 25}, ${-nodeHeight/2 + 5})`)
            .on("click", (e, d: any) => {
                e.stopPropagation();
                setFocusId(d.data.data.id);
            });
            
        btn.append("rect").attr("width", 20).attr("height", 20).attr("fill", "transparent");
        btn.append("text").text("⚲").attr("dy", 15).style("font-size", "16px");

    } catch (e) {
        console.error("Errore disegno albero:", e);
        svg.append("text").text("Errore visualizzazione").attr("x", 50).attr("y", 50);
    }

  }, [data, focusId, selectedPersonId, onSelectPerson]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 border overflow-hidden relative">
      <div className="absolute top-2 left-2 bg-white/80 p-2 text-xs rounded z-10">
        Radice attuale: {data.find(p => p.id === focusId)?.firstName} <br/>
        (Clicca '⚲' su un nodo per centrare su di lui)
      </div>
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};