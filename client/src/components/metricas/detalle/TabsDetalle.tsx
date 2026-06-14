/** src/components/metricas/detalle/TabsDetalle.tsx */

type Tab = "resumen" | "funnel" | "analisis" | "proyeccion";

interface Props {
  activa:   Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { value: Tab; label: string; emoji: string }[] = [
  { value: "resumen",    label: "Resumen",    emoji: "📊" },
  { value: "funnel",     label: "Pipeline",   emoji: "🔄" },
  { value: "analisis",   label: "Análisis",   emoji: "🔍" },
  { value: "proyeccion", label: "Proyección", emoji: "📈" },
];

export const TabsDetalle = ({ activa, onChange }: Props) => (
  <div className="overflow-x-auto -mx-1 px-1">
    <div className="flex gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1 min-w-max">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
            activa === tab.value
              ? "bg-white/[0.08] text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span>{tab.emoji}</span>
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

export type { Tab };