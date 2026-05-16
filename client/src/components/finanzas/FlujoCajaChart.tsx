/** client/src/components/finanzas/FlujoCajaChart.tsx */

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { ResumenFinanciero } from "../../types/finanzas.types";

const TooltipCustom = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-zinc-700 mb-1">{label}</p>
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
  if (!flujo?.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-semibold text-zinc-800 mb-4">Flujo de caja — últimos 6 meses</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={flujo} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEgresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<TooltipCustom />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="ingresos" name="Ingresos"
            stroke="#22c55e" strokeWidth={2} fill="url(#gradIngresos)" />
          <Area type="monotone" dataKey="egresos" name="Egresos"
            stroke="#ef4444" strokeWidth={2} fill="url(#gradEgresos)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
