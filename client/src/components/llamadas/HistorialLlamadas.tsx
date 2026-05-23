/** client/src/components/llamadas/HistorialLlamadas.tsx */

import { PhoneCall, PhoneMissed, Pencil } from "lucide-react";

interface Props {
  llamadas:  any[];
  onEditar?: (l: any) => void;
}

export function HistorialLlamadas({ llamadas, onEditar }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-x-auto max-h-[700px] overflow-y-auto scrollbar-thin">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-zinc-800">Historial de llamadas</h2>
      </div>

      <div className="divide-y divide-gray-50">
        {llamadas.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-600">
            Sin llamadas registradas
          </div>
        ) : (
          llamadas.slice(0, 50).map((l: any) => (
            <div key={l.id} className="px-5 py-3 flex items-center justify-between">
              {/* Icono + info */}
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg ${
                    l.contestada ? "bg-green-50 text-green-600" : "bg-gray-100 text-zinc-600"
                  }`}
                >
                  {l.contestada ? <PhoneCall size={14} /> : <PhoneMissed size={14} />}
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-800">{l.empresa}</p>
                  <p className="text-xs text-zinc-600">{l.nombre_contacto || "Sin contacto"}</p>
                  <p className="text-xs text-zinc-600 capitalize">{l.canal}</p>
                </div>
              </div>

              {/* Fecha + acción */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700">
                    {new Date(l.fecha).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {new Date(l.fecha).toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {onEditar && (
                  <button
                    onClick={() => onEditar(l)}
                    className="text-zinc-700 hover:text-brand transition"
                    title="Editar llamada"
                  >
                    <Pencil size={13} />
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