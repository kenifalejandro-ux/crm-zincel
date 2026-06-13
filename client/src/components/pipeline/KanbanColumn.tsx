/**client/src/components/pipeline/KanbanColumn.tsx — REDISEÑO NEON
 * Cambios: drop-zone neon (antes bg-amber-50 ring-amber-300 — tema claro),
 * dot de etapa con glow por color real, valor en color de etapa,
 * borde válido (antes border-white/8 — no pintaba). Props y lógica intactos.
 */
import { ETAPA_HEX } from "../../lib/estadoColors";
import { KanbanCard } from "./KanbanCard";
import type { Prospecto } from "../../types/prospecto.types";
import type { ScoreLead } from "../../services/prospectos.api";

interface Props {
  etapa:       string;
  label:       string;
  color:       string;   // se mantiene en la firma por compatibilidad (ya no se usa la clase)
  prospectos:  Prospecto[];
  valor:       number;
  scores?:     Record<string, ScoreLead>;
  isDragOver:  boolean;
  onDragOver:  (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop:      (e: React.DragEvent, etapa: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onCardClick: (p: Prospecto) => void;
}

export function KanbanColumn({
  etapa, label, prospectos, valor, scores,
  isDragOver, onDragOver, onDragLeave, onDrop,
  onDragStart, onCardClick,
}: Props) {
  const hex = ETAPA_HEX[etapa] ?? "#06b6d4";
  const montoFmt = valor > 0
    ? `S/ ${valor.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`
    : null;

  return (
    <div
      onDragOver={e => { e.preventDefault(); onDragOver(e); }}
      onDragLeave={onDragLeave}
      onDrop={e => onDrop(e, etapa)}
      className="flex flex-col min-h-[400px] w-64 shrink-0 rounded-2xl transition-all"
      style={
        isDragOver
          ? { background: "rgb(var(--accent) / 0.06)", border: "1px solid rgb(var(--accent) / 0.4)", boxShadow: "0 0 22px rgb(var(--accent) / calc(0.2*var(--glow)))" }
          : { background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }
      }
    >
      {/* Column header */}
      <div className="px-3.5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: hex, boxShadow: `0 0 8px ${hex}` }} />
            <p className="text-[12.5px] font-semibold text-zinc-200 truncate">{label}</p>
            <span className="text-[10px] font-bold text-zinc-500 bg-white/[0.06] px-1.5 py-0.5 rounded-full tabular-nums shrink-0">
              {prospectos.length}
            </span>
          </div>
        </div>
        {montoFmt && (
          <p className="text-[11px] font-display font-bold mt-1.5" style={{ color: hex }}>{montoFmt}</p>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto">
        {prospectos.length === 0 && (
          <div
            className="rounded-xl border border-dashed h-20 flex items-center justify-center transition-colors"
            style={{ borderColor: isDragOver ? "rgb(var(--accent) / 0.5)" : "rgba(255,255,255,0.08)" }}
          >
            <p className="text-[11px] text-zinc-600">Arrastra aquí</p>
          </div>
        )}
        {prospectos.map(p => (
          <KanbanCard
            key={p.id}
            prospecto={p}
            score={scores?.[p.id]?.score}
            nivel={scores?.[p.id]?.nivel}
            onDragStart={onDragStart}
            onClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}
