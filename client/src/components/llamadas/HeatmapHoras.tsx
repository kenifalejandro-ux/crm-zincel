/** client/src/components/llamadas/HeatmapHoras.tsx */

import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { Clock } from "lucide-react";

interface HoraData {
  hora:        number;
  total:       number;
  contestadas: number;
  tasa:        number;
}

interface Props { data: HoraData[] }

const HORAS       = Array.from({ length: 10 }, (_, i) => i + 9);
const MIN_MUESTRA = 5;

function colorBarra(tasa: number, total: number, confiable: boolean) {
  if (total === 0)  return "bg-zinc-100";
  if (!confiable)   return "bg-zinc-200";
  if (tasa >= 60)   return "bg-[#27272a]";
  if (tasa >= 40)   return "bg-brand";
  if (tasa >= 20)   return "bg-[#a1a1aa]";
  return "bg-[#f87171]";
}

function horaLabel(h: number) {
  return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

export function HeatmapHoras({ data }: Props) {
  const byHora: Record<number, HoraData> = {};
  data.forEach(d => { byHora[d.hora] = d; });
  const maxTotal = Math.max(...data.map(d => d.total), 1);

  const confiables = data.filter(d => d.total >= MIN_MUESTRA);
  const mejorHora  = confiables.reduce<HoraData | null>(
    (best, d) => (!best || d.tasa > best.tasa || (d.tasa === best.tasa && d.total > best.total)) ? d : best,
    null
  );

  const masVolumen = data.reduce<HoraData | null>(
    (best, d) => (!best || d.total > best.total) ? d : best, null
  );

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={HEADER_CLASS}><Clock size={14} className="mr-2.5 text-amber-500" strokeWidth={2} />Mejor hora para llamar</h3>
          <p className="text-[11px] text-zinc-600 font-medium mt-1">
            Altura = volumen · color = % contestadas · gris = muestra insuficiente (&lt;{MIN_MUESTRA})
          </p>
        </div>
        <div className="text-right space-y-1">
          {mejorHora ? (
            <div>
              <p className="text-[10px] text-zinc-600">Más efectiva</p>
              <p className="text-sm font-bold text-zinc-800">{horaLabel(mejorHora.hora)}</p>
              <p className="text-[10px] text-zinc-700">{mejorHora.tasa}% · {mejorHora.total} llamadas</p>
            </div>
          ) : masVolumen && masVolumen.total > 0 ? (
            <div>
              <p className="text-[10px] text-zinc-600">Mayor volumen</p>
              <p className="text-sm font-bold text-brand">{horaLabel(masVolumen.hora)}</p>
              <p className="text-[10px] text-zinc-600">Muestra aún baja</p>
            </div>
          ) : null}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-xs text-zinc-600">
          Sin datos para el período seleccionado
        </div>
      ) : (
        <>
          <div className="flex items-end gap-1" style={{ height: 80 }}>
            {HORAS.map(hora => {
              const d         = byHora[hora];
              const total     = d?.total ?? 0;
              const tasa      = d?.tasa  ?? 0;
              const confiable = total >= MIN_MUESTRA;
              const height    = total > 0 ? Math.max((total / maxTotal) * 72, 6) : 3;
              const color     = colorBarra(tasa, total, confiable);
              return (
                <div key={hora} className="flex-1 flex flex-col items-center gap-0.5"
                  title={total === 0
                    ? `${horaLabel(hora)}: sin llamadas`
                    : !confiable
                      ? `${horaLabel(hora)}: ${total} llamada${total > 1 ? "s" : ""} — muestra insuficiente`
                      : `${horaLabel(hora)}: ${total} llamadas · ${tasa}% contestadas`
                  }
                >
                  <div className={`w-full ${color} rounded-t-sm transition-all ${!confiable && total > 0 ? "opacity-50" : ""}`}
                    style={{ height }} />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 mt-1">
            {HORAS.map(hora => (
              <div key={hora} className="flex-1 text-center">
                <span className="text-[9px] text-zinc-600">{horaLabel(hora)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-zinc-100">
        {[
          { color: "bg-[#27272a]",          label: "+60%" },
          { color: "bg-brand",          label: "40–60%" },
          { color: "bg-[#a1a1aa]",          label: "20–40%" },
          { color: "bg-[#f87171]",          label: "-20%" },
          { color: "bg-zinc-200 opacity-50", label: `<${MIN_MUESTRA} llamadas` },
          { color: "bg-zinc-100",            label: "Sin datos" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1 text-[10px] text-zinc-700">
            <span className={`w-2.5 h-2.5 rounded-sm ${color} inline-block`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
