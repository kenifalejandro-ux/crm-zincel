/** client/src/components/inteligencia/PrioridadOperacional.tsx */

import type { AccionPrioridad } from "../../services/inteligencia.api";

const NIVEL_STYLE = {
  critica:   { badge: "bg-red-100 text-red-700",    borde: "border-red-200",    bg: "bg-red-50"    },
  urgente:   { badge: "bg-amber-100 text-amber-700", borde: "border-amber-200", bg: "bg-amber-50"  },
  pendiente: { badge: "bg-blue-100 text-blue-700",   borde: "border-blue-200",  bg: "bg-blue-50"   },
};

const NIVEL_LABEL = {
  critica:   "CRÍTICO",
  urgente:   "URGENTE",
  pendiente: "PENDIENTE",
};

interface Props { acciones: AccionPrioridad[] }

export function PrioridadOperacional({ acciones }: Props) {
  if (!acciones.length) return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🎯</span>
        <h3 className="text-sm font-semibold text-zinc-800">Prioridad operacional</h3>
      </div>
      <div className="flex items-center justify-center py-6 text-xs text-emerald-600 font-medium gap-2">
        <span>✅</span> Todo al día — no hay acciones urgentes pendientes
      </div>
    </div>
  );

  const criticas  = acciones.filter(a => a.nivel === "critica");
  const urgentes  = acciones.filter(a => a.nivel === "urgente");
  const pendientes= acciones.filter(a => a.nivel === "pendiente");

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800">Haz esto primero</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Acciones ordenadas por impacto en ventas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticas.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {criticas.length} crítico{criticas.length > 1 ? "s" : ""}
            </span>
          )}
          {urgentes.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {urgentes.length} urgente{urgentes.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {acciones.map((acc, i) => {
          const s = NIVEL_STYLE[acc.nivel];
          return (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl border p-3.5 ${s.bg} ${s.borde}`}
            >
              {/* Número de orden */}
              <div className="shrink-0 w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-[10px] font-bold text-zinc-500 mt-0.5">
                {i + 1}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm">{acc.icono}</span>
                  <span className="text-xs font-semibold text-zinc-800">{acc.titulo}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${s.badge}`}>
                    {NIVEL_LABEL[acc.nivel]}
                  </span>
                  <span className="ml-auto text-xs font-bold text-zinc-700 shrink-0">{acc.cantidad}</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">{acc.descripcion}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
