/** client/src/components/dashboard/ActividadAnual.tsx — NEON
 * Antes: chips de serie inactivos bg-slate-800/60, select focus:ring-zinc-400.
 * Ahora: chips inactivos neon, select neon-input. Charts ya usaban useChartColors + glow.
 * Lógica/datos INTACTOS.
 */

import { CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { useState, useEffect } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { getActividadAnual, type ActividadMensual } from "../../services/dashboard.api";
import { aniosDisponibles } from "../../utils/date";


const SERIES = [
  { key: "llamadas",  label: "Llamadas",  idx: 0 },
  { key: "reuniones", label: "Reuniones", idx: 1 },
  { key: "brochures", label: "Brochures", idx: 2 },
  { key: "ventas",    label: "Ventas",    idx: 3 },
] as const;

type SerieKey = typeof SERIES[number]["key"];

const TooltipPersonalizado = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ActividadMensual;
  return (
    <div className={`${TOOLTIP_BASE} p-3 text-xs min-w-[140px]`}>
      <p className="font-semibold text-zinc-200 mb-2">{label}</p>
      <p className="text-zinc-300">Llamadas: <span className="font-medium">{d.llamadas}</span> <span className="text-zinc-500">({d.contestadas} contest.)</span></p>
      <p className="text-zinc-300">Reuniones: <span className="font-medium">{d.reuniones}</span> <span className="text-zinc-500">({d.realizadas} realiz.)</span></p>
      <p className="text-zinc-300">Brochures: <span className="font-medium">{d.brochures}</span></p>
      <p className="text-zinc-300">Ventas cerradas: <span className="font-medium">{d.ventas}</span></p>
    </div>
  );
};

export function ActividadAnual() {
  const c = useChartColors();
  const colorDe = (idx: number) => c.palette[idx % c.palette.length];
  const anios = aniosDisponibles();
  const [anioSel, setAnioSel] = useState(new Date().getFullYear());
  const [data,    setData]    = useState<ActividadMensual[]>([]);
  const [series,  setSeries]  = useState<SerieKey[]>(["llamadas", "reuniones"]);
  const [cargando, setCargando] = useState(false);

  const cargar = async (anio: number) => {
    setCargando(true);
    try {
      const d = await getActividadAnual(anio);
      setData(d);
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(anioSel); }, [anioSel]);

  const toggleSerie = (key: SerieKey) => {
    setSeries((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const hayDatos = data.some((d) => series.some((s) => d[s] > 0));

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <BarChart2 size={14} className="mr-2.5 text-violet-400" strokeWidth={2} />
        Comparativa anual
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-[11px] text-zinc-500 font-medium">Actividad mensual · barras + tendencia</p>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {SERIES.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSerie(s.key)}
                className={`px-2.5 py-1 text-xs rounded-full border transition ${
                  series.includes(s.key)
                    ? "text-white border-transparent"
                    : "bg-white/[0.04] text-zinc-400 border-white/10 hover:bg-white/[0.07]"
                }`}
                style={series.includes(s.key) ? { background: colorDe(s.idx), borderColor: colorDe(s.idx), boxShadow: `0 0 10px ${colorDe(s.idx)}66` } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>

          <select
            value={anioSel}
            onChange={(e) => setAnioSel(Number(e.target.value))}
            className="neon-input px-3 py-1.5 text-xs"
          >
            {anios.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="h-[240px] flex items-center justify-center">
          <p className="text-xs text-zinc-500">Cargando...</p>
        </div>
      ) : !hayDatos ? (
        <div className="h-[240px] flex items-center justify-center">
          <p className="text-xs text-zinc-500">Sin actividad registrada en {anioSel}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: c.axis }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: c.axis }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<TooltipPersonalizado />} />
            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
            />
            {SERIES.filter((s) => series.includes(s.key)).map((s) => (
              <Bar filter="url(#neon-glow)"
                key={`bar-${s.key}`}
                dataKey={s.key}
                name={s.label}
                fill={colorDe(s.idx)}
                radius={[3, 3, 0, 0]}
                maxBarSize={22}
              />
            ))}
            {SERIES.filter((s) => series.includes(s.key)).map((s) => (
              <Line filter="url(#neon-glow)"
                key={`line-${s.key}`}
                type="monotone"
                dataKey={s.key}
                stroke={colorDe(s.idx)}
                strokeWidth={2}
                dot={{ r: 3, fill: colorDe(s.idx) }}
                activeDot={{ r: 4 }}
                name={s.label}
                legendType="none"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}