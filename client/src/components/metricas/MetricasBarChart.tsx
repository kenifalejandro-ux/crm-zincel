/** src/components/metricas/MetricasBarChart.tsx */

import { CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import {
  RadarChart, PolarGrid, PolarAngleAxis,
  Radar, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { Metrica } from "../../types/metricas.types";
import { useEffect, useState } from "react";

interface Props { metricas: Metrica[] }

const PLATAFORMA_TONO: Record<string, string> = {
  meta:   "p1",
  google: "accent",
  tiktok: "axis",
};

const LABELS: Record<string, string> = {
  meta:   "Meta",
  google: "Google",
  tiktok: "TikTok",
};

const TooltipRadar = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${TOOLTIP_BASE} px-3 py-2 text-xs space-y-1`}>
      <p className="font-semibold text-zinc-200">{payload[0]?.payload?.metric}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString("es-PE")}
        </p>
      ))}
    </div>
  );
};

export const MetricasBarChart = ({ metricas }: Props) => {
  const c = useChartColors();
  const tono: Record<string, string> = { p1: c.palette[1], accent: c.accent, axis: c.axis };
  const platColor = (p: string) => tono[PLATAFORMA_TONO[p]] ?? c.axis;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const mapa: Record<string, { leads: number; conversiones: number; gasto: number }> = {};

  metricas.forEach(m => {
    if (!mapa[m.plataforma]) mapa[m.plataforma] = { leads: 0, conversiones: 0, gasto: 0 };
    mapa[m.plataforma].leads        += Number(m.leads);
    mapa[m.plataforma].conversiones += Number(m.conversiones);
    mapa[m.plataforma].gasto        += Number(m.gasto);
  });

  const plataformas = Object.keys(mapa);

  if (!plataformas.length) return (
    <div className="flex items-center justify-center h-40 text-xs text-zinc-400">
      Sin datos para graficar
    </div>
  );

  // Normalizar 0–100 por métrica para que el radar sea comparable
  const maxLeads  = Math.max(...plataformas.map(p => mapa[p].leads), 1);
  const maxConv   = Math.max(...plataformas.map(p => mapa[p].conversiones), 1);
  const maxGasto  = Math.max(...plataformas.map(p => mapa[p].gasto), 1);

  const radarData = [
    { metric: "Leads",        ...Object.fromEntries(plataformas.map(p => [p, Math.round((mapa[p].leads / maxLeads) * 100)])) },
    { metric: "Conversiones", ...Object.fromEntries(plataformas.map(p => [p, Math.round((mapa[p].conversiones / maxConv) * 100)])) },
    { metric: "Gasto",        ...Object.fromEntries(plataformas.map(p => [p, Math.round((mapa[p].gasto / maxGasto) * 100)])) },
  ];

  return (
    <div className={CARD_CLASS}>
      <h3 className={HEADER_CLASS}>
        <BarChart2 size={14} className="mr-2.5 text-violet-500" strokeWidth={2} />
        Comparativa por plataforma
      </h3>
      <p className="text-[10px] text-zinc-500 -mt-3 mb-4">Índice relativo — 100 = mejor valor en cada métrica</p>
      {mounted && <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#e4e4e7" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#71717a", fontWeight: 500 }} />
          <Tooltip content={<TooltipRadar />} />
          {plataformas.map(p => (
            <Radar filter="url(#neon-glow)"
              key={p}
              name={LABELS[p] ?? p}
              dataKey={p}
              stroke={platColor(p)}
              fill={platColor(p)}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </RadarChart>
      </ResponsiveContainer>}
    </div>
  );
};
