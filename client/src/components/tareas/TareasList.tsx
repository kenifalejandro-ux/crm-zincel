/**client/src/components/tareas/TareasList.tsx */

import { useState } from "react";
import { Check, Trash2, Clock, AlertCircle } from "lucide-react";
import { completarTarea, eliminarTarea } from "../../services/tareas.api";
import type { Tarea } from "../../types/tarea.types";

interface Props {
  tareas:      Tarea[];
  onActualizar: () => void;
}

function urgencia(t: Tarea): "vencida" | "hoy" | "proxima" {
  const hoy   = new Date().toISOString().split("T")[0];
  const venc  = t.fecha_vencimiento.split("T")[0];
  if (venc < hoy)  return "vencida";
  if (venc === hoy) return "hoy";
  return "proxima";
}

const ESTILOS: Record<string, { row: string; badge: string; texto: string }> = {
  vencida: {
    row:   "border-red-200 bg-red-50",
    badge: "bg-red-100 text-red-700",
    texto: "Vencida",
  },
  hoy: {
    row:   "border-orange-200 bg-orange-50",
    badge: "bg-orange-100 text-orange-700",
    texto: "Hoy",
  },
  proxima: {
    row:   "border-gray-100 bg-white",
    badge: "bg-green-100 text-green-700",
    texto: "",
  },
};

export function TareasList({ tareas, onActualizar }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (tareas.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-zinc-400">
        <Clock size={28} className="mx-auto mb-2 opacity-40" />
        Sin tareas pendientes
      </div>
    );
  }

  async function handleCompletar(id: string) {
    setLoadingId(id);
    try { await completarTarea(id); onActualizar(); }
    catch (err) { console.error(err); }
    finally { setLoadingId(null); }
  }

  async function handleEliminar(id: string) {
    setLoadingId(id);
    try { await eliminarTarea(id); onActualizar(); }
    catch (err) { console.error(err); }
    finally { setLoadingId(null); }
  }

  const fecha = (iso: string) =>
    new Date(iso.split("T")[0] + "T12:00:00").toLocaleDateString("es-PE", {
      day: "numeric", month: "short", year: "numeric",
    });

  return (
    <div className="space-y-2">
      {tareas.map(t => {
        const urg = t.completada ? "proxima" : urgencia(t);
        const est = ESTILOS[urg];
        const loading = loadingId === t.id;
        return (
          <div key={t.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition ${est.row} ${t.completada ? "opacity-60" : ""}`}>

            {/* Estado visual */}
            <div className="mt-0.5 shrink-0">
              {urg === "vencida" && !t.completada
                ? <AlertCircle size={14} className="text-red-500" />
                : <Clock size={14} className="text-zinc-400" />
              }
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium text-zinc-800 ${t.completada ? "line-through" : ""}`}>
                {t.titulo}
              </p>
              {t.descripcion && (
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{t.descripcion}</p>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] text-zinc-400">{fecha(t.fecha_vencimiento)}</span>
                {!t.completada && est.texto && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${est.badge}`}>
                    {est.texto}
                  </span>
                )}
                {t.completada && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-100 text-zinc-400">
                    Completada
                  </span>
                )}
                {t.empresa && (
                  <span className="text-[10px] text-zinc-400 truncate">{t.empresa}</span>
                )}
              </div>
            </div>

            {/* Acciones */}
            {!t.completada && (
              <button
                onClick={() => handleCompletar(t.id)}
                disabled={loading}
                title="Marcar completada"
                className="shrink-0 p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition disabled:opacity-50"
              >
                <Check size={13} />
              </button>
            )}
            <button
              onClick={() => handleEliminar(t.id)}
              disabled={loading}
              title="Eliminar"
              className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:bg-red-100 hover:text-red-500 transition disabled:opacity-50"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
