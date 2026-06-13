/** client/src/components/inteligencia/ForecastHistoricoChart.tsx */

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { accentRgb } from "../../lib/chartTheme";
import { getForecastHistorico, getForecast } from "../../services/inteligencia.api";
import type { ForecastHistoricoMes } from "../../services/inteligencia.api";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function fmt(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(1)}k`;
  if (n > 0)          return `S/ ${Math.round(n)}`;
  return "S/ —";
}

interface ChartRow {
  label:      string;
  cerrado:    number;
  proyectado: number;
  isActual:   boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ChartRow;
  return (
    <div className="bg-slate-800/60 border border-white/8 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-zinc-300 mb-1">{label}</p>
      {row.isActual ? (
        <>
          {row.cerrado > 0 && <p className="text-zinc-500">Cerrado: <span className="font-bold text-zinc-100">{fmt(row.cerrado)}</span></p>}
          <p className="text-zinc-500">Proyectado: <span className="font-bold" style={{ color: accentRgb() }}>{fmt(row.proyectado)}</span></p>
        </>
      ) : (
        <p className="text-zinc-500">Cerrado: <span className="font-bold text-zinc-100">{fmt(row.cerrado)}</span></p>
      )}
    </div>
  );
}

export function ForecastHistoricoChart() {
  const c = useChartColors();
  const [rows,      setRows]      = useState<ForecastHistoricoMes[]>([]);
  const [proyeccion, setProyeccion] = useState(0);
  const [cargando,   setCargando]   = useState(true);

  useEffect(() => {
    Promise.all([getForecastHistorico(), getForecast()])
      .then(([h, f]) => {
        setRows(h);
        setProyeccion(f.escenario_realista);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return null;
  if (!rows.length) return null;

  const hoy      = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const chartData: ChartRow[] = rows.map(r => ({
    label:      MESES[parseInt(r.mes.split("-")[1]) - 1],
    cerrado:    r.mes === mesActual ? 0 : r.cerrado,
    proyectado: r.mes === mesActual ? proyeccion : 0,
    isActual:   r.mes === mesActual,
  }));

  // Promedio de meses anteriores con al menos un cierre
  const mesesPrevios = rows.filter(r => r.mes !== mesActual && r.cerrado > 0);
  const promedio = mesesPrevios.length > 0
    ? mesesPrevios.reduce((s, r) => s + r.cerrado, 0) / mesesPrevios.length
    : 0;

  const maxVal = Math.max(...chartData.map(d => Math.max(d.cerrado, d.proyectado)), 1);

  const tickFmt = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000   ? `${(v / 1_000).toFixed(0)}k`
    : `${v}`;

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-800">
            <TrendingUp size={14} className="text-zinc-400" />
          </div>
          <div>
            <h3 className={HEADER_CLASS}>Histórico de ingresos cerrados</h3>
            <p className="text-[11px] text-zinc-500">Últimos 6 meses · mes actual = proyección realista</p>
          </div>
        </div>
        {promedio > 0 && (
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-zinc-200">{fmt(promedio)}</p>
            <p className="text-[10px] text-zinc-400">promedio mensual</p>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barCategoryGap="35%" barGap={3}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            axisLine={false} tickLine={false}
            tickFormatter={tickFmt}
            width={38}
            domain={[0, maxVal * 1.15]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f4f5", radius: 6 }} />
          {promedio > 0 && (
            <ReferenceLine
              y={promedio}
              stroke={c.accent}
              strokeDasharray="5 4"
              strokeWidth={1.5}
            />
          )}
          {/* Barras de meses anteriores (cerrado real) */}
          <Bar filter="url(#neon-glow)" dataKey="cerrado" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={c.palette[1]} fillOpacity={entry.isActual ? 0 : 1} />
            ))}
          </Bar>
          {/* Barra del mes actual (proyectado) */}
          <Bar filter="url(#neon-glow)" dataKey="proyectado" radius={[6, 6, 0, 0]} maxBarSize={44} fill={c.accent} fillOpacity={0.75} />
        </BarChart>
      </ResponsiveContainer>

      {/* Leyenda */}
      <div className="flex items-center gap-5 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded-sm" style={{ backgroundColor: c.palette[1] }} />
          <span className="text-[10px] text-zinc-500">Cerrado real</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded-sm opacity-75" style={{ backgroundColor: c.accent }} />
          <span className="text-[10px] text-zinc-500">Proyectado (este mes)</span>
        </div>
        {promedio > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0" style={{ borderTop: `2px dashed ${c.accent}` }} />
            <span className="text-[10px] text-zinc-500">Promedio</span>
          </div>
        )}
      </div>
    </div>
  );
}
