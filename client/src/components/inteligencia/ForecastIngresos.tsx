/** client/src/components/inteligencia/ForecastIngresos.tsx */

import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { getForecastIngresos, type ForecastIngresos } from "../../services/inteligencia.api";

const STAGE_CONFIG: Record<string, { bg: string; num: string; badge: string; badgeText: string }> = {
  enviada:        { bg: "bg-zinc-50",    num: "text-zinc-800",   badge: "bg-zinc-200",   badgeText: "text-zinc-600"   },
  en_negociacion: { bg: "bg-amber-50",   num: "text-amber-700",  badge: "bg-amber-200",  badgeText: "text-amber-700"  },
  cerrada_ganada: { bg: "bg-zinc-900",   num: "text-white",      badge: "bg-zinc-700",   badgeText: "text-zinc-100"   },
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
          <div className="p-1.5 rounded-lg bg-amber-50">
            <TrendingUp size={14} className="text-amber-500" />
          </div>
          <div>
            <h3 className={HEADER_CLASS}>Forecast de ingresos ponderado</h3>
            <p className="text-[11px] text-zinc-600">Pipeline × probabilidad de cierre</p>
          </div>
        </div>
      </div>

      {/* Total KPI */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="text-center bg-zinc-900 rounded-2xl py-4">
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Pipeline total</p>
          <p className="text-3xl font-bold text-white mt-1">{fmt(data.total_sin_ponderar)}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Monto real en juego</p>
        </div>
        <div className="text-center bg-amber-50 border border-amber-100 rounded-2xl py-4">
          <p className="text-[10px] text-amber-600 uppercase tracking-widest font-semibold">Ingreso esperado</p>
          <p className="text-3xl font-bold text-amber-700 mt-1">{fmt(data.total_ponderado)}</p>
          <p className="text-[10px] text-amber-500 mt-0.5">
            {data.tasa_cierre_real != null
              ? `Tu tasa real de cierre: ${data.tasa_cierre_real}%`
              : "Sin historial de cierre aún"}
          </p>
        </div>
      </div>

      {/* Tiles por etapa */}
      <div className="grid grid-cols-3 gap-3">
        {data.desglose.map((d) => {
          const cfg = STAGE_CONFIG[d.estado] ?? { bg: "bg-zinc-50", num: "text-zinc-800", badge: "bg-zinc-200", badgeText: "text-zinc-600" };
          const isWhite = d.estado === "cerrada_ganada";
          return (
            <div key={d.estado} className={`${cfg.bg} rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center`}>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.badge} ${cfg.badgeText}`}>
                {d.prob}%
              </span>
              <p className={`text-xl font-bold leading-none ${cfg.num}`}>{fmt(d.monto_total)}</p>
              <p className={`text-[11px] font-medium ${isWhite ? "text-zinc-300" : "text-zinc-600"}`}>{d.label}</p>
              <p className={`text-[10px] ${isWhite ? "text-zinc-500" : "text-zinc-400"}`}>
                {d.cantidad} prop.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
