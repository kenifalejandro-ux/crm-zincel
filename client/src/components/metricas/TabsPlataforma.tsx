/** src/components/metricas/TabsPlataforma.tsx */

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Plataforma } from "../../types/metricas.types";

type Tab = Plataforma | "todas" | "cpl" | "proyeccion" | "comparativa" | "rentabilidad" | "roi" | "benchmarks" | "optimizador" | "formatos" | "ciclo" | "organico" | "competidores";

interface TabItem { value: Tab; label: string; dot: string }
interface Grupo   { label: string; activeColor: string; borderColor: string; tabs: TabItem[] }

const GRUPOS: Grupo[] = [
  {
    label: "Campañas",
    activeColor: "text-amber-700",
    borderColor: "border-brand/25 bg-brand/8",
    tabs: [
      { value: "todas",  label: "Todas",      dot: "bg-slate-400" },
      { value: "meta",   label: "Meta Ads",   dot: "bg-blue-500"  },
      { value: "google", label: "Google Ads", dot: "bg-red-500"   },
      { value: "tiktok", label: "TikTok Ads", dot: "bg-pink-500"  },
    ],
  },
  {
    label: "Análisis",
    activeColor: "text-amber-700",
    borderColor: "border-brand/25 bg-brand/8",
    tabs: [
      { value: "comparativa",  label: "Comparativa",     dot: "bg-emerald-500" },
      { value: "rentabilidad", label: "ROAS",            dot: "bg-blue-500"    },
      { value: "roi",          label: "ROI",             dot: "bg-green-500"   },
      { value: "cpl",          label: "Costo por Lead",  dot: "bg-sky-500"     },
      { value: "proyeccion",   label: "Proyección",      dot: "bg-violet-500"  },
      { value: "benchmarks",   label: "Benchmarks",      dot: "bg-orange-500"  },
    ],
  },
  {
    label: "Estrategia",
    activeColor: "text-amber-700",
    borderColor: "border-brand/25 bg-brand/8",
    tabs: [
      { value: "optimizador", label: "Optimizador",    dot: "bg-violet-500" },
      { value: "formatos",    label: "Formatos",       dot: "bg-green-500"  },
      { value: "ciclo",       label: "Ciclo de Venta", dot: "bg-amber-500"  },
    ],
  },
  {
    label: "Orgánico",
    activeColor: "text-amber-700",
    borderColor: "border-brand/25 bg-brand/8",
    tabs: [
      { value: "organico",     label: "Contenido",    dot: "bg-fuchsia-500" },
      { value: "competidores", label: "Competidores", dot: "bg-rose-500"    },
    ],
  },
];

interface Props {
  activa:   Tab;
  onChange: (tab: Tab) => void;
}

export function TabsPlataforma({ activa, onChange }: Props) {
  const [abierto, setAbierto] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const grupoActivo = GRUPOS.findIndex(g => g.tabs.some(t => t.value === activa));
  const tabActivaLabel = GRUPOS.flatMap(g => g.tabs).find(t => t.value === activa)?.label ?? "";

  return (
    <div ref={ref} className="flex items-center gap-2 flex-wrap">
      {GRUPOS.map((grupo, gi) => {
        const esGrupoActivo = gi === grupoActivo;
        const estaAbierto   = abierto === gi;

        return (
          <div key={gi} className="relative">
            <button
              onClick={() => setAbierto(estaAbierto ? null : gi)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition select-none ${
                esGrupoActivo
                  ? `${grupo.activeColor} ${grupo.borderColor} shadow-[0_1px_4px_rgba(206,171,17,0.20)]`
                  : "text-slate-600 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-sm"
              }`}
            >
              <span>{grupo.label}</span>
              {esGrupoActivo && (
                <span className="text-[10px] opacity-60 font-normal">· {tabActivaLabel}</span>
              )}
              <ChevronDown
                size={12}
                className={`transition-transform ${estaAbierto ? "rotate-180" : ""} opacity-50`}
              />
            </button>

            {estaAbierto && (
              <div className="absolute top-full left-0 mt-1.5 z-50 bg-slate-800/60 border border-white/10 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.10)] py-1.5 min-w-[170px]">
                {grupo.tabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => { onChange(tab.value); setAbierto(null); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs text-left transition ${
                      activa === tab.value
                        ? "bg-brand/8 font-bold text-amber-700"
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tab.dot}`} />
                    {tab.label}
                    {activa === tab.value && (
                      <span className="ml-auto w-1 h-4 rounded-full bg-brand shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
