/** client/src/components/finanzas/FlujoCajaChart.tsx */

import { CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { ResumenFinanciero } from "../../types/finanzas.types";


const TooltipCustom = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${TOOLTIP_BASE} px-3 py-2 text-xs`}>
      <p className="font-medium text-zinc-300 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: S/ {Number(p.value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

interface Props {
  flujo: ResumenFinanciero["flujo_mensual"];
}

export function FlujoCajaChart({ flujo }: Props) {
  const c = useChartColors();           // ← colores vivos
  if (!flujo?.length) return null;

  return (
    <div className={CARD_CLASS}>
      <h3 className={HEADER_CLASS}>
        <TrendingUp size={14} className="mr-2.5 text-emerald-500" strokeWidth={2} />
        Flujo de caja — últimos 6 meses
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={flujo} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={c.accent} stopOpacity={0.35} />
              <stop offset="95%" stopColor={c.accent} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="gradEgresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={c.danger} stopOpacity={0.35} />
              <stop offset="95%" stopColor={c.danger} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: c.axis }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: c.axis }} tickLine={false} axisLine={false}
            tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<TooltipCustom />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area filter="url(#neon-glow)" type="monotone" dataKey="ingresos" name="Ingresos" stackId="flujo"
            stroke={c.accent} strokeWidth={2} fill="url(#gradIngresos)" />
          <Area filter="url(#neon-glow)" type="monotone" dataKey="egresos"  name="Egresos"  stackId="flujo"
            stroke={c.danger} strokeWidth={2} fill="url(#gradEgresos)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
