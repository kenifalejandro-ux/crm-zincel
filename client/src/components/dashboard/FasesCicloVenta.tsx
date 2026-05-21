/** client/src/components/dashboard/FasesCicloVenta.tsx */

import { useEffect, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { getCicloVenta } from "../../services/prospectos.api";

export function FasesCicloVenta() {
  const [kpis, setKpis] = useState<{
    promedio_dias:               number | null;
    promedio_contacto_propuesta: number | null;
    promedio_propuesta_cierre:   number | null;
    total_cerrados:              number;
  } | null>(null);

  useEffect(() => {
    getCicloVenta()
      .then(d => setKpis(d.kpis))
      .catch(() => {});
  }, []);

  if (!kpis || kpis.total_cerrados === 0) return null;

  const f1    = kpis.promedio_contacto_propuesta;
  const f2    = kpis.promedio_propuesta_cierre;
  const total = kpis.promedio_dias;

  const p1 = total && f1 ? Math.round((f1 / total) * 100) : 0;
  const p2 = total && f2 ? Math.round((f2 / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-zinc-800">Ciclo de venta promedio</p>
          <p className="text-[11px] text-zinc-400">Basado en {kpis.total_cerrados} venta{kpis.total_cerrados !== 1 ? "s" : ""} cerrada{kpis.total_cerrados !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
          <Clock size={12} />
          <span className="text-xs font-bold">{total}d total</span>
        </div>
      </div>

      {/* Fases en línea */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex-1 min-w-[90px] bg-blue-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-blue-500 font-medium uppercase tracking-wide mb-0.5">📋 Prospección</p>
          <p className="text-lg font-bold text-blue-700">{f1 != null ? `${f1}d` : "—"}</p>
          <p className="text-[9px] text-blue-400">contacto → propuesta</p>
        </div>
        <ArrowRight size={14} className="text-zinc-300 shrink-0" />
        <div className="flex-1 min-w-[90px] bg-amber-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-amber-600 font-medium uppercase tracking-wide mb-0.5">⚖️ Negociación</p>
          <p className="text-lg font-bold text-amber-700">{f2 != null ? `${f2}d` : "—"}</p>
          <p className="text-[9px] text-amber-500">propuesta → cierre</p>
        </div>
        <ArrowRight size={14} className="text-zinc-300 shrink-0" />
        <div className="flex-1 min-w-[90px] bg-green-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-green-600 font-medium uppercase tracking-wide mb-0.5">✅ Cierre</p>
          <p className="text-lg font-bold text-green-700">{total != null ? `${total}d` : "—"}</p>
          <p className="text-[9px] text-green-500">ciclo completo</p>
        </div>
      </div>

      {/* Barra de proporción */}
      {total && total > 0 && (
        <div className="space-y-1.5">
          <div className="flex h-2 rounded-full overflow-hidden gap-px bg-zinc-100">
            <div className="bg-blue-400 transition-all rounded-l-full" style={{ width: `${p1}%` }} />
            <div className="bg-amber-400 transition-all rounded-r-full" style={{ width: `${p2}%` }} />
          </div>
          <div className="flex gap-4 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              Prospección {p1}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Negociación {p2}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
