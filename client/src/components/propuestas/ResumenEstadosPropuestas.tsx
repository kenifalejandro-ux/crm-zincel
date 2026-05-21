/** client/src/components/propuestas/ResumenEstadosPropuestas.tsx */

import { useEffect, useState } from "react";
import { getResumenEstadosPropuestas } from "../../services/propuestas.api";
import type { ResumenEstadoPropuesta } from "../../services/propuestas.api";

const CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  enviada:         { label: "Enviadas",        bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400"   },
  en_negociacion:  { label: "En negociación",  bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400"  },
  cerrada_ganada:  { label: "Ganadas",         bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500"  },
  cerrada_perdida: { label: "Perdidas",        bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-400"    },
  vencida:         { label: "Vencidas",        bg: "bg-zinc-50",   text: "text-zinc-500",   dot: "bg-zinc-300"   },
};

function fmt(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function ResumenEstadosPropuestas() {
  const [data, setData] = useState<ResumenEstadoPropuesta[]>([]);

  useEffect(() => {
    getResumenEstadosPropuestas().then(setData).catch(() => {});
  }, []);

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-zinc-800">Estado de propuestas</p>
          <p className="text-[11px] text-zinc-400">{total} propuesta{total !== 1 ? "s" : ""} en total</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {Object.entries(CONFIG).map(([estado, cfg]) => {
          const item = data.find(d => d.estado === estado);
          const n    = item?.total       ?? 0;
          const m    = item?.monto_total ?? 0;
          const pct  = total > 0 ? Math.round((n / total) * 100) : 0;
          return (
            <div key={estado} className={`rounded-xl p-3 ${cfg.bg}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                <span className={`text-[11px] font-medium ${cfg.text}`}>{cfg.label}</span>
              </div>
              <p className={`text-2xl font-bold ${cfg.text}`}>{n}</p>
              {m > 0 && <p className={`text-[10px] mt-0.5 ${cfg.text} opacity-75`}>{fmt(m)}</p>}
              {total > 0 && (
                <div className="mt-2 h-1 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
