/** client/src/components/finanzas/TabsFinanzas.tsx — NEON + iconos
 * Antes: bg-slate-800 + activo bg-slate-800/60 text-amber-700, SIN iconos. Ahora: tabs neon
 * con acento + icono a la izquierda de cada label.
 */

import { TrendingUp, TrendingDown, Landmark, BarChart2, Building2 } from "lucide-react";

export type TabFinanzas = "ingresos" | "egresos" | "prestamos" | "resumen" | "empresas";

interface Props {
  tab: TabFinanzas;
  onChange: (tab: TabFinanzas) => void;
}

const TABS: { value: TabFinanzas; label: string; Icon: typeof TrendingUp }[] = [
  { value: "ingresos",  label: "Ingresos",  Icon: TrendingUp   },
  { value: "egresos",   label: "Egresos",   Icon: TrendingDown },
  { value: "prestamos", label: "Préstamos", Icon: Landmark     },
  { value: "resumen",   label: "Resumen",   Icon: BarChart2    },
  { value: "empresas",  label: "Empresas",  Icon: Building2    },
];

export function TabsFinanzas({ tab, onChange }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap neon-card p-2 w-fit">
      {TABS.map(({ value, label, Icon }) => {
        const act = tab === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex items-center gap-2 px-4 py-2 text-[13px] rounded-xl transition font-semibold border ${
              act ? "bg-accent-15 text-accent border-accent-30" : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
            style={act ? { boxShadow: "0 0 16px rgb(var(--accent) / calc(0.18*var(--glow)))" } : undefined}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}