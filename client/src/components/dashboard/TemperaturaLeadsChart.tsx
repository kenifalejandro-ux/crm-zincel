/** client/src/components/dashboard/TemperaturaLeadsChart.tsx */
import { useState } from "react";
import { CARD_CLASS, HEADER_CLASS, COLORS } from "../../lib/tokens";
import { Thermometer } from "lucide-react";
import { DrilldownModal } from "../inteligencia/DrilldownModal";
import type { LeadDrilldown } from "../inteligencia/DrilldownModal";
import { getLeadsScoreNivel } from "../../services/inteligencia.api";

interface Props {
  caliente: number;
  activo:   number;
  tibio:    number;
  frio:     number;
  onClick?: () => void;
}

const GRUPOS = [
  { key: "caliente", label: "Calientes", score: "Score 75+",   color: COLORS.danger,   hover: "hover:bg-red-50"    },
  { key: "activo",   label: "Activos",   score: "Score 50–74", color: COLORS.primary,  hover: "hover:bg-yellow-50" },
  { key: "tibio",    label: "Tibios",    score: "Score 25–49", color: COLORS.muted,    hover: "hover:bg-zinc-50"   },
  { key: "frio",     label: "Fríos",     score: "Score 0–24",  color: COLORS.dark,     hover: "hover:bg-zinc-50"   },
];

export function TemperaturaLeadsChart({ caliente, activo, tibio, frio, onClick }: Props) {
  const totalReal = caliente + activo + tibio + frio;
  const total    = totalReal || 1;
  const maxValor = Math.max(caliente, activo, tibio, frio, 1);

  const [drilldownNivel,   setDrilldownNivel]   = useState<string | null>(null);
  const [drilldownLabel,   setDrilldownLabel]   = useState("");
  const [drilldownLeads,   setDrilldownLeads]   = useState<LeadDrilldown[]>([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  async function abrirDrilldown(niveles: string[], label: string) {
    setDrilldownNivel(label);
    setDrilldownLabel(label);
    setDrilldownLoading(true);
    setDrilldownLeads([]);
    try {
      const rows = await getLeadsScoreNivel(niveles);
      setDrilldownLeads(rows.map(r => ({
        id:              r.id,
        empresa:         r.empresa,
        nombre_contacto: r.nombre_contacto,
        telefono:        r.telefono,
        ciudad:          r.ciudad,
        etapa_pipeline:  r.etapa_pipeline,
        extra:           `Score: ${r.score}`,
      })));
    } catch { /* silencioso */ }
    finally { setDrilldownLoading(false); }
  }

  const valores: Record<string, number> = { caliente, activo, tibio, frio };

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className={HEADER_CLASS}>
            <Thermometer size={14} className="mr-2.5 text-amber-500" strokeWidth={2} />
            Temperatura de Leads
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Score automático · {totalReal} leads en total · clic para ver empresas
          </p>
        </div>
        {onClick && (
          <button onClick={onClick} className="text-xs text-brand hover:underline">
            Ver prospectos →
          </button>
        )}
      </div>

      {totalReal === 0 && (
        <p className="text-xs text-zinc-400 text-center py-6">Sin actividad en el período seleccionado</p>
      )}

      {/* Barras clickeables */}
      {totalReal > 0 && <div className="space-y-2">
        {GRUPOS.map(g => {
          const valor  = valores[g.key];
          const pct    = Math.round((valor / total) * 100);
          const barPct = valor > 0 ? Math.max(Math.round((valor / maxValor) * 100), 3) : 0;

          return (
            <button
              key={g.key}
              onClick={() => abrirDrilldown([g.key], g.label)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 transition ${g.hover} group`}
            >
              {/* Label */}
              <span className="text-[12px] font-semibold text-zinc-700 w-20 shrink-0 text-left">
                {g.label}
              </span>

              {/* Barra */}
              <div className="flex-1 h-5 bg-zinc-100 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500"
                  style={{ width: `${barPct}%`, backgroundColor: g.color }}
                />
              </div>

              {/* Valor + % */}
              <div className="w-20 shrink-0 text-right">
                <span className="text-[12px] font-bold text-zinc-800">{valor}</span>
                <span className="text-[10px] text-zinc-400 ml-1">· {pct}%</span>
              </div>

              {/* Flecha hover */}
              <span className="text-[10px] text-zinc-300 group-hover:text-zinc-500 transition shrink-0">→</span>
            </button>
          );
        })}
      </div>}

      {drilldownNivel && (
        <DrilldownModal
          titulo={drilldownLabel}
          leads={drilldownLeads}
          cargando={drilldownLoading}
          onCerrar={() => setDrilldownNivel(null)}
        />
      )}
    </div>
  );
}
