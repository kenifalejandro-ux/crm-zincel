/** client/src/components/dashboard/TasaConversion.tsx */
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Target } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";


interface Props {
  metricas: Metricas;
}

export function TasaConversion({ metricas }: Props) {
  const tasa        = Math.min(metricas.tasa_conversion ?? 0, 100);
  const total       = metricas.prospectos.total_prospectos;
  const interesados = metricas.prospectos.prospectos_interesados;

  const color = COLORS.primary; // Amarillo mate/oro
  const label =
    tasa >= 30 ? "Óptimo" :
    tasa >= 15 ? "Regular" :
    "Por mejorar";

  const data = [{ value: tasa }];

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <Target size={14} className="mr-2.5 text-amber-500" strokeWidth={2} />
        Tasa de Conversión
      </h2>

      <div className="relative mt-2" style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="85%"
            innerRadius="75%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={data}
            barSize={12}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: COLORS.surface }}
              fill={color}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 pointer-events-none">
          <span className="text-3xl font-light tracking-tighter text-zinc-900 leading-none">
            {tasa}%
          </span>
          <span className="text-[11px] font-semibold text-zinc-600 mt-2 uppercase tracking-wide">
            {label}
          </span>
        </div>
      </div>

      <div className="space-y-3 mt-6 pt-5 border-t border-zinc-100/60">
        <div className="flex justify-between items-center">
          <span className="text-[12px] font-medium text-zinc-700">Interesados</span>
          <span className="text-[13px] font-semibold text-zinc-900">{interesados}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[12px] font-medium text-zinc-700">Total prospectos</span>
          <span className="text-[13px] font-semibold text-zinc-900">{total}</span>
        </div>

        <div className="flex justify-between text-[10px] font-medium text-zinc-600 pt-2 px-1">
          <span>0%</span>
          <span>15%</span>
          <span>30%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}