/** client/src/ui/TableBulkActions.tsx */

import { useState } from "react";
import { Tag } from "lucide-react";
import { PROYECTOS_LISTA } from "@/components/metricas/detalle/TablaMetricas";

const PROY_STYLE: Record<string, string> = {
  "Alborada":      "accent-violet-600",
  "Terrenos Villa":"accent-emerald-600",
  "San Fernando":  "accent-sky-600",
};

interface TableBulkActionsProps {
  count:                number;
  proyectos?:           string[];
  onDelete?:            () => void;
  onAsignarProyectos?:  (proyectos: string[]) => void;
}

export function TableBulkActions({ count, proyectos = [], onDelete, onAsignarProyectos }: TableBulkActionsProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>([]);

  const todosProyectos = Array.from(new Set([...PROYECTOS_LISTA, ...proyectos]));

  const toggle = (p: string) =>
    setSeleccion(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const confirmar = () => {
    if (onAsignarProyectos) onAsignarProyectos(seleccion);
    setSeleccion([]);
    setShowPanel(false);
  };

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 relative">

      {/* Asignar proyectos */}
      {onAsignarProyectos && (
        <>
          <button
            onClick={() => setShowPanel(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-50 border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-100 transition"
          >
            <Tag size={11} />
            Asignar proyectos ({count})
          </button>

          {showPanel && (
            <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg p-3 min-w-[200px]">
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide mb-2">
                Asignar a {count} campaña{count > 1 ? "s" : ""}
              </p>
              <div className="flex flex-col gap-2 mb-3">
                {todosProyectos.map(p => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seleccion.includes(p)}
                      onChange={() => toggle(p)}
                      className={`w-3.5 h-3.5 rounded ${PROY_STYLE[p] ?? "accent-zinc-500"}`}
                    />
                    <span className="text-xs text-zinc-700">{p}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={confirmar}
                  disabled={seleccion.length === 0}
                  className="flex-1 text-xs bg-zinc-800 text-white rounded-lg py-1.5 hover:bg-zinc-700 disabled:opacity-40 transition"
                >
                  Asignar
                </button>
                <button
                  onClick={() => { setShowPanel(false); setSeleccion([]); }}
                  className="text-xs text-zinc-400 hover:text-zinc-600 px-2"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          🗑️ Eliminar ({count})
        </button>
      )}

    </div>
  );
}
