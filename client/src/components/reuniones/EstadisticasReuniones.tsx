/** client/src/components/reuniones/EstadisticasReuniones.tsx */

import { CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE, INPUT_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { Calendar, BarChart2 } from "lucide-react";


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
  estadisticas:    StatItem[];
  modalidad:       ModalidadItem[];
  filtroPeriodo:   string;
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
    <div className={`${TOOLTIP_BASE} p-3 text-xs`}>
      <p className="font-semibold text-zinc-200 mb-1">{label}</p>
      <p className="text-zinc-300">Total: <span className="font-medium">{d.total}</span></p>
      <p className="text-zinc-300">Realizadas: <span className="font-medium">{d.realizadas}</span></p>
      <p className="text-zinc-300">Programadas: <span className="font-medium">{d.programadas}</span></p>
      {d.canceladas > 0 && (
        <p className="text-red-400">Canceladas: <span className="font-medium">{d.canceladas}</span></p>
      )}
      {d.total > 0 && (
        <p className="text-zinc-300 mt-1">Tasa realización: {Math.round((d.realizadas / d.total) * 100)}%</p>
      )}
    </div>
  );
};

export function EstadisticasReuniones({ estadisticas, modalidad, filtroPeriodo, onPeriodoChange }: Props) {
  const c = useChartColors();
  const labelPeriodo = filtroPeriodo === "dia" ? "hora" : filtroPeriodo === "anio" ? "mes" : "día";
  const totalItems   = estadisticas.length;
  const tickInterval = Math.max(0, Math.ceil(totalItems / 7) - 1);

  return (
    <div className="grid gap-4 md:grid-cols-2">

      {/* Gráfico por período */}
      <div className={CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          <BarChart2 size={14} className="mr-2.5 text-violet-500" strokeWidth={2} />
          Reuniones por {labelPeriodo}
        </h2>
        <div className="flex items-center justify-between mb-3">
          {totalItems > 0 && (
            <p className="text-[11px] text-zinc-400 font-medium">
              {totalItems} {labelPeriodo}{totalItems !== 1 ? "s" : ""} · línea de tendencia
            </p>
          )}
          <select
            value={filtroPeriodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className={`${INPUT_BASE} ml-auto px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-400`}
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
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={estadisticas} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
              <XAxis dataKey="fecha" tick={{ fontSize: 9, fill: c.axis }} tickLine={false} axisLine={false} interval={tickInterval} />
              <YAxis tick={{ fontSize: 9, fill: c.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<TooltipPersonalizado />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                formatter={(v) => v === "total" ? "Total" : "Realizadas"} />
              <Bar filter="url(#neon-glow)" dataKey="total" fill={c.palette[3]} name="total" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Line filter="url(#neon-glow)" type="monotone" dataKey="realizadas" stroke={c.accent} strokeWidth={2}
                dot={totalItems <= 10 ? { r: 3, fill: c.accent } : false} activeDot={{ r: 4 }} name="realizadas" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Desglose por modalidad */}
      <div className={CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          <Calendar size={14} className="mr-2.5 text-blue-500" strokeWidth={2} />
          Por modalidad
        </h2>
        {modalidad.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">Sin registros aún</p>
        ) : (
          <div className="space-y-2">
            {modalidad.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/8 last:border-0">
                <span className="text-xs text-zinc-400">{LABEL_MODALIDAD[m.modalidad] ?? m.modalidad}</span>
                <span className="text-xs font-medium text-zinc-200">{m.total} reuniones</span>
              </div>
            ))}
          </div>
        )}

        {estadisticas.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/8">
            <h3 className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest mb-2">Detalle por {labelPeriodo}</h3>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {estadisticas.map((stat, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-zinc-300 w-16 shrink-0">{stat.fecha}</span>
                  <div className="flex-1 mx-2 bg-zinc-800 rounded-full h-1.5">
                    <div className="bg-brand h-1.5 rounded-full"
                      style={{ width: `${stat.total > 0 ? (stat.realizadas / stat.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-zinc-300 font-medium w-6 text-right">{stat.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
