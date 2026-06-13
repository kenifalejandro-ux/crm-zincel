/** client/src/components/dashboard/ActividadMensualDiaria.tsx */

import { CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE, INPUT_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { useState, useEffect } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { Calendar } from "lucide-react";
import { getActividadMensual, type ActividadDiaria } from "../../services/dashboard.api";
import { aniosDisponibles } from "../../utils/date";


const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const SERIES = [
  { key: "llamadas",  label: "Llamadas",  idx: 0 },
  { key: "reuniones", label: "Reuniones", idx: 1 },
  { key: "brochures", label: "Brochures", idx: 2 },
] as const;

type SerieKey = typeof SERIES[number]["key"];

const TooltipPersonalizado = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ActividadDiaria;
  return (
    <div className={`${TOOLTIP_BASE} p-3 text-xs min-w-[140px]`}>
      <p className="font-semibold text-zinc-200 mb-2">Día {label}</p>
      <p className="text-zinc-300">Llamadas: <span className="font-medium">{d.llamadas}</span> <span className="text-zinc-400">({d.contestadas} contest.)</span></p>
      <p className="text-zinc-300">Reuniones: <span className="font-medium">{d.reuniones}</span> <span className="text-zinc-400">({d.realizadas} realiz.)</span></p>
      <p className="text-zinc-300">Brochures: <span className="font-medium">{d.brochures}</span></p>
    </div>
  );
};

export function ActividadMensualDiaria() {
  const c = useChartColors();
  const colorDe = (idx: number) => c.palette[idx % c.palette.length];
  const now   = new Date();
  const anios = aniosDisponibles();

  const [anioSel,  setAnioSel]  = useState(now.getFullYear());
  const [mesSel,   setMesSel]   = useState(now.getMonth() + 1);
  const [data,     setData]     = useState<ActividadDiaria[]>([]);
  const [series,   setSeries]   = useState<SerieKey[]>(["llamadas", "reuniones"]);
  const [cargando, setCargando] = useState(false);

  const cargar = async (anio: number, mes: number) => {
    setCargando(true);
    try {
      const d = await getActividadMensual(anio, mes);
      setData(d);
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(anioSel, mesSel); }, [anioSel, mesSel]);

  const toggleSerie = (key: SerieKey) =>
    setSeries((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const hayDatos = data.some((d) => series.some((s) => d[s] > 0));
  const tickInterval = Math.max(0, Math.ceil(data.length / 10) - 1);

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <Calendar size={14} className="mr-2.5 text-blue-500" strokeWidth={2} />
        Comparativa diaria
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-[11px] text-zinc-400 font-medium">Actividad por día del mes · barras + tendencia</p>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {SERIES.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSerie(s.key)}
                className={`px-2.5 py-1 text-xs rounded-full border transition ${
                  series.includes(s.key)
                    ? "text-white border-transparent"
                    : "bg-slate-800/60 text-zinc-400 border-white/10"
                }`}
                style={series.includes(s.key) ? { background: colorDe(s.idx), borderColor: colorDe(s.idx) } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>

          <select
            value={mesSel}
            onChange={(e) => setMesSel(Number(e.target.value))}
            className={`${INPUT_BASE} px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-400`}
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>

          <select
            value={anioSel}
            onChange={(e) => setAnioSel(Number(e.target.value))}
            className={`${INPUT_BASE} px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-400`}
          >
            {anios.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="h-[240px] flex items-center justify-center">
          <p className="text-xs text-zinc-400">Cargando...</p>
        </div>
      ) : !hayDatos ? (
        <div className="h-[240px] flex items-center justify-center">
          <p className="text-xs text-zinc-400">Sin actividad en {MESES[mesSel - 1]} {anioSel}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: c.axis }}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
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
                maxBarSize={18}
              />
            ))}
            {SERIES.filter((s) => series.includes(s.key)).map((s) => (
              <Line filter="url(#neon-glow)"
                key={`line-${s.key}`}
                type="monotone"
                dataKey={s.key}
                stroke={colorDe(s.idx)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                legendType="none"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
