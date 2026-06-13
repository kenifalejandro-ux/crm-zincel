/** client/src/components/finanzas/IngresosPorServicioChart.tsx */

import { COLORS, CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE } from "../../lib/tokens";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { DollarSign } from "lucide-react";
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
    <div className={`${TOOLTIP_BASE} px-3 py-1.5 text-xs`}>
      <p className="font-medium text-zinc-300">{label}</p>
      <p className="text-zinc-400">S/ {Number(payload[0].value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
    </div>
  );
};

const COLORES = [COLORS.primary, COLORS.dark, COLORS.mutedDark, COLORS.primary, COLORS.dark, COLORS.mutedDark, COLORS.primary];

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
    <div className={CARD_CLASS}>
      <h3 className={HEADER_CLASS}>
        <DollarSign size={14} className="mr-2.5 text-emerald-500" strokeWidth={2} />
        Ingresos por tipo de servicio
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.surface} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: COLORS.muted }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: COLORS.muted }} tickLine={false} axisLine={false}
            tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<TooltipCustom />} />
          <Bar filter="url(#neon-glow)" dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
            <LabelList dataKey="total" position="top" style={{ fontSize: 9, fill: "#52525b", fontWeight: 600 }} formatter={(v: any) => `S/${(Number(v)/1000).toFixed(0)}k`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
