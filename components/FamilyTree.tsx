import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Person } from '../types';
import { 
  GitBranch,
  Users,
  Layers,
  Maximize,
  Navigation,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../constants';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
  onOpenEditor: (person: Person) => void;
}

type ViewMode = 'all' | 'branches' | 'units' | 'generations';

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId, onOpenEditor }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('all');

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

  // Motore di analisi dei Clan (Isolamento dei rami scollegati)
  const clanData = useMemo(() => {
    const visitedGlobal = new Set<string>();
    
    const buildHierarchy = (id: string, depth: number): any => {
      if (visitedGlobal.has(id)) return null; // Previene duplicati circolari
      visitedGlobal.add(id);

      const p = data.find(x => x.id === id);
      if (!p) return null;
      const spouse = data.find(s => p.spouseIds.includes(s.id));
      
      let childrenIds = p.childrenIds;
      if (viewMode === 'units' && id !== selectedPersonId) childrenIds = [];

      return {
        id: p.id,
        person: p,
        spouse,
        children: childrenIds.map(cid => buildHierarchy(cid, depth + 1)).filter(Boolean)
      };
    };

    if (viewMode === 'all') {
      const roots = data.filter(p => !p.fatherId && !p.motherId);
      return roots.map(root => buildHierarchy(root.id, 0)).filter(Boolean);
    }

    const startId = selectedPersonId || (data[0]?.id);
    if (!startId) return [];
    return [buildHierarchy(startId, 0)].filter(Boolean);
  }, [data, selectedPersonId, viewMode]);

  useEffect(() => {
    if (!clanData.length || !svgRef.current || !dimensions.width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.01, 3])
      .on("zoom", (e) => g.attr("transform", e.transform));
    
    svg.call(zoom);

    const nodeW = 180;
    const nodeH = 80;
    const horizontalGap = 100;
    const verticalGap = 150;

    let currentXOffset = 0;

    // Disegna ogni Clan separatamente per evitare sovrapposizioni
    clanData.forEach((clan, index) => {
      const root = d3.hierarchy(clan);
      const treeLayout = d3.tree().nodeSize([nodeW + 80, nodeH + verticalGap]);
      treeLayout(root);

      if (viewMode === 'generations') {
        root.each(d => { d.y = d.depth * 250; });
      }

      // Trova l'estensione orizzontale di questo clan
      const descendants = root.descendants();
      const minX = d3.min(descendants, d => d.x) || 0;
      const maxX = d3.max(descendants, d => d.x) || 0;
      const clanWidth = maxX - minX + nodeW + horizontalGap;

      const clanGroup = g.append("g")
        .attr("transform", `translate(${currentXOffset - minX + horizontalGap}, 100)`);

      // Linee Ortogonali Pulite
      clanGroup.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 1.5)
        .attr("d", d => {
          const sx = d.source.x, sy = d.source.y;
          const tx = d.target.x, ty = d.target.y;
          const midY = (sy + ty) / 2;
          return `M${sx},${sy + nodeH/2} V${midY} H${tx} V${ty - nodeH/2}`;
        });

      // Schede Personaggi
      const nodeGroups = clanGroup.selectAll(".node")
        .data(descendants)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

      nodeGroups.each(function(d: any) {
        const pGroup = d3.select(this);
        const p = d.data.person;
        const spouse = d.data.spouse;

        const drawCard = (person: Person, offset: number) => {
          const isSelected = person.id === selectedPersonId;
          const card = pGroup.append("g").attr("transform", `translate(${offset}, 0)`);

          card.append("rect")
            .attr("x", -nodeW/2)
            .attr("y", -nodeH/2)
            .attr("width", nodeW)
            .attr("height", nodeH)
            .attr("rx", 8)
            .attr("fill", isSelected ? "#eff6ff" : "white")
            .attr("stroke", isSelected ? "#3b82f6" : (person.gender === 'M' ? "#dbeafe" : "#fce7f3"))
            .attr("stroke-width", isSelected ? 2 : 1)
            .style("cursor", "pointer")
            .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

          // Generation Index
          card.append("text").attr("x", -nodeW/2 + 5).attr("y", -nodeH/2 + 15).style("font-size", "8px").style("fill", "#94a3b8").text(`G${d.depth + 1}`);

          // Content
          card.append("text").attr("x", -nodeW/2 + 10).attr("y", -nodeH/2 + 35).style("font-size", "12px").style("font-weight", "bold").text(person.firstName);
          card.append("text").attr("x", -nodeW/2 + 10).attr("y", -nodeH/2 + 50).style("font-size", "11px").style("fill", "#64748b").text(person.lastName);
          card.append("text").attr("x", -nodeW/2 + 10).attr("y", -nodeH/2 + 65).style("font-size", "9px").style("fill", "#94a3b8").text(`${person.birthDate?.slice(-4) || '?'} - ${person.deathDate?.slice(-4) || (person.isLiving ? 'Viv' : '?')}`);
        };

        if (spouse) {
          drawCard(p, -nodeW/2 - 2);
          drawCard(spouse, nodeW/2 + 2);
          pGroup.append("line").attr("x1", -5).attr("x2", 5).attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2");
        } else {
          drawCard(p, 0);
        }
      });

      currentXOffset += clanWidth;
    });

    // Reset view based on initial bounds
    svg.call(zoom.transform, d3.zoomIdentity.translate(50, 50).scale(0.4));

  }, [clanData, dimensions, viewMode, selectedPersonId]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-[#fcfcfd] relative overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <div className="bg-white/90 backdrop-blur border p-1 rounded-xl shadow-sm flex items-center">
          {[
            { id: 'all', icon: Maximize, label: 'PANORAMA' },
            { id: 'branches', icon: GitBranch, label: 'RAMI' },
            { id: 'units', icon: Users, label: 'NUCLEI' },
            { id: 'generations', icon: Layers, label: 'LINEA TEMPO' }
          ].map(btn => (
            <button 
              key={btn.id}
              onClick={() => setViewMode(btn.id as ViewMode)}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest transition rounded-lg ${viewMode === btn.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <btn.icon size={12} /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Info Badge */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/80 backdrop-blur px-3 py-1 rounded border text-[9px] text-slate-400 font-mono">
            {clanData.length} Clan identificati | Anti-Overlapping Attivo
        </div>
        {viewMode === 'all' && (
          <div className="bg-emerald-50 px-3 py-1 rounded border border-emerald-100 text-[9px] text-emerald-700 font-medium">
              Panorama completo di tutti i capostipiti indipendenti
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2">
         <button 
           onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 1.2)}
           className="bg-white p-2 rounded-lg border shadow-sm hover:bg-slate-50"
         ><ZoomIn size={16} /></button>
         <button 
           onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 0.8)}
           className="bg-white p-2 rounded-lg border shadow-sm hover:bg-slate-50"
         ><ZoomOut size={16} /></button>
         <button 
           onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().transform as any, d3.zoomIdentity.translate(50, 50).scale(0.3))}
           className="bg-white p-2 rounded-lg border shadow-sm hover:bg-slate-50"
         ><Navigation size={16} /></button>
      </div>
    </div>
  );
};