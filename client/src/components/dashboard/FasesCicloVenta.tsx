/** client/src/components/dashboard/FasesCicloVenta.tsx */
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { getCicloVenta } from "../../services/prospectos.api";
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer, LabelList,
} from "recharts";

interface WaterfallRow {
  name:    string;
  sub:     string;
  offset:  number;
  value:   number;
  fill:    string;
  isTotal: boolean;
}

const TooltipWaterfall = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const row: WaterfallRow = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-zinc-800 mb-0.5">{row.name}</p>
      <p className="text-zinc-500 text-[10px] mb-1">{row.sub}</p>
      <p className="font-bold text-zinc-900">{row.value} días</p>
    </div>
  );
};

export function FasesCicloVenta() {
  const [kpis, setKpis] = useState<{
    promedio_dias:               number | null;
    promedio_contacto_propuesta: number | null;
    promedio_propuesta_cierre:   number | null;
    total_cerrados:              number;
  } | null>(null);

  useEffect(() => {
    getCicloVenta()
      .then(d => setKpis(d.kpis))
      .catch(() => {});
  }, []);

  if (!kpis || kpis.total_cerrados === 0) return null;

  const prosp = kpis.promedio_contacto_propuesta ?? 0;
  const neg   = kpis.promedio_propuesta_cierre   ?? 0;
  const total = kpis.promedio_dias               ?? 0;

  const data: WaterfallRow[] = [
    {
      name:    "Prospección",
      sub:     "contacto → propuesta",
      offset:  0,
      value:   prosp,
      fill:    COLORS.primary,
      isTotal: false,
    },
    {
      name:    "Negociación",
      sub:     "propuesta → cierre",
      offset:  prosp,
      value:   neg,
      fill:    COLORS.mutedDark,
      isTotal: false,
    },
    {
      name:    "Ciclo total",
      sub:     "contacto → cierre",
      offset:  0,
      value:   total,
      fill:    COLORS.dark,
      isTotal: true,
    },
  ];

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <TrendingUp size={14} className="mr-2.5 text-emerald-500" strokeWidth={2} />
        Ciclo de Venta Promedio
      </h2>
      <p className="text-[11px] text-zinc-500 -mt-3 mb-4">
        Basado en {kpis.total_cerrados} venta{kpis.total_cerrados !== 1 ? "s" : ""} cerrada{kpis.total_cerrados !== 1 ? "s" : ""}
      </p>

      {/* ── Waterfall chart ── */}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.surface} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: COLORS.muted }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: COLORS.muted }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v}d`}
            domain={[0, Math.ceil((total + 5) / 10) * 10]}
          />
          <Tooltip content={<TooltipWaterfall />} cursor={{ fill: "#f4f4f5", radius: 6 }} />

          {/* Barra espaciadora invisible */}
          <Bar dataKey="offset" stackId="wf" fill="transparent" legendType="none" isAnimationActive={false} />

          {/* Barra de valor visible */}
          <Bar dataKey="value" stackId="wf" radius={[6, 6, 0, 0]} legendType="none">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: any) => `${v}d`}
              style={{ fontSize: 11, fontWeight: 700, fill: COLORS.dark }}
            />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── KPI tiles resumen ── */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-100">
        {[
          { label: "Prospección", dias: prosp, color: COLORS.primary,   textCls: "text-amber-600" },
          { label: "Negociación", dias: neg,   color: COLORS.mutedDark, textCls: "text-zinc-600"  },
          { label: "Ciclo total", dias: total,  color: COLORS.dark,      textCls: "text-zinc-900"  },
        ].map((f, i) => (
          <div key={i} className="text-center">
            <p className={`text-xl font-bold ${f.textCls}`}>{f.dias}d</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{f.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
