/** client/src/components/llamadas/MotivosChart.tsx — REDISEÑO NEON
 * El chart YA usaba useChartColors() ✓. Único cambio: track de la barra
 * (antes bg-zinc-800 — plano) → bg-white/[0.05] neon. Lógica/props/datos INTACTOS.
 */
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { TrendingDown } from "lucide-react";

const LABELS: Record<string, string> = {
  precio_alto:        "Precio alto",
  ya_tiene_proveedor: "Ya tiene proveedor",
  sin_presupuesto:    "Sin presupuesto",
  no_le_interesa:     "No le interesa",
  tiene_web:          "Ya tiene web",
  no_toma_decision:   "No decide",
  otro:               "Otro",
};

interface Props { data: Array<{ motivo_perdida: string; total: number }>; }

export function MotivosChart({ data }: Props) {
  const c = useChartColors();
  const COLORES = [c.danger, c.accent, c.muted, c.palette[1], c.palette[3], c.palette[4], c.axis];
  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className={CARD_CLASS}>
      <h3 className={HEADER_CLASS}><TrendingDown size={14} className="mr-2.5 text-red-400" strokeWidth={2} />¿Por qué no cierran?</h3>
      <p className="text-[11px] text-zinc-500 font-medium mb-4">Motivos de pérdida registrados</p>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-xs text-zinc-500 text-center px-4">
          Sin motivos registrados aún — márcalos al editar un prospecto perdido
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((d, i) => {
            const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
            const color = COLORES[i % COLORES.length];
            return (
              <div key={d.motivo_perdida}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12.5px] text-zinc-300">{LABELS[d.motivo_perdida] ?? d.motivo_perdida}</span>
                  <span className="text-[12px] font-semibold text-zinc-200 tabular-nums">{d.total} <span className="text-zinc-500 font-normal">({pct}%)</span></span>
                </div>
                <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-zinc-500 pt-1">{total} prospectos perdidos en total</p>
        </div>
      )}
    </div>
  );
}