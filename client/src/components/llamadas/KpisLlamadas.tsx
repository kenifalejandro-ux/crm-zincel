/** client/src/components/llamadas/KpisLlamadas.tsx */

import { Phone, PhoneCall, PhoneMissed } from "lucide-react";

interface Props {
  total: number;
  contestadas: number;
  noContestadas: number;
}

export function KpisLlamadas({ total, contestadas, noContestadas }: Props) {
  const kpis = [
    {
      label: "Total llamadas",
      valor: total,
      icon: <Phone size={18} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Contestadas",
      valor: contestadas,
      icon: <PhoneCall size={18} />,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "No contestadas",
      valor: noContestadas,
      icon: <PhoneMissed size={18} />,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {kpis.map((k, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
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