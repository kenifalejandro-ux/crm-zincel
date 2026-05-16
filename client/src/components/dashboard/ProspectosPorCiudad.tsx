/**client/src/components/dashboard/ProspectosPorCiudad.tsx */

import { MapPin } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

const COLORES = [
  "bg-blue-500", "bg-purple-500", "bg-amber-500",
  "bg-green-500", "bg-red-400", "bg-pink-500",
  "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-cyan-500",
];

export function ProspectosPorCiudad({ metricas }: Props) {
  const datos = metricas.prospectos_por_ciudad ?? [];
  const total = datos.reduce((acc, d) => acc + d.total, 0);

  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-zinc-800 mb-4 flex items-center">
        <MapPin size={16} className="mr-2" />
        Prospectos por Ciudad
      </h2>

      {datos.length === 0 ? (
        <p className="text-xs text-zinc-800 text-center py-6">Sin datos</p>
      ) : (
        <div className="space-y-2.5">
          {datos.slice(0, 8).map((item, i) => {
            const pct = total > 0 ? Math.round((item.total / total) * 100) : 0;
            return (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs gray-100 capitalize">{item.ciudad}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-800">{item.total}</span>
                    <span className="text-xs text-zinc-800">({pct}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`${COLORES[i % COLORES.length]} h-1.5 rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between">
        <span className="text-xs text-zinc-800">Total</span>
        <span className="text-xs font-semibold text-zinc-800">{total}</span>
      </div>
    </div>
  );
}