/** client/src/components/brochures/EstadisticasBrochures.tsx */

import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from "recharts";

interface StatItem {
  fecha: string;
  total: number;
}

interface CanalItem {
  canal: string;
  total: number;
}

interface Props {
  estadisticas:    StatItem[];
  canales:         CanalItem[];
  filtroPeriodo:   string;
  onPeriodoChange: (valor: string) => void;
}

const TooltipPersonalizado = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as StatItem;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-zinc-800 mb-1">{label}</p>
      <p className="text-amber-600">Envíos: <span className="font-medium">{d.total}</span></p>
    </div>
  );
};

export function EstadisticasBrochures({ estadisticas, canales, filtroPeriodo, onPeriodoChange }: Props) {
  const labelPeriodo = filtroPeriodo === "dia" ? "hora" : filtroPeriodo === "anio" ? "mes" : "día";
  const totalItems   = estadisticas.length;
  const tickInterval = Math.max(0, Math.ceil(totalItems / 7) - 1);
  const maxVal       = Math.max(...estadisticas.map((s) => s.total), 1);

  return (
    <div className="grid gap-4 md:grid-cols-2">

      {/* Gráfico por período */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-semibold text-zinc-800">Envíos por {labelPeriodo}</h2>
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
            <option value="anio">Por mes (año)</option>
          </select>
        </div>

        {estadisticas.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-10">Sin envíos en este período</p>
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
              <Bar dataKey="total" fill="#e0e7ff" name="total" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2}
                dot={totalItems <= 10 ? { r: 3, fill: "#6366f1" } : false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Desglose por canal + detalle */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-xs font-semibold text-zinc-800 mb-4">Envíos por canal</h2>
        {canales.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">Sin registros aún</p>
        ) : (
          <div className="space-y-2">
            {canales.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-700 capitalize">{c.canal}</span>
                <span className="text-xs font-medium text-zinc-800">{c.total} envíos</span>
              </div>
            ))}
          </div>
        )}

        {estadisticas.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">Detalle por {labelPeriodo}</h3>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {estadisticas.map((stat, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-zinc-500 w-16 shrink-0">{stat.fecha}</span>
                  <div className="flex-1 mx-2 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full"
                      style={{ width: `${(stat.total / maxVal) * 100}%` }}
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
