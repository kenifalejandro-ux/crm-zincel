/**client/src/pages/PipelinePage.tsx — REDISEÑO NEON
 * Cambios SOLO de presentación:
 *  - Header con kicker + banda de KPIs con glow (antes textos sueltos text-amber-600/green-600 apretados).
 *  - Toggle de vista coherente (antes bg-zinc-900 casi invisible sobre el dark).
 *  - Toast "deshacer" neon (antes bg-zinc-900 + clase inválida hover:bg-white/8/25).
 *  - Bordes válidos (antes border-white/8 ×4 — no pintaban).
 *  Toda la lógica (cargar, drag/drop, moverCard, undo, optimistic) queda INTACTA.
 */
import { useEffect, useRef, useState } from "react";
import { Kanban, RefreshCw, Undo2, LayoutGrid } from "lucide-react";
import { getPipeline, actualizarEtapaPipeline, actualizarEstadoLead, getScoresLeads, getProspecto, type PipelineEtapa, type ScoreLead } from "../services/prospectos.api";

import { KanbanColumn } from "../components/pipeline/KanbanColumn";
import { OportunidadesKanban } from "../components/pipeline/OportunidadesKanban";
import { ProspectoDetalle } from "../components/prospectos/ProspectoDetalle";
import { ProspectoForm } from "../components/prospectos/ProspectoForm";
import { getKanbanOportunidades } from "../services/propuestas.api";
import type { Prospecto, EtapaPipeline } from "../types/prospecto.types";

const PRE_PIPELINE = new Set(["volver_a_llamar","solicita_informacion","interesado"]);

const ETAPAS: { key: string; label: string; color: string }[] = [
  { key: "volver_a_llamar",   label: "Volver a llamar",   color: "bg-yellow-400" },
  { key: "solicita_informacion", label: "Solicita información", color: "bg-blue-400" },
  { key: "interesado",        label: "Interesado",        color: "bg-green-500"  },
  { key: "propuesta_enviada", label: "Propuesta enviada", color: "bg-yellow-500" },
  { key: "negociacion",       label: "Negociación",       color: "bg-orange-500" },
  { key: "cerrado_ganado",    label: "Cerrado ✓",         color: "bg-green-600"  },
  { key: "perdido",           label: "Perdido",           color: "bg-red-400"    },
];

const LABEL: Record<string, string> = Object.fromEntries(ETAPAS.map(e => [e.key, e.label]));

interface UndoState {
  id: string; empresa: string; etapaOrigen: string; etapaDestino: string;
  timer: ReturnType<typeof setTimeout>;
}

