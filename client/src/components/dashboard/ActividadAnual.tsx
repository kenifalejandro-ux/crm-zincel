/** client/src/components/dashboard/ActividadAnual.tsx */

import { useState, useEffect } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { getActividadAnual, type ActividadMensual } from "../../services/dashboard.api";
import { aniosDisponibles } from "../../utils/date";

const SERIES = [
  { key: "llamadas",  label: "Llamadas",  color: "#3b82f6", barColor: "#bfdbfe" },
  { key: "reuniones", label: "Reuniones", color: "#6366f1", barColor: "#c7d2fe" },
  { key: "brochures", label: "Brochures", color: "#10b981", barColor: "#a7f3d0" },
  { key: "ventas",    label: "Ventas",    color: "#f59e0b", barColor: "#fde68a" },
] as const;

type SerieKey = typeof SERIES[number]["key"];

const TooltipPersonalizado = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ActividadMensual;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-zinc-800 mb-2">{label}</p>
      <p className="text-blue-600">Llamadas: <span className="font-medium">{d.llamadas}</span> <span className="text-zinc-400">({d.contestadas} contest.)</span></p>
      <p className="text-amber-600">Reuniones: <span className="font-medium">{d.reuniones}</span> <span className="text-zinc-400">({d.realizadas} realiz.)</span></p>
      <p className="text-emerald-600">Brochures: <span className="font-medium">{d.brochures}</span></p>
      <p className="text-amber-600">Ventas cerradas: <span className="font-medium">{d.ventas}</span></p>
    </div>
  );
};

export function ActividadAnual() {
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
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800">Comparativa anual</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Actividad mensual · barras + tendencia</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Toggle series */}
          <div className="flex gap-1 flex-wrap">
            {SERIES.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSerie(s.key)}
                className={`px-2.5 py-1 text-xs rounded-full border transition ${
                  series.includes(s.key)
                    ? "text-white border-transparent"
                    : "bg-white text-zinc-400 border-gray-200"
                }`}
                style={series.includes(s.key) ? { background: s.color, borderColor: s.color } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Selector de año */}
          <select
            value={anioSel}
            onChange={(e) => setAnioSel(Number(e.target.value))}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <p className="text-xs text-zinc-400">Sin actividad registrada en {anioSel}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              tickLine={false}
              axisLine={false}
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
            />
            {SERIES.filter((s) => series.includes(s.key)).map((s) => (
              <Bar
                key={`bar-${s.key}`}
                dataKey={s.key}
                name={s.label}
                fill={s.barColor}
                radius={[3, 3, 0, 0]}
                maxBarSize={22}
              />
            ))}
            {SERIES.filter((s) => series.includes(s.key)).map((s) => (
              <Line
                key={`line-${s.key}`}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3, fill: s.color }}
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
