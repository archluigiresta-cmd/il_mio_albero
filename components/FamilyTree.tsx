import React, { useEffect, useRef, useState, useMemo, useTransition } from 'react';
import * as d3 from 'd3';
import { Person } from '../types';
import { 
  GitBranch,
  Users,
  Layers,
  Maximize,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Palette,
  Menu,
  X,
  Loader2,
  MapPin,
  Calendar
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
  "#2563eb", // Blue
  "#059669", // Emerald
  "#d97706", // Amber
  "#db2777", // Pink
  "#7c3aed", // Violet
  "#0891b2", // Cyan
  "#ea580c", // Orange
  "#4b5563"  // Slate
];

// ID dell'utente principale su cui centrare la vista iniziale (Luigi Resta)
const FOCUS_USER_ID = "@I3@"; 

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onSelectPerson, selectedPersonId, onOpenEditor }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [hiddenClans, setHiddenClans] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Tracciamo se l'utente ha interagito per evitare di resettare lo zoom
  const hasInteractedRef = useRef(false);
  // Memorizza l'ultima trasformazione per riapplicarla dopo il render
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
    // Non resettiamo l'interazione, vogliamo mantenere la posizione
    startTransition(() => {
        setHiddenClans(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
    });
  };

  const clans = useMemo(() => {
    const globalVisited = new Set<string>();

    const build = (id: string, depth: number, visited = new Set<string>()): any => {
      if (visited.has(id)) return null;
      visited.add(id);
      
      const p = data.find(x => x.id === id);
      if (!p) return null;

      globalVisited.add(p.id);
      p.spouseIds.forEach(sid => globalVisited.add(sid));

      const spouse = data.find(s => p.spouseIds.includes(s.id));
      let childrenIds = p.childrenIds;
      
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

    const roots = data.filter(p => !p.fatherId && !p.motherId);
    const validClans: any[] = [];
    
    // Trova il clan che contiene l'utente focus per metterlo per primo (opzionale, ma aiuta)
    const sortedRoots = [...roots].sort((a, b) => {
        if (a.id === FOCUS_USER_ID) return -1;
        return 0;
    });

    sortedRoots.forEach((root) => {
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

    return validClans
        .sort((a, b) => b.memberCount - a.memberCount)
        .map((c, i) => ({ ...c, color: CLAN_COLORS[i % CLAN_COLORS.length] }));
  }, [data, viewMode, selectedPersonId]);

  // --- RENDERING D3 ---
  useEffect(() => {
    if (!clans.length || !svgRef.current || !dimensions.width) return;

    const svg = d3.select(svgRef.current);
    
    // Configurazione Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 2.5])
      .on("zoom", (e) => {
          g.attr("transform", e.transform);
          lastTransformRef.current = e.transform;
          if (e.sourceEvent) hasInteractedRef.current = true; // Solo se l'evento viene dall'utente
      });

    // Se esiste già un gruppo, lo rimuoviamo per ridisegnare, ma cerchiamo di preservare lo stato
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("id", "main-group");
    svg.call(zoom);

    // Ripristina ultima trasformazione se esiste, per evitare "salti" al toggle
    if (lastTransformRef.current) {
        g.attr("transform", lastTransformRef.current.toString());
        svg.call(zoom.transform, lastTransformRef.current);
    }

    // --- PARAMETRI GRAFICI ---
    const cardWidth = 260;
    const cardHeight = 90;
    const hGap = 60; // Spazio orizzontale tra cugini
    const vGap = 160; // Spazio verticale tra generazioni
    const avatarSize = 64;

    let currentXOffset = 0;
    const activeClans = clans.filter(c => !hiddenClans.has(c.rootId));

    if (activeClans.length === 0) {
        g.append("text").attr("x", 0).attr("y", 0).text("Seleziona un clan dal menu laterale").style("font-size", "24px").attr("text-anchor", "middle").attr("fill", "#94a3b8");
        return;
    }

    // Mappa per salvare le posizioni dei nodi per future connessioni inter-clan (se necessario)
    const nodePositions = new Map<string, {x: number, y: number}>();

    activeClans.forEach((clan) => {
      const root = d3.hierarchy(clan.tree);
      
      // Impostiamo nodeSize largo per evitare sovrapposizioni
      // width = cardWidth + spazio per coniuge + gap
      const treeLayout = d3.tree().nodeSize([cardWidth * 2 + hGap, vGap]); 
      treeLayout(root);

      const descendants = root.descendants();
      const links = root.links();

      // Calcola larghezza reale del clan per posizionamento
      let minX = Infinity;
      let maxX = -Infinity;
      descendants.forEach(d => {
          if (d.x < minX) minX = d.x;
          if (d.x > maxX) maxX = d.x;
      });

      // Il gruppo del clan
      const clanGroup = g.append("g")
        .attr("transform", `translate(${currentXOffset - minX}, 0)`);

      // 1. LINKS - Disegnati PRIMA dei nodi così stanno sotto
      const linkPathGenerator = (d: any) => {
            const sourceX = d.source.x;
            const sourceY = d.source.y; // Centro del nodo sorgente (che per noi è la coppia)
            const targetX = d.target.x;
            const targetY = d.target.y;

            // Punto di partenza: Sotto la card (o la coppia di card)
            const startY = sourceY + cardHeight / 2;
            // Punto di arrivo: Sopra la card del figlio
            const endY = targetY - cardHeight / 2;
            const midY = (startY + endY) / 2;

            // Linea ortogonale spessa
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
        .attr("stroke", "#cbd5e1") // Grigio chiaro ma visibile
        .attr("stroke-width", 3) // Più spesso
        .attr("d", linkPathGenerator);


      // 2. NODI
      const nodeGroups = clanGroup.selectAll(".node")
        .data(descendants)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

      nodeGroups.each(function(d: any, i: number) {
        const group = d3.select(this);
        const p = d.data.person;
        const spouse = d.data.spouse;
        
        // Salviamo posizione assoluta (approssimata)
        nodePositions.set(p.id, { x: d.x + currentXOffset - minX, y: d.y });

        // Funzione per disegnare una card singola
        const drawCard = (person: Person, offsetX: number) => {
          const isSel = person.id === selectedPersonId;
          const isFemale = person.gender === 'F';
          const borderColor = isFemale ? "#f472b6" : "#60a5fa"; // Pink vs Blue accent
          
          const card = group.append("g").attr("transform", `translate(${offsetX}, 0)`);

          // Ombra esterna (Filtro o semplice rect offset)
          card.append("rect")
            .attr("x", -cardWidth/2 + 4).attr("y", -cardHeight/2 + 4)
            .attr("width", cardWidth).attr("height", cardHeight)
            .attr("rx", 8)
            .attr("fill", "rgba(0,0,0,0.05)");

          // Sfondo Card
          card.append("rect")
            .attr("x", -cardWidth/2).attr("y", -cardHeight/2)
            .attr("width", cardWidth).attr("height", cardHeight)
            .attr("rx", 8)
            .attr("fill", "white")
            .attr("stroke", isSel ? "#0f172a" : "#e2e8f0")
            .attr("stroke-width", isSel ? 3 : 1)
            .style("cursor", "pointer")
            .on("click", (e) => { e.stopPropagation(); onSelectPerson(person); });

          // Banda colorata superiore
          card.append("path")
             .attr("d", `M${-cardWidth/2},-cardHeight/2 a8,8 0 0 1 8,-8 h${cardWidth-16} a8,8 0 0 1 8,8 v4 h-${cardWidth} z`)
             .attr("transform", `translate(0, 4)`) 
             .attr("fill", borderColor);

          // Foto Avatar (grande a sinistra)
          const avX = -cardWidth/2 + 40;
          card.append("circle")
             .attr("cx", avX).attr("cy", 0).attr("r", avatarSize/2 + 2)
             .attr("fill", "white").attr("stroke", borderColor).attr("stroke-width", 2);
          
          card.append("clipPath").attr("id", `cp-${person.id}-${i}`)
             .append("circle").attr("cx", avX).attr("cy", 0).attr("r", avatarSize/2);

          card.append("image")
             .attr("xlink:href", person.photoUrl || PLACEHOLDER_IMAGE)
             .attr("x", avX - avatarSize/2).attr("y", -avatarSize/2)
             .attr("width", avatarSize).attr("height", avatarSize)
             .attr("preserveAspectRatio", "xMidYMid slice")
             .attr("clip-path", `url(#cp-${person.id}-${i})`);

          // Testi
          const textX = -cardWidth/2 + 85;
          const nameY = -15;

          // Nome (Troncato se lungo)
          const fullName = `${person.firstName} ${person.lastName}`;
          const displayName = fullName.length > 25 ? fullName.substring(0, 23) + "..." : fullName;
          
          card.append("text")
             .attr("x", textX).attr("y", nameY)
             .style("font-size", "14px").style("font-weight", "700").style("fill", "#1e293b").style("font-family", "sans-serif")
             .text(displayName);
          
          // Date / Luoghi
          const dateStr = person.birthDate 
            ? `${person.birthDate.slice(-4)}${person.deathDate ? ' - ' + person.deathDate.slice(-4) : ''}`
            : 'Sconosciuto';

          card.append("text")
             .attr("x", textX).attr("y", nameY + 20)
             .style("font-size", "11px").style("fill", "#64748b")
             .text(dateStr);

          // Icona vivente/morto
          if (!person.isLiving) {
              card.append("text").attr("x", textX + 80).attr("y", nameY + 20).text("†").style("font-size", "12px").style("fill", "#94a3b8");
          }
        };

        if (spouse) {
          // Se c'è un coniuge, disegniamo le due card vicine collegate da una "staffa"
          const gap = 20;
          const totalW = cardWidth * 2 + gap;
          
          // Staffa di collegamento coniugale
          group.append("line")
            .attr("x1", -gap).attr("x2", gap)
            .attr("y1", 0).attr("y2", 0)
            .attr("stroke", "#cbd5e1")
            .attr("stroke-width", 4);
            
          drawCard(p, -cardWidth/2 - gap/2);
          drawCard(spouse, cardWidth/2 + gap/2);
        } else {
          // Singolo
          drawCard(p, 0);
        }
      });

      // Aggiorna offset per il prossimo clan (più spazio)
      currentXOffset += maxX - minX + cardWidth * 2 + 300;
    });

    // --- AUTO FIT INIZIALE O SU FOCUS ---
    if (!hasInteractedRef.current && dimensions.width > 0) {
        try {
            // Cerchiamo il nodo dell'utente focus
            let focusNodeX = 0;
            let focusNodeY = 0;
            let foundFocus = false;

            // Recupera la posizione dai dati salvati
            if (nodePositions.has(FOCUS_USER_ID)) {
                const pos = nodePositions.get(FOCUS_USER_ID);
                if (pos) {
                    focusNodeX = pos.x;
                    focusNodeY = pos.y;
                    foundFocus = true;
                }
            } else if (activeClans.length > 0) {
                 // Fallback: centro del primo clan
                 // Non ideale ma meglio di niente
            }

            if (foundFocus) {
                // Centra su focusNode
                const scale = 0.8; // Zoom level iniziale confortevole
                const tx = dimensions.width / 2 - focusNodeX * scale;
                const ty = dimensions.height / 2 - focusNodeY * scale;

                svg.transition().duration(1000)
                   .call(zoom.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
            } else {
                // Auto-fit generale (come prima) se non troviamo l'utente
                const bounds = (g.node() as SVGGraphicsElement).getBBox();
                if (bounds.width > 0) {
                     const scale = 0.8 / Math.max(bounds.width / dimensions.width, bounds.height / dimensions.height);
                     const tx = (dimensions.width - bounds.width * scale) / 2 - bounds.x * scale;
                     svg.transition().duration(1000).call(zoom.transform as any, d3.zoomIdentity.translate(tx, 50).scale(Math.min(scale, 1)));
                }
            }
        } catch (e) { console.error(e); }
    }

  }, [clans, hiddenClans, dimensions, selectedPersonId]); // hasInteractedRef non è dipendenza per evitare loop

  return (
    <div ref={wrapperRef} className="w-full h-full bg-[#f1f5f9] relative overflow-hidden">
      
      {/* Loading Overlay */}
      {isPending && (
          <div className="absolute top-4 right-20 z-50 bg-white/90 px-4 py-2 rounded-full text-sm font-bold text-emerald-600 flex items-center gap-2 shadow-lg border border-emerald-100 animate-pulse">
              <Loader2 size={16} className="animate-spin" /> Aggiornamento Grafo...
          </div>
      )}

      {/* Header Controls */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-4">
        <h2 className="font-serif text-2xl font-bold text-slate-800 drop-shadow-sm">Panorama Familiare</h2>
        <div className="bg-white/95 backdrop-blur p-1.5 rounded-2xl shadow-xl border border-slate-200 flex items-center w-fit">
          {[
            { id: 'all', icon: Maximize, label: 'Tutti' },
            { id: 'branches', icon: GitBranch, label: 'Rami' },
            { id: 'generations', icon: Layers, label: 'Generazioni' }
          ].map(btn => (
            <button 
              key={btn.id}
              onClick={() => handleViewChange(btn.id as ViewMode)}
              disabled={isPending}
              className={`
                flex items-center gap-2 px-4 py-2 text-[11px] font-bold tracking-widest transition-all rounded-xl
                ${viewMode === btn.id 
                  ? 'bg-slate-800 text-white shadow-md' 
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
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" style={{ background: "radial-gradient(#e2e8f0 1px, transparent 1px) 0 0 / 20px 20px" }} />

      {/* Sidebar (Drawer) */}
      <div className={`absolute top-0 right-0 h-full w-96 bg-white shadow-2xl border-l z-40 transition-transform duration-300 ease-out transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col bg-slate-50/50">
          <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-5">
            <div>
                <h3 className="text-lg font-serif font-bold text-slate-800">Filtra Clan</h3>
                <p className="text-xs text-slate-500">Accendi o spegni i rami familiari</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-900 transition p-2 hover:bg-slate-200 rounded-full">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar p-1">
            {clans.map(clan => (
              <div 
                key={clan.rootId} 
                onClick={() => toggleClan(clan.rootId)}
                className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer select-none
                  ${hiddenClans.has(clan.rootId) 
                    ? 'bg-slate-100 border-dashed border-slate-300 opacity-60' 
                    : 'bg-white border-white shadow-md hover:border-emerald-200'}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm`} style={{ backgroundColor: clan.color }}>
                      {clan.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 leading-tight">{clan.name}</span>
                      <span className="text-xs text-slate-500 mt-0.5">{clan.memberCount} persone</span>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                   {hiddenClans.has(clan.rootId) ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls Bottom Right */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-3">
         <button 
            onClick={() => {
                hasInteractedRef.current = false; // Reset interazione per permettere auto-fit
                setHiddenClans(new Set()); // Mostra tutto opzionale
                // Trigger manuale zoom
                const svg = d3.select(svgRef.current);
                const g = svg.select("#main-group");
                const bounds = (g.node() as any)?.getBBox();
                if(bounds) {
                    const scale = 0.8 / Math.max(bounds.width / dimensions.width, bounds.height / dimensions.height);
                    const tx = (dimensions.width - bounds.width * scale) / 2 - bounds.x * scale;
                    svg.transition().duration(750).call(d3.zoom().transform as any, d3.zoomIdentity.translate(tx, 50).scale(scale));
                }
            }} 
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xl hover:bg-slate-50 text-slate-700 active:scale-95 transition"
            title="Reset Vista e Centra"
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