/**client/src/components/dashboard/TasaConversion.tsx */

import { Target } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

export function TasaConversion({ metricas }: Props) {
  const tasa = metricas.tasa_conversion ?? 0;
  const total = metricas.prospectos.total_prospectos;
  const interesados = metricas.prospectos.prospectos_interesados;

  const color =
    tasa >= 30 ? "text-green-600" :
    tasa >= 15 ? "text-yellow-600" :
    "text-red-500";

  const bgBar =
    tasa >= 30 ? "bg-green-500" :
    tasa >= 15 ? "bg-yellow-500" :
    "bg-red-400";

  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-zinc-800 mb-4 flex items-center">
        <Target size={16} className="mr-2" />
        Tasa de Conversión
      </h2>

      {/* Número grande */}
      <div className="flex items-end gap-2 mb-4">
        <span className={`text-4xl font-bold ${color}`}>{tasa}%</span>
        <span className="text-xs text-zinc-800 mb-1">de interés</span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
        <div
          className={`${bgBar} h-2 rounded-full transition-all`}
          style={{ width: `${Math.min(tasa, 100)}%` }}
        />
      </div>

      {/* Detalle */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-800">Interesados</span>
          <span className="text-xs font-semibold text-green-600">{interesados}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-800">Total prospectos</span>
          <span className="text-xs font-semibold text-zinc-800">{total}</span>
        </div>
      </div>
    </div>
  );
}