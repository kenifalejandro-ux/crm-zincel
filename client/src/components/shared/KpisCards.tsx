/** client/src/components/shared/KpisCards.tsx */

import type { ReactNode } from "react";
import { GLASS_BASE, GLASS_HOVER } from "../../lib/tokens";

export interface KpiItem {
  label: string;
  valor: string | number;
  icon: ReactNode;
  color: string;   // text color class  e.g. "text-amber-600"
  bg: string;      // bg color class    e.g. "bg-amber-50"
  sub?: string;    // context line opcional e.g. "11 campañas"
}

interface Props {
  items: KpiItem[];
  cols?: 2 | 3 | 4 | 5;
}

/**
 * Deriva la clase de color para la barra superior a partir del prop `color`
 * (que es una clase Tailwind text-*-XXX).
 * Mapeo conservador: solo las familias más comunes del CRM.
 */
function colorToStrip(textColorClass: string): string {
  const map: Record<string, string> = {
    "text-amber-600":    "bg-amber-400",
    "text-amber-500":    "bg-amber-400",
    "text-yellow-600":   "bg-yellow-400",
    "text-yellow-500":   "bg-yellow-400",
    "text-green-600":    "bg-green-500",
    "text-green-500":    "bg-green-500",
    "text-emerald-600":  "bg-emerald-500",
    "text-emerald-500":  "bg-emerald-500",
    "text-blue-600":     "bg-blue-500",
    "text-blue-500":     "bg-blue-500",
    "text-indigo-600":   "bg-indigo-500",
    "text-indigo-500":   "bg-indigo-500",
    "text-violet-600":   "bg-violet-500",
    "text-violet-500":   "bg-violet-500",
    "text-purple-600":   "bg-purple-500",
    "text-purple-500":   "bg-purple-500",
    "text-pink-600":     "bg-pink-500",
    "text-pink-500":     "bg-pink-500",
    "text-red-600":      "bg-red-500",
    "text-red-500":      "bg-red-500",
    "text-rose-600":     "bg-rose-500",
    "text-rose-500":     "bg-rose-500",
    "text-orange-600":   "bg-orange-500",
    "text-orange-500":   "bg-orange-500",
    "text-teal-600":     "bg-teal-500",
    "text-teal-500":     "bg-teal-500",
    "text-cyan-600":     "bg-cyan-500",
    "text-cyan-500":     "bg-cyan-500",
    "text-sky-600":      "bg-sky-500",
    "text-sky-500":      "bg-sky-500",
    "text-slate-600":    "bg-slate-400",
    "text-zinc-600":     "bg-zinc-400",
    "text-zinc-800":     "bg-zinc-600",
  };
  return map[textColorClass] ?? "bg-slate-300";
}

export function KpiCards({ items, cols = 3 }: Props) {
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-3 lg:grid-cols-5",
  }[cols];

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
      {items.map((k, i) => (
        <div
          key={i}
          className={`relative overflow-hidden flex flex-col ${GLASS_BASE} ${GLASS_HOVER}`}
        >
          {/* Barra de color superior */}
          <div className={`h-1 w-full shrink-0 ${colorToStrip(k.color)}`} />

          {/* Contenido del card */}
          <div className="flex items-center gap-4 p-5 flex-1">
            {/* Icono */}
            <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${k.bg}`}>
              <span className={k.color}>
                {/* Renderiza el icono pasando size si es posible; wrappear en span no cambia el nodo */}
                <span className="[&>svg]:w-5 [&>svg]:h-5">{k.icon}</span>
              </span>
            </div>

            {/* Valor + label */}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1.5 truncate">
                {k.label}
              </p>
              <p className={`text-2xl lg:text-3xl font-black tabular-nums leading-tight ${k.color}`}>
                {k.valor}
              </p>
              {k.sub && (
                <p className="text-[11px] text-slate-400 mt-1 truncate">{k.sub}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
