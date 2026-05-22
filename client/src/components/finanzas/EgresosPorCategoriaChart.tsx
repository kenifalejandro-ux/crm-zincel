/** client/src/components/finanzas/EgresosPorCategoriaChart.tsx */

import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown } from "lucide-react";
import type { ResumenFinanciero, CategoriaEgreso } from "../../types/finanzas.types";


const CATEGORIA_LABEL: Record<CategoriaEgreso, string> = {
  publicidad_digital:      "Publicidad digital",
  herramientas_saas:       "Herramientas & SaaS",
  herramientas_ia:         "Herramientas IA",
  infraestructura_digital: "Infraestructura",
  subcontratos:            "Subcontratos",
};

const COLORES: Record<CategoriaEgreso, string> = {
  publicidad_digital:      COLORS.dark,
  herramientas_saas:       COLORS.primary,
  herramientas_ia:         COLORS.muted,
  infraestructura_digital: COLORS.mutedLight,
  subcontratos:            COLORS.mutedDark,
};

const TooltipCustom = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm px-3 py-1.5 text-xs">
      <p className="font-medium text-zinc-700">{name}</p>
      <p className="text-zinc-500">S/ {Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
    </div>
  );
};

interface Props {
  por_categoria: ResumenFinanciero["por_categoria"];
}

export function EgresosPorCategoriaChart({ por_categoria }: Props) {
  const data = por_categoria
    .filter((c) => Number(c.total) > 0)
    .map((c) => ({
      name:  CATEGORIA_LABEL[c.categoria as CategoriaEgreso] ?? c.categoria,
      value: Number(c.total),
      color: COLORES[c.categoria as CategoriaEgreso] ?? COLORS.muted,
    }));

  if (!data.length) return null;

  return (
    <div className={CARD_CLASS}>
      <h3 className={HEADER_CLASS}>
        <TrendingDown size={14} className="mr-2.5 text-zinc-400" strokeWidth={2} />
        Egresos por categoría
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name"
            cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<TooltipCustom />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
