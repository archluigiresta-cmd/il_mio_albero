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
  Network
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

const FOCUS_USER_ID = "@I500001@"; 

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId, onOpenEditor }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  
  // Set di ID dei clan NASCOSTI. Se un ID è qui, non viene disegnato.
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
    // Non usiamo transition qui per rendere l'UI reattiva immediatamente al click
    setHiddenClans(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
          next.delete(id); // Mostra
      } else {
          next.add(id); // Nascondi
      }
      return next;
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

  // --- RENDERING D3 "ADAPTIVE & MAGNETIC MERGE" ---
  useEffect(() => {
    if (!clans.length || !svgRef.current || !dimensions.width) return;

    // 1. Pulisci il Canvas
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // CRITICO: Rimuove tutto prima di ridisegnare

    const g = svg.append("g").attr("id", "main-group");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 3])
      .on("zoom", (e) => {
          g.attr("transform", e.transform);
          lastTransformRef.current = e.transform;
          if (e.sourceEvent) hasInteractedRef.current = true;
      });

    svg.call(zoom);

    if (lastTransformRef.current) {
        g.attr("transform", lastTransformRef.current.toString());
        svg.call(zoom.transform, lastTransformRef.current);
    }

    // 2. Filtra Clan Attivi
    const activeClans = clans.filter(c => !hiddenClans.has(c.rootId));

    if (activeClans.length === 0) {
        g.append("text").attr("x", dimensions.width/2).attr("y", dimensions.height/2)
         .text("Seleziona almeno un clan dal menu laterale.")
         .style("font-size", "18px")
         .attr("text-anchor", "middle")
         .attr("fill", "#64748b");
        return;
    }

    // 3. ADAPTIVE SCALING (RIDIMENSIONAMENTO DINAMICO)
    // Se ci sono più clan (che quindi si intersecheranno), riduciamo le dimensioni
    // per farli stare adiacenti senza sovrapposizioni massicce.
    const isMultiClan = activeClans.length > 1;
    const densityFactor = isMultiClan ? 0.65 : 1; // Riduce al 65% se multi-clan

    const baseCardWidth = 200;
    const baseCardHeight = 70;
    const baseVGap = 130;
    const baseSpouseGap = 20;
    const baseAvatarSize = 48;

    const cardWidth = baseCardWidth * densityFactor; 
    const cardHeight = baseCardHeight * densityFactor; 
    const vGap = baseVGap * densityFactor; 
    const spouseGap = baseSpouseGap * densityFactor;
    const avatarSize = baseAvatarSize * densityFactor;
    const fontSizeName = isMultiClan ? "9px" : "12px";
    const fontSizeDate = isMultiClan ? "8px" : "10px";

    // --- ALGORITMO DI DISEGNO ---
    
    const globalPositions = new Map<string, {x: number, y: number, clanId: string}>();
    const renderedNodes = new Set<string>(); 

    let maxXSoFar = 0;

    let remainingClans = [...activeClans];
    const processedClanIds = new Set<string>();

    const findPivot = (clanTree: any): { offsetX: number, offsetY: number, found: boolean } => {
        const root = d3.hierarchy(clanTree);
        const descendants = root.descendants();
        const tempLayout = d3.tree().nodeSize([cardWidth, vGap]).separation(() => 1);
        tempLayout(root);

        for (const d of descendants) {
            const pId = d.data.id;
            const spouseId = d.data.spouse?.id;

            if (globalPositions.has(pId)) {
                const existing = globalPositions.get(pId)!;
                return { offsetX: existing.x - d.x, offsetY: existing.y - d.y, found: true };
            }
            if (spouseId && globalPositions.has(spouseId)) {
                const existing = globalPositions.get(spouseId)!;
                return { offsetX: existing.x - d.x, offsetY: existing.y - d.y, found: true };
            }
        }
        return { offsetX: 0, offsetY: 0, found: false };
    };

    while (remainingClans.length > 0) {
        let clanIndexToProcess = -1;
        let bestOffset = { x: 0, y: 0 };
        let isIsland = true;

        if (processedClanIds.size === 0) {
            clanIndexToProcess = 0;
            isIsland = true;
        } else {
            for (let i = 0; i < remainingClans.length; i++) {
                const pivot = findPivot(remainingClans[i].tree);
                if (pivot.found) {
                    clanIndexToProcess = i;
                    bestOffset = { x: pivot.offsetX, y: pivot.offsetY };
                    isIsland = false;
                    break;
                }
            }
            if (clanIndexToProcess === -1) {
                clanIndexToProcess = 0;
                isIsland = true;
            }
        }

        const clan = remainingClans[clanIndexToProcess];
        remainingClans.splice(clanIndexToProcess, 1);
        processedClanIds.add(clan.rootId);

        const root = d3.hierarchy(clan.tree);
        const treeLayout = d3.tree()
            .nodeSize([cardWidth, vGap]) 
            .separation((a: any, b: any) => {
                // Aumentiamo la separazione per evitare che i rami si scontrino lateralmente
                const aIsCouple = !!a.data.spouse;
                const bIsCouple = !!b.data.spouse;
                let sep = 1.2; // Base più larga
                if (aIsCouple) sep += 0.6; 
                if (bIsCouple) sep += 0.6;
                // Se sono cugini (genitori diversi), spingili ancora più lontano
                if (a.parent !== b.parent) sep += 0.5;
                return sep;
            });
        treeLayout(root);

        let finalOffsetX = 0;
        let finalOffsetY = 0;

        if (isIsland) {
            let localMinX = Infinity;
            root.descendants().forEach(d => { if(d.x < localMinX) localMinX = d.x; });
            
            if (processedClanIds.size === 1) {
                finalOffsetX = -localMinX;
            } else {
                finalOffsetX = maxXSoFar - localMinX + cardWidth + (250 * densityFactor);
            }
        } else {
            finalOffsetX = bestOffset.x;
            finalOffsetY = bestOffset.y;
        }

        root.descendants().forEach(d => {
            const absX = d.x + finalOffsetX;
            if (absX > maxXSoFar) maxXSoFar = absX;
            
            const pId = d.data.person.id;
            const sId = d.data.spouse?.id;
            
            if (!globalPositions.has(pId)) globalPositions.set(pId, {x: absX, y: d.y + finalOffsetY, clanId: clan.rootId});
            if (sId && !globalPositions.has(sId)) globalPositions.set(sId, {x: absX, y: d.y + finalOffsetY, clanId: clan.rootId});
        });

        const clanGroup = g.append("g")
            .attr("transform", `translate(${finalOffsetX}, ${finalOffsetY})`);

        // --- LINKS ---
        const linksToDraw = root.links().filter(link => {
             const sourceId = link.source.data.id;
             const targetId = link.target.data.id;
             const sourceAlreadyRendered = renderedNodes.has(sourceId);
             const targetAlreadyRendered = renderedNodes.has(targetId);
             if (sourceAlreadyRendered && targetAlreadyRendered) return false;
             return true;
        });

        const linkPathGenerator = (d: any) => {
            const sourceX = d.source.x;
            const sourceY = d.source.y;
            const targetX = d.target.x;
            const targetY = d.target.y;
            const startY = sourceY + cardHeight / 2;
            const endY = targetY - cardHeight / 2;
            const midY = (startY + endY) / 2;
            return `M ${sourceX} ${startY} V ${midY} H ${targetX} V ${endY}`;
        };
        
        clanGroup.selectAll(".link")
            .data(linksToDraw)
            .enter()
            .append("path")
            .attr("fill", "none")
            .attr("stroke", "#94a3b8")
            .attr("stroke-width", 2 * densityFactor) // Linee più sottili se denso
            .attr("d", linkPathGenerator);

        // --- NODES ---
        const descendants = root.descendants();
        const nodeGroups = clanGroup.selectAll(".node")
            .data(descendants)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        nodeGroups.each(function(d: any, i: number) {
            const p = d.data.person;
            const spouse = d.data.spouse;
            const group = d3.select(this);

            const pAlreadyRendered = renderedNodes.has(p.id);
            const spouseAlreadyRendered = spouse ? renderedNodes.has(spouse.id) : false;

            renderedNodes.add(p.id);
            if(spouse) renderedNodes.add(spouse.id);

            const drawCard = (person: Person, offsetX: number, skipRender: boolean) => {
                if (skipRender) return;

                const isSel = person.id === selectedPersonId;
                const isFemale = person.gender === 'F';
                const strokeColor = isSel ? "#059669" : (isFemale ? "#db2777" : "#2563eb");
            
                const card = group.append("g").attr("transform", `translate(${offsetX}, 0)`);

                card.append("rect")
                    .attr("x", -cardWidth/2).attr("y", -cardHeight/2)
                    .attr("width", cardWidth).attr("height", cardHeight)
                    .attr("rx", 6 * densityFactor)
                    .attr("fill", "white")
                    .attr("stroke", strokeColor)
                    .attr("stroke-width", isSel ? 3 : 1)
                    .style("cursor", "pointer")
                    .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

                const avX = -cardWidth/2 + (32 * densityFactor);
                card.append("circle")
                    .attr("cx", avX).attr("cy", 0).attr("r", avatarSize/2)
                    .attr("fill", "#f1f5f9").attr("stroke", strokeColor).attr("stroke-width", 1);
            
                const uniqueClipId = `cp-${person.id}-${clan.rootId}-${i}`; 
                card.append("clipPath").attr("id", uniqueClipId)
                    .append("circle").attr("cx", avX).attr("cy", 0).attr("r", avatarSize/2);

                card.append("image")
                    .attr("xlink:href", person.photoUrl || PLACEHOLDER_IMAGE)
                    .attr("x", avX - avatarSize/2).attr("y", -avatarSize/2)
                    .attr("width", avatarSize).attr("height", avatarSize)
                    .attr("preserveAspectRatio", "xMidYMid slice")
                    .attr("clip-path", `url(#${uniqueClipId})`);

                const textX = -cardWidth/2 + (64 * densityFactor);
                const nameY = -8 * densityFactor;
                const fullName = `${person.firstName} ${person.lastName}`;
                // Troncamento nome più aggressivo se denso
                const maxLen = isMultiClan ? 15 : 22;
                const displayName = fullName.length > maxLen ? fullName.substring(0, maxLen-2) + "..." : fullName;
            
                card.append("text")
                    .attr("x", textX).attr("y", nameY)
                    .style("font-size", fontSizeName).style("font-weight", "700").style("fill", "#334155")
                    .text(displayName);
            
                const dateStr = person.birthDate 
                    ? `${person.birthDate.slice(-4)}${person.deathDate ? ' - ' + person.deathDate.slice(-4) : ''}`
                    : '...';

                card.append("text")
                    .attr("x", textX).attr("y", nameY + (16 * densityFactor))
                    .style("font-size", fontSizeDate).style("fill", "#64748b")
                    .text(dateStr);

                if (!person.isLiving) {
                    card.append("text").attr("x", cardWidth/2 - 12).attr("y", cardHeight/2 - 8).text("†").style("font-size", fontSizeName).style("fill", "#94a3b8");
                }
            };

            if (spouse) {
                const leftOffset = -cardWidth/2 - spouseGap/2;
                const rightOffset = cardWidth/2 + spouseGap/2; 

                if (!pAlreadyRendered || !spouseAlreadyRendered) {
                    group.append("path")
                        .attr("d", `M${-spouseGap/2 - 5},0 H${spouseGap/2 + 5}`)
                        .attr("stroke", "#475569")
                        .attr("stroke-width", 2);
                }
                
                drawCard(p, leftOffset, pAlreadyRendered);
                drawCard(spouse, rightOffset, spouseAlreadyRendered);
            } else {
                drawCard(p, 0, pAlreadyRendered);
            }
        });
    }

    // --- AUTO FIT (Solo se l'utente non sta interagendo) ---
    if (!hasInteractedRef.current && dimensions.width > 0) {
         const bounds = (g.node() as SVGGraphicsElement).getBBox();
         if (bounds.width > 0) {
              // Zoom out leggermente maggiore per avere una vista d'insieme migliore
              const scale = 0.85 / Math.max(bounds.width / dimensions.width, bounds.height / dimensions.height);
              const tx = (dimensions.width - bounds.width * scale) / 2 - bounds.x * scale;
              const ty = 50; 
              svg.transition().duration(750).call(zoom.transform as any, d3.zoomIdentity.translate(tx, ty).scale(Math.min(scale, 1)));
         }
    }

  }, [clans, hiddenClans, dimensions, selectedPersonId]); // HiddenClans è dipendenza fondamentale

  return (
    <div ref={wrapperRef} className="w-full h-full bg-[#f1f5f9] relative overflow-hidden">
      
      {isPending && (
          <div className="absolute top-4 right-20 z-50 bg-white/90 px-4 py-2 rounded-full text-sm font-bold text-emerald-600 flex items-center gap-2 shadow-lg border border-emerald-100 animate-pulse">
              <Loader2 size={16} className="animate-spin" /> Elaborazione Grafico...
          </div>
      )}

      {/* View Selectors */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-4">
        <h2 className="font-serif text-2xl font-bold text-slate-800 drop-shadow-sm flex items-center gap-2">
            <Network className="text-emerald-600"/> Albero Unificato
        </h2>
        <div className="bg-white/95 backdrop-blur p-1 rounded-xl shadow-lg border border-slate-200 flex items-center w-fit">
          {[
            { id: 'all', icon: Maximize, label: 'Panorama' },
            { id: 'branches', icon: GitBranch, label: 'Ramo Diretto' },
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
                <p className="text-xs text-slate-500">
                    {clans.filter(c => !hiddenClans.has(c.rootId)).length} attivi su {clans.length}
                </p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-900 transition p-2 hover:bg-slate-200 rounded-full">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar p-1">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2 pl-1">Capostipiti</div>
            {clans.map(clan => {
              const isHidden = hiddenClans.has(clan.rootId);
              return (
              <div 
                key={clan.rootId} 
                onClick={() => toggleClan(clan.rootId)}
                className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none
                  ${isHidden 
                    ? 'bg-slate-100 border-dashed border-slate-300 opacity-60 grayscale' 
                    : 'bg-white border-slate-200 shadow-sm hover:border-emerald-400 ring-1 ring-transparent hover:ring-emerald-100'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm transition-colors duration-300`} style={{ backgroundColor: isHidden ? '#cbd5e1' : clan.color }}>
                      {clan.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                      <span className={`text-sm font-bold leading-tight truncate w-32 ${isHidden ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{clan.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{clan.memberCount} membri</span>
                  </div>
                </div>
                <div className={`transition-colors ${isHidden ? 'text-slate-400' : 'text-emerald-500'}`}>
                   {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            )})}
          </div>
          
          <div className="mt-4 pt-4 border-t text-[10px] text-slate-400 text-center leading-relaxed">
             <strong>Modalità Adattiva:</strong> Quando attivi più clan, le schede si riducono automaticamente per evitare sovrapposizioni.
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
                // Force Update logic
                const svg = d3.select(svgRef.current);
                const g = svg.select("#main-group");
                // Reset zoom
                svg.transition().duration(750).call(d3.zoom().transform as any, d3.zoomIdentity.translate(0, 0).scale(1));
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