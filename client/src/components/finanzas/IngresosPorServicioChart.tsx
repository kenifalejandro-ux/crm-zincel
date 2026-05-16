/** client/src/components/finanzas/IngresosPorServicioChart.tsx */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { ResumenFinanciero, TipoServicio } from "../../types/finanzas.types";

const TIPO_LABEL: Record<TipoServicio, string> = {
  desarrollo_web:    "Desarrollo web",
  wordpress:         "WordPress",
  diseño_marketing:  "Diseño & Mkt.",
  redes_sociales:    "Redes sociales",
  publicidad_digital:"Publicidad",
  erp:               "ERP",
  crm:               "CRM",
  otro:              "Otro",
};

const TooltipCustom = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow px-3 py-1.5 text-xs">
      <p className="font-medium text-zinc-700">{label}</p>
      <p className="text-green-600">S/ {Number(payload[0].value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
    </div>
  );
};

const COLORES = ["#3b82f6", "#22c55e", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6b7280"];

interface Props {
  por_servicio: ResumenFinanciero["por_servicio"];
}

export function IngresosPorServicioChart({ por_servicio }: Props) {
  const data = por_servicio
    .filter((s) => Number(s.total) > 0)
    .map((s) => ({
      name:  TIPO_LABEL[s.tipo_servicio as TipoServicio] ?? s.tipo_servicio,
      total: Number(s.total),
    }));

  if (!data.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-semibold text-zinc-800 mb-4">Ingresos por tipo de servicio</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<TooltipCustom />} />
          <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
