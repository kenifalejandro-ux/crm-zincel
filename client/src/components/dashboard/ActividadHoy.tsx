/** client/src/components/dashboard/ActividadHoy.tsx */
import { CARD_CLASS, HEADER_CLASS, COLORS } from "../../lib/tokens";
import { Target } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

const ITEMS = [
  { name: "Prospectos", fill: COLORS.primary      },
  { name: "Reuniones",  fill: COLORS.primaryHover },
  { name: "Brochures",  fill: COLORS.muted        },
  { name: "Llamadas",   fill: COLORS.dark         },
  { name: "Propuestas", fill: COLORS.success      },
];

export function ActividadHoy({ metricas }: Props) {
  const valores = [
    metricas.prospectos.prospectos_hoy,
    metricas.reuniones.reuniones_hoy,
    metricas.brochures.brochures_hoy,
    metricas.llamadas.llamadas_hoy,
    metricas.propuestas?.propuestas_hoy ?? 0,
  ];
  const maxVal = Math.max(...valores, 1);

  const data = ITEMS.map((item, i) => ({
    name:  item.name,
    value: valores[i],
    fill:  item.fill,
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
              <RadialBar
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
                <span className="text-[12px] font-medium text-zinc-700">{item.name}</span>
              </div>
              <span className="text-[15px] font-bold text-zinc-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
