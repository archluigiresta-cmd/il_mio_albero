import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { 
  Search, 
  Layers, 
  Users, 
  GitBranch,
  Maximize,
  Edit2
} from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../constants';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
  onOpenEditor: (person: Person) => void;
}

type ViewMode = 'all' | 'branches' | 'units' | 'generations';

const VIRTUAL_ROOT_ID = 'VIRTUAL_ROOT';

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

  const findRoot = (id: string): string => {
    let current = data.find(p => p.id === id);
    while (current && current.fatherId) {
      const parent = data.find(p => p.id === current.fatherId);
      if (parent) current = parent; else break;
    }
    return current?.id || id;
  };

  const treeData = useMemo(() => {
    const build = (id: string, depth: number, visited = new Set()): any => {
      if (visited.has(id)) return null;
      visited.add(id);

      const p = data.find(x => x.id === id);
      if (!p) return null;
      const spouse = data.find(s => p.spouseIds.includes(s.id));
      
      let children = p.childrenIds;
      if (viewMode === 'units' && id !== selectedPersonId) {
          children = [];
      }

      return {
        id: p.id,
        person: p,
        spouse,
        children: children.map(cid => build(cid, depth + 1, visited)).filter(Boolean)
      };
    };

    if (viewMode === 'all') {
        const roots = data.filter(p => !p.fatherId && !p.motherId);
        const visitedGlobal = new Set();
        return {
            id: VIRTUAL_ROOT_ID,
            person: { id: VIRTUAL_ROOT_ID, firstName: 'Root' } as Person,
            children: roots.map(r => build(r.id, 0, visitedGlobal)).filter(Boolean)
        };
    }

    const activeRootId = selectedPersonId ? findRoot(selectedPersonId) : data[0]?.id;
    if (!activeRootId) return null;
    return build(activeRootId, 0);
  }, [data, selectedPersonId, viewMode]);

  useEffect(() => {
    if (!treeData || !svgRef.current || !dimensions.width) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 2])
      .on("zoom", (e) => g.attr("transform", e.transform));
    
    svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(width/2, 50).scale(viewMode === 'all' ? 0.3 : 0.5));

    const root = d3.hierarchy(treeData);
    const nodeW = 220;
    const nodeH = 100;
    
    const treeLayout = d3.tree().nodeSize([nodeW + 120, nodeH + 160]);
    treeLayout(root);

    if (viewMode === 'generations') {
        root.each(d => { d.y = d.depth * 280; });
    }

    // Linee Ortogonali
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1.5)
      .attr("opacity", d => d.source.data.id === VIRTUAL_ROOT_ID ? 0 : 1)
      .attr("d", d => {
        const sx = d.source.x, sy = d.source.y;
        const tx = d.target.x, ty = d.target.y;
        const midY = (sy + ty) / 2;
        return `M${sx},${sy + nodeH/2} V${midY} H${tx} V${ty - nodeH/2}`;
      });

    const nodes = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    nodes.each(function(d: any) {
      if (d.data.id === VIRTUAL_ROOT_ID) return;
      const gNode = d3.select(this);
      const p = d.data.person;
      const s = d.data.spouse;

      const drawCard = (person: Person, ox: number) => {
        const isSelected = person.id === selectedPersonId;
        const card = gNode.append("g").attr("transform", `translate(${ox},0)`);
        
        card.append("rect")
          .attr("x", -nodeW/2)
          .attr("y", -nodeH/2)
          .attr("width", nodeW)
          .attr("height", nodeH)
          .attr("rx", 12)
          .attr("fill", isSelected ? "#f0fdf4" : "white")
          .attr("stroke", isSelected ? "#059669" : (person.gender === 'M' ? "#3b82f6" : "#ec4899"))
          .attr("stroke-width", isSelected ? 3 : 1.5)
          .style("cursor", "pointer")
          .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

        // Badge Generazione
        const badge = card.append("g").attr("transform", `translate(${-nodeW/2}, ${-nodeH/2})`);
        badge.append("circle").attr("r", 12).attr("fill", "#64748b");
        badge.append("text").attr("y", 4).attr("text-anchor", "middle").style("font-size", "9px").style("fill", "white").style("font-weight", "bold").text(`G${d.depth}`);

        card.append("clipPath").attr("id", `avatar-${person.id}`).append("circle").attr("r", 25).attr("cx", -nodeW/2 + 35).attr("cy", 0);
        card.append("image")
          .attr("xlink:href", person.photoUrl || PLACEHOLDER_IMAGE)
          .attr("x", -nodeW/2 + 10).attr("y", -25)
          .attr("width", 50).attr("height", 50)
          .attr("clip-path", `url(#avatar-${person.id})`);

        card.append("text").attr("x", -nodeW/2 + 70).attr("y", -10).style("font-size", "14px").style("font-weight", "bold").style("fill", "#0f172a").text(person.firstName);
        card.append("text").attr("x", -nodeW/2 + 70).attr("y", 6).style("font-size", "12px").style("fill", "#64748b").text(person.lastName);
        card.append("text").attr("x", -nodeW/2 + 70).attr("y", 22).style("font-size", "10px").style("fill", "#94a3b8").text(`${person.birthDate?.slice(-4) || '?'} - ${person.deathDate?.slice(-4) || (person.isLiving ? 'Viv' : '?')}`);

        if (isSelected) {
            const edit = card.append("g")
              .attr("transform", `translate(${nodeW/2}, -${nodeH/2})`)
              .style("cursor", "pointer")
              .on("click", (e) => { e.stopPropagation(); onOpenEditor(person); });
            edit.append("circle").attr("r", 14).attr("fill", "#059669").attr("stroke", "white").attr("stroke-width", 2);
            edit.append("text").attr("x", -4).attr("y", 4).style("fill", "white").style("font-size", "10px").text("✎");
        }
      };

      if (s) {
        drawCard(p, -nodeW/2 - 5);
        drawCard(s, nodeW/2 + 5);
        gNode.append("line").attr("x1", -10).attr("x2", 10).attr("stroke", "#cbd5e1").attr("stroke-dasharray", "4");
      } else {
        drawCard(p, 0);
      }
    });
  }, [treeData, dimensions, viewMode, selectedPersonId]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-white p-1 rounded-xl shadow-lg border flex overflow-hidden">
          {[
            { id: 'all', icon: Maximize, label: 'TUTTO' },
            { id: 'branches', icon: GitBranch, label: 'RAMI' },
            { id: 'units', icon: Users, label: 'NUCLEI' },
            { id: 'generations', icon: Layers, label: 'GEN' }
          ].map(btn => (
            <button 
              key={btn.id}
              onClick={() => setViewMode(btn.id as ViewMode)}
              className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold transition ${viewMode === btn.id ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <btn.icon size={12} /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full border text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Visualizzazione: {viewMode.toUpperCase()}
          </div>
          {viewMode === 'all' && (
              <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 text-[10px] text-blue-700">
                  Panorama completo di tutti i capostipiti
              </div>
          )}
      </div>
    </div>
  );
};