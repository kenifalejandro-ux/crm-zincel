/** src/components/metricas/MetricasLineChart.tsx */

import { COLORS } from "../../lib/tokens";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Metrica } from "../../types/metricas.types";

interface Props { metricas: Metrica[] }

const COLORES: Record<string, string> = {
  meta:   COLORS.dark,
  google: COLORS.primary,
  tiktok: COLORS.muted,
};

export const MetricasLineChart = ({ metricas }: Props) => {
  // Agrupar por periodo_inicio y plataforma → gasto
  const mapaFechas: Record<string, Record<string, number>> = {};

  metricas.forEach((m) => {
    const fecha = m.periodo_inicio;
    if (!mapaFechas[fecha]) mapaFechas[fecha] = {};
    mapaFechas[fecha][m.plataforma] =
      (mapaFechas[fecha][m.plataforma] ?? 0) + Number(m.gasto);
  });

  const data = Object.entries(mapaFechas)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, plataformas]) => ({ fecha, ...plataformas }));

  const plataformas = [...new Set(metricas.map((m) => m.plataforma))];

  if (!data.length) return (
    <div className="flex items-center justify-center h-40 text-xs text-zinc-400">
      Sin datos para graficar
    </div>
  );

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-xl border border-zinc-200/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Evolución de gasto por plataforma</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.surface} />
          //fecha formato dd/mm/yyyy
          <XAxis
           dataKey="fecha"
           tick={{ fontSize: 10 }}
           tickFormatter={(v) => new Date(v).toLocaleDateString("es-PE", { day:"2-digit", month:"short" })}
            />
           <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `S/${v}`} />
          <Tooltip formatter={(v) => `S/ ${Number(v).toLocaleString("es-PE")}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {plataformas.map((p) => (
            <Line
              key={p}
              type="monotone"
              dataKey={p}
              stroke={COLORES[p] ?? "#94a3b8"}
              strokeWidth={2}
              dot={{ r: 3 }}
              name={p === "meta" ? "Meta Ads" : p === "google" ? "Google Ads" : "TikTok Ads"}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};