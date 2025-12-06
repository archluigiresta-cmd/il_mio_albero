import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { ZoomIn, ZoomOut, User as UserIcon, Move } from 'lucide-react';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
}

interface TreeNode extends d3.HierarchyPointNode<any> {
  data: Person & { isSpouse?: boolean };
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  // Initialize or Reset focus
  useEffect(() => {
    // Se non c'è un focusId, o se il focusId corrente non esiste più nei nuovi dati (es. post import)
    const currentFocusExists = focusId && data.find(p => p.id === focusId);
    
    if (data.length > 0 && (!focusId || !currentFocusExists)) {
      // Cerca un capostipite (senza genitori ma con figli) o prendi il primo
      const root = data.find(p => !p.fatherId && !p.motherId && p.childrenIds.length > 0) || data[0];
      setFocusId(root.id);
    }
  }, [data, focusId]);

  const drawTree = useCallback(() => {
    if (!svgRef.current || !wrapperRef.current || data.length === 0 || !focusId) return;

    // Safety check: ensure focus person exists
    const rootPerson = data.find(p => p.id === focusId);
    if (!rootPerson) return;

    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight;
    
    // Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Helper to build hierarchy object for D3
    const buildHierarchy = (personId: string, depth = 0): any => {
      const p = data.find(x => x.id === personId);
      if (!p) return null;
      
      // Get children
      const childrenNodes = p.childrenIds
        .map(cid => buildHierarchy(cid, depth + 1))
        .filter(c => c !== null);

      return {
        ...p,
        children: childrenNodes.length > 0 ? childrenNodes : undefined
      };
    };

    const hierarchyData = buildHierarchy(focusId);
    
    if (!hierarchyData) return;

    const root = d3.hierarchy(hierarchyData) as d3.HierarchyNode<Person>;
    
    // Config values
    const nodeWidth = 220;
    const nodeHeight = 100;
    const horizontalSep = 50;
    const verticalSep = 100;

    // Tree layout
    const treeLayout = d3.tree<Person>().nodeSize([nodeHeight + horizontalSep, nodeWidth + verticalSep]);
    
    // @ts-ignore - D3 typing issues with generic data
    const nodes = treeLayout(root);

    // Zoom behavior
    const g = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom)
       .call(zoom.transform, d3.zoomIdentity.translate(width / 4, height / 2).scale(0.8));

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
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
      .attr("class", (d) => `node cursor-pointer transition-opacity duration-300 hover:opacity-80`)
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
      .on("click", (event, d) => {
        const originalPerson = data.find(p => p.id === d.data.id);
        if (originalPerson) onSelectPerson(originalPerson);
      });

    // Node Box
    node.append("rect")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("x", 0)
      .attr("y", -nodeHeight / 2)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", (d) => d.data.gender === Gender.Male ? "#eff6ff" : "#fff1f2") // Light blue vs Light pink
      .attr("stroke", (d) => d.data.id === selectedPersonId ? "#2563eb" : "#cbd5e1")
      .attr("stroke-width", (d) => d.data.id === selectedPersonId ? 3 : 1)
      .attr("filter", "drop-shadow(2px 2px 2px rgba(0,0,0,0.05))");

    // Image placeholder
    node.append("circle")
      .attr("cx", 40)
      .attr("cy", 0)
      .attr("r", 25)
      .attr("fill", "#e2e8f0")
      .attr("stroke", "#cbd5e1");
    
    // Initials in circle
    node.append("text")
      .attr("x", 40)
      .attr("y", 6)
      .attr("text-anchor", "middle")
      .attr("class", "text-sm font-bold text-slate-500 pointer-events-none")
      .text((d) => {
          const first = d.data.firstName?.[0] || '';
          const last = d.data.lastName?.[0] || '';
          return (first + last).toUpperCase();
      });

    // Name
    node.append("text")
      .attr("x", 80)
      .attr("y", -10)
      .attr("class", "text-sm font-semibold text-slate-800 font-serif")
      .text((d) => {
         const full = `${d.data.firstName} ${d.data.lastName}`;
         return full.length > 18 ? full.substring(0, 16) + '...' : full;
      });

    // Dates
    node.append("text")
      .attr("x", 80)
      .attr("y", 10)
      .attr("class", "text-xs text-slate-500")
      .text((d) => {
        const b = d.data.birthDate ? new Date(d.data.birthDate).getFullYear() || d.data.birthDate : '?';
        const dDate = d.data.deathDate ? new Date(d.data.deathDate).getFullYear() || d.data.deathDate : '';
        return `${b} - ${dDate}`;
      });
      
    // Action: Set as Focus
    const focusGroup = node.append("g")
        .attr("transform", `translate(${nodeWidth - 30}, ${-nodeHeight/2 + 10})`)
        .style("cursor", "pointer")
        .on("click", (e, d) => {
            e.stopPropagation();
            setFocusId(d.data.id);
        });
    
    focusGroup.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "transparent");
        
    focusGroup.append("path")
        .attr("d", "M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z") // Plus icon
        .attr("fill", "none")
        .attr("stroke", "#64748b");
    
    // Label for Focus button
    focusGroup.append("title").text("Imposta come radice albero");

  }, [data, focusId, onSelectPerson, selectedPersonId]);

  useEffect(() => {
    drawTree();
    const handleResize = () => drawTree();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawTree]);

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden border border-slate-200 rounded-lg shadow-inner" ref={wrapperRef}>
        <div className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded shadow backdrop-blur-sm text-xs text-slate-600">
            <p><strong>Vista:</strong> Discendenti</p>
            <p><strong>Radice:</strong> {data.find(p => p.id === focusId)?.firstName || 'Nessuno'}</p>
            <p className="italic mt-1">Clicca su una persona per dettagli.</p>
            <p className="italic">Usa l'icona sul nodo per ricentrare.</p>
        </div>
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
    </div>
  );
};