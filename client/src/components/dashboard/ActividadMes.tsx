/**client/src/components/dashboard/ActividadMes.tsx */

import { TrendingUp } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

export function ActividadMes({ metricas }: Props) {
  const items = [
    { label: "Llamadas realizadas",    valor: metricas.llamadas.llamadas_mes },
    { label: "Brochures enviados",     valor: metricas.brochures.brochures_mes },
    { label: "Reuniones programadas",  valor: metricas.reuniones.reuniones_mes },
    { label: "Nuevos prospectos",      valor: metricas.prospectos.prospectos_mes },
  ];

  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-zinc-800 mb-4 flex items-center">
        <TrendingUp size={16} className="mr-2" />
        Actividad del Mes
      </h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-xs gray-100">{item.label}</span>
            <span className="text-xs font-medium text-zinc-800">{item.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}