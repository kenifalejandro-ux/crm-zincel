/** client/src/components/finanzas/EgresosPorCategoriaChart.tsx */

import { CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingDown } from "lucide-react";
import type { ResumenFinanciero, CategoriaEgreso } from "../../types/finanzas.types";

const CATEGORIA_LABEL: Record<CategoriaEgreso, string> = {
  publicidad_digital:      "Publicidad",
  herramientas_saas:       "SaaS",
  herramientas_ia:         "IA",
  infraestructura_digital: "Infraest.",
  subcontratos:            "Subcontratos",
};

const CATEGORIA_TONO: Record<CategoriaEgreso, string> = {
  publicidad_digital:      "p1",
  herramientas_saas:       "accent",
  herramientas_ia:         "axis",
  infraestructura_digital: "p1",
  subcontratos:            "accent",
};

const TooltipCustom = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={`${TOOLTIP_BASE} px-3 py-1.5 text-xs`}>
      <p className="font-semibold text-zinc-200">{d.name}</p>
      <p className="text-zinc-400">S/ {Number(d.value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
    </div>
  );
};

const CustomContent = (props: any) => {
  const { x, y, width, height, name, value, fill } = props;
  const tooSmall = width < 40 || height < 28;
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} fill={fill} rx={6} />
      {!tooSmall && (
        <>
          <text
            x={x + width / 2} y={y + height / 2 - 6}
            textAnchor="middle" fill="#fff"
            fontSize={10} fontWeight={700}
          >
            {name}
          </text>
          <text
            x={x + width / 2} y={y + height / 2 + 8}
            textAnchor="middle" fill="rgba(255,255,255,0.75)"
            fontSize={9}
          >
            S/ {Number(value).toLocaleString("es-PE", { maximumFractionDigits: 0 })}
          </text>
        </>
      )}
    </g>
  );
};

interface Props {
  por_categoria: ResumenFinanciero["por_categoria"];
}

export function EgresosPorCategoriaChart({ por_categoria }: Props) {
  const clr = useChartColors();
  const tono: Record<string, string> = { p1: clr.palette[1], accent: clr.accent, axis: clr.axis };
  const data = por_categoria
    .filter(c => Number(c.total) > 0)
    .map(c => ({
      name:  CATEGORIA_LABEL[c.categoria as CategoriaEgreso] ?? c.categoria,
      value: Number(c.total),
      fill:  tono[CATEGORIA_TONO[c.categoria as CategoriaEgreso]] ?? clr.muted,
    }));

  if (!data.length) return null;

  return (
    <div className={CARD_CLASS}>
      <h3 className={HEADER_CLASS}>
        <TrendingDown size={14} className="mr-2.5 text-red-500" strokeWidth={2} />
        Egresos por categoría
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <Treemap
          data={data}
          dataKey="value"
          stroke="transparent"
          content={<CustomContent />}
        >
          <Tooltip content={<TooltipCustom />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
