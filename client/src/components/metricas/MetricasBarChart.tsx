/** src/components/metricas/MetricasBarChart.tsx */

import { COLORS } from "../../lib/tokens";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Metrica } from "../../types/metricas.types";

interface Props { metricas: Metrica[] }

const COLORES: Record<string, string> = {
  meta:   "#3b82f6",
  google: "#ef4444",
  tiktok: "#ec4899",
};

const LABELS: Record<string, string> = {
  meta:   "Meta Ads",
  google: "Google Ads",
  tiktok: "TikTok Ads",
};

export const MetricasBarChart = ({ metricas }: Props) => {
  // Agrupar por plataforma → leads, conversiones, gasto
  const mapa: Record<string, { leads: number; conversiones: number; gasto: number }> = {};

  metricas.forEach((m) => {
    if (!mapa[m.plataforma]) mapa[m.plataforma] = { leads: 0, conversiones: 0, gasto: 0 };
    mapa[m.plataforma].leads        += Number(m.leads);
    mapa[m.plataforma].conversiones += Number(m.conversiones);
    mapa[m.plataforma].gasto        += Number(m.gasto);
  });

  const data = Object.entries(mapa).map(([plataforma, vals]) => ({
    plataforma: LABELS[plataforma] ?? plataforma,
    ...vals,
  }));

  if (!data.length) return (
    <div className="flex items-center justify-center h-40 text-xs text-zinc-400">
      Sin datos para graficar
    </div>
  );

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-xl border border-zinc-200/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Comparativa por plataforma</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.surface} vertical={false} />
          <XAxis dataKey="plataforma" tick={{ fontSize: 10, fill: COLORS.muted }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: COLORS.muted }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="leads"        name="Leads"        fill={COLORS.dark} radius={[4,4,0,0]} />
          <Bar dataKey="conversiones" name="Conversiones" fill={COLORS.primary} radius={[4,4,0,0]} />
          <Bar dataKey="gasto"        name="Gasto (S/)"   fill={COLORS.muted} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};