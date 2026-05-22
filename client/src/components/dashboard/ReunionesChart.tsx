/** client/src/components/dashboard/ReunionesChart.tsx */
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Video } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";


const REUNIONES_ITEMS = [
  { label: "Programadas",   key: "reuniones_programadas",   color: COLORS.primary },
  { label: "Realizadas",    key: "reuniones_realizadas",    color: COLORS.dark },
  { label: "Canceladas",    key: "reuniones_canceladas",    color: "#e4e4e7" },
  { label: "Reprogramadas", key: "reuniones_reprogramadas", color: COLORS.muted },
];

interface Props {
  metricas: Metricas;
}

export function ReunionesChart({ metricas }: Props) {
  const datos = REUNIONES_ITEMS
    .map(item => ({
      name:  item.label,
      value: (metricas.reuniones as any)[item.key],
      color: item.color,
    }))
    .filter(d => d.value > 0);

  const datosGrafico = datos.length > 0
    ? datos
    : [{ name: "Sin datos", value: 1, color: COLORS.surface }];

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <Video size={14} className="mr-2.5 text-zinc-400" strokeWidth={2} />
        Reuniones
      </h2>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie data={datosGrafico} cx="50%" cy="50%"
                innerRadius={35} outerRadius={46} paddingAngle={2}
                dataKey="value" stroke="none">
                {datosGrafico.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-light tracking-tighter text-zinc-900">
              {metricas.reuniones.total_reuniones}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {REUNIONES_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[12px] font-medium text-zinc-500">{item.label}</span>
              </div>
              <span className="text-[13px] font-semibold text-zinc-900">
                {(metricas.reuniones as any)[item.key]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}