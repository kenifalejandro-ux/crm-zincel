/** client/src/components/brochures/KpisBrochures.tsx */

import { Send, Mail, MessageCircle } from "lucide-react";

interface CanalItem {
  canal: string;
  total: number;
}

interface Props {
  total:   number;
  canales: CanalItem[];
}

const CANAL_ICON: Record<string, JSX.Element> = {
  correo:    <Mail          size={18} />,
  whatsapp:  <MessageCircle size={18} />,
  instagram: <Send          size={18} />,
};

const CANAL_COLOR: Record<string, { color: string; bg: string }> = {
  correo:    { color: "text-blue-600",   bg: "bg-blue-50"   },
  whatsapp:  { color: "text-green-600",  bg: "bg-green-50"  },
  instagram: { color: "text-pink-600",   bg: "bg-pink-50"   },
};

export function KpisBrochures({ total, canales }: Props) {
  const items = [
    { label: "Total envíos", valor: total, icon: <Send size={18} />, color: "text-amber-600", bg: "bg-amber-50" },
    ...canales.map((c) => ({
      label: c.canal.charAt(0).toUpperCase() + c.canal.slice(1),
      valor: c.total,
      icon:  CANAL_ICON[c.canal]  ?? <Send size={18} />,
      color: CANAL_COLOR[c.canal]?.color ?? "text-zinc-600",
      bg:    CANAL_COLOR[c.canal]?.bg    ?? "bg-zinc-50",
    })),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.slice(0, 4).map((k, i) => (
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
