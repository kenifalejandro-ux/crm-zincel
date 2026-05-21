/** client/src/components/dashboard/TasaConversion.tsx */

import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { Target } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

export function TasaConversion({ metricas }: Props) {
  const tasa        = Math.min(metricas.tasa_conversion ?? 0, 100);
  const total       = metricas.prospectos.total_prospectos;
  const interesados = metricas.prospectos.prospectos_interesados;

  const color =
    tasa >= 30 ? "#22c55e" :
    tasa >= 15 ? "#f59e0b" :
    "#ef4444";

  const label =
    tasa >= 30 ? "Excelente" :
    tasa >= 15 ? "Regular" :
    "Por mejorar";

  const data = [{ value: tasa }];

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Target size={14} className="text-zinc-400" />
        <p className="text-sm font-semibold text-zinc-800">Tasa de Conversión</p>
      </div>

      {/* Gauge semicircular */}
      <div className="relative" style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="85%"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={data}
            barSize={14}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={8}
              background={{ fill: "#f4f4f5" }}
              fill={color}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Texto central */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 pointer-events-none">
          <span className="text-3xl font-bold leading-none" style={{ color }}>
            {tasa}%
          </span>
          <span className="text-[10px] font-medium mt-0.5" style={{ color }}>
            {label}
          </span>
        </div>
      </div>

      {/* Detalle */}
      <div className="space-y-1.5 mt-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-500">Interesados</span>
          <span className="font-semibold text-green-600">{interesados}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-500">Total prospectos</span>
          <span className="font-semibold text-zinc-700">{total}</span>
        </div>

        {/* Escala referencia */}
        <div className="flex justify-between text-[9px] text-zinc-300 pt-1">
          <span>0%</span>
          <span className="text-yellow-400">15%</span>
          <span className="text-green-400">30%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
