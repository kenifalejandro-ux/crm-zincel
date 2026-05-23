/**client/src/pages/PipelinePage.tsx */

import { useEffect, useRef, useState } from "react";
import { Kanban, RefreshCw, Undo2 } from "lucide-react";
import { getPipeline, actualizarEtapaPipeline, getScoresLeads, getProspecto, type PipelineEtapa, type ScoreLead } from "../services/prospectos.api";
import { KanbanColumn } from "../components/pipeline/KanbanColumn";
import { ProspectoDetalle } from "../components/prospectos/ProspectoDetalle";
import { ProspectoForm } from "../components/prospectos/ProspectoForm";
import type { Prospecto, EtapaPipeline } from "../types/prospecto.types";

const ETAPAS: { key: EtapaPipeline; label: string; color: string }[] = [
  { key: "nuevo",             label: "Nuevo",             color: "bg-gray-400" },
  { key: "contactado",        label: "Contactado",        color: "bg-blue-400" },
  { key: "interesado",        label: "Interesado",        color: "bg-amber-500" },
  { key: "propuesta_enviada", label: "Propuesta enviada", color: "bg-yellow-500" },
  { key: "negociacion",       label: "Negociación",       color: "bg-orange-500" },
  { key: "cerrado_ganado",    label: "Cerrado ✓",         color: "bg-green-500" },
  { key: "perdido",           label: "Perdido",           color: "bg-red-400" },
];

const LABEL: Record<string, string> = Object.fromEntries(ETAPAS.map(e => [e.key, e.label]));

interface UndoState {
  id:          string;
  empresa:     string;
  etapaOrigen: string;
  etapaDestino: string;
  timer:       ReturnType<typeof setTimeout>;
}

export default function PipelinePage() {
  const [pipeline,    setPipeline]    = useState<Record<string, PipelineEtapa>>({});
  const [scores,      setScores]      = useState<Record<string, ScoreLead>>({});
  const [cargando,    setCargando]    = useState(true);
  const [dragOver,    setDragOver]    = useState<string | null>(null);
  const [undo,        setUndo]        = useState<UndoState | null>(null);
  const [prospectoDetalle,  setProspectoDetalle]  = useState<Prospecto | null>(null);
  const [prospectoEditando, setProspectoEditando] = useState<Prospecto | null>(null);
  const dragId = useRef<string | null>(null);

  useEffect(() => { cargar(); }, []);

  // Clean up undo timer on unmount
  useEffect(() => () => { if (undo) clearTimeout(undo.timer); }, [undo]);

  async function cargar() {
    setCargando(true);
    try {
      setPipeline(await getPipeline());
    }
    catch (err) { console.error(err); }
    finally { setCargando(false); }
    // Scores independiente — no bloquea el pipeline si falla
    getScoresLeads()
      .then(s => setScores(Object.fromEntries(s.map(sc => [sc.id, sc]))))
      .catch(console.error);
  }

  // Recarga solo el card afectado y lo mueve a su nueva columna sin recargar todo
  async function actualizarCardPipeline(id: string) {
    try {
      const actualizado = await getProspecto(id);
      const nuevaEtapa  = actualizado.etapa_pipeline;
      setPipeline(prev => {
        const next = structuredClone(prev);
        // Buscar en qué columna está actualmente
        const etapaActual = Object.keys(next).find(k =>
          next[k].prospectos.some(p => p.id === id)
        );
        if (!etapaActual) return prev;
        if (etapaActual === nuevaEtapa) {
          // Solo actualizar datos del card sin moverlo
          next[etapaActual].prospectos = next[etapaActual].prospectos.map(p =>
            p.id === id ? { ...p, ...actualizado } : p
          );
          return next;
        }
        // Mover el card a la nueva columna
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
    } catch {
      // Si falla, recarga completa como fallback
      cargar();
    }
  }

  function handleDragStart(_e: React.DragEvent, id: string) {
    dragId.current = id;
  }

  async function handleDrop(_e: React.DragEvent, etapaDestino: string) {
    setDragOver(null);
    const id = dragId.current;
    if (!id) return;
    dragId.current = null;

    const etapaOrigen = Object.entries(pipeline).find(([, v]) =>
      v.prospectos.some(p => p.id === id)
    )?.[0];
    if (!etapaOrigen || etapaOrigen === etapaDestino) return;

    const empresa = pipeline[etapaOrigen].prospectos.find(p => p.id === id)?.empresa ?? "";

    // Optimistic UI update
    moverCard(id, etapaOrigen, etapaDestino);

    // Show undo toast for 5 seconds
    if (undo) clearTimeout(undo.timer);
    const timer = setTimeout(() => setUndo(null), 5000);
    setUndo({ id, empresa, etapaOrigen, etapaDestino, timer });

    try {
      await actualizarEtapaPipeline(id, etapaDestino);
    } catch (err) {
      console.error(err);
      cargar();
    }
  }

  function moverCard(id: string, origen: string, destino: string) {
    setPipeline(prev => {
      const next = structuredClone(prev);
      if (!next[origen]) return prev;
      const card = next[origen].prospectos.find(p => p.id === id);
      if (!card) return prev;
      next[origen].prospectos = next[origen].prospectos.filter(p => p.id !== id);
      next[origen].total  = Math.max(0, next[origen].total - 1);
      next[origen].valor -= Number(card.valor_pipeline ?? 0);
      card.etapa_pipeline = destino as EtapaPipeline;
      if (!next[destino]) next[destino] = { prospectos: [], total: 0, valor: 0, valor_pen: 0, valor_usd: 0 };
      next[destino].prospectos.unshift(card);
      next[destino].total++;
      next[destino].valor += Number(card.valor_pipeline ?? 0);
      return next;
    });
  }

  async function handleUndo() {
    if (!undo) return;
    clearTimeout(undo.timer);
    const { id, etapaOrigen, etapaDestino } = undo;
    setUndo(null);
    moverCard(id, etapaDestino, etapaOrigen);
    try { await actualizarEtapaPipeline(id, etapaOrigen); }
    catch (err) { console.error(err); cargar(); }
  }

  const totalProspectos = Object.values(pipeline).reduce((s, e) => s + e.total, 0);
  const etapasActivas = ETAPAS.filter(e => !["cerrado_ganado", "perdido"].includes(e.key));
  const valorActivo    = etapasActivas.reduce((s, e) => s + (pipeline[e.key]?.valor     ?? 0), 0);
  const valorActivoPen = etapasActivas.reduce((s, e) => s + (pipeline[e.key]?.valor_pen ?? 0), 0);
  const valorActivoUsd = etapasActivas.reduce((s, e) => s + (pipeline[e.key]?.valor_usd ?? 0), 0);
  const valorCerrado   = pipeline["cerrado_ganado"]?.valor     ?? 0;
  const valorCerradoPen = pipeline["cerrado_ganado"]?.valor_pen ?? 0;
  const valorCerradoUsd = pipeline["cerrado_ganado"]?.valor_usd ?? 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <Kanban size={20} className="text-amber-500" />
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Pipeline de ventas</h1>
            <p className="text-xs text-zinc-600">{totalProspectos} prospectos en el pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Pipeline activo — desglose por moneda */}
          <div className="text-right border-r border-gray-100 pr-3">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wide">Pipeline activo</p>
            <div className="flex items-center gap-2">
              {valorActivoPen > 0 && (
                <span className="text-sm font-bold text-amber-600">
                  S/ {valorActivoPen.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
                </span>
              )}
              {valorActivoUsd > 0 && (
                <span className="text-sm font-bold text-amber-400">
                  $ {valorActivoUsd.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-600">
              Total S/ {valorActivo.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
            </p>
          </div>
          {/* Cerrado — desglose por moneda */}
          <div className="text-right">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wide">Cerrado</p>
            <div className="flex items-center gap-2">
              {valorCerradoPen > 0 && (
                <span className="text-sm font-bold text-green-600">
                  S/ {valorCerradoPen.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
                </span>
              )}
              {valorCerradoUsd > 0 && (
                <span className="text-sm font-bold text-green-400">
                  $ {valorCerradoUsd.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-600">
              Total S/ {valorCerrado.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
            </p>
          </div>
          <button onClick={cargar}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-zinc-700"
            title="Actualizar">
            <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full" style={{ minWidth: "max-content" }}>
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

      {/* Toast de deshacer */}
      {undo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                        bg-zinc-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl animate-fade-in">
          <span className="truncate max-w-[200px]">
            <span className="font-medium">{undo.empresa}</span>
            {" "}movida a{" "}
            <span className="font-medium">{LABEL[undo.etapaDestino]}</span>
          </span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 transition font-medium shrink-0"
          >
            <Undo2 size={12} /> Deshacer
          </button>
        </div>
      )}

      {/* Modal detalle */}
      {prospectoDetalle && (
        <ProspectoDetalle
          prospecto={prospectoDetalle}
          onCerrar={() => setProspectoDetalle(null)}
          onEditar={() => { setProspectoEditando(prospectoDetalle); setProspectoDetalle(null); }}
          onActualizado={actualizarCardPipeline}
        />
      )}

      {/* Modal editar */}
      {prospectoEditando && (
        <ProspectoForm
          prospecto={prospectoEditando}
          onGuardado={() => { setProspectoEditando(null); cargar(); }}
          onCerrar={() => setProspectoEditando(null)}
        />
      )}
    </div>
  );
}
