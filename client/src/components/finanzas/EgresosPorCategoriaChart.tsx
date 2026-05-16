/** client/src/components/finanzas/EgresosPorCategoriaChart.tsx */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ResumenFinanciero, CategoriaEgreso } from "../../types/finanzas.types";

const CATEGORIA_LABEL: Record<CategoriaEgreso, string> = {
  publicidad_digital:      "Publicidad digital",
  herramientas_saas:       "Herramientas & SaaS",
  herramientas_ia:         "Herramientas IA",
  infraestructura_digital: "Infraestructura",
  subcontratos:            "Subcontratos",
};

const COLORES: Record<CategoriaEgreso, string> = {
  publicidad_digital:      "#3b82f6",
  herramientas_saas:       "#8b5cf6",
  herramientas_ia:         "#06b6d4",
  infraestructura_digital: "#f59e0b",
  subcontratos:            "#10b981",
};

const TooltipCustom = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow px-3 py-1.5 text-xs">
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
      color: COLORES[c.categoria as CategoriaEgreso] ?? "#6b7280",
    }));

  if (!data.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-semibold text-zinc-800 mb-4">Egresos por categoría</h3>
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
