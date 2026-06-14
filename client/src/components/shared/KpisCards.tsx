/** client/src/components/shared/KpisCards.tsx — REDISEÑO NEON
 * Componente compartido de KPI cards. Antes: bg-amber-50/bg-blue-50 (iconos en cajas
 * pastel) + barra superior bg-*-400. Ahora: cards neon con glow, barra superior con
 * glow, ícono en círculo translúcido del color del KPI, número display.
 * API INTACTA (KpiItem{label,valor,icon,color,bg,sub}, props {items, cols}).
 *
 * NOTA: la prop `bg` (clase tipo "bg-amber-50") ya no se usa para el fondo claro;
 * derivamos el color desde `color` (clase text-*-XXX) → HEX neon. Mantengo `bg` en la
 * interfaz para no romper los ~6 componentes que pasan KpiItem.
 */
import type { ReactNode } from "react";

export interface KpiItem {
  label: string;
  valor: string | number;
  icon: ReactNode;
  color: string;   // clase text-*-XXX (define el color del KPI)
  bg: string;      // (legacy, ya no se usa para fondo claro)
  sub?: string;
}

interface Props { items: KpiItem[]; cols?: 2 | 3 | 4 | 5; }

/** clase text-*-XXX → HEX neon */
function colorToHex(textColorClass: string): string {
  const map: Record<string, string> = {
    "text-amber-600": "#fbbf24", "text-amber-500": "#fbbf24",
    "text-yellow-600": "#facc15", "text-yellow-500": "#facc15",
    "text-green-600": "#34d399", "text-green-500": "#34d399",
    "text-emerald-600": "#34d399", "text-emerald-500": "#34d399",
    "text-blue-600": "#3b82f6", "text-blue-500": "#3b82f6",
    "text-indigo-600": "#6366f1", "text-indigo-500": "#6366f1",
    "text-violet-600": "#a855f7", "text-violet-500": "#a855f7",
    "text-purple-600": "#a855f7", "text-purple-500": "#a855f7",
    "text-pink-600": "#ec4899", "text-pink-500": "#ec4899",
    "text-red-600": "#f87171", "text-red-500": "#f87171",
    "text-rose-600": "#fb7185", "text-rose-500": "#fb7185",
    "text-orange-600": "#fb923c", "text-orange-500": "#fb923c",
    "text-teal-600": "#2dd4bf", "text-cyan-600": "#22d3ee", "text-cyan-500": "#22d3ee",
    "text-sky-600": "#0ea5e9", "text-sky-500": "#0ea5e9",
    "text-slate-600": "#94a3b8", "text-zinc-600": "#a1a1aa", "text-zinc-800": "#71717a",
  };
  return map[textColorClass] ?? "#94a3b8";
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
      {items.map((k, i) => {
        const hex = colorToHex(k.color);
        return (
          <div key={i} className="neon-card neon-hover relative overflow-hidden p-4">
            {/* Barra superior con glow */}
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: hex, boxShadow: `0 0 10px ${hex}` }} />
            <div className="flex items-center gap-3.5">
              <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${hex}1a`, border: `1px solid ${hex}40`, color: hex, boxShadow: `0 0 14px ${hex}30` }}>
                <span className="[&>svg]:w-5 [&>svg]:h-5">{k.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest leading-none mb-1.5 truncate">{k.label}</p>
                <p className="font-display text-2xl lg:text-[26px] font-bold tabular-nums leading-tight" style={{ color: hex, textShadow: `0 0 16px ${hex}55` }}>{k.valor}</p>
                {k.sub && <p className="text-[11px] text-zinc-500 mt-1 truncate">{k.sub}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}