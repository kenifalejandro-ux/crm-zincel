/** client/src/components/inteligencia/ForecastIngresos.tsx */

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { TrendingUp } from "lucide-react";
import { getForecastIngresos, type ForecastIngresos } from "../../services/inteligencia.api";

const COLORS: Record<string, string> = {
  enviada:        "#60a5fa",
  en_negociacion: "#f59e0b",
  cerrada_ganada: "#22c55e",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}k`;
  return `S/ ${n.toLocaleString("es-PE")}`;
}

const TooltipForecast = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 text-xs">
      <p className="font-semibold text-zinc-800">{d.label}</p>
      <p className="text-zinc-500 mt-0.5">{d.cantidad} propuesta{d.cantidad !== 1 ? "s" : ""}</p>
      <p className="text-zinc-600">Monto total: {fmt(d.monto_total)}</p>
      <p className="font-medium mt-1" style={{ color: COLORS[d.estado] ?? "#6366f1" }}>
        Ponderado ({d.prob}%): {fmt(d.ponderado)}
      </p>
    </div>
  );
};

export function ForecastIngresosChart() {
  const [data, setData] = useState<ForecastIngresos | null>(null);

  useEffect(() => {
    getForecastIngresos().then(setData).catch(() => {});
  }, []);

  if (!data || data.desglose.length === 0) return null;

  const chartData = data.desglose.map((d) => ({ ...d }));
  const maxVal = Math.max(...chartData.map((d) => d.ponderado), 1);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50">
            <TrendingUp size={14} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800">Forecast de ingresos ponderado</h3>
            <p className="text-[11px] text-zinc-400">Propuestas en pipeline × probabilidad de cierre por etapa</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400">Ingreso esperado</p>
          <p className="text-lg font-bold text-amber-700">{fmt(data.total_ponderado)}</p>
        </div>
      </div>

      {/* Barra principal de probabilidades */}
      <div className="flex gap-2 mb-4 text-[10px]">
        {[
          { label: "Enviadas",       prob: "20%", color: "#60a5fa" },
          { label: "Negociación",    prob: "60%", color: "#f59e0b" },
          { label: "Cerradas/ganadas", prob: "100%", color: "#22c55e" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-zinc-500">{s.label}</span>
            <span className="font-bold text-zinc-700">{s.prob}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
          barSize={22}
        >
          <XAxis
            type="number"
            domain={[0, maxVal * 1.15]}
            tick={{ fontSize: 9, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => fmt(v)}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 10, fill: "#52525b" }}
            tickLine={false}
            axisLine={false}
            width={95}
          />
          <Tooltip content={<TooltipForecast />} cursor={{ fill: "#f4f4f5" }} />
          <Bar dataKey="ponderado" radius={[0, 6, 6, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.estado} fill={COLORS[entry.estado] ?? "#6366f1"} />
            ))}
            <LabelList
              dataKey="ponderado"
              position="right"
              style={{ fontSize: 10, fontWeight: 600, fill: "#3f3f46" }}
              formatter={(v: any) => fmt(Number(v))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 flex items-center justify-between text-[11px] bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        <span className="text-amber-600 font-medium">Pipeline total (sin ponderar)</span>
        <span className="font-bold text-amber-700">{fmt(data.total_sin_ponderar)}</span>
      </div>
    </div>
  );
}
