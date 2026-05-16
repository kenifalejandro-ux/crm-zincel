/**client/src/components/dashboard/ProximasReuniones.tsx */

import { CalendarDays } from "lucide-react";

interface Props {
  reuniones: any[];
}

export function ProximasReuniones({ reuniones }: Props) {
  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-zinc-800 mb-4 flex items-center">
        <CalendarDays size={16} className="mr-2" />
        Próximas reuniones
      </h2>
      {reuniones.length === 0 ? (
        <p className="text-xs text-zinc-800 text-center py-6">No hay reuniones programadas</p>
      ) : (
        <div className="space-y-3">
          {reuniones.map(r => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-xs font-medium text-zinc-800">{r.titulo}</p>
                <p className="text-xs text-zinc-800">{r.empresa} · {r.modalidad}</p>
              </div>
              <p className="text-xs text-zinc-800">
                {new Date(r.fecha_hora).toLocaleDateString("es-PE", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}