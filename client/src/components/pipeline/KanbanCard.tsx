/**client/src/components/pipeline/KanbanCard.tsx */

import { Phone, User, DollarSign, GripVertical } from "lucide-react";

function calcularProbabilidad(score: number): number {
  if (score >= 75) return Math.min(85, Math.round(60 + (score - 75) * 1.0));
  if (score >= 50) return Math.round(35 + (score - 50) * 1.0);
  if (score >= 25) return Math.round(15 + (score - 25) * 0.8);
  return Math.max(3, Math.round(score * 0.6));
}
import type { Prospecto } from "../../types/prospecto.types";

const COLOR_ESTADO: Record<string, string> = {
  interesado:         "bg-green-100 text-green-700",
  no_interesado:      "bg-red-100 text-red-700",
  no_contesta:        "bg-gray-100 text-gray-600",
  volver_a_llamar:    "bg-yellow-100 text-yellow-700",
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
  buzon_de_voz:       "Buzón de voz",
  ya_tiene_proveedor: "Tiene proveedor",
  fuera_de_servicio:  "Fuera servicio",
  numero_equivocado:  "N° equivocado",
};

const PRIORIDAD_DOT: Record<string, string> = {
  alta:  "bg-red-500",
  media: "bg-yellow-400",
  baja:  "bg-gray-300",
};

const SCORE_STYLE = {
  caliente: { dot: "bg-red-500",    text: "text-red-600",    label: "🔥" },
  activo:   { dot: "bg-indigo-500", text: "text-indigo-600", label: "⬆" },
  tibio:    { dot: "bg-yellow-400", text: "text-yellow-600", label: "→" },
  frio:     { dot: "bg-gray-300",   text: "text-gray-400",   label: "❄" },
};

interface Props {
  prospecto:   Prospecto;
  score?:      number;
  nivel?:      "caliente" | "activo" | "tibio" | "frio";
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick:     (p: Prospecto) => void;
}

export function KanbanCard({ prospecto: p, score, nivel, onDragStart, onClick }: Props) {
  const montoFmt = (p.valor_pipeline ?? 0) > 0
    ? `S/ ${Number(p.valor_pipeline).toLocaleString("es-PE", { minimumFractionDigits: 0 })}`
    : null;

  const ringClass = nivel === "caliente" ? "ring-2 ring-red-400 ring-offset-1"
                  : nivel === "activo"   ? "ring-1 ring-indigo-300"
                  : "";

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, p.id)}
      onClick={() => onClick(p)}
      className={`bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md
                 cursor-grab active:cursor-grabbing transition-shadow select-none group ${ringClass}`}
    >
      {/* Header: empresa + grip */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORIDAD_DOT[p.prioridad]}`} />
          <p className="text-xs font-semibold text-zinc-800 truncate leading-tight">{p.empresa}</p>
        </div>
        <GripVertical size={13} className="text-gray-300 group-hover:text-gray-400 shrink-0 mt-0.5 transition-colors" />
      </div>

      {/* Contacto */}
      {p.nombre_contacto && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <User size={11} className="text-zinc-400 shrink-0" />
          <p className="text-[11px] text-zinc-500 truncate">{p.nombre_contacto}</p>
        </div>
      )}
      {p.telefono && (
        <div className="flex items-center gap-1.5 mb-2">
          <Phone size={11} className="text-zinc-400 shrink-0" />
          <p className="text-[11px] text-zinc-500">{p.telefono}</p>
        </div>
      )}

      {/* Footer: estado + score + valor */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-50">
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${COLOR_ESTADO[p.estado_lead] ?? "bg-gray-100 text-gray-600"}`}>
          {LABEL_ESTADO[p.estado_lead] ?? p.estado_lead}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {score !== undefined && nivel && (() => {
            const s = SCORE_STYLE[nivel];
            const prob = calcularProbabilidad(score);
            return (
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-bold ${s.text}`}>
                  {s.label} {score}
                </span>
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
