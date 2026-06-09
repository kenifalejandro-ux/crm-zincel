/** src/components/metricas/MetricasLineChart.tsx */

import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Metrica } from "../../types/metricas.types";
import { useEffect, useState } from "react";

interface Props { metricas: Metrica[] }

const COLORES: Record<string, string> = {
  meta:   COLORS.dark,
  google: COLORS.primary,
  tiktok: COLORS.mutedDark,
};

export const MetricasLineChart = ({ metricas }: Props) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
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
    <div className="flex items-center justify-center h-40 text-xs text-zinc-600">
      Sin datos para graficar
    </div>
  );

  return (
    <div className={CARD_CLASS}>
      <h3 className={HEADER_CLASS}><TrendingUp size={14} className="mr-2.5 text-emerald-500" strokeWidth={2} />Evolución de gasto por plataforma</h3>
      {mounted && <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.surface} />
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
              stroke={COLORES[p] ?? COLORS.mutedDark}
              strokeWidth={2}
              dot={{ r: 3 }}
              name={p === "meta" ? "Meta Ads" : p === "google" ? "Google Ads" : "TikTok Ads"}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>}
    </div>
  );
};