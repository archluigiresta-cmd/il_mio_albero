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
  ChevronRight,
  Menu,
  X
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    }).sort((a, b) => b.memberCount - a.memberCount);
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

    const nodeW = 220;
    const nodeH = 110;
    const hGap = 320;
    const vGap = 240;

    let currentXOffset = 0;
    const activeClans = clans.filter(c => !hiddenClans.has(c.rootId) || viewMode !== 'all');

    activeClans.forEach((clan) => {
      const root = d3.hierarchy(clan.tree);
      const treeLayout = d3.tree().nodeSize([hGap, vGap]);
      treeLayout(root);

      const descendants = root.descendants();
      const minX = d3.min(descendants, d => d.x) || 0;
      const maxX = d3.max(descendants, d => d.x) || 0;
      const clanWidth = maxX - minX + hGap;

      const clanGroup = g.append("g")
        .attr("transform", `translate(${currentXOffset - minX + 150}, 150)`);

      // Links
      clanGroup.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", clan.color)
        .attr("stroke-width", 3)
        .attr("opacity", 0.25)
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
        const person = d.data.person;
        const spouse = d.data.spouse;

        const drawCard = (p: Person, ox: number) => {
          const isSel = p.id === selectedPersonId;
          const card = group.append("g").attr("transform", `translate(${ox}, 0)`);

          card.append("rect")
            .attr("x", -nodeW/2).attr("y", -nodeH/2)
            .attr("width", nodeW).attr("height", nodeH)
            .attr("rx", 20).attr("fill", "white")
            .attr("stroke", isSel ? "#000" : (p.gender === 'M' ? "#bfdbfe" : "#fbcfe8"))
            .attr("stroke-width", isSel ? 4 : 2)
            .attr("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.05))")
            .style("cursor", "pointer")
            .on("click", (e) => { e.stopPropagation(); onSelectPerson(p); });

          // Profile Image
          const avSize = 64;
          card.append("circle").attr("r", avSize/2 + 2).attr("cx", -nodeW/2 + 40).attr("cy", 0).attr("fill", clan.color).attr("opacity", 0.1);
          card.append("circle").attr("r", avSize/2).attr("cx", -nodeW/2 + 40).attr("cy", 0).attr("fill", "#f8fafc").attr("stroke", "white").attr("stroke-width", 3);
          
          card.append("clipPath").attr("id", `cp-${p.id}`).append("circle").attr("r", avSize/2).attr("cx", -nodeW/2 + 40).attr("cy", 0);
          card.append("image")
            .attr("xlink:href", p.photoUrl || PLACEHOLDER_IMAGE)
            .attr("x", -nodeW/2 + 40 - avSize/2).attr("y", -avSize/2).attr("width", avSize).attr("height", avSize)
            .attr("preserveAspectRatio", "xMidYMid slice")
            .attr("clip-path", `url(#cp-${p.id})`);

          // Info
          card.append("text").attr("x", -nodeW/2 + 85).attr("y", -15).style("font-size", "14px").style("font-weight", "800").style("fill", "#1e293b").text(p.firstName);
          card.append("text").attr("x", -nodeW/2 + 85).attr("y", 5).style("font-size", "12px").style("fill", "#64748b").text(p.lastName);
          card.append("text").attr("x", -nodeW/2 + 85).attr("y", 25).style("font-size", "10px").style("fill", clan.color).style("font-weight", "bold")
            .text(`${p.birthDate?.slice(-4) || '?'} - ${p.deathDate?.slice(-4) || (p.isLiving ? 'Viv' : '?')}`);

          // Gen Badge
          card.append("rect").attr("x", nodeW/2 - 25).attr("y", -nodeH/2 + 5).attr("width", 20).attr("height", 20).attr("rx", 6).attr("fill", "#f1f5f9");
          card.append("text").attr("x", nodeW/2 - 15).attr("y", -nodeH/2 + 18).attr("text-anchor", "middle").style("fill", "#64748b").style("font-size", "9px").style("font-weight", "bold").text(d.depth + 1);
        };

        if (spouse) {
          drawCard(person, -nodeW/2 - 8);
          drawCard(spouse, nodeW/2 + 8);
          group.append("line").attr("x1", -15).attr("x2", 15).attr("stroke", clan.color).attr("stroke-width", 2).attr("stroke-dasharray", "4,4");
        } else {
          drawCard(person, 0);
        }
      });

      currentXOffset += clanWidth + 100;
    });

    // Auto Framing Logic
    if (viewMode === 'all') {
      const scale = dimensions.width / (currentXOffset + 500);
      svg.call(zoom.transform, d3.zoomIdentity.translate(dimensions.width/2 - (currentXOffset * scale)/2, 100).scale(Math.min(scale, 0.4)));
    }
  }, [clans, hiddenClans, dimensions, viewMode, selectedPersonId]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-[#fcfdfe] relative overflow-hidden">
      {/* Dynamic View Selector */}
      <div className="absolute top-6 left-6 z-20 flex gap-3">
        <div className="bg-white/90 backdrop-blur p-1 rounded-2xl shadow-xl border border-slate-200 flex items-center">
          {[
            { id: 'all', icon: Maximize, label: 'PANORAMA' },
            { id: 'branches', icon: GitBranch, label: 'CEPPATA' },
            { id: 'generations', icon: Layers, label: 'TEMPO' }
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

      {/* Sidebar Toggle Button (Floating) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-6 right-6 z-30 flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-emerald-50 text-emerald-600 font-bold text-xs hover:bg-emerald-50 transition-all animate-fadeIn"
        >
          <Menu size={16} /> CLAN
        </button>
      )}

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Sidebar a Scomparsa (Drawer) */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l z-40 transition-transform duration-500 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-slate-400" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Esplora Clan</h3>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-900 transition p-1 bg-slate-50 rounded-lg">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {clans.map(clan => (
              <div 
                key={clan.rootId} 
                onClick={() => toggleClan(clan.rootId)}
                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${hiddenClans.has(clan.rootId) ? 'bg-slate-50 opacity-40 grayscale' : 'bg-white shadow-sm border-slate-100 hover:border-slate-300 active:scale-95'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="h-5 w-1.5 rounded-full" style={{ backgroundColor: clan.color }} />
                  <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-800 truncate w-36">{clan.name}</span>
                      <span className="text-[9px] text-slate-400">{clan.memberCount} membri</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                   {hiddenClans.has(clan.rootId) ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-emerald-500" />}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-slate-50 p-4 rounded-3xl border flex items-start gap-3">
              <ChevronRight size={16} className="text-slate-400 mt-1" />
              <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
                  Clicca sull'occhio per accendere o spegnere un intero ceppo familiare nella panoramica generale.
              </p>
          </div>
        </div>
      </div>

      {/* Info Stats */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
          <Users size={14} className="text-emerald-400" />
          <span className="text-[11px] font-black uppercase tracking-widest">
            {data.length} Membri &bull; {clans.length - hiddenClans.size} Attivi
          </span>
        </div>
      </div>

      {/* Navigation Tools */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
         <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 1.4)} className="bg-white p-4 rounded-2xl border shadow-xl hover:bg-slate-50 active:scale-90 transition text-slate-600"><ZoomIn size={20} /></button>
         <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 0.7)} className="bg-white p-4 rounded-2xl border shadow-xl hover:bg-slate-50 active:scale-90 transition text-slate-600"><ZoomOut size={20} /></button>
         <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().transform as any, d3.zoomIdentity.translate(dimensions.width/2, 100).scale(0.3))} className="bg-white p-4 rounded-2xl border border-blue-50 shadow-xl hover:bg-blue-50 text-blue-600 active:scale-90 transition"><Navigation size={20} /></button>
      </div>
    </div>
  );
};