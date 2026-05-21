/**client/src/components/pipeline/KanbanColumn.tsx */

import { KanbanCard } from "./KanbanCard";
import type { Prospecto } from "../../types/prospecto.types";

import type { ScoreLead } from "../../services/prospectos.api";

interface Props {
  etapa:       string;
  label:       string;
  color:       string;
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
  etapa, label, color, prospectos, valor, scores,
  isDragOver, onDragOver, onDragLeave, onDrop,
  onDragStart, onCardClick,
}: Props) {
  const montoFmt = valor > 0
    ? `S/ ${valor.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`
    : null;

  return (
    <div
      onDragOver={e => { e.preventDefault(); onDragOver(e); }}
      onDragLeave={onDragLeave}
      onDrop={e => onDrop(e, etapa)}
      className={`flex flex-col rounded-2xl transition-colors min-h-[400px] w-64 shrink-0
        ${isDragOver ? "bg-amber-50 ring-2 ring-amber-300" : "bg-gray-50"}`}
    >
      {/* Column header */}
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <p className="text-xs font-semibold text-zinc-700">{label}</p>
          </div>
          <span className="text-[10px] bg-white border border-gray-200 text-zinc-500 px-1.5 py-0.5 rounded-full font-medium">
            {prospectos.length}
          </span>
        </div>
        {montoFmt && (
          <p className="text-[11px] text-green-600 font-semibold pl-4">{montoFmt}</p>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {prospectos.length === 0 && (
          <div className={`rounded-xl border-2 border-dashed h-20 flex items-center justify-center transition-colors
            ${isDragOver ? "border-amber-300" : "border-gray-200"}`}>
            <p className="text-[10px] text-zinc-400">Arrastra aquí</p>
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
