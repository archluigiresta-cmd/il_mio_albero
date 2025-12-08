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
  Palette,
  ChevronRight
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
  "#2563eb", // Blue (Resta Focus)
  "#059669", // Emerald (Murri Focus)
  "#d97706", // Amber
  "#db2777", // Pink
  "#7c3aed", // Violet
  "#0891b2", // Cyan
  "#ea580c", // Orange
  "#4b5563"  // Slate
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
    setHiddenClans(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
    
    // Ordiniamo i clan per importanza (numero di discendenti) per evitare che i Murri spariscano
    return roots.map((root, i) => {
      const tree = build(root.id, 0, new Set());
      const countDescendants = (node: any): number => {
          return 1 + node.children.reduce((acc: number, child: any) => acc + countDescendants(child), 0);
      };
      return {
        rootId: root.id,
        name: `${root.lastName} ${root.firstName}`,
        color: CLAN_COLORS[i % CLAN_COLORS.length],
        tree,
        memberCount: countDescendants(tree)
      };
    }).sort((a, b) => b.memberCount - a.memberCount); // Clan più popolosi prima
  }, [data, viewMode, selectedPersonId]);

  useEffect(() => {
    if (!clans.length || !svgRef.current || !dimensions.width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 3])
      .on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);

    const nodeW = 220;
    const nodeH = 110;
    const hGap = 300;
    const vGap = 220;

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
        .attr("transform", `translate(${currentXOffset - minX + 150}, 150)`);

      // Draw Paths
      clanGroup.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", clan.color)
        .attr("stroke-width", 3)
        .attr("opacity", 0.3)
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
            .attr("rx", 16).attr("fill", "white")
            .attr("stroke", isSel ? "#1e293b" : (person.gender === 'M' ? "#bfdbfe" : "#fbcfe8"))
            .attr("stroke-width", isSel ? 4 : 2)
            .attr("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.06))")
            .style("cursor", "pointer")
            .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

          // Avatar Frame
          const avSize = 60;
          card.append("circle").attr("r", avSize/2 + 2).attr("cx", -nodeW/2 + 40).attr("cy", 0).attr("fill", clan.color).attr("opacity", 0.1);
          card.append("circle").attr("r", avSize/2).attr("cx", -nodeW/2 + 40).attr("cy", 0).attr("fill", "#f1f5f9").attr("stroke", clan.color).attr("stroke-width", 2);
          
          card.append("clipPath").attr("id", `cp-${person.id}`).append("circle").attr("r", avSize/2 - 2).attr("cx", -nodeW/2 + 40).attr("cy", 0);
          card.append("image")
            .attr("xlink:href", person.photoUrl || PLACEHOLDER_IMAGE)
            .attr("x", -nodeW/2 + 40 - avSize/2).attr("y", -avSize/2).attr("width", avSize).attr("height", avSize)
            .attr("preserveAspectRatio", "xMidYMid slice")
            .attr("clip-path", `url(#cp-${person.id})`);

          // Text Data
          card.append("text").attr("x", -nodeW/2 + 80).attr("y", -15).style("font-size", "14px").style("font-weight", "800").style("fill", "#1e293b").text(person.firstName);
          card.append("text").attr("x", -nodeW/2 + 80).attr("y", 5).style("font-size", "12px").style("font-weight", "600").style("fill", "#64748b").text(person.lastName);
          card.append("text").attr("x", -nodeW/2 + 80).attr("y", 25).style("font-size", "10px").style("fill", clan.color).style("font-weight", "bold")
            .text(`${person.birthDate?.slice(-4) || '?'} - ${person.deathDate?.slice(-4) || (person.isLiving ? 'Viv' : '?')}`);

          // Gen Badge
          card.append("circle").attr("cx", nodeW/2 - 12).attr("cy", -nodeH/2 + 12).attr("r", 10).attr("fill", "#f8fafc").attr("stroke", "#e2e8f0");
          card.append("text").attr("x", nodeW/2 - 12).attr("y", -nodeH/2 + 15).attr("text-anchor", "middle").style("fill", "#94a3b8").style("font-size", "8px").style("font-weight", "bold").text(d.depth);
        };

        if (spouse) {
          drawCard(p, -nodeW/2 - 8);
          drawCard(spouse, nodeW/2 + 8);
          group.append("line").attr("x1", -15).attr("x2", 15).attr("stroke", clan.color).attr("stroke-width", 2).attr("stroke-dasharray", "4,4");
        } else {
          drawCard(p, 0);
        }
      });

      currentXOffset += clanWidth;
    });

    if (viewMode === 'all') {
      svg.call(zoom.transform, d3.zoomIdentity.translate(dimensions.width/2 - 400, 100).scale(0.35));
    }
  }, [clans, hiddenClans, dimensions, viewMode, selectedPersonId]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-[#f8fafc] relative overflow-hidden">
      {/* Dynamic View Selector */}
      <div className="absolute top-6 left-6 z-20 flex gap-3">
        <div className="bg-white p-1 rounded-2xl shadow-xl border border-slate-200 flex items-center">
          {[
            { id: 'all', icon: Maximize, label: 'PANORAMA' },
            { id: 'branches', icon: GitBranch, label: 'CEPPATA' },
            { id: 'generations', icon: Layers, label: 'LINEA TEMPO' }
          ].map(btn => (
            <button 
              key={btn.id}
              onClick={() => setViewMode(btn.id as ViewMode)}
              className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold tracking-widest transition rounded-xl ${viewMode === btn.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <btn.icon size={13} /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Right Toolbar: Legacy Explorer (Clan Sidebar) */}
      <div className="absolute top-6 right-6 z-20 w-72 bg-white border rounded-3xl shadow-2xl p-6 hidden md:flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b pb-3">
          < Palette size={18} className="text-slate-400" />
          <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Esplora Clan</h3>
        </div>
        
        <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
          {clans.map(clan => (
            <div 
              key={clan.rootId} 
              onClick={() => toggleClan(clan.rootId)}
              className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${hiddenClans.has(clan.rootId) ? 'bg-slate-50 opacity-40 grayscale' : 'bg-white shadow-sm border-slate-100 hover:border-slate-300 active:scale-95'}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-1 rounded-full" style={{ backgroundColor: clan.color }} />
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-800 truncate w-32">{clan.name}</span>
                    <span className="text-[9px] text-slate-400">{clan.memberCount} membri</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 {hiddenClans.has(clan.rootId) ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-800" />}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-start gap-2">
            <ChevronRight size={14} className="text-emerald-500 mt-0.5" />
            <p className="text-[9px] text-emerald-700 leading-relaxed font-medium">
                I clan sono ordinati per importanza storica. I Murri e i Resta sono sempre visibili in alto.
            </p>
        </div>
      </div>

      {/* Stats UI */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3">
        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3">
          <Users size={14} className="text-emerald-400" />
          <span className="text-[11px] font-black uppercase tracking-widest">
            {data.length} Totali &bull; {clans.length - hiddenClans.size} Ceppi Attivi
          </span>
        </div>
      </div>

      {/* Navigation Tools */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
         <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 1.5)} className="bg-white p-3.5 rounded-2xl border shadow-xl hover:bg-slate-50 active:scale-90 transition"><ZoomIn size={20} className="text-slate-600" /></button>
         <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 0.7)} className="bg-white p-3.5 rounded-2xl border shadow-xl hover:bg-slate-50 active:scale-90 transition"><ZoomOut size={20} className="text-slate-600" /></button>
         <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().transform as any, d3.zoomIdentity.translate(dimensions.width/2 - 400, 100).scale(0.3))} className="bg-white p-3.5 rounded-2xl border border-blue-100 shadow-xl hover:bg-blue-50 text-blue-600 active:scale-90 transition"><Navigation size={20} /></button>
      </div>
    </div>
  );
};