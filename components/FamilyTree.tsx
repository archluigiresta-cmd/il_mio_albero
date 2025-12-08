import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';
import { 
  GitBranch,
  Users,
  Layers,
  Maximize,
  Edit2,
  Navigation
} from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../constants';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
  onOpenEditor: (person: Person) => void;
}

type ViewMode = 'all' | 'branches' | 'units' | 'generations';

const VIRTUAL_ROOT_ID = 'SYSTEM_VIRTUAL_ROOT';

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

  const findTrueRoots = (people: Person[]): string[] => {
    // Una radice vera è chi non ha né padre né madre definiti nel database
    return people
      .filter(p => !p.fatherId && !p.motherId)
      .map(p => p.id);
  };

  const treeData = useMemo(() => {
    const build = (id: string, depth: number, visited: Set<string>): any => {
      if (visited.has(id)) return null;
      visited.add(id);

      const p = data.find(x => x.id === id);
      if (!p) return null;
      const spouse = data.find(s => p.spouseIds.includes(s.id));
      
      let childrenIds = p.childrenIds;
      if (viewMode === 'units' && id !== selectedPersonId) {
          childrenIds = [];
      }

      return {
        id: p.id,
        person: p,
        spouse,
        children: childrenIds.map(cid => build(cid, depth + 1, visited)).filter(Boolean)
      };
    };

    if (viewMode === 'all') {
        const rootIds = findTrueRoots(data);
        const visitedGlobal = new Set<string>();
        return {
            id: VIRTUAL_ROOT_ID,
            children: rootIds.map(r => build(r, 0, visitedGlobal)).filter(Boolean)
        };
    }

    const activeRootId = selectedPersonId ? (data.find(p => p.id === selectedPersonId)?.id || data[0]?.id) : data[0]?.id;
    return build(activeRootId, 0, new Set());
  }, [data, selectedPersonId, viewMode]);

  useEffect(() => {
    if (!treeData || !svgRef.current || !dimensions.width) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.02, 3])
      .on("zoom", (e) => g.attr("transform", e.transform));
    
    svg.call(zoom);

    // Initial Zoom Logic
    const initialScale = viewMode === 'all' ? 0.2 : 0.6;
    svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, 100).scale(initialScale));

    const root = d3.hierarchy(treeData);
    const nodeW = 220;
    const nodeH = 100;
    
    // Spaziatura ortogonale professionale
    const treeLayout = d3.tree().nodeSize([nodeW + 100, nodeH + 180]);
    treeLayout(root);

    if (viewMode === 'generations') {
        root.each(d => { d.y = d.depth * 300; });
    }

    // Linee di Connessione Ortogonali (Parent-Child)
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1.5)
      .attr("opacity", d => d.source.data.id === VIRTUAL_ROOT_ID ? 0 : 0.8)
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
      const person = d.data.person;
      const spouse = d.data.spouse;

      const drawPerson = (p: Person, offset: number) => {
        const isSelected = p.id === selectedPersonId;
        const card = gNode.append("g").attr("transform", `translate(${offset}, 0)`);

        card.append("rect")
          .attr("x", -nodeW/2)
          .attr("y", -nodeH/2)
          .attr("width", nodeW)
          .attr("height", nodeH)
          .attr("rx", 10)
          .attr("fill", isSelected ? "#f0f9ff" : "white")
          .attr("stroke", isSelected ? "#0284c7" : (p.gender === 'M' ? "#bfdbfe" : "#fbcfe8"))
          .attr("stroke-width", isSelected ? 3 : 1.5)
          .style("cursor", "pointer")
          .on("click", (e) => { e.stopPropagation(); onSelectPerson(p); });

        // Generation Badge
        card.append("circle").attr("cx", -nodeW/2).attr("cy", -nodeH/2).attr("r", 10).attr("fill", "#64748b");
        card.append("text").attr("x", -nodeW/2).attr("y", -nodeH/2 + 3).attr("text-anchor", "middle").style("font-size", "8px").style("fill", "white").text(d.depth);

        // Photo
        card.append("clipPath").attr("id", `clip-${p.id}`).append("circle").attr("r", 20).attr("cx", -nodeW/2 + 25).attr("cy", 0);
        card.append("image")
          .attr("xlink:href", p.photoUrl || PLACEHOLDER_IMAGE)
          .attr("x", -nodeW/2 + 5).attr("y", -20).attr("width", 40).attr("height", 40)
          .attr("clip-path", `url(#clip-${p.id})`);

        // Names
        card.append("text").attr("x", -nodeW/2 + 55).attr("y", -5).style("font-size", "13px").style("font-weight", "700").text(p.firstName);
        card.append("text").attr("x", -nodeW/2 + 55).attr("y", 12).style("font-size", "11px").style("fill", "#64748b").text(p.lastName);
        card.append("text").attr("x", -nodeW/2 + 55).attr("y", 28).style("font-size", "9px").style("fill", "#94a3b8").text(`${p.birthDate?.slice(-4) || '?'} - ${p.isLiving ? 'Viv.' : (p.deathDate?.slice(-4) || '?')}`);

        if (isSelected) {
            const edit = card.append("g")
              .attr("transform", `translate(${nodeW/2 - 15}, ${nodeH/2 - 15})`)
              .style("cursor", "pointer")
              .on("click", (e) => { e.stopPropagation(); onOpenEditor(p); });
            edit.append("circle").attr("r", 12).attr("fill", "#0284c7");
            edit.append("text").attr("x", -3).attr("y", 4).style("fill", "white").style("font-size", "9px").text("✎");
        }
      };

      if (spouse) {
        drawPerson(person, -nodeW/2 - 5);
        drawPerson(spouse, nodeW/2 + 5);
        gNode.append("line").attr("x1", -10).attr("x2", 10).attr("stroke", "#94a3b8").attr("stroke-dasharray", "3,3");
      } else {
        drawPerson(person, 0);
      }
    });
  }, [treeData, dimensions, viewMode, selectedPersonId]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur p-1 rounded-xl shadow-xl border flex">
          {[
            { id: 'all', icon: Maximize, label: 'TUTTO' },
            { id: 'branches', icon: GitBranch, label: 'RAMI' },
            { id: 'units', icon: Users, label: 'NUCLEI' },
            { id: 'generations', icon: Layers, label: 'CRONOLOGICO' }
          ].map(btn => (
            <button 
              key={btn.id}
              onClick={() => setViewMode(btn.id as ViewMode)}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-tight transition rounded-lg ${viewMode === btn.id ? 'bg-slate-900 text-white shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <btn.icon size={12} /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      <div className="absolute bottom-4 left-4 bg-white/80 p-2 rounded border text-[9px] text-slate-400 font-mono">
          Totale Membri: {data.length} | Modalità: {viewMode.toUpperCase()}
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2">
         <button 
           onClick={() => {
              if (svgRef.current && wrapperRef.current) {
                d3.select(svgRef.current).transition().duration(750).call(
                    d3.zoom().transform as any, 
                    d3.zoomIdentity.translate(dimensions.width/2, 100).scale(0.3)
                );
              }
           }}
           className="bg-white p-2 rounded-full border shadow hover:bg-slate-50 transition"
           title="Centra Visuale"
         >
           <Navigation size={16} className="text-slate-600" />
         </button>
      </div>
    </div>
  );
};