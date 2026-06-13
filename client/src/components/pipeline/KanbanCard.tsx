/**client/src/components/pipeline/KanbanCard.tsx */

import { GLASS_BASE } from "../../lib/tokens";
import { useState, useRef } from "react";
import { Phone, User, DollarSign, GripVertical, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { Prospecto } from "../../types/prospecto.types";

function calcularProbabilidad(score: number): number {
  if (score >= 75) return Math.min(85, Math.round(60 + (score - 75) * 1.0));
  if (score >= 50) return Math.round(35 + (score - 50) * 1.0);
  if (score >= 25) return Math.round(15 + (score - 25) * 0.8);
  return Math.max(3, Math.round(score * 0.6));
}

const COLOR_ESTADO: Record<string, string> = {
  interesado:         "bg-green-100 text-green-700",
  no_interesado:      "bg-red-100 text-red-700",
  no_contesta:        "bg-gray-100 text-gray-600",
  volver_a_llamar:    "bg-yellow-100 text-yellow-700",
  ocupado_en_reunion: "bg-yellow-100 text-yellow-700",
  prometio_llamar:    "bg-purple-100 text-purple-700",
  buzon_de_voz:       "bg-orange-100 text-orange-700",
  ya_tiene_proveedor: "bg-purple-100 text-purple-700",
  fuera_de_servicio:  "bg-red-100 text-red-700",
  numero_equivocado:  "bg-pink-100 text-pink-700",
};

const LABEL_ESTADO: Record<string, string> = {
  interesado:         "Interesado",
  no_interesado:      "No interesado",
  no_contesta:        "No contesta",
  volver_a_llamar:    "Volver a llamar",
  ocupado_en_reunion: "Ocupado / En reunión",
  prometio_llamar:    "Prometió llamar",
  buzon_de_voz:       "Buzón de voz",
  ya_tiene_proveedor: "Tiene proveedor",
  fuera_de_servicio:  "Fuera servicio",
  numero_equivocado:  "N° equivocado",
};

const LABEL_SERVICIO: Record<string, string> = {
  desarrollo_web:      "Web",
  redes_sociales:      "Redes sociales",
  publicidad_digital:  "Publicidad",
  branding:            "Branding",
  fotografia_video:    "Foto/Video",
  consultoria:         "Consultoría",
  otro:                "Otro",
};

const ESTADO_PROPUESTA: Record<string, { label: string; cls: string }> = {
  enviada:         { label: "Enviada",       cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  en_negociacion:  { label: "Negociación",   cls: "bg-blue-50 text-blue-700 border-blue-200"       },
  cerrada_ganada:  { label: "Ganada",        cls: "bg-green-50 text-green-700 border-green-200"     },
  cerrada_perdida: { label: "Perdida",       cls: "bg-red-50 text-red-600 border-red-200"           },
  vencida:         { label: "Vencida",       cls: "bg-zinc-100 text-zinc-500 border-zinc-200"       },
};

const PRIORIDAD_DOT: Record<string, string> = {
  alta:  "bg-red-500",
  media: "bg-yellow-400",
  baja:  "bg-gray-300",
};

const SCORE_STYLE = {
  caliente: { dot: "bg-red-500",    text: "text-red-600",    label: "🔥" },
  activo:   { dot: "bg-amber-500", text: "text-amber-600", label: "⬆" },
  tibio:    { dot: "bg-yellow-400", text: "text-yellow-600", label: "→" },
  frio:     { dot: "bg-gray-300",   text: "text-gray-600",   label: "❄" },
};

// Solo estas 4 etapas tienen color + desglose
const ETAPAS_AVANZADAS = new Set(["propuesta_enviada", "negociacion", "cerrado_ganado", "perdido"]);

const ETAPA_BORDER: Record<string, string> = {
  propuesta_enviada: "border-l-amber-400",
  negociacion:       "border-l-amber-400",
  cerrado_ganado:    "border-l-green-500",
  perdido:           "border-l-red-400",
};

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

  const ringClass = nivel === "caliente" ? "ring-2 ring-red-400 ring-offset-1"
                  : nivel === "activo"   ? "ring-1 ring-amber-300"
                  : "";

  function handleDragStart(e: React.DragEvent) {
    dragging.current = true;
    onDragStart(e, p.id);
  }

  function handleDragEnd() {
    setTimeout(() => { dragging.current = false; }, 100);
  }

  // ── Tarjeta simple (nuevo / contactado / interesado) ─────────────────────
  if (!esAvanzada) {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => { if (!dragging.current) onClick(p); }}
        className={`${GLASS_BASE} p-3 hover:shadow-md cursor-grab active:cursor-grabbing transition-shadow select-none group ${ringClass}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORIDAD_DOT[p.prioridad]}`} />
            <p className="text-xs font-semibold text-zinc-200 truncate leading-tight">{p.empresa}</p>
          </div>
          <GripVertical size={13} className="text-gray-300 group-hover:text-gray-400 shrink-0 mt-0.5 transition-colors" />
        </div>

        {p.nombre_contacto && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <User size={11} className="text-zinc-400 shrink-0" />
            <p className="text-[11px] text-zinc-300 truncate">{p.nombre_contacto}</p>
          </div>
        )}
        {p.telefono && (
          <div className="flex items-center gap-1.5 mb-2">
            <a href={`tel:${p.telefono}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-[10px] font-medium"
              onClick={e => e.stopPropagation()}
              title="Llamar">
              <Phone size={10} /> {p.telefono}
            </a>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${COLOR_ESTADO[p.estado_lead] ?? "bg-zinc-800 text-gray-400"}`}>
            {LABEL_ESTADO[p.estado_lead] ?? p.estado_lead}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {score !== undefined && nivel && (() => {
              const s = SCORE_STYLE[nivel];
              const prob = calcularProbabilidad(score);
              return (
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-bold ${s.text}`}>{s.label} {score}</span>
                  <span className="text-[9px] text-zinc-400">{prob}% cierre</span>
                </div>
              );
            })()}
            {montoFmt && (
              <div className="flex items-center gap-0.5">
                <DollarSign size={10} className="text-green-500" />
                <span className="text-[10px] font-semibold text-green-600">{montoFmt}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Tarjeta con desglose (propuesta_enviada / negociacion / cerrado_ganado / perdido) ──
  const borderColor = ETAPA_BORDER[p.etapa_pipeline];

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => { if (!dragging.current) setExpandido(v => !v); }}
      className={`${GLASS_BASE} border-l-4 ${borderColor}
                 hover:shadow-md cursor-pointer transition-shadow select-none group ${ringClass}`}
    >
      {/* Header siempre visible */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORIDAD_DOT[p.prioridad]}`} />
          <p className="text-xs font-semibold text-zinc-200 truncate leading-tight">{p.empresa}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {montoFmt && (
            <span className="text-[10px] font-semibold text-green-600">{montoFmt}</span>
          )}
          <GripVertical size={12} className="text-gray-300 group-hover:text-gray-400 transition-colors cursor-grab active:cursor-grabbing" />
          {expandido
            ? <ChevronUp  size={12} className="text-gray-400" />
            : <ChevronDown size={12} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
          }
        </div>
      </div>

      {/* Contenido expandido */}
      {expandido && (
        <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-2">

          {/* Contacto */}
          {p.nombre_contacto && (
            <div className="flex items-center gap-1.5">
              <User size={11} className="text-zinc-400 shrink-0" />
              <p className="text-[11px] text-zinc-400 truncate">{p.nombre_contacto}</p>
            </div>
          )}
          {p.telefono && (
            <div className="flex items-center gap-1.5">
              <a href={`tel:${p.telefono}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-[10px] font-medium"
                onClick={e => e.stopPropagation()}
                title="Llamar">
                <Phone size={10} /> {p.telefono}
              </a>
            </div>
          )}

          {/* Propuestas */}
          {p.propuestas_list && p.propuestas_list.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest">
                {p.propuestas_list.length} propuesta{p.propuestas_list.length > 1 ? "s" : ""}
              </p>
              {p.propuestas_list.map(pr => {
                const est = ESTADO_PROPUESTA[pr.estado] ?? { label: pr.estado, cls: "bg-zinc-100 text-zinc-500 border-zinc-200" };
                return (
                  <div key={pr.id} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-800/40 px-2 py-1.5 border border-white/8">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-zinc-200 truncate">
                        {LABEL_SERVICIO[pr.servicio] ?? pr.servicio}
                      </p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${est.cls}`}>
                        {est.label}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-zinc-100 shrink-0">
                      S/ {Number(pr.monto).toLocaleString("es-PE", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Score + botón */}
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/5">
            {score !== undefined && nivel && (() => {
              const s = SCORE_STYLE[nivel];
              const prob = calcularProbabilidad(score);
              return (
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold ${s.text}`}>{s.label} {score}</span>
                  <span className="text-[9px] text-zinc-500">{prob}% cierre</span>
                </div>
              );
            })()}
            <button
              onClick={e => { e.stopPropagation(); onClick(p); }}
              className="flex items-center gap-1 text-[10px] font-medium text-zinc-500
                         hover:text-zinc-200 hover:bg-zinc-800 rounded-lg px-2 py-1 transition-colors ml-auto"
            >
              <ExternalLink size={10} /> Detalle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