export default function PipelinePage() {
  const [vista,          setVista]          = useState<"prospectos" | "oportunidades">("prospectos");
  const [pipeline,       setPipeline]       = useState<Record<string, PipelineEtapa>>({});
  const [valorPerdido,   setValorPerdido]   = useState(0);
  const [scores,         setScores]         = useState<Record<string, ScoreLead>>({});
  const [statsOport,     setStatsOport]     = useState<{ total_activo: number; total_ganado: number } | null>(null);
  const [cargando,    setCargando]    = useState(true);
  const [dragOver,    setDragOver]    = useState<string | null>(null);
  const [undo,        setUndo]        = useState<UndoState | null>(null);
  const [prospectoDetalle,  setProspectoDetalle]  = useState<Prospecto | null>(null);
  const [prospectoEditando, setProspectoEditando] = useState<Prospecto | null>(null);
  const dragId = useRef<string | null>(null);

  useEffect(() => { cargar(); }, []);
  useEffect(() => () => { if (undo) clearTimeout(undo.timer); }, [undo]);

  async function cargar() {
    setCargando(true);
    try {
      const { pipeline: p, valorPerdido: vp } = await getPipeline();
      setPipeline(p);
      setValorPerdido(vp);
    }
    catch (err) { console.error(err); }
    finally { setCargando(false); }
    getScoresLeads().then(s => setScores(Object.fromEntries(s.map(sc => [sc.id, sc])))).catch(console.error);
    getKanbanOportunidades().then(({ stats }) => setStatsOport(stats)).catch(console.error);
  }

  async function actualizarCardPipeline(id: string) {
    try {
      const actualizado = await getProspecto(id);
      const nuevaEtapa  = actualizado.etapa_pipeline;
      setPipeline(prev => {
        const next = structuredClone(prev);
        const etapaActual = Object.keys(next).find(k => next[k].prospectos.some(p => p.id === id));
        if (!etapaActual) return prev;
        if (etapaActual === nuevaEtapa) {
          next[etapaActual].prospectos = next[etapaActual].prospectos.map(p => p.id === id ? { ...p, ...actualizado } : p);
          return next;
        }
        const card = next[etapaActual].prospectos.find(p => p.id === id);
        if (!card) return prev;
        next[etapaActual].prospectos = next[etapaActual].prospectos.filter(p => p.id !== id);
        next[etapaActual].total = Math.max(0, next[etapaActual].total - 1);
        const cardActualizado = { ...card, ...actualizado, etapa_pipeline: nuevaEtapa };
        if (!next[nuevaEtapa]) next[nuevaEtapa] = { prospectos: [], total: 0, valor: 0, valor_pen: 0, valor_usd: 0 };
        next[nuevaEtapa].prospectos.unshift(cardActualizado);
        next[nuevaEtapa].total++;
        return next;
      });
    } catch { cargar(); }
  }

  function handleDragStart(_e: React.DragEvent, id: string) { dragId.current = id; }

  async function handleDrop(_e: React.DragEvent, etapaDestino: string) {
    setDragOver(null);
    const id = dragId.current;
    if (!id) return;
    dragId.current = null;

    const etapaOrigen = Object.entries(pipeline).find(([, v]) => v.prospectos.some(p => p.id === id))?.[0];
    if (!etapaOrigen || etapaOrigen === etapaDestino) return;

    const empresa = pipeline[etapaOrigen].prospectos.find(p => p.id === id)?.empresa ?? "";
    moverCard(id, etapaOrigen, etapaDestino);

    if (undo) clearTimeout(undo.timer);
    const timer = setTimeout(() => setUndo(null), 5000);
    setUndo({ id, empresa, etapaOrigen, etapaDestino, timer });

    try {
      if (PRE_PIPELINE.has(etapaDestino)) await actualizarEstadoLead(id, etapaDestino);
      else await actualizarEtapaPipeline(id, etapaDestino);
    } catch (err) { console.error(err); cargar(); }
  }

  function moverCard(id: string, origen: string, destino: string) {
    const cardActual = pipeline[origen]?.prospectos.find(p => p.id === id);
    const valor = Number(cardActual?.valor_pipeline ?? 0);

    setPipeline(prev => {
      const next = structuredClone(prev);
      if (!next[origen]) return prev;
      const card = next[origen].prospectos.find(p => p.id === id);
      if (!card) return prev;
      const v = Number(card.valor_pipeline ?? 0);
      const esPen = card.moneda?.toUpperCase() !== "USD";
      next[origen].prospectos = next[origen].prospectos.filter(p => p.id !== id);
      next[origen].total    = Math.max(0, next[origen].total - 1);
      next[origen].valor   -= v;
      if (esPen) next[origen].valor_pen = Math.max(0, (next[origen].valor_pen ?? 0) - v);
      else       next[origen].valor_usd = Math.max(0, (next[origen].valor_usd ?? 0) - v);
      card.etapa_pipeline = destino as EtapaPipeline;

      const PROPUESTA_MAP: Record<string, string> = {
        propuesta_enviada: "enviada", negociacion: "en_negociacion",
        cerrado_ganado: "cerrada_ganada", perdido: "cerrada_perdida",
      };
      const nuevoPropuestaEstado = PROPUESTA_MAP[destino];
      if (nuevoPropuestaEstado && card.propuestas_list && card.propuestas_list.length > 0) {
        const fromFinalizado = ["cerrado_ganado", "perdido"].includes(origen);
        card.propuestas_list = card.propuestas_list.map((pr, i) => {
          if (i !== 0) return pr;
          if (fromFinalizado || !["cerrada_ganada", "cerrada_perdida", "vencida"].includes(pr.estado)) {
            return { ...pr, estado: nuevoPropuestaEstado };
          }
          return pr;
        });
      }

      if (!next[destino]) next[destino] = { prospectos: [], total: 0, valor: 0, valor_pen: 0, valor_usd: 0 };
      next[destino].prospectos.unshift(card);
      next[destino].total++;
      next[destino].valor  += v;
      if (esPen) next[destino].valor_pen = (next[destino].valor_pen ?? 0) + v;
      else       next[destino].valor_usd = (next[destino].valor_usd ?? 0) + v;
      return next;
    });

    if (valor > 0) {
      const activaKeys = new Set(etapasActivas.map(e => e.key));
      const deltaActivo = (activaKeys.has(destino) ? valor : 0) - (activaKeys.has(origen) ? valor : 0);
      const deltaGanado = (destino === "cerrado_ganado" ? valor : 0) - (origen === "cerrado_ganado" ? valor : 0);
      if (deltaActivo !== 0 || deltaGanado !== 0) {
        setStatsOport(prev => prev ? { total_activo: prev.total_activo + deltaActivo, total_ganado: prev.total_ganado + deltaGanado } : null);
      }
      if (destino === "perdido") setValorPerdido(p => p + valor);
      if (origen  === "perdido") setValorPerdido(p => Math.max(0, p - valor));
    }
  }

  async function handleUndo() {
    if (!undo) return;
    clearTimeout(undo.timer);
    const { id, etapaOrigen, etapaDestino } = undo;
    setUndo(null);
    moverCard(id, etapaDestino, etapaOrigen);
    try {
      if (PRE_PIPELINE.has(etapaOrigen)) await actualizarEstadoLead(id, etapaOrigen);
      else await actualizarEtapaPipeline(id, etapaOrigen);
    } catch (err) { console.error(err); cargar(); }
  }

  const totalProspectos = Object.values(pipeline).reduce((s, e) => s + e.total, 0);
  const etapasActivas = ETAPAS.filter(e => !["cerrado_ganado","perdido","volver_a_llamar","solicita_informacion","interesado"].includes(e.key));
  const valorActivo     = statsOport?.total_activo ?? etapasActivas.reduce((s, e) => s + (pipeline[e.key]?.valor ?? 0), 0);
  const valorCerrado    = statsOport?.total_ganado ?? pipeline["cerrado_ganado"]?.valor ?? 0;
  const valorCerradoPen = pipeline["cerrado_ganado"]?.valor_pen ?? 0;
  const valorCerradoUsd = pipeline["cerrado_ganado"]?.valor_usd ?? 0;

  const soles = (v: number) => `S/ ${v.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 sm:px-8 py-4 border-b border-white/[0.07] bg-[#070b16]/70 backdrop-blur-2xl shrink-0">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Comercial</p>
            <h1 className="font-display text-[26px] font-bold text-zinc-50 tracking-tight leading-tight mt-1">Pipeline de ventas</h1>
            <p className="text-[13px] text-zinc-500 mt-1">{totalProspectos} prospectos en el pipeline</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs font-semibold">
              <button onClick={() => setVista("prospectos")}
                className={`flex items-center gap-1.5 px-3 py-2 transition ${vista === "prospectos" ? "bg-accent-15 text-accent" : "text-zinc-400 hover:bg-white/[0.05]"}`}>
                <Kanban size={12} /> Prospectos
              </button>
              <button onClick={() => setVista("oportunidades")}
                className={`flex items-center gap-1.5 px-3 py-2 transition ${vista === "oportunidades" ? "bg-accent-15 text-accent" : "text-zinc-400 hover:bg-white/[0.05]"}`}>
                <LayoutGrid size={12} /> Oportunidades
              </button>
            </div>
            <button onClick={cargar} className="btn-ghost p-2.5 text-zinc-300" title="Actualizar">
              <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Banda de KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.06] mt-4 max-w-3xl">
          <div className="bg-[#0a101f]/90 px-4 py-2.5">
            <p className="font-display text-[17px] font-bold leading-none tabular-nums text-accent" style={{ textShadow: "0 0 14px rgb(var(--accent) / calc(0.5*var(--glow)))" }}>{soles(valorActivo)}</p>
            <p className="text-[9px] text-zinc-500 mt-1.5 uppercase tracking-[0.16em]">Pipeline activo</p>
          </div>
          <div className="bg-[#0a101f]/90 px-4 py-2.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              {valorCerradoPen > 0 && <span className="font-display text-[17px] font-bold leading-none tabular-nums text-emerald-400">{soles(valorCerradoPen)}</span>}
              {valorCerradoUsd > 0 && <span className="font-display text-[14px] font-bold leading-none tabular-nums text-emerald-300">$ {valorCerradoUsd.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>}
              {valorCerradoPen === 0 && valorCerradoUsd === 0 && <span className="font-display text-[17px] font-bold leading-none tabular-nums text-emerald-400">{soles(valorCerrado)}</span>}
            </div>
            <p className="text-[9px] text-zinc-500 mt-1.5 uppercase tracking-[0.16em]">Cerrado ganado</p>
          </div>
          <div className="bg-[#0a101f]/90 px-4 py-2.5">
            <p className="font-display text-[17px] font-bold leading-none tabular-nums text-red-400">{soles(valorPerdido)}</p>
            <p className="text-[9px] text-zinc-500 mt-1.5 uppercase tracking-[0.16em]">Perdido</p>
          </div>
          <div className="bg-[#0a101f]/90 px-4 py-2.5">
            <p className="font-display text-[17px] font-bold leading-none tabular-nums text-zinc-100">{totalProspectos}</p>
            <p className="text-[9px] text-zinc-500 mt-1.5 uppercase tracking-[0.16em]">Prospectos</p>
          </div>
        </div>
      </div>

      {/* Vista Prospectos */}
      {vista === "prospectos" && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3.5 p-5 h-full" style={{ minWidth: "max-content" }}>
            {ETAPAS.map(etapa => (
              <KanbanColumn
                key={etapa.key}
                etapa={etapa.key}
                label={etapa.label}
                color={etapa.color}
                prospectos={pipeline[etapa.key]?.prospectos ?? []}
                valor={pipeline[etapa.key]?.valor ?? 0}
                scores={scores}
                isDragOver={dragOver === etapa.key}
                onDragOver={() => setDragOver(etapa.key)}
                onDragLeave={() => setDragOver(null)}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onCardClick={p => setProspectoDetalle(p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vista Oportunidades */}
      {vista === "oportunidades" && (
        <div className="flex-1 overflow-y-auto"><OportunidadesKanban /></div>
      )}

      {/* Toast de deshacer — neon */}
      {undo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                        text-zinc-100 text-xs px-4 py-3 rounded-xl fade-up"
             style={{ background: "rgba(10,16,31,0.96)", border: "1px solid rgb(var(--accent) / 0.35)", boxShadow: "0 0 24px rgb(var(--accent) / calc(0.25*var(--glow))), 0 12px 30px rgba(0,0,0,0.6)" }}>
          <span className="truncate max-w-[200px]">
            <span className="font-semibold">{undo.empresa}</span>{" "}movida a{" "}
            <span className="font-semibold text-accent">{LABEL[undo.etapaDestino]}</span>
          </span>
          <button onClick={handleUndo}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-15 text-accent border border-accent-30 hover:bg-accent-10 transition font-semibold shrink-0">
            <Undo2 size={12} /> Deshacer
          </button>
        </div>
      )}

      {prospectoDetalle && (
        <ProspectoDetalle prospecto={prospectoDetalle} onCerrar={() => setProspectoDetalle(null)} onActualizado={actualizarCardPipeline} />
      )}
      {prospectoEditando && (
        <ProspectoForm prospecto={prospectoEditando} onGuardado={() => { setProspectoEditando(null); cargar(); }} onCerrar={() => setProspectoEditando(null)} />
      )}
    </div>
  );
}
