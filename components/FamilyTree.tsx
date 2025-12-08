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
  ZoomOut,
  Eye,
  EyeOff,
  Palette
} from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../constants';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
  onOpenEditor: (person: Person) => void;
}

type ViewMode = 'all' | 'branches' | 'units' | 'generations';

const CLAN_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16"  // Lime
];

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId, onOpenEditor }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [hiddenClans, setHiddenClans] = useState<Set<string>>(new Set());

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

  const toggleClan = (id: string) => {
    const next = new Set(hiddenClans);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHiddenClans(next);
  };

  const clans = useMemo(() => {
    const build = (id: string, depth: number, visited = new Set<string>()): any => {
      if (visited.has(id)) return null;
      visited.add(id);
      const p = data.find(x => x.id === id);
      if (!p) return null;
      const spouse = data.find(s => p.spouseIds.includes(s.id));
      let childrenIds = p.childrenIds;
      if (viewMode === 'units' && id !== selectedPersonId) childrenIds = [];
      return {
        id: p.id,
        person: p,
        spouse,
        children: childrenIds.map(cid => build(cid, depth + 1, visited)).filter(Boolean)
      };
    };

    const roots = data.filter(p => !p.fatherId && !p.motherId);
    return roots.map((root, i) => ({
      rootId: root.id,
      name: `${root.lastName} ${root.firstName}`,
      color: CLAN_COLORS[i % CLAN_COLORS.length],
      tree: build(root.id, 0, new Set())
    }));
  }, [data, viewMode, selectedPersonId]);

  useEffect(() => {
    if (!clans.length || !svgRef.current || !dimensions.width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.02, 3])
      .on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);

    const nodeW = 200;
    const nodeH = 100;
    const hGap = 280;
    const vGap = 200;

    let currentXOffset = 0;

    clans.forEach((clan) => {
      if (hiddenClans.has(clan.rootId) && viewMode === 'all') return;
      
      const root = d3.hierarchy(clan.tree);
      const treeLayout = d3.tree().nodeSize([hGap, vGap]);
      treeLayout(root);

      const descendants = root.descendants();
      const minX = d3.min(descendants, d => d.x) || 0;
      const maxX = d3.max(descendants, d => d.x) || 0;
      const clanWidth = maxX - minX + hGap;

      const clanGroup = g.append("g")
        .attr("transform", `translate(${currentXOffset - minX + 100}, 150)`);

      // Draw Paths with Clan Color
      clanGroup.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", clan.color)
        .attr("stroke-width", 2.5)
        .attr("opacity", 0.4)
        .attr("d", d => {
          const sx = d.source.x, sy = d.source.y;
          const tx = d.target.x, ty = d.target.y;
          const midY = (sy + ty) / 2;
          return `M${sx},${sy + nodeH/2} V${midY} H${tx} V${ty - nodeH/2}`;
        });

      // Nodes
      const nodeGroups = clanGroup.selectAll(".node")
        .data(descendants)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

      nodeGroups.each(function(d: any) {
        const group = d3.select(this);
        const p = d.data.person;
        const spouse = d.data.spouse;

        const drawCard = (person: Person, ox: number) => {
          const isSel = person.id === selectedPersonId;
          const card = group.append("g").attr("transform", `translate(${ox}, 0)`);

          card.append("rect")
            .attr("x", -nodeW/2).attr("y", -nodeH/2)
            .attr("width", nodeW).attr("height", nodeH)
            .attr("rx", 14).attr("fill", "white")
            .attr("stroke", isSel ? "#000" : (person.gender === 'M' ? "#dbeafe" : "#fce7f3"))
            .attr("stroke-width", isSel ? 3 : 2)
            .attr("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.05))")
            .style("cursor", "pointer")
            .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

          // Photo Frame
          card.append("circle").attr("r", 28).attr("cx", -nodeW/2 + 35).attr("cy", 0).attr("fill", "#f8fafc").attr("stroke", clan.color).attr("stroke-width", 1.5);
          card.append("clipPath").attr("id", `cp-${person.id}`).append("circle").attr("r", 25).attr("cx", -nodeW/2 + 35).attr("cy", 0);
          card.append("image")
            .attr("xlink:href", person.photoUrl || PLACEHOLDER_IMAGE)
            .attr("x", -nodeW/2 + 10).attr("y", -25).attr("width", 50).attr("height", 50)
            .attr("clip-path", `url(#cp-${person.id})`);

          // Info
          card.append("text").attr("x", -nodeW/2 + 70).attr("y", -10).style("font-size", "13px").style("font-weight", "bold").text(person.firstName);
          card.append("text").attr("x", -nodeW/2 + 70).attr("y", 8).style("font-size", "11px").style("fill", "#64748b").text(person.lastName);
          card.append("text").attr("x", -nodeW/2 + 70).attr("y", 25).style("font-size", "9px").style("fill", clan.color).style("font-weight", "bold").text(`${person.birthDate?.slice(-4) || '?'} - ${person.deathDate?.slice(-4) || (person.isLiving ? 'Viv' : '?')}`);

          // Generation Badge
          card.append("circle").attr("cx", -nodeW/2).attr("cy", -nodeH/2).attr("r", 8).attr("fill", clan.color);
          card.append("text").attr("x", -nodeW/2).attr("y", -nodeH/2 + 3).attr("text-anchor", "middle").style("fill", "white").style("font-size", "7px").style("font-weight", "bold").text(d.depth + 1);
        };

        if (spouse) {
          drawCard(p, -nodeW/2 - 2);
          drawCard(spouse, nodeW/2 + 2);
          group.append("line").attr("x1", -5).attr("x2", 5).attr("stroke", clan.color).attr("stroke-dasharray", "3,3");
        } else {
          drawCard(p, 0);
        }
      });

      currentXOffset += clanWidth;
    });

    if (viewMode === 'all') {
      svg.call(zoom.transform, d3.zoomIdentity.translate(50, 50).scale(0.25));
    }
  }, [clans, hiddenClans, dimensions, viewMode, selectedPersonId]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-[#fcfdfe] relative overflow-hidden">
      {/* Top Controls */}
      <div className="absolute top-6 left-6 z-20 flex gap-3">
        <div className="bg-white/90 backdrop-blur border p-1 rounded-2xl shadow-xl flex items-center gap-1">
          {[
            { id: 'all', icon: Maximize, label: 'PANORAMA' },
            { id: 'branches', icon: GitBranch, label: 'RAMI' },
            { id: 'units', icon: Users, label: 'NUCLEI' },
            { id: 'generations', icon: Layers, label: 'TEMPO' }
          ].map(btn => (
            <button 
              key={btn.id}
              onClick={() => setViewMode(btn.id as ViewMode)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-widest transition rounded-xl ${viewMode === btn.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <btn.icon size={12} /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Right Sidebar: Clan Visibility Toggle */}
      <div className="absolute top-6 right-6 z-20 w-64 bg-white/90 backdrop-blur border rounded-2xl shadow-2xl p-4 hidden md:block">
        <div className="flex items-center gap-2 mb-4 border-b pb-2">
          <Palette size={16} className="text-slate-400" />
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Clan Identificati</h3>
        </div>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {clans.map(clan => (
            <div 
              key={clan.rootId} 
              onClick={() => toggleClan(clan.rootId)}
              className={`group flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${hiddenClans.has(clan.rootId) ? 'bg-slate-50 opacity-60' : 'bg-white shadow-sm border-slate-100 hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: clan.color }} />
                <span className="text-[10px] font-bold text-slate-700 truncate w-32">{clan.name}</span>
              </div>
              <button className="text-slate-400 hover:text-slate-900">
                {hiddenClans.has(clan.rootId) ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[9px] text-slate-400 italic font-medium">
          * Clicca su un clan per nascondere/mostrare l'intero ramo.
        </p>
      </div>

      {/* Info Badge */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg border border-slate-800 flex items-center gap-3">
          <Users size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {data.length} Totali | {clans.length - hiddenClans.size} Clan attivi
          </span>
        </div>
      </div>

      {/* Zoom Toolbar */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
         <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 1.4)} className="bg-white p-3 rounded-xl border shadow-lg hover:bg-slate-50 active:scale-95 transition"><ZoomIn size={18} /></button>
         <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 0.7)} className="bg-white p-3 rounded-xl border shadow-lg hover:bg-slate-50 active:scale-95 transition"><ZoomOut size={18} /></button>
         <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().transform as any, d3.zoomIdentity.translate(dimensions.width/2, 100).scale(0.3))} className="bg-white p-3 rounded-xl border border-emerald-100 shadow-lg hover:bg-emerald-50 text-emerald-600 transition active:scale-95"><Navigation size={18} /></button>
      </div>
    </div>
  );
};