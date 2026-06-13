/** client/src/components/dashboard/ActividadHoy.tsx */
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { Target } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

const NOMBRES = ["Prospectos", "Reuniones", "Brochures", "Llamadas", "Propuestas"];

export function ActividadHoy({ metricas }: Props) {
  const c = useChartColors();
  const fills = [c.accent, c.palette[3], c.muted, c.palette[1], c.success];
  const valores = [
    metricas.prospectos.prospectos_hoy,
    metricas.reuniones.reuniones_hoy,
    metricas.brochures.brochures_hoy,
    metricas.llamadas.llamadas_hoy,
    metricas.propuestas?.propuestas_hoy ?? 0,
  ];
  const maxVal = Math.max(...valores, 1);

  const data = NOMBRES.map((name, i) => ({
    name,
    value: valores[i],
    fill:  fills[i],
  }));

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <Target size={14} className="mr-2.5 text-orange-500" strokeWidth={2} />
        Actividad de Hoy
      </h2>

      <div className="flex items-center gap-2">
        <div className="shrink-0" style={{ width: 150, height: 150 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius={18}
              outerRadius={70}
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, maxVal]} angleAxisId={0} tick={false} />
              <RadialBar filter="url(#neon-glow)"
                background={{ fill: "#f4f4f5" }}
                dataKey="value"
                cornerRadius={5}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                <span className="text-[12px] font-medium text-zinc-300">{item.name}</span>
              </div>
              <span className="text-[15px] font-bold text-zinc-100">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
