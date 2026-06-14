/** src/components/metricas/TabsPlataforma.tsx — REDISEÑO NEON
 * Antes: dropdowns agrupados en TEMA CLARO (text-amber-700, bg-white, border-slate-200) —
 *        confusos y fuera del theme. Ahora: navegación de 2 niveles visible —
 *        grupos (Campañas/Análisis/Estrategia/Orgánico) + sub-tabs del grupo activo.
 * Props (activa, onChange) y los `value` de cada tab INTACTOS — no cambia la lógica del router.
 */
import { Rocket, BarChart2, Target, Leaf } from "lucide-react";
import { Plataforma } from "../../types/metricas.types";

type Tab = Plataforma | "todas" | "cpl" | "proyeccion" | "comparativa" | "rentabilidad" | "roi" | "benchmarks" | "optimizador" | "formatos" | "ciclo" | "organico" | "competidores";

interface TabItem { value: Tab; label: string; color: string }
interface Grupo { id: string; label: string; Icon: typeof Rocket; tabs: TabItem[] }

const GRUPOS: Grupo[] = [
  { id: "campanas", label: "Campañas", Icon: Rocket, tabs: [
    { value: "todas",  label: "Todas",      color: "#94a3b8" },
    { value: "meta",   label: "Meta Ads",   color: "#3b82f6" },
    { value: "google", label: "Google Ads", color: "#ef4444" },
    { value: "tiktok", label: "TikTok Ads", color: "#ec4899" },
  ]},
  { id: "analisis", label: "Análisis", Icon: BarChart2, tabs: [
    { value: "comparativa",  label: "Comparativa",    color: "#34d399" },
    { value: "rentabilidad", label: "ROAS",           color: "#3b82f6" },
    { value: "roi",          label: "ROI",            color: "#22c55e" },
    { value: "cpl",          label: "Costo por Lead", color: "#0ea5e9" },
    { value: "proyeccion",   label: "Proyección",     color: "#a855f7" },
    { value: "benchmarks",   label: "Benchmarks",     color: "#f97316" },
  ]},
  { id: "estrategia", label: "Estrategia", Icon: Target, tabs: [
    { value: "optimizador", label: "Optimizador",    color: "#a855f7" },
    { value: "formatos",    label: "Formatos",       color: "#22c55e" },
    { value: "ciclo",       label: "Ciclo de Venta", color: "#f59e0b" },
  ]},
  { id: "organico", label: "Orgánico", Icon: Leaf, tabs: [
    { value: "organico",     label: "Contenido",    color: "#d946ef" },
    { value: "competidores", label: "Competidores", color: "#f43f5e" },
  ]},
];

interface Props { activa: Tab; onChange: (tab: Tab) => void; }

export function TabsPlataforma({ activa, onChange }: Props) {
  const grupoActivo = GRUPOS.find(g => g.tabs.some(t => t.value === activa)) ?? GRUPOS[0];

  return (
    <div className="neon-card p-2 space-y-2">
      {/* Grupos */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {GRUPOS.map((g) => {
          const act = g.id === grupoActivo.id;
          return (
            <button
              key={g.id}
              onClick={() => onChange(g.tabs[0].value)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all border ${
                act ? "bg-accent-15 text-accent border-accent-30" : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
              style={act ? { boxShadow: "0 0 16px rgb(var(--accent) / calc(0.18*var(--glow)))" } : undefined}
            >
              <g.Icon size={14} /> {g.label}
              <span className="text-[10px] opacity-50 font-normal">{g.tabs.length}</span>
            </button>
          );
        })}
      </div>
      {/* Sub-tabs del grupo activo */}
      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/[0.06]">
        {grupoActivo.tabs.map((tb) => {
          const act = tb.value === activa;
          return (
            <button
              key={tb.value}
              onClick={() => onChange(tb.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                act ? "text-zinc-100 bg-white/[0.07] border-white/15" : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/[0.03]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: tb.color, boxShadow: act ? `0 0 7px ${tb.color}` : "none" }} />
              {tb.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}