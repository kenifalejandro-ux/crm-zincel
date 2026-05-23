/** client/src/components/dashboard/ProximasReuniones.tsx */
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { CalendarDays } from "lucide-react";


interface Props {
  reuniones: any[];
}

export function ProximasReuniones({ reuniones }: Props) {
  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <CalendarDays size={14} className="mr-2.5 text-indigo-500" strokeWidth={2} />
        Próximas reuniones
      </h2>
      {reuniones.length === 0 ? (
        <p className="text-[12px] text-zinc-600 text-center py-6 font-medium">No hay reuniones programadas</p>
      ) : (
        <div className="space-y-1">
          {reuniones.map((r, i) => (
            <div key={r.id || i} className="flex items-center justify-between py-3 border-b border-zinc-100/50 last:border-0">
              <div>
                <p className="text-[13px] font-semibold text-zinc-900 mb-0.5">{r.titulo}</p>
                <p className="text-[11px] text-zinc-700 uppercase tracking-wide">{r.empresa} <span className="mx-1">·</span> {r.modalidad}</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-medium text-zinc-900">
                  {new Date(r.fecha_hora).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                </p>
                <p className="text-[11px] text-zinc-600">
                  {new Date(r.fecha_hora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}