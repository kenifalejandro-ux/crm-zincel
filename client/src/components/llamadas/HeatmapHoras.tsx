/** client/src/components/llamadas/HeatmapHoras.tsx — REDISEÑO NEON
 * Antes: barras tema claro (bg-zinc-100/bg-zinc-200/bg-brand) + leyenda clara.
 * Ahora: escala de color neon con glow, % al hover, panel "más efectiva" neon.
 * Props/lógica (HoraData, MIN_MUESTRA, mejorHora, masVolumen) INTACTOS.
 */
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { Clock } from "lucide-react";

interface HoraData { hora: number; total: number; contestadas: number; tasa: number; }
interface Props { data: HoraData[] }

const HORAS = Array.from({ length: 10 }, (_, i) => i + 9);
const MIN_MUESTRA = 5;

function colorBarra(tasa: number, total: number, confiable: boolean): string {
  if (total === 0) return "#3f4453";
  if (!confiable)  return "#3f4453";
  if (tasa >= 60)  return "rgb(var(--accent))";
  if (tasa >= 40)  return "#22d3ee";
  if (tasa >= 20)  return "#fbbf24";
  return "#f87171";
}
function horaLabel(h: number) { return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`; }

export function HeatmapHoras({ data }: Props) {
  const byHora: Record<number, HoraData> = {};
  data.forEach(d => { byHora[d.hora] = d; });
  const maxTotal = Math.max(...data.map(d => d.total), 1);

  const confiables = data.filter(d => d.total >= MIN_MUESTRA);
  const mejorHora = confiables.reduce<HoraData | null>(
    (best, d) => (!best || d.tasa > best.tasa || (d.tasa === best.tasa && d.total > best.total)) ? d : best, null);
  const masVolumen = data.reduce<HoraData | null>((best, d) => (!best || d.total > best.total) ? d : best, null);

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className={HEADER_CLASS}><Clock size={14} className="mr-2.5 text-amber-400" strokeWidth={2} />Mejor hora para llamar</h3>
          <p className="text-[11px] text-zinc-500 font-medium mt-1">Altura = volumen · color = % contestadas · gris = muestra &lt;{MIN_MUESTRA}</p>
        </div>
        <div className="text-right shrink-0">
          {mejorHora ? (
            <div className="neon-panel px-3 py-1.5">
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Más efectiva</p>
              <p className="font-display text-[15px] font-bold text-accent leading-none mt-0.5" style={{ textShadow: "0 0 12px rgb(var(--accent) / calc(0.5*var(--glow)))" }}>{horaLabel(mejorHora.hora)}</p>
              <p className="text-[9.5px] text-zinc-400 mt-0.5">{mejorHora.tasa}% · {mejorHora.total} llam.</p>
            </div>
          ) : masVolumen && masVolumen.total > 0 ? (
            <div className="neon-panel px-3 py-1.5">
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Mayor volumen</p>
              <p className="font-display text-[15px] font-bold text-accent leading-none mt-0.5">{horaLabel(masVolumen.hora)}</p>
              <p className="text-[9.5px] text-zinc-500 mt-0.5">Muestra aún baja</p>
            </div>
          ) : null}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-xs text-zinc-500">Sin datos para el período seleccionado</div>
      ) : (
        <>
          <div className="flex items-end gap-1.5" style={{ height: 96 }}>
            {HORAS.map(hora => {
              const d = byHora[hora];
              const total = d?.total ?? 0;
              const tasa = d?.tasa ?? 0;
              const confiable = total >= MIN_MUESTRA;
              const height = total > 0 ? Math.max((total / maxTotal) * 88, 5) : 3;
              const color = colorBarra(tasa, total, confiable);
              const best = mejorHora && d?.hora === mejorHora.hora;
              return (
                <div key={hora} className="flex-1 flex flex-col items-center justify-end group relative"
                  title={total === 0 ? `${horaLabel(hora)}: sin llamadas`
                    : !confiable ? `${horaLabel(hora)}: ${total} llamada${total > 1 ? "s" : ""} — muestra insuficiente`
                    : `${horaLabel(hora)}: ${total} llamadas · ${tasa}% contestadas`}>
                  {total > 0 && (
                    <span className="text-[9px] font-bold tabular-nums mb-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>{tasa}%</span>
                  )}
                  <div className="w-full rounded-t-md transition-all" style={{ height, background: color, boxShadow: best ? `0 0 14px ${color}` : `0 0 6px ${color}66`, border: best ? `1px solid ${color}` : "none", opacity: !confiable && total > 0 ? 0.55 : 1 }} />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {HORAS.map(hora => <div key={hora} className="flex-1 text-center"><span className="text-[9px] text-zinc-600">{horaLabel(hora)}</span></div>)}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/[0.07]">
        {[
          { color: "rgb(var(--accent))", label: "+60%" },
          { color: "#22d3ee", label: "40–60%" },
          { color: "#fbbf24", label: "20–40%" },
          { color: "#f87171", label: "-20%" },
          { color: "#3f4453", label: `<${MIN_MUESTRA} llam.` },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />{label}
          </span>
        ))}
      </div>
    </div>
  );
}