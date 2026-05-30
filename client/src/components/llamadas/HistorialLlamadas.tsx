/** client/src/components/llamadas/HistorialLlamadas.tsx */

import { PhoneCall, PhoneMissed, Pencil, Trash2 } from "lucide-react";

interface Props {
  llamadas:          any[];
  seleccionados?:    string[];
  onToggle?:         (id: string) => void;
  onToggleTodos?:    () => void;
  onEditar?:         (l: any) => void;
  onEliminar?:       (id: string) => void;
  onVerProspecto?:   (prospecto_id: string) => void;
}

export function HistorialLlamadas({
  llamadas, seleccionados = [], onToggle, onToggleTodos, onEditar, onEliminar, onVerProspecto,
}: Props) {
  const todosSeleccionados = llamadas.length > 0 && seleccionados.length === llamadas.length;
  const mostrarCheck = !!onToggle;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-x-auto max-h-[700px] overflow-y-auto scrollbar-thin">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
        {mostrarCheck && (
          <input type="checkbox" checked={todosSeleccionados}
            onChange={onToggleTodos}
            className="rounded border-gray-300 accent-brand" />
        )}
        <h2 className="text-xs font-semibold text-zinc-800">Historial de llamadas</h2>
      </div>

      <div className="divide-y divide-gray-50">
        {llamadas.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-600">
            Sin llamadas registradas
          </div>
        ) : (
          llamadas.slice(0, 50).map((l: any) => (
            <div key={l.id} className="px-5 py-3 flex items-center gap-3">
              {mostrarCheck && (
                <input type="checkbox"
                  checked={seleccionados.includes(l.id)}
                  onChange={() => onToggle!(l.id)}
                  className="rounded border-gray-300 accent-brand shrink-0" />
              )}

              {/* Icono + info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${l.contestada ? "bg-green-50 text-green-600" : "bg-gray-100 text-zinc-600"}`}>
                  {l.contestada ? <PhoneCall size={14} /> : <PhoneMissed size={14} />}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-medium text-zinc-800 truncate ${onVerProspecto && l.prospecto_id ? "cursor-pointer hover:text-brand hover:underline transition-colors" : ""}`}
                    onClick={() => onVerProspecto && l.prospecto_id && onVerProspecto(l.prospecto_id)}
                  >
                    {l.empresa}
                  </p>
                  <p className="text-xs text-zinc-600">{l.nombre_contacto || "Sin contacto"}</p>
                  <p className="text-xs text-zinc-600 capitalize">{l.canal}</p>
                </div>
              </div>

              {/* Fecha + acciones */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700">
                    {new Date(l.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {new Date(l.fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {onEditar && (
                  <button onClick={() => onEditar(l)}
                    className="text-zinc-400 hover:text-brand transition p-1" title="Editar">
                    <Pencil size={13} />
                  </button>
                )}
                {onEliminar && (
                  <button onClick={() => onEliminar(l.id)}
                    className="text-zinc-400 hover:text-red-500 transition p-1" title="Eliminar">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {llamadas.length > 50 && (
          <div className="px-5 py-3 text-center text-xs text-zinc-600">
            Mostrando 50 de {llamadas.length} llamadas
          </div>
        )}
      </div>
    </div>
  );
}
