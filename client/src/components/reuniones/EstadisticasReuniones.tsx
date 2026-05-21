/** client/src/components/reuniones/EstadisticasReuniones.tsx */

import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

interface StatItem {
  fecha:       string;
  total:       number;
  realizadas:  number;
  programadas: number;
  canceladas:  number;
}

interface ModalidadItem {
  modalidad: string;
  total:     number;
}

interface Props {
  estadisticas:  StatItem[];
  modalidad:     ModalidadItem[];
  filtroPeriodo: string;
  onPeriodoChange: (valor: string) => void;
}

const LABEL_MODALIDAD: Record<string, string> = {
  google_meet: "Google Meet",
  presencial:  "Presencial",
  zoom:        "Zoom",
  teams:       "Teams",
  telefono:    "Teléfono",
};

const TooltipPersonalizado = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as StatItem;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-zinc-800 mb-1">{label}</p>
      <p className="text-blue-600">Total: <span className="font-medium">{d.total}</span></p>
      <p className="text-green-600">Realizadas: <span className="font-medium">{d.realizadas}</span></p>
      <p className="text-amber-500">Programadas: <span className="font-medium">{d.programadas}</span></p>
      {d.canceladas > 0 && (
        <p className="text-red-400">Canceladas: <span className="font-medium">{d.canceladas}</span></p>
      )}
      {d.total > 0 && (
        <p className="text-zinc-500 mt-1">
          Tasa realización: {Math.round((d.realizadas / d.total) * 100)}%
        </p>
      )}
    </div>
  );
};

export function EstadisticasReuniones({ estadisticas, modalidad, filtroPeriodo, onPeriodoChange }: Props) {
  const labelPeriodo = filtroPeriodo === "dia" ? "hora" : filtroPeriodo === "anio" ? "mes" : "día";
  const totalItems   = estadisticas.length;
  const tickInterval = Math.max(0, Math.ceil(totalItems / 7) - 1);

  return (
    <div className="grid gap-4 md:grid-cols-2">

      {/* Gráfico por período */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-semibold text-zinc-800">Reuniones por {labelPeriodo}</h2>
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
          <p className="text-xs text-zinc-400 text-center py-10">Sin reuniones en este período</p>
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
                formatter={(v) => v === "total" ? "Total" : "Realizadas"}
              />
              <Bar dataKey="total" fill="#c7d2fe" name="total" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Line
                type="monotone"
                dataKey="realizadas"
                stroke="#6366f1"
                strokeWidth={2}
                dot={totalItems <= 10 ? { r: 3, fill: "#6366f1" } : false}
                activeDot={{ r: 4 }}
                name="realizadas"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Desglose por modalidad + detalle */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-xs font-semibold text-zinc-800 mb-4">Por modalidad</h2>
        {modalidad.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">Sin registros aún</p>
        ) : (
          <div className="space-y-2">
            {modalidad.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-700">{LABEL_MODALIDAD[m.modalidad] ?? m.modalidad}</span>
                <span className="text-xs font-medium text-zinc-800">{m.total} reuniones</span>
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
                      style={{ width: `${stat.total > 0 ? (stat.realizadas / stat.total) * 100 : 0}%` }}
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
