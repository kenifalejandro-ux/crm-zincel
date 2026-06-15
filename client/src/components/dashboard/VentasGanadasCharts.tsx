/** client/src/components/dashboard/VentasGanadasCharts.tsx — PREMIUM NEON
 * Antes: 3 BarChart de recharts (barras agrupadas) con stroke "#f4f4f5", ticks "#3f3f46"
 * (ilegibles) y tooltip borde "#e4e4e7". Ahora: por card un resumen (ganadas/perdidas +
 * win rate) y barras DIVERGENTES verde/rojo con glow, proporcionales al volumen, con
 * win% por ítem. Sin recharts. Lógica de datos (getAnalisisPipeline) INTACTA.
 */

import { useEffect, useState } from "react";
import { Building2, Briefcase, Tag } from "lucide-react";
import { CARD_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { getAnalisisPipeline } from "../../services/propuestas.api";
import type { AnalisisPipelineData } from "../../services/propuestas.api";
import { LABEL_SERVICIO } from "../../types/propuesta.types";
import type { ServicioPropuesta } from "../../types/propuesta.types";

const SERVICIO_COLOR: Record<string, string> = {
  desarrollo_web:     "#f59e0b",
  wordpress:          "#3b82f6",
  redes_sociales:     "#8b5cf6",
  "diseño_marketing": "#06b6d4",
  erp:                "#10b981",
  crm:                "#f97316",
  otro:               "#6b7280",
};

interface Row { name: string; Ganadas: number; Perdidas: number; color?: string }

function SubChart({
  icon, titulo, data, emptyMsg,
}: {
  icon: React.ReactNode;
  titulo: string;
  data: Row[];
  emptyMsg: string;
}) {
  if (data.length === 0) {
    return (
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-4">{icon}<h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{titulo}</h3></div>
        <p className="text-xs text-zinc-500 text-center py-8">{emptyMsg}</p>
      </div>
    );
  }

  const totG    = data.reduce((s, d) => s + d.Ganadas, 0);
  const totP    = data.reduce((s, d) => s + d.Perdidas, 0);
  const winRate = totG + totP > 0 ? Math.round((totG / (totG + totP)) * 100) : 0;
  const maxTot  = Math.max(...data.map(d => d.Ganadas + d.Perdidas), 1);

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center gap-2 mb-1">{icon}<h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{titulo}</h3></div>

      {/* Resumen */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold tabular-nums" style={{ color: "#34d399", textShadow: "0 0 12px rgba(52,211,153,0.5)" }}>{totG}</span>
          <span className="text-[10px] text-zinc-500">ganadas</span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold tabular-nums" style={{ color: "#f87171", textShadow: "0 0 12px rgba(248,113,113,0.5)" }}>{totP}</span>
          <span className="text-[10px] text-zinc-500">perdidas</span>
        </div>
        <div className="ml-auto text-right">
          <p className="font-display text-lg font-bold tabular-nums" style={{ color: winRate >= 50 ? "#34d399" : "#fbbf24" }}>{winRate}%</p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wide">win rate</p>
        </div>
      </div>

      {/* Filas con barra divergente */}
      <div className="space-y-3">
        {data.map((d) => {
          const tot = d.Ganadas + d.Perdidas;
          const wr  = tot > 0 ? Math.round((d.Ganadas / tot) * 100) : 0;
          const widthPct = (tot / maxTot) * 100;
          return (
            <div key={d.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-zinc-300 truncate flex items-center gap-1.5">
                  {d.color && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.color, boxShadow: `0 0 5px ${d.color}` }} />}
                  {d.name}
                </span>
                <span className="text-[10px] tabular-nums shrink-0 ml-2" style={{ color: wr >= 50 ? "#34d399" : "#fbbf24" }}>{wr}%</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-white/[0.04]" style={{ width: `${Math.max(widthPct, 18)}%` }}>
                <div className="h-full" style={{ width: `${wr}%`, background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.55)" }} title={`${d.Ganadas} ganadas`} />
                <div className="h-full" style={{ width: `${100 - wr}%`, background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.45)" }} title={`${d.Perdidas} perdidas`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.07]">
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-400"><span className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />Ganadas</span>
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-400"><span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />Perdidas</span>
      </div>
    </div>
  );
}

export function VentasGanadasCharts() {
  const c = useChartColors();
  const [data,     setData]     = useState<AnalisisPipelineData | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getAnalisisPipeline()
      .then(setData)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0,1,2].map(i => (
        <div key={i} className={`${CARD_CLASS} flex items-center justify-center`} style={{ minHeight: 180 }}>
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgb(var(--accent))", borderTopColor: "transparent" }} />
        </div>
      ))}
    </div>
  );

  // Por empresa — top 8 con actividad
  const empresaData: Row[] = (data?.por_empresa ?? [])
    .filter(e => (e.ganadas + e.perdidas) > 0)
    .slice(0, 8)
    .map(e => ({
      name:     e.empresa.length > 18 ? e.empresa.slice(0, 17) + "…" : e.empresa,
      Ganadas:  e.ganadas,
      Perdidas: e.perdidas,
    }));

  // Por servicio
  const servicioData: Row[] = (data?.por_servicio ?? [])
    .filter(s => (s.ganadas + s.perdidas) > 0)
    .map(s => ({
      name:     LABEL_SERVICIO[s.servicio as ServicioPropuesta] ?? s.servicio,
      Ganadas:  s.ganadas,
      Perdidas: s.perdidas,
      color:    SERVICIO_COLOR[s.servicio] ?? c.accent,
    }));

  // Por subcategoría
  const subcatData: Row[] = (data?.por_subcategoria ?? [])
    .filter(s => (s.ganadas + s.perdidas) > 0)
    .slice(0, 8)
    .map(s => ({
      name:     s.subcategoria,
      Ganadas:  s.ganadas,
      Perdidas: s.perdidas,
    }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SubChart
        icon={<Building2 size={14} className="text-emerald-400 shrink-0" />}
        titulo="Ganadas vs Perdidas · Empresa"
        data={empresaData}
        emptyMsg="Sin cierres registrados"
      />
      <SubChart
        icon={<Briefcase size={14} className="text-accent shrink-0" />}
        titulo="Ganadas vs Perdidas · Servicio"
        data={servicioData}
        emptyMsg="Sin cierres registrados"
      />
      <SubChart
        icon={<Tag size={14} className="text-purple-400 shrink-0" />}
        titulo="Ganadas vs Perdidas · Categoría"
        data={subcatData}
        emptyMsg="Sin cierres con subcategoría"
      />
    </div>
  );
}