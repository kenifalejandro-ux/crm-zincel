/** client/src/components/dashboard/TemperaturaLeadsChart.tsx — NEON
 * Antes: hover de fila hover:bg-red-50/yellow-50/zinc-50 (tema claro), barras track bg-zinc-800,
 * botón "Ver prospectos" text-brand, flecha text-zinc-300. Ahora: hover neon uniforme,
 * barras con glow, botón acento. Lógica/drill-down INTACTO.
 */
import { useState } from "react";
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
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
  { key: "caliente", label: "Calientes", score: "Score 75+",   tono: "danger" },
  { key: "activo",   label: "Activos",   score: "Score 50–74", tono: "accent" },
  { key: "tibio",    label: "Tibios",    score: "Score 25–49", tono: "muted"  },
  { key: "frio",     label: "Fríos",     score: "Score 0–24",  tono: "p3"     },
] as const;

export function TemperaturaLeadsChart({ caliente, activo, tibio, frio, onClick }: Props) {
  const c = useChartColors();
  const tono: Record<string, string> = { danger: c.danger, accent: c.accent, muted: c.muted, p3: c.palette[3] };
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
            <Thermometer size={14} className="mr-2.5 text-amber-400" strokeWidth={2} />
            Temperatura de Leads
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Score automático · {totalReal} leads en total · clic para ver empresas
          </p>
        </div>
        {onClick && (
          <button onClick={onClick} className="text-xs text-accent hover:underline">
            Ver prospectos →
          </button>
        )}
      </div>

      {totalReal === 0 && (
        <p className="text-xs text-zinc-500 text-center py-6">Sin actividad en el período seleccionado</p>
      )}

      {/* Barras clickeables */}
      {totalReal > 0 && <div className="space-y-2">
        {GRUPOS.map(g => {
          const valor  = valores[g.key];
          const pct    = Math.round((valor / total) * 100);
          const barPct = valor > 0 ? Math.max(Math.round((valor / maxValor) * 100), 3) : 0;
          const col    = tono[g.tono];

          return (
            <button
              key={g.key}
              onClick={() => abrirDrilldown([g.key], g.label)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/[0.04] group"
            >
              {/* Label */}
              <span className="text-[12px] font-semibold text-zinc-300 w-20 shrink-0 text-left">
                {g.label}
              </span>

              {/* Barra */}
              <div className="flex-1 h-5 bg-white/[0.06] rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500"
                  style={{ width: `${barPct}%`, backgroundColor: col, boxShadow: `0 0 8px ${col}88` }}
                />
              </div>

              {/* Valor + % */}
              <div className="w-20 shrink-0 text-right">
                <span className="text-[12px] font-bold text-zinc-200">{valor}</span>
                <span className="text-[10px] text-zinc-500 ml-1">· {pct}%</span>
              </div>

              {/* Flecha hover */}
              <span className="text-[10px] text-zinc-600 group-hover:text-accent transition shrink-0">→</span>
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