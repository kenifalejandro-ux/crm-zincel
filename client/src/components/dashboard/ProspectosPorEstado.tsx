/**client/src/components/dashboard/ProspectosPorEstado.tsx */

import { Users } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

const ESTADOS: Array<{ key: keyof Metricas["prospectos"]; label: string; color: string; bg: string }> = [
  { key: "prospectos_interesados",     label: "Interesado",       color: "bg-green-500",  bg: "bg-green-50"  },
  { key: "prospectos_no_interesados",  label: "No interesado",    color: "bg-red-400",    bg: "bg-red-50"    },
  { key: "prospectos_no_contesta",     label: "No contesta",      color: "bg-gray-400",   bg: "bg-gray-50"   },
  { key: "prospectos_volver_llamar",   label: "Volver a llamar",  color: "bg-yellow-400", bg: "bg-yellow-50" },
  { key: "prospectos_buzon",           label: "Buzón de voz",     color: "bg-orange-400", bg: "bg-orange-50" },
  { key: "prospectos_tiene_proveedor", label: "Ya tiene proveedor", color: "bg-purple-400", bg: "bg-purple-50" },
];

export function ProspectosPorEstado({ metricas }: Props) {
  const total = metricas.prospectos.total_prospectos;

  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-zinc-800 mb-4 flex items-center">
        <Users size={16} className="mr-2" />
        Prospectos por Estado
      </h2>

      <div className="space-y-2.5">
        {ESTADOS.map((item, i) => {
          const valor = metricas.prospectos[item.key] as number;
          const pct   = total > 0 ? Math.round((valor / total) * 100) : 0;

          return (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs gray-100">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-800">{valor}</span>
                  <span className="text-xs text-zinc-800">({pct}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`${item.color} h-1.5 rounded-full transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between">
        <span className="text-xs text-zinc-800">Total prospectos</span>
        <span className="text-xs font-semibold text-zinc-800">{total}</span>
      </div>
    </div>
  );
}