import React, { useEffect, useRef, useState, useMemo, useTransition } from 'react';
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
  X,
  Loader2
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
  
  // React 18 Transition per risolvere INP issue
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  
  const [hiddenClans, setHiddenClans] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Gestione resize finestra
  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.clientWidth,
          height: wrapperRef.current.clientHeight
        });
      }
    };
    setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleViewChange = (mode: ViewMode) => {
    startTransition(() => {
      setViewMode(mode);
    });
  };

  const toggleClan = (id: string) => {
    startTransition(() => {
        setHiddenClans(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
        });
    });
  };

  // Calcolo struttura dati (Pesante)
  const clans = useMemo(() => {
    const globalVisited = new Set<string>();

    const build = (id: string, depth: number, visited = new Set<string>()): any => {
      if (visited.has(id)) return null;
      visited.add(id);
      
      const p = data.find(x => x.id === id);
      if (!p) return null;

      // Marcatura globale per evitare che questa persona o i suoi coniugi
      // vengano processati come "nuovi clan" successivamente.
      globalVisited.add(p.id);
      p.spouseIds.forEach(sid => globalVisited.add(sid));

      const spouse = data.find(s => p.spouseIds.includes(s.id));
      let childrenIds = p.childrenIds;
      
      // Filtro visualizzazione nuclei
      if (viewMode === 'units' && id !== selectedPersonId && !p.spouseIds.includes(selectedPersonId || '')) {
         if(childrenIds.length > 0 && id !== selectedPersonId) childrenIds = [];
      }
      
      return {
        id: p.id,
        person: p,
        spouse,
        children: childrenIds.map(cid => build(cid, depth + 1, visited)).filter(Boolean)
      };
    };

    // Ordina i potenziali capostipiti per numero di discendenti (stima grezza o logica business)
    // In questo modo processiamo prima i rami grossi.
    const roots = data.filter(p => !p.fatherId && !p.motherId);
    
    // Per un sort migliore, calcoliamo i discendenti prima o ci basiamo sull'ordine naturale.
    // Qui usiamo un approccio greedy: processiamo e marchiamo.
    
    const validClans: any[] = [];

    // Priorità: Murri e Resta (Hardcoded check per portarli in cima se necessario, 
    // ma l'algoritmo di sort finale gestisce la visualizzazione)
    
    roots.forEach((root) => {
        // Se la persona è già stata inclusa in un altro albero (es. come coniuge), saltiamola.
        if (globalVisited.has(root.id)) return;

        const tree = build(root.id, 0, new Set());
        if (tree) {
            const countDescendants = (node: any): number => {
                if(!node) return 0;
                return 1 + (node.children || []).reduce((acc: number, child: any) => acc + countDescendants(child), 0);
            };
            validClans.push({
                rootId: root.id,
                name: `${root.lastName} ${root.firstName}`,
                tree,
                memberCount: countDescendants(tree)
            });
        }
    });

    // Assegna colori e ordina per grandezza
    return validClans
        .sort((a, b) => b.memberCount - a.memberCount)
        .map((c, i) => ({ ...c, color: CLAN_COLORS[i % CLAN_COLORS.length] }));

  }, [data, viewMode, selectedPersonId]);

  // Render D3 (Pesante)
  useEffect(() => {
    if (!clans.length || !svgRef.current || !dimensions.width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Pulisci tutto
    
    const g = svg.append("g").attr("id", "main-group");

    // Configurazione Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 4])
      .on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);

    // Parametri Layout
    const nodeW = 240;
    const nodeH = 100;
    const hGap = 350; // Distanza orizzontale tra nodi fratelli
    const vGap = 200; // Distanza verticale tra generazioni

    let currentXOffset = 0;
    const activeClans = clans.filter(c => !hiddenClans.has(c.rootId));

    if (activeClans.length === 0) {
        g.append("text").attr("x", 0).attr("y", 0).text("Nessun clan visibile").style("font-size", "24px").attr("text-anchor", "middle");
        return;
    }

    // --- DISEGNO DEI CLAN ---
    activeClans.forEach((clan) => {
      const root = d3.hierarchy(clan.tree);
      const treeLayout = d3.tree().nodeSize([nodeW + 40, vGap]); 
      treeLayout(root);

      const descendants = root.descendants();
      const links = root.links();

      // Calcola larghezza reale di questo clan
      let minX = Infinity;
      let maxX = -Infinity;
      descendants.forEach(d => {
          if (d.x < minX) minX = d.x;
          if (d.x > maxX) maxX = d.x;
      });
      const clanWidth = maxX - minX + nodeW;

      // Gruppo per il singolo clan
      const clanGroup = g.append("g")
        .attr("transform", `translate(${currentXOffset - minX}, 0)`);

      // 1. Linee di connessione (Links) - SQUADRATE / ORTOGONALI
      clanGroup.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "#64748b") // Colore grigio neutro per le linee, meno intrusivo del colore clan
        .attr("stroke-width", 2)
        .attr("d", (d: any) => {
            const sy = d.source.y + nodeH/2;
            const ty = d.target.y - nodeH/2;
            const midY = (sy + ty) / 2;
            
            // Logica Ortogonale: M -> V -> H -> V
            return `M ${d.source.x} ${sy} 
                    V ${midY} 
                    H ${d.target.x} 
                    V ${ty}`;
        });

      // 2. Nodi (Persone)
      const nodeGroups = clanGroup.selectAll(".node")
        .data(descendants)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

      nodeGroups.each(function(d: any, i: number) {
        const group = d3.select(this);
        const p = d.data.person;
        const spouse = d.data.spouse;
        
        // Funzione helper per disegnare la card
        const drawCard = (person: Person, offsetX: number) => {
          const isSel = person.id === selectedPersonId;
          const card = group.append("g").attr("transform", `translate(${offsetX}, 0)`);

          // Ombra e sfondo
          card.append("rect")
            .attr("x", -nodeW/2).attr("y", -nodeH/2)
            .attr("width", nodeW).attr("height", nodeH)
            .attr("rx", 12).attr("ry", 12)
            .attr("fill", "white")
            .attr("stroke", isSel ? "#1e293b" : (person.gender === 'M' ? "#e2e8f0" : "#fce7f3"))
            .attr("stroke-width", isSel ? 3 : 1.5)
            .style("cursor", "pointer")
            .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

          // Header colorato
          card.append("path")
             .attr("d", `M${-nodeW/2},-nodeH/2 a12,12 0 0 1 12,-12 h${nodeW-24} a12,12 0 0 1 12,12 v6 h-${nodeW} z`)
             .attr("transform", `translate(0, ${-nodeH/2 + 6})`) 
             .attr("fill", isSel ? "#1e293b" : (person.gender === 'M' ? "#f1f5f9" : "#fdf2f8"));

          // Foto / Avatar
          const avSize = 56;
          const avX = -nodeW/2 + 38;
          
          card.append("circle")
             .attr("cx", avX).attr("cy", 0).attr("r", avSize/2 + 2)
             .attr("fill", "white").attr("stroke", clan.color).attr("stroke-width", 2);
          
          card.append("clipPath").attr("id", `cp-${person.id}-${i}`) 
             .append("circle").attr("cx", avX).attr("cy", 0).attr("r", avSize/2);

          card.append("image")
             .attr("xlink:href", person.photoUrl || PLACEHOLDER_IMAGE)
             .attr("x", avX - avSize/2).attr("y", -avSize/2)
             .attr("width", avSize).attr("height", avSize)
             .attr("preserveAspectRatio", "xMidYMid slice")
             .attr("clip-path", `url(#cp-${person.id}-${i})`);

          // Testi
          const textX = -nodeW/2 + 80;
          
          // Nome
          card.append("text")
             .attr("x", textX).attr("y", -12)
             .style("font-size", "14px").style("font-weight", "700").style("fill", "#0f172a")
             .text(person.firstName);
          
          // Cognome
          card.append("text")
             .attr("x", textX).attr("y", 6)
             .style("font-size", "12px").style("font-weight", "500").style("fill", "#64748b").style("text-transform", "uppercase")
             .text(person.lastName);

          // Date
          const dateStr = `${person.birthDate?.slice(-4) || ''} - ${person.deathDate?.slice(-4) || (person.isLiving ? '' : '†')}`;
          card.append("text")
             .attr("x", textX).attr("y", 24)
             .style("font-size", "11px").style("fill", clan.color).style("font-weight", "600")
             .text(dateStr);
             
          // Badge Generazione (Opzionale)
          if(d.depth === 0) {
             card.append("circle").attr("cx", nodeW/2 - 15).attr("cy", -nodeH/2 + 15).attr("r", 8).attr("fill", clan.color);
             card.append("text").attr("x", nodeW/2 - 15).attr("y", -nodeH/2 + 18).attr("text-anchor", "middle").style("fill", "white").style("font-size", "10px").text("C");
          }
        };

        if (spouse) {
          // Disegna coppia
          drawCard(p, -nodeW/2 - 10);
          drawCard(spouse, nodeW/2 + 10);
          // Link coniugale
          group.append("line")
            .attr("x1", -20).attr("x2", 20).attr("y1", 0).attr("y2", 0)
            .attr("stroke", "#94a3b8").attr("stroke-width", 2);
        } else {
          // Singolo
          drawCard(p, 0);
        }
      });

      currentXOffset += clanWidth + hGap;
    });

    // --- AUTO FIT (ZOOM TO FIT) ---
    try {
        const bounds = (g.node() as SVGGraphicsElement).getBBox();
        const fullWidth = dimensions.width;
        const fullHeight = dimensions.height;
        
        if (bounds.width > 0 && bounds.height > 0 && fullWidth > 0) {
            const scale = 0.9 / Math.max(
                bounds.width / fullWidth, 
                bounds.height / fullHeight
            );
            
            const finalScale = Math.min(scale, 1); 

            const tx = (fullWidth - bounds.width * finalScale) / 2 - bounds.x * finalScale;
            const ty = (fullHeight - bounds.height * finalScale) / 2 - bounds.y * finalScale;

            svg.transition().duration(750)
               .call(zoom.transform as any, d3.zoomIdentity.translate(tx, 50).scale(finalScale));
        }
    } catch (e) {
        console.error("Auto-fit error", e);
    }

  }, [clans, hiddenClans, dimensions, selectedPersonId]); 

  return (
    <div ref={wrapperRef} className="w-full h-full bg-[#f8fafc] relative overflow-hidden">
      
      {/* Loading Overlay */}
      {isPending && (
          <div className="absolute top-4 right-20 z-50 bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-emerald-600 flex items-center gap-2 shadow-sm border animate-pulse">
              <Loader2 size={12} className="animate-spin" /> Elaborazione...
          </div>
      )}

      {/* Dynamic View Selector */}
      <div className="absolute top-6 left-6 z-20 flex gap-3">
        <div className="bg-white/95 backdrop-blur p-1.5 rounded-2xl shadow-xl border border-slate-200 flex items-center">
          {[
            { id: 'all', icon: Maximize, label: 'PANORAMA' },
            { id: 'branches', icon: GitBranch, label: 'CEPPATA' },
            { id: 'generations', icon: Layers, label: 'TEMPO' }
          ].map(btn => (
            <button 
              key={btn.id}
              onClick={() => handleViewChange(btn.id as ViewMode)}
              disabled={isPending}
              className={`
                flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest transition-all rounded-xl
                ${viewMode === btn.id 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}
                ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <btn.icon size={14} /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Toggle Button (Floating) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-6 right-6 z-30 flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all hover:scale-105"
        >
          <Menu size={16} /> CLAN
        </button>
      )}

      {/* SVG Canvas */}
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

      {/* Sidebar a Scomparsa (Drawer) */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l z-40 transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-slate-400" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Esplora Clan</h3>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-900 transition p-1 hover:bg-slate-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            {clans.map(clan => (
              <div 
                key={clan.rootId} 
                onClick={() => toggleClan(clan.rootId)}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none
                  ${hiddenClans.has(clan.rootId) 
                    ? 'bg-slate-50 border-slate-100 opacity-60 grayscale' 
                    : 'bg-white border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: clan.color }} />
                  <div className="flex flex-col overflow-hidden">
                      <span className="text-[12px] font-bold text-slate-800 truncate">{clan.name}</span>
                      <span className="text-[10px] text-slate-400">{clan.memberCount} membri</span>
                  </div>
                </div>
                <div className="flex items-center">
                   {hiddenClans.has(clan.rootId) ? <EyeOff size={16} className="text-slate-300" /> : <Eye size={16} className="text-emerald-500" />}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
              <p className="text-[10px] text-slate-400 text-center">
                  Usa i controlli per accendere/spegnere i rami.
              </p>
          </div>
        </div>
      </div>

      {/* Info Stats */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700">
          <Users size={14} className="text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {data.length} Persone &bull; {clans.length - hiddenClans.size} Clan
          </span>
        </div>
      </div>

      {/* Navigation Tools */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
         <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 1.3)} className="bg-white p-3 rounded-xl border shadow-lg hover:bg-slate-50 active:bg-slate-100 transition text-slate-600"><ZoomIn size={20} /></button>
         <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 0.7)} className="bg-white p-3 rounded-xl border shadow-lg hover:bg-slate-50 active:bg-slate-100 transition text-slate-600"><ZoomOut size={20} /></button>
         <button 
            onClick={() => {
                const g = d3.select(svgRef.current).select("#main-group");
                try {
                    const bounds = (g.node() as any).getBBox();
                    const scale = 0.9 / Math.max(bounds.width / dimensions.width, bounds.height / dimensions.height);
                    const tx = (dimensions.width - bounds.width * scale) / 2 - bounds.x * scale;
                    d3.select(svgRef.current).transition().duration(750).call(d3.zoom().transform as any, d3.zoomIdentity.translate(tx, 50).scale(scale));
                } catch(e){}
            }} 
            className="bg-white p-3 rounded-xl border border-blue-100 shadow-lg hover:bg-blue-50 text-blue-600 active:scale-95 transition"
            title="Centra vista"
         >
             <Maximize size={20} />
         </button>
      </div>
    </div>
  );
};