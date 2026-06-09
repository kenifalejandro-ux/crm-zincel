/** src/components/metricas/TabsPlataforma.tsx */

import { Plataforma } from "../../types/metricas.types";

type Tab = Plataforma | "todas" | "proyeccion" | "comparativa" | "rentabilidad" | "benchmarks" | "optimizador" | "formatos";

interface Props {
  activa:   Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { value: Tab; label: string; color: string }[] = [
  { value: "todas",        label: "Todas",        color: "text-zinc-600"    },
  { value: "meta",         label: "Meta Ads",     color: "text-blue-600"    },
  { value: "google",       label: "Google Ads",   color: "text-red-600"     },
  { value: "tiktok",       label: "TikTok Ads",   color: "text-pink-600"    },
  { value: "proyeccion",   label: "Proyección",   color: "text-violet-600"  },
  { value: "comparativa",  label: "Comparativa",  color: "text-emerald-600" },
  { value: "rentabilidad", label: "Rentabilidad", color: "text-green-600"   },
  { value: "optimizador",  label: "Optimizador",  color: "text-violet-600"  },
  { value: "benchmarks",   label: "Benchmarks",   color: "text-orange-600"  },
  { value: "formatos",     label: "Formatos",     color: "text-green-600"   },
];

export const TabsPlataforma = ({ activa, onChange }: Props) => (
  <div className="flex gap-1 bg-zinc-100 rounded-xl p-1 w-fit">
    {TABS.map((tab) => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
          activa === tab.value
            ? `bg-white shadow-sm ${tab.color}`
            : "text-zinc-600 hover:text-zinc-600"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
