/** client/src/components/reuniones/KpisReuniones.tsx */

import { CARD_CLASS } from "../../lib/tokens";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";


interface Props {
  total:        number;
  programadas:  number;
  realizadas:   number;
  canceladas:   number;
}

export function KpisReuniones({ total, programadas, realizadas, canceladas }: Props) {
  const kpis = [
    { label: "Total reuniones", valor: total,       icon: <Calendar    size={18} />, color: "text-zinc-700", bg: "bg-zinc-100" },
    { label: "Programadas",     valor: programadas,  icon: <Clock       size={18} />, color: "text-zinc-700", bg: "bg-zinc-100" },
    { label: "Realizadas",      valor: realizadas,   icon: <CheckCircle size={18} />, color: "text-zinc-700", bg: "bg-zinc-100" },
    { label: "Canceladas",      valor: canceladas,   icon: <XCircle     size={18} />, color: "text-red-500",  bg: "bg-red-50"  },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {kpis.map((k, i) => (
        <div key={i} className={CARD_CLASS}>
          <div className={`inline-flex p-2 rounded-lg ${k.bg} ${k.color} mb-3`}>
            {k.icon}
          </div>
          <p className="text-2xl font-semibold text-zinc-800">{k.valor}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{k.label}</p>
        </div>
      ))}
    </div>
  );
}
