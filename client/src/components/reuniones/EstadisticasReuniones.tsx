/** client/src/components/reuniones/EstadisticasReuniones.tsx — REDISEÑO NEON
 * El chart YA usaba useChartColors() ✓. Cambios: modalidad con barras de color +
 * glow (antes solo filas de texto), barras de detalle (antes bg-zinc-800/bg-brand) → neon,
 * bordes válidos (antes border-white/8), select neon. Lógica/props/datos INTACTOS.
 */
import { CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE, INPUT_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { Calendar, BarChart2 } from "lucide-react";

interface StatItem { fecha: string; total: number; realizadas: number; programadas: number; canceladas: number; }
interface ModalidadItem { modalidad: string; total: number; }
interface Props { estadisticas: StatItem[]; modalidad: ModalidadItem[]; filtroPeriodo: string; onPeriodoChange: (valor: string) => void; }

const LABEL_MODALIDAD: Record<string, string> = {
  google_meet: "Google Meet", presencial: "Presencial", zoom: "Zoom", teams: "Teams", telefono: "Teléfono",
};
const COLOR_MODALIDAD: Record<string, string> = {
  google_meet: "#06b6d4", zoom: "#a855f7", presencial: "#34d399", teams: "#3b82f6", telefono: "#fbbf24",
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
      {d.canceladas > 0 && <p className="text-red-400">Canceladas: <span className="font-medium">{d.canceladas}</span></p>}
      {d.total > 0 && <p className="text-zinc-300 mt-1">Tasa realización: {Math.round((d.realizadas / d.total) * 100)}%</p>}
    </div>
  );
};

export function EstadisticasReuniones({ estadisticas, modalidad, filtroPeriodo, onPeriodoChange }: Props) {
  const c = useChartColors();
  const labelPeriodo = filtroPeriodo === "dia" ? "hora" : filtroPeriodo === "anio" ? "mes" : "día";
  const totalItems = estadisticas.length;
  const tickInterval = Math.max(0, Math.ceil(totalItems / 7) - 1);
  const totalMod = modalidad.reduce((s, m) => s + m.total, 0);
  const showDots = totalItems <= 10 || filtroPeriodo === "anio";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Gráfico por período */}
      <div className={CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          <BarChart2 size={14} className="mr-2.5 text-violet-400" strokeWidth={2} />
          Reuniones por {labelPeriodo}
        </h2>
        <div className="flex items-center justify-between mb-3">
          {totalItems > 0 && <p className="text-[11px] text-zinc-500 font-medium">{totalItems} {labelPeriodo}{totalItems !== 1 ? "s" : ""} · línea de tendencia</p>}
          <select value={filtroPeriodo} onChange={(e) => onPeriodoChange(e.target.value)} className={`${INPUT_BASE} ml-auto px-3 py-1.5 text-xs`}>
            <option value="dia">Por hora (hoy)</option>
            <option value="semana">Por día (semana)</option>
            <option value="mes">Por día (mes)</option>
            <option value="anio">Por mes (año)</option>
          </select>
        </div>

        {estadisticas.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-10">Sin reuniones en este período</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={estadisticas} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
              <XAxis dataKey="fecha" tick={{ fontSize: 9, fill: c.axis }} tickLine={false} axisLine={false} interval={tickInterval} />
              <YAxis tick={{ fontSize: 9, fill: c.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<TooltipPersonalizado />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }} formatter={(v) => v === "total" ? "Total" : "Realizadas"} />
              <Bar filter="url(#neon-glow)" dataKey="total" fill={c.palette[3]} name="total" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Line filter="url(#neon-glow-strong)" type="monotone" dataKey="realizadas" stroke={c.accent} strokeWidth={2} strokeOpacity={0.96} dot={showDots ? { r: 3, fill: c.accent } : false} activeDot={{ r: 4 }} name="realizadas" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Por modalidad */}
      <div className={CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          <Calendar size={14} className="mr-2.5 text-blue-400" strokeWidth={2} />
          Por modalidad
        </h2>
        {modalidad.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">Sin registros aún</p>
        ) : (
          <div className="space-y-3.5">
            {modalidad.map((m, i) => {
              const p = totalMod > 0 ? Math.round((m.total / totalMod) * 100) : 0;
              const col = COLOR_MODALIDAD[m.modalidad] ?? c.accent;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-[12.5px] text-zinc-300">
                      <span className="w-2 h-2 rounded-full" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />{LABEL_MODALIDAD[m.modalidad] ?? m.modalidad}
                    </span>
                    <span className="text-[12px] font-semibold text-zinc-200 tabular-nums">{m.total} <span className="text-zinc-500 font-normal">({p}%)</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: col, boxShadow: `0 0 8px ${col}` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {estadisticas.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.07]">
            <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mb-2">Detalle por {labelPeriodo}</h3>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {estadisticas.map((stat, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-zinc-400 w-16 shrink-0">{stat.fecha}</span>
                  <div className="flex-1 mx-2 bg-white/[0.05] rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${stat.total > 0 ? (stat.realizadas / stat.total) * 100 : 0}%`, background: "rgb(var(--accent))", boxShadow: "0 0 6px rgb(var(--accent) / calc(0.6*var(--glow)))" }} />
                  </div>
                  <span className="text-zinc-300 font-medium w-6 text-right tabular-nums">{stat.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}