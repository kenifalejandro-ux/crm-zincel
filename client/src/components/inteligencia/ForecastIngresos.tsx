/** client/src/components/inteligencia/ForecastIngresos.tsx — PREMIUM NEON
 * Antes: STAGE_CONFIG en tema claro (bg-zinc-50/bg-amber-50/bg-zinc-900), KPI "Pipeline total"
 * bg-zinc-900 + text-zinc-100 lavado, "Ingreso esperado" bg-amber-50, icono bg-amber-50.
 * Ahora: tiles y KPIs neon con glow. Lógica/datos INTACTOS.
 */

import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { getForecastIngresos, type ForecastIngresos } from "../../services/inteligencia.api";

// hex por etapa
const STAGE_HEX: Record<string, string> = {
  enviada:        "#94a3b8",
  en_negociacion: "#fbbf24",
  cerrada_ganada: "#34d399",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}k`;
  return `S/ ${n.toLocaleString("es-PE")}`;
}

export function ForecastIngresosChart() {
  const [data, setData] = useState<ForecastIngresos | null>(null);

  useEffect(() => {
    getForecastIngresos().then(setData).catch(() => {});
  }, []);

  if (!data || data.desglose.length === 0) return null;

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)" }}>
            <TrendingUp size={14} className="text-amber-400" />
          </div>
          <div>
            <h3 className={HEADER_CLASS}>Forecast de ingresos ponderado</h3>
            <p className="text-[11px] text-zinc-500">Pipeline × probabilidad de cierre</p>
          </div>
        </div>
      </div>

      {/* Total KPI */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="text-center rounded-2xl py-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Pipeline total</p>
          <p className="font-display text-3xl font-bold text-zinc-50 mt-1 tabular-nums">{fmt(data.total_sin_ponderar)}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Monto real en juego</p>
        </div>
        <div className="text-center rounded-2xl py-4" style={{ background: "rgb(var(--accent) / 0.07)", border: "1px solid rgb(var(--accent) / 0.25)" }}>
          <p className="text-[10px] text-accent uppercase tracking-widest font-semibold">Ingreso esperado</p>
          <p className="font-display text-3xl font-bold text-accent mt-1 tabular-nums" style={{ textShadow: "0 0 18px rgb(var(--accent) / calc(0.5*var(--glow)))" }}>{fmt(data.total_ponderado)}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {data.tasa_cierre_real != null
              ? `Tu tasa real de cierre: ${data.tasa_cierre_real}%`
              : "Sin historial de cierre aún"}
          </p>
        </div>
      </div>

      {/* Tiles por etapa */}
      <div className="grid grid-cols-3 gap-3">
        {data.desglose.map((d) => {
          const hex = STAGE_HEX[d.estado] ?? "#94a3b8";
          return (
            <div key={d.estado} className="rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center" style={{ background: `${hex}10`, border: `1px solid ${hex}2e` }}>
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: hex, background: `${hex}1f`, border: `1px solid ${hex}40` }}>
                {d.prob}%
              </span>
              <p className="font-display text-xl font-bold leading-none tabular-nums" style={{ color: hex, textShadow: `0 0 10px ${hex}55` }}>{fmt(d.monto_total)}</p>
              <p className="text-[11px] font-medium text-zinc-300">{d.label}</p>
              <p className="text-[10px] text-zinc-500">{d.cantidad} prop.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}