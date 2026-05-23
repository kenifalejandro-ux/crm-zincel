/** client/src/components/dashboard/ActividadMes.tsx */
import { CARD_CLASS, HEADER_CLASS, COLORS } from "../../lib/tokens";
import { TrendingUp } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis,
  Radar, ResponsiveContainer, Tooltip,
} from "recharts";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

const TooltipRadar = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm px-3 py-1.5 text-xs">
      <p className="font-semibold text-zinc-800">{d.subject}</p>
      <p className="text-zinc-600">{d.raw}</p>
    </div>
  );
};

export function ActividadMes({ metricas }: Props) {
  const raw = [
    { subject: "Llamadas",   raw: metricas.llamadas.llamadas_mes },
    { subject: "Brochures",  raw: metricas.brochures.brochures_mes },
    { subject: "Reuniones",  raw: metricas.reuniones.reuniones_mes },
    { subject: "Prospectos", raw: metricas.prospectos.prospectos_mes },
  ];

  const maxVal = Math.max(...raw.map(d => d.raw), 1);
  const data = raw.map(d => ({
    ...d,
    value: Math.round((d.raw / maxVal) * 100),
  }));

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <TrendingUp size={14} className="mr-2.5 text-emerald-500" strokeWidth={2} />
        Actividad del Mes
      </h2>

      <div className="flex items-center gap-2">
        <div className="shrink-0" style={{ width: 150, height: 150 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <PolarGrid stroke="#e4e4e7" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 9, fill: "#71717a", fontWeight: 500 }}
              />
              <Radar
                name="Mes"
                dataKey="value"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip content={<TooltipRadar />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {raw.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-700">{item.subject}</span>
              <span className="text-[15px] font-bold text-zinc-900">{item.raw}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
