/**client/src/components/pipeline/KanbanCard.tsx — REDISEÑO NEON
 * Cambios visuales: estado/score/propuesta/teléfono/prioridad migrados a neon
 * (antes bg-green-100, bg-yellow-50, ring-red-400, border-l-amber-400, text-gray-300).
 * Toda la lógica (variantes simple/avanzada, expandir, drag, probabilidad) intacta.
 */
import { GLASS_BASE } from "../../lib/tokens";
import { ESTADO_CHIP, PRIORIDAD_DOT, SCORE_NEON, PROPUESTA_CHIP, ETAPA_HEX } from "../../lib/estadoColors";
import { useState, useRef } from "react";
import { Phone, User, GripVertical, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { Prospecto } from "../../types/prospecto.types";

function calcularProbabilidad(score: number): number {
  if (score >= 75) return Math.min(85, Math.round(60 + (score - 75) * 1.0));
  if (score >= 50) return Math.round(35 + (score - 50) * 1.0);
  if (score >= 25) return Math.round(15 + (score - 25) * 0.8);
  return Math.max(3, Math.round(score * 0.6));
}

const LABEL_ESTADO: Record<string, string> = {
  interesado: "Interesado", no_interesado: "No interesado", no_contesta: "No contesta",
  volver_a_llamar: "Volver a llamar", ocupado_en_reunion: "Ocupado / En reunión",
  prometio_llamar: "Prometió llamar", buzon_de_voz: "Buzón de voz",
  ya_tiene_proveedor: "Tiene proveedor", fuera_de_servicio: "Fuera servicio",
  numero_equivocado: "N° equivocado",
};

const LABEL_SERVICIO: Record<string, string> = {
  desarrollo_web: "Web", redes_sociales: "Redes sociales", publicidad_digital: "Publicidad",
  branding: "Branding", fotografia_video: "Foto/Video", consultoria: "Consultoría", otro: "Otro",
};

const ETAPAS_AVANZADAS = new Set(["propuesta_enviada", "negociacion", "cerrado_ganado", "perdido"]);

interface Props {
  prospecto:   Prospecto;
  score?:      number;
  nivel?:      "caliente" | "activo" | "tibio" | "frio";
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick:     (p: Prospecto) => void;
}

export function KanbanCard({ prospecto: p, score, nivel, onDragStart, onClick }: Props) {
  const [expandido, setExpandido] = useState(false);
  const dragging = useRef(false);

  const esAvanzada = ETAPAS_AVANZADAS.has(p.etapa_pipeline);
  const montoFmt = (p.valor_pipeline ?? 0) > 0
    ? `S/ ${Number(p.valor_pipeline).toLocaleString("es-PE", { minimumFractionDigits: 0 })}`
    : null;

  // Anillo neon según nivel (antes ring-red-400 / ring-amber-300)
  const ringStyle =
    nivel === "caliente" ? { boxShadow: "0 0 0 1px rgba(248,113,113,0.5), 0 0 16px rgba(248,113,113,0.25)" }
    : nivel === "activo" ? { boxShadow: "0 0 0 1px rgba(251,191,36,0.4)" }
    : undefined;

  function handleDragStart(e: React.DragEvent) { dragging.current = true; onDragStart(e, p.id); }
  function handleDragEnd() { setTimeout(() => { dragging.current = false; }, 100); }

  const ScoreInline = () => {
    if (score === undefined || !nivel) return null;
    const s = SCORE_NEON[nivel];
    const prob = calcularProbabilidad(score);
    return (
      <div className="flex flex-col items-end">
        <span className={`text-[10px] font-bold ${s.text}`}>{s.icon} {score}</span>
        <span className="text-[9px] text-zinc-500">{prob}% cierre</span>
      </div>
    );
  };

  const TelefonoPill = () =>
    p.telefono ? (
      <a href={`tel:${p.telefono}`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors text-[10px] font-medium"
        onClick={e => e.stopPropagation()} title="Llamar">
        <Phone size={10} /> {p.telefono}
      </a>
    ) : null;

  // ── Tarjeta simple ──────────────────────────────────────────────────────
  if (!esAvanzada) {
    return (
      <div
        draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}
        onClick={() => { if (!dragging.current) onClick(p); }}
        style={ringStyle}
        className={`${GLASS_BASE} p-3 cursor-grab active:cursor-grabbing transition-all select-none group hover:-translate-y-0.5`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORIDAD_DOT[p.prioridad]}`} />
            <p className="text-xs font-semibold text-zinc-100 truncate leading-tight group-hover:text-accent transition-colors">{p.empresa}</p>
          </div>
          <GripVertical size={13} className="text-zinc-700 group-hover:text-zinc-500 shrink-0 mt-0.5 transition-colors" />
        </div>

        {p.nombre_contacto && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <User size={11} className="text-zinc-500 shrink-0" />
            <p className="text-[11px] text-zinc-400 truncate">{p.nombre_contacto}</p>
          </div>
        )}
        {p.telefono && <div className="mb-2"><TelefonoPill /></div>}

        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/[0.06]">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium truncate ${ESTADO_CHIP[p.estado_lead] ?? "bg-white/[0.05] text-zinc-400 border border-white/10"}`}>
            {LABEL_ESTADO[p.estado_lead] ?? p.estado_lead}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <ScoreInline />
            {montoFmt && <span className="text-[10px] font-display font-bold text-zinc-200 tabular-nums">{montoFmt}</span>}
          </div>
        </div>
      </div>
    );
  }

  // ── Tarjeta avanzada (con desglose) ───────────────────────────────────
  const hex = ETAPA_HEX[p.etapa_pipeline] ?? "#a855f7";

  return (
    <div
      draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}
      onClick={() => { if (!dragging.current) setExpandido(v => !v); }}
      style={{ ...ringStyle, borderLeft: `3px solid ${hex}` }}
      className={`${GLASS_BASE} cursor-pointer transition-all select-none group hover:-translate-y-0.5`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORIDAD_DOT[p.prioridad]}`} />
          <p className="text-xs font-semibold text-zinc-100 truncate leading-tight group-hover:text-accent transition-colors">{p.empresa}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {montoFmt && <span className="text-[10px] font-display font-bold text-zinc-200 tabular-nums">{montoFmt}</span>}
          <GripVertical size={12} className="text-zinc-700 group-hover:text-zinc-500 transition-colors cursor-grab active:cursor-grabbing" />
          {expandido
            ? <ChevronUp size={12} className="text-zinc-500" />
            : <ChevronDown size={12} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />}
        </div>
      </div>

      {expandido && (
        <div className="px-3 pb-3 border-t border-white/[0.06] pt-2 space-y-2">
          {p.nombre_contacto && (
            <div className="flex items-center gap-1.5">
              <User size={11} className="text-zinc-500 shrink-0" />
              <p className="text-[11px] text-zinc-400 truncate">{p.nombre_contacto}</p>
            </div>
          )}
          {p.telefono && <TelefonoPill />}

          {p.propuestas_list && p.propuestas_list.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                {p.propuestas_list.length} propuesta{p.propuestas_list.length > 1 ? "s" : ""}
              </p>
              {p.propuestas_list.map(pr => {
                const est = PROPUESTA_CHIP[pr.estado] ?? { label: pr.estado, cls: "bg-white/[0.06] text-zinc-400 border border-white/15" };
                return (
                  <div key={pr.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5 border border-white/[0.07]">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-zinc-200 truncate">{LABEL_SERVICIO[pr.servicio] ?? pr.servicio}</p>
                      <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${est.cls}`}>{est.label}</span>
                    </div>
                    <p className="text-[11px] font-display font-bold text-zinc-100 shrink-0 tabular-nums">
                      S/ {Number(pr.monto).toLocaleString("es-PE", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/[0.06]">
            <ScoreInline />
            <button
              onClick={e => { e.stopPropagation(); onClick(p); }}
              className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-accent hover:bg-white/[0.05] rounded-lg px-2 py-1 transition-colors ml-auto"
            >
              <ExternalLink size={10} /> Detalle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
