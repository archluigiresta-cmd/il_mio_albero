import React, { useEffect, useRef, useState, useMemo, useTransition } from 'react';
import * as d3 from 'd3';
import { Person } from '../types';
import { 
  GitBranch,
  Maximize,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Menu,
  X,
  Loader2,
  Filter
} from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../constants';

interface FamilyTreeProps {
  data: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
  onOpenEditor: (person: Person) => void;
}

type ViewMode = 'all' | 'branches';

const CLAN_COLORS = [
  "#059669", // Emerald (Murri)
  "#2563eb", // Blue (Resta)
  "#db2777", // Pink
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#0891b2", // Cyan
  "#ea580c", // Orange
  "#4b5563"  // Slate
];

// Focus iniziale su Simone Carmelo Murri
const FOCUS_USER_ID = "@I500001@"; 

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId, onOpenEditor }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [hiddenClans, setHiddenClans] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const hasInteractedRef = useRef(false);
  const lastTransformRef = useRef<d3.ZoomTransform | null>(null);

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

  const getBranchIds = (startId: string): Set<string> => {
      const ids = new Set<string>();
      const visited = new Set<string>();
      
      const traverseUp = (currId: string) => {
          if (visited.has('up'+currId)) return;
          visited.add('up'+currId);
          ids.add(currId);
          const p = data.find(x => x.id === currId);
          if (p) {
              if (p.fatherId) traverseUp(p.fatherId);
              if (p.motherId) traverseUp(p.motherId);
          }
      };

      const traverseDown = (currId: string) => {
          if (visited.has('down'+currId)) return;
          visited.add('down'+currId);
          ids.add(currId);
          const p = data.find(x => x.id === currId);
          if (p) {
              p.childrenIds.forEach(cid => traverseDown(cid));
              p.spouseIds.forEach(sid => ids.add(sid)); 
          }
      };

      traverseUp(startId);
      traverseDown(startId);
      return ids;
  };

  const clans = useMemo(() => {
    let branchIds: Set<string> | null = null;
    if (viewMode === 'branches' && selectedPersonId) {
        branchIds = getBranchIds(selectedPersonId);
    }

    const build = (id: string, depth: number, visited = new Set<string>()): any => {
      if (visited.has(id)) return null;
      if (branchIds && !branchIds.has(id)) return null;

      visited.add(id);
      
      const p = data.find(x => x.id === id);
      if (!p) return null;

      const spouse = data.find(s => p.spouseIds.includes(s.id));
      
      const children = p.childrenIds
        .map(cid => build(cid, depth + 1, new Set(visited))) 
        .filter(Boolean);
      
      return {
        id: p.id,
        person: p,
        spouse,
        children
      };
    };

    const roots = data.filter(p => !p.fatherId && !p.motherId);
    const validClans: any[] = [];
    
    roots.forEach((root) => {
        if (branchIds && !branchIds.has(root.id)) {
             // Skip logic for branches mode
        }

        const tree = build(root.id, 0, new Set());
        
        if (tree) {
            const countDescendants = (node: any): number => {
                if(!node) return 0;
                return 1 + (node.children || []).reduce((acc: number, child: any) => acc + countDescendants(child), 0);
            };
            
            const count = countDescendants(tree);
            if (count > 0) {
                 validClans.push({
                    rootId: root.id,
                    name: `${root.lastName} ${root.firstName}`,
                    tree,
                    memberCount: count,
                    forceColor: root.lastName.toLowerCase().includes('murri') ? CLAN_COLORS[0] : undefined
                });
            }
        }
    });

    return validClans
        .sort((a, b) => {
            if (a.rootId === FOCUS_USER_ID) return -1;
            if (b.rootId === FOCUS_USER_ID) return 1;
            if (a.name.toLowerCase().includes('murri') && !b.name.toLowerCase().includes('murri')) return -1;
            if (!a.name.toLowerCase().includes('murri') && b.name.toLowerCase().includes('murri')) return 1;
            return b.memberCount - a.memberCount;
        })
        .map((c, i) => ({ 
            ...c, 
            color: c.forceColor || CLAN_COLORS[(i + 1) % CLAN_COLORS.length] 
        }));

  }, [data, viewMode, selectedPersonId]);

  // --- RENDERING D3 ---
  useEffect(() => {
    if (!clans.length || !svgRef.current || !dimensions.width) return;

    const svg = d3.select(svgRef.current);
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 2.5])
      .on("zoom", (e) => {
          g.attr("transform", e.transform);
          lastTransformRef.current = e.transform;
          if (e.sourceEvent) hasInteractedRef.current = true;
      });

    svg.selectAll("*").remove();
    const g = svg.append("g").attr("id", "main-group");
    svg.call(zoom);

    if (lastTransformRef.current) {
        g.attr("transform", lastTransformRef.current.toString());
        svg.call(zoom.transform, lastTransformRef.current);
    }

    // --- PARAMETRI GRAFICI DINAMICI ---
    const cardWidth = 200; 
    const cardHeight = 70; 
    const vGap = 130; 
    const spouseGap = 20; // Spazio tra marito e moglie
    const avatarSize = 48;

    let currentXOffset = 0;
    const activeClans = clans.filter(c => !hiddenClans.has(c.rootId));

    if (activeClans.length === 0) {
        g.append("text").attr("x", 0).attr("y", 0).text("Nessun clan visibile. Attivane uno dal menu.").style("font-size", "20px").attr("text-anchor", "middle").attr("fill", "#94a3b8");
        return;
    }

    const nodePositions = new Map<string, {x: number, y: number}>();

    activeClans.forEach((clan) => {
      const root = d3.hierarchy(clan.tree);
      
      // --- LAYOUT DINAMICO ANTICOLLISIONE ---
      // Impostiamo una nodeSize base. 
      // La vera magia avviene in .separation() dove calcoliamo se i nodi sono doppi (coppie) o singoli.
      const treeLayout = d3.tree()
        .nodeSize([cardWidth, vGap]) 
        .separation((a: any, b: any) => {
            const aIsCouple = !!a.data.spouse;
            const bIsCouple = !!b.data.spouse;
            
            // Unità base = 1 cardWidth
            // Se entrambi sono single vicini: 1.15 (piccolo margine)
            // Se uno è coppia: serve spazio extra (metà larghezza extra card + margine)
            // Se entrambi coppie: serve ancora più spazio
            
            let sep = 1.15;
            if (aIsCouple) sep += 0.55; 
            if (bIsCouple) sep += 0.55;
            
            // Se sono cugini (genitori diversi), aggiungi ulteriore aria
            if (a.parent !== b.parent) sep += 0.3;
            
            return sep;
        });

      treeLayout(root);

      const descendants = root.descendants();
      const links = root.links();

      // Calcola larghezza reale del clan per l'offset orizzontale
      let minX = Infinity;
      let maxX = -Infinity;
      descendants.forEach(d => {
          if (d.x < minX) minX = d.x;
          if (d.x > maxX) maxX = d.x;
      });

      const clanGroup = g.append("g")
        .attr("transform", `translate(${currentXOffset - minX}, 0)`);

      // LINKS
      const linkPathGenerator = (d: any) => {
            const sourceX = d.source.x;
            const sourceY = d.source.y;
            const targetX = d.target.x;
            const targetY = d.target.y;

            const startY = sourceY + cardHeight / 2;
            const endY = targetY - cardHeight / 2;
            const midY = (startY + endY) / 2;

            return `M ${sourceX} ${startY} 
                    V ${midY} 
                    H ${targetX} 
                    V ${endY}`;
      };

      clanGroup.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 2)
        .attr("d", linkPathGenerator);

      // NODI
      const nodeGroups = clanGroup.selectAll(".node")
        .data(descendants)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

      nodeGroups.each(function(d: any, i: number) {
        const group = d3.select(this);
        const p = d.data.person;
        const spouse = d.data.spouse;
        
        nodePositions.set(p.id, { x: d.x + currentXOffset - minX, y: d.y });

        const drawCard = (person: Person, offsetX: number) => {
          const isSel = person.id === selectedPersonId;
          const isFemale = person.gender === 'F';
          const borderColor = isSel ? "#10b981" : (isFemale ? "#fbcfe8" : "#bfdbfe"); 
          const strokeColor = isSel ? "#059669" : (isFemale ? "#db2777" : "#2563eb");
          
          const card = group.append("g").attr("transform", `translate(${offsetX}, 0)`);

          // Sfondo Card
          card.append("rect")
            .attr("x", -cardWidth/2).attr("y", -cardHeight/2)
            .attr("width", cardWidth).attr("height", cardHeight)
            .attr("rx", 6)
            .attr("fill", "white")
            .attr("stroke", strokeColor)
            .attr("stroke-width", isSel ? 3 : 1)
            .style("filter", "drop-shadow(0px 2px 3px rgba(0,0,0,0.08))")
            .style("cursor", "pointer")
            .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

          // Foto Avatar
          const avX = -cardWidth/2 + 32;
          card.append("circle")
             .attr("cx", avX).attr("cy", 0).attr("r", avatarSize/2)
             .attr("fill", "#f1f5f9").attr("stroke", strokeColor).attr("stroke-width", 1);
          
          card.append("clipPath").attr("id", `cp-${person.id}-${i}-${clan.rootId}`)
             .append("circle").attr("cx", avX).attr("cy", 0).attr("r", avatarSize/2);

          card.append("image")
             .attr("xlink:href", person.photoUrl || PLACEHOLDER_IMAGE)
             .attr("x", avX - avatarSize/2).attr("y", -avatarSize/2)
             .attr("width", avatarSize).attr("height", avatarSize)
             .attr("preserveAspectRatio", "xMidYMid slice")
             .attr("clip-path", `url(#cp-${person.id}-${i}-${clan.rootId})`);

          // Testi
          const textX = -cardWidth/2 + 64;
          const nameY = -8;

          const fullName = `${person.firstName} ${person.lastName}`;
          const displayName = fullName.length > 22 ? fullName.substring(0, 20) + "..." : fullName;
          
          card.append("text")
             .attr("x", textX).attr("y", nameY)
             .style("font-size", "12px").style("font-weight", "700").style("fill", "#334155").style("font-family", "sans-serif")
             .text(displayName);
          
          const dateStr = person.birthDate 
            ? `${person.birthDate.slice(-4)}${person.deathDate ? ' - ' + person.deathDate.slice(-4) : ''}`
            : '...';

          card.append("text")
             .attr("x", textX).attr("y", nameY + 16)
             .style("font-size", "10px").style("fill", "#64748b")
             .text(dateStr);

          if (!person.isLiving) {
              card.append("text").attr("x", cardWidth/2 - 12).attr("y", cardHeight/2 - 8).text("†").style("font-size", "12px").style("fill", "#94a3b8");
          }
        };

        if (spouse) {
          // Disegno coppia:
          // Il centro del nodo (0,0) cade esattamente nel mezzo della coppia.
          // Marito a sinistra, Moglie a destra (o viceversa, qui usiamo l'ordine dati)
          // Offset sinistro: -metà larghezza card - metà gap
          // Offset destro: +metà larghezza card + metà gap
          // Questo lascia il centro (0,0) libero per la linea che scende ai figli.
          
          const leftOffset = -cardWidth/2 - spouseGap/2;
          const rightOffset = cardWidth/2 + spouseGap/2; // Attenzione: drawCard centra la card sul punto dato. 
          // Quindi drawCard(p, -cardWidth/2 - gap/2) mette il CENTRO della card a quella coordinata.
          // La larghezza totale occupata sarà da (-cardWidth - gap/2) a (+cardWidth + gap/2).
          // D3 tree separation è stata configurata sopra per rispettare questo ingombro doppio.

          // Staffa Coniugale
          group.append("path")
            .attr("d", `M${-spouseGap/2 - 5},0 H${spouseGap/2 + 5}`) // Linea di unione leggermente più larga del gap
            .attr("stroke", "#475569")
            .attr("stroke-width", 2);
            
          // Card Sinistra (Capofamiglia del nodo)
          drawCard(p, -cardWidth/2 - spouseGap/2);
          // Card Destra (Coniuge)
          drawCard(spouse, cardWidth/2 + spouseGap/2);
          
        } else {
          // Single: Centrato su 0,0
          drawCard(p, 0);
        }
      });

      // Spazio tra clan successivi (basato sulla larghezza effettiva calcolata)
      currentXOffset += maxX - minX + cardWidth + 300;
    });

    // --- AUTO FIT ---
    if (!hasInteractedRef.current && dimensions.width > 0) {
        try {
            let focusNodeX = 0;
            let focusNodeY = 0;
            let foundFocus = false;

            if (nodePositions.has(FOCUS_USER_ID)) {
                const pos = nodePositions.get(FOCUS_USER_ID);
                if (pos) {
                    focusNodeX = pos.x;
                    focusNodeY = pos.y;
                    foundFocus = true;
                }
            }

            if (foundFocus) {
                const scale = 0.85; 
                const tx = dimensions.width / 2 - focusNodeX * scale;
                const ty = 100; 

                svg.transition().duration(1000)
                   .call(zoom.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
            } else {
                const bounds = (g.node() as SVGGraphicsElement).getBBox();
                if (bounds.width > 0) {
                     const scale = 0.85 / Math.max(bounds.width / dimensions.width, bounds.height / dimensions.height);
                     const tx = (dimensions.width - bounds.width * scale) / 2 - bounds.x * scale;
                     svg.transition().duration(1000).call(zoom.transform as any, d3.zoomIdentity.translate(tx, 50).scale(Math.min(scale, 1)));
                }
            }
        } catch (e) { console.error(e); }
    }

  }, [clans, hiddenClans, dimensions, selectedPersonId]); 

  return (
    <div ref={wrapperRef} className="w-full h-full bg-[#f1f5f9] relative overflow-hidden">
      
      {isPending && (
          <div className="absolute top-4 right-20 z-50 bg-white/90 px-4 py-2 rounded-full text-sm font-bold text-emerald-600 flex items-center gap-2 shadow-lg border border-emerald-100 animate-pulse">
              <Loader2 size={16} className="animate-spin" /> Elaborazione...
          </div>
      )}

      {/* View Selectors */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-4">
        <h2 className="font-serif text-2xl font-bold text-slate-800 drop-shadow-sm">Albero Genealogico</h2>
        <div className="bg-white/95 backdrop-blur p-1 rounded-xl shadow-lg border border-slate-200 flex items-center w-fit">
          {[
            { id: 'all', icon: Maximize, label: 'Panorama Completo' },
            { id: 'branches', icon: GitBranch, label: 'Solo Ramo Diretto' },
          ].map(btn => (
            <button 
              key={btn.id}
              onClick={() => handleViewChange(btn.id as ViewMode)}
              className={`
                flex items-center gap-2 px-4 py-2 text-[11px] font-bold tracking-widest transition-all rounded-lg
                ${viewMode === btn.id 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}
              `}
            >
              <btn.icon size={14} /> {btn.label}
            </button>
          ))}
        </div>
        {viewMode === 'branches' && !selectedPersonId && (
            <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-xs border border-amber-200 max-w-xs flex items-center gap-2">
                <Filter size={14} /> Seleziona una persona per isolare il suo ramo.
            </div>
        )}
      </div>

      {/* Sidebar Toggle */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-6 right-6 z-30 flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-lg border border-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all hover:scale-105"
        >
          <Menu size={18} /> GESTISCI CLAN
        </button>
      )}

      {/* SVG Canvas */}
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" style={{ background: "radial-gradient(#cbd5e1 1px, transparent 1px) 0 0 / 20px 20px" }} />

      {/* Sidebar (Drawer) */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-white shadow-2xl border-l z-40 transition-transform duration-300 ease-out transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col bg-slate-50/50">
          <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-5">
            <div>
                <h3 className="text-lg font-serif font-bold text-slate-800">Clan Familiari</h3>
                <p className="text-xs text-slate-500">Accendi/Spegni le famiglie.</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-900 transition p-2 hover:bg-slate-200 rounded-full">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar p-1">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2 pl-1">Capostipiti</div>
            {clans.map(clan => (
              <div 
                key={clan.rootId} 
                onClick={() => toggleClan(clan.rootId)}
                className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none
                  ${hiddenClans.has(clan.rootId) 
                    ? 'bg-slate-100 border-dashed border-slate-300 opacity-60' 
                    : 'bg-white border-slate-200 shadow-sm hover:border-emerald-400'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm`} style={{ backgroundColor: clan.color }}>
                      {clan.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 leading-tight truncate w-32">{clan.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{clan.memberCount} membri</span>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                   {hiddenClans.has(clan.rootId) ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t text-[10px] text-slate-400 text-center leading-relaxed">
             Nota: Attivando più clan collegati, i membri comuni verranno mostrati in entrambi i rami (sovrapposizione).
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-3">
         <button 
            onClick={() => {
                hasInteractedRef.current = false; 
                setHiddenClans(new Set()); 
                setViewMode('all');
                // Trigger manuale zoom reset
                const svg = d3.select(svgRef.current);
                const g = svg.select("#main-group");
                const bounds = (g.node() as any)?.getBBox();
                if(bounds) {
                    const scale = 0.85 / Math.max(bounds.width / dimensions.width, bounds.height / dimensions.height);
                    const tx = (dimensions.width - bounds.width * scale) / 2 - bounds.x * scale;
                    svg.transition().duration(750).call(d3.zoom().transform as any, d3.zoomIdentity.translate(tx, 50).scale(scale));
                }
            }} 
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xl hover:bg-slate-50 text-slate-700 active:scale-95 transition"
            title="Reset Vista"
         >
             <Maximize size={24} />
         </button>
         <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 1.3)} className="p-4 hover:bg-slate-50 text-slate-700 border-b border-slate-100"><ZoomIn size={24} /></button>
            <button onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy as any, 0.7)} className="p-4 hover:bg-slate-50 text-slate-700"><ZoomOut size={24} /></button>
         </div>
      </div>
    </div>
  );
};