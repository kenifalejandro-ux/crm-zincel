/** client/src/components/llamadas/EstadisticasPeriodo.tsx */

import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

interface StatItem {
  fecha: string;
  total: number;
  contestadas: number;
  no_contestadas: number;
}

interface ResumenItem {
  canal: string;
  por_canal: number;
}

interface Props {
  estadisticas: StatItem[];
  resumen: ResumenItem[];
  filtroPeriodo: string;
  onPeriodoChange: (valor: string) => void;
}

const TooltipPersonalizado = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as StatItem;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-zinc-800 mb-1">{label}</p>
      <p className="text-blue-600">Total: <span className="font-medium">{d.total}</span></p>
      <p className="text-emerald-600">Contestadas: <span className="font-medium">{d.contestadas}</span></p>
      <p className="text-red-400">No contestadas: <span className="font-medium">{d.no_contestadas}</span></p>
      {d.total > 0 && (
        <p className="text-zinc-500 mt-1">
          Tasa: {Math.round((d.contestadas / d.total) * 100)}%
        </p>
      )}
    </div>
  );
};

export function EstadisticasPeriodo({ estadisticas, resumen, filtroPeriodo, onPeriodoChange }: Props) {
  const labelPeriodo = filtroPeriodo === "dia" ? "hora" : filtroPeriodo === "mes" ? "día" : "día";
  const totalItems   = estadisticas.length;
  // Show one tick label per ~6 segments to avoid overlap
  const tickInterval = Math.max(0, Math.ceil(totalItems / 7) - 1);

  return (
    <div className="grid gap-4 md:grid-cols-2">

      {/* Llamadas por período — chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-semibold text-zinc-800">Llamadas por {labelPeriodo}</h2>
            {totalItems > 0 && (
              <p className="text-xs text-zinc-400 mt-0.5">
                {totalItems} {labelPeriodo}{totalItems !== 1 ? "s" : ""} · línea de tendencia
              </p>
            )}
          </div>
          <select
            value={filtroPeriodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="dia">Por hora (hoy)</option>
            <option value="semana">Por día (semana)</option>
            <option value="mes">Por día (mes)</option>
          </select>
        </div>

        {estadisticas.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-10">Sin llamadas en este período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={estadisticas} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 9, fill: "#a1a1aa" }}
                tickLine={false}
                axisLine={false}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#a1a1aa" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<TooltipPersonalizado />} />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                formatter={(v) => v === "total" ? "Total" : "Contestadas"}
              />
              <Bar dataKey="total" fill="#bfdbfe" name="total" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Line
                type="monotone"
                dataKey="contestadas"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={totalItems <= 10 ? { r: 3, fill: "#3b82f6" } : false}
                activeDot={{ r: 4 }}
                name="contestadas"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Llamadas por canal */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-xs font-semibold text-zinc-800 mb-4">Llamadas por canal</h2>
        {resumen.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">Sin registros aún</p>
        ) : (
          <div className="space-y-2">
            {resumen.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-700 capitalize">{r.canal}</span>
                <span className="text-xs font-medium text-zinc-800">{r.por_canal} llamadas</span>
              </div>
            ))}
          </div>
        )}

        {/* Mini resumen de estadisticas */}
        {estadisticas.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">Detalle por {labelPeriodo}</h3>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {estadisticas.map((stat, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-zinc-500 w-16 shrink-0">{stat.fecha}</span>
                  <div className="flex-1 mx-2 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-400 h-1.5 rounded-full"
                      style={{ width: `${stat.total > 0 ? (stat.contestadas / stat.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-zinc-700 font-medium w-6 text-right">{stat.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
