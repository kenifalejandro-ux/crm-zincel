/** client/src/components/llamadas/KpisLlamadas.tsx */

import { CARD_CLASS } from "../../lib/tokens";
import { Phone, PhoneCall, PhoneMissed } from "lucide-react";


interface Props {
  total: number;
  contestadas: number;
  noContestadas: number;
}

export function KpisLlamadas({ total, contestadas, noContestadas }: Props) {
  const kpis = [
    { label: "Total llamadas",  valor: total,         icon: <Phone      size={18} />, color: "text-zinc-700", bg: "bg-zinc-100" },
    { label: "Contestadas",     valor: contestadas,   icon: <PhoneCall  size={18} />, color: "text-zinc-700", bg: "bg-zinc-100" },
    { label: "No contestadas",  valor: noContestadas, icon: <PhoneMissed size={18} />, color: "text-red-500",  bg: "bg-red-50"  },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {kpis.map((k, i) => (
        <div key={i} className={CARD_CLASS}>
          <div className={`inline-flex p-2 rounded-lg ${k.bg} ${k.color} mb-3`}>
            {k.icon}
          </div>
          <p className="text-2xl font-semibold text-zinc-800">{k.valor}</p>
          <p className="text-xs text-zinc-600 mt-0.5">{k.label}</p>
        </div>
      ))}
    </div>
  );
}
