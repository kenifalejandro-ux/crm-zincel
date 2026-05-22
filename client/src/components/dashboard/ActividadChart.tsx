/** client/src/components/dashboard/ActividadChart.tsx */
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";


interface Props {
  metricas: Metricas;
}

export function ActividadChart({ metricas }: Props) {
  const datos = [
    { name: "Llamadas",  llamadas: metricas.llamadas.llamadas_mes,    brochures: 0,                              reuniones: 0 },
    { name: "Brochures", llamadas: 0,                                  brochures: metricas.brochures.brochures_mes, reuniones: 0 },
    { name: "Reuniones", llamadas: 0,                                  brochures: 0,                              reuniones: metricas.reuniones.reuniones_mes },
  ].filter(d => d.llamadas > 0 || d.brochures > 0 || d.reuniones > 0);

  return (
    <div className={`${CARD_CLASS} xl:col-span-3`}>
      <h2 className={HEADER_CLASS}>
        <TrendingUp size={14} className="mr-2.5 text-zinc-400" strokeWidth={2} />
        Actividad del Período
      </h2>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={datos} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.surface} vertical={false} />
          <XAxis dataKey="name" fontSize={11} tick={{ fill: COLORS.muted }} axisLine={false} tickLine={false} dy={10} />
          <YAxis fontSize={11} tick={{ fill: COLORS.muted }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: '#fafafa' }}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              fontSize: "12px",
              color: "#18181b"
            }}
            itemStyle={{ color: "#52525b", fontWeight: 500 }}
          />
          <Bar dataKey="llamadas"  stackId="a" fill={COLORS.dark} radius={[2, 2, 0, 0]} maxBarSize={40} />
          <Bar dataKey="brochures" stackId="a" fill="#e4e4e7" radius={[2, 2, 0, 0]} maxBarSize={40} />
          <Bar dataKey="reuniones" stackId="a" fill={COLORS.primary} radius={[2, 2, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-6">
        {[
          { label: "Llamadas",  color: COLORS.dark },
          { label: "Brochures", color: "#e4e4e7" },
          { label: "Reuniones", color: COLORS.primary },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}