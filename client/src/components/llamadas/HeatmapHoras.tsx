/** client/src/components/llamadas/HeatmapHoras.tsx */

interface HoraData {
  hora:        number;
  total:       number;
  contestadas: number;
  tasa:        number;
}

interface Props { data: HoraData[] }

const HORAS        = Array.from({ length:10 }, (_, i) => i + 9); // 6am–9pm
const MIN_MUESTRA  = 5; // mínimo de llamadas para considerar una franja estadísticamente válida

function colorBarra(tasa: number, total: number, confiable: boolean) {
  if (total === 0)    return "bg-gray-100";
  if (!confiable)     return "bg-gray-200";   // baja muestra — gris neutro
  if (tasa >= 60)     return "bg-emerald-500";
  if (tasa >= 40)     return "bg-yellow-400";
  if (tasa >= 20)     return "bg-orange-400";
  return "bg-red-400";
}

function horaLabel(h: number) {
  return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

export function HeatmapHoras({ data }: Props) {
  const byHora: Record<number, HoraData> = {};
  data.forEach(d => { byHora[d.hora] = d; });
  const maxTotal = Math.max(...data.map(d => d.total), 1);

  // Solo franjas con muestra suficiente son confiables
  const confiables = data.filter(d => d.total >= MIN_MUESTRA);
  const mejorHora  = confiables.reduce<HoraData | null>(
    (best, d) => (!best || d.tasa > best.tasa || (d.tasa === best.tasa && d.total > best.total)) ? d : best,
    null
  );

  // Hora con más volumen (independiente de confiabilidad)
  const masVolumen = data.reduce<HoraData | null>(
    (best, d) => (!best || d.total > best.total) ? d : best, null
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800">Mejor hora para llamar</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Altura = volumen · color = % contestadas · gris = muestra insuficiente (&lt;{MIN_MUESTRA})
          </p>
        </div>
        <div className="text-right space-y-1">
          {mejorHora ? (
            <div>
              <p className="text-[10px] text-zinc-400">Más efectiva ✓</p>
              <p className="text-sm font-bold text-emerald-600">{horaLabel(mejorHora.hora)}</p>
              <p className="text-[10px] text-zinc-500">{mejorHora.tasa}% · {mejorHora.total} llamadas</p>
            </div>
          ) : masVolumen && masVolumen.total > 0 ? (
            <div>
              <p className="text-[10px] text-amber-500">Mayor volumen</p>
              <p className="text-sm font-bold text-amber-600">{horaLabel(masVolumen.hora)}</p>
              <p className="text-[10px] text-zinc-400">Muestra aún baja</p>
            </div>
          ) : null}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-xs text-zinc-400">
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
                <div
                  key={hora}
                  className="flex-1 flex flex-col items-center gap-0.5"
                  title={
                    total === 0
                      ? `${horaLabel(hora)}: sin llamadas`
                      : !confiable
                        ? `${horaLabel(hora)}: ${total} llamada${total > 1 ? "s" : ""} — muestra insuficiente para ser confiable (mín. ${MIN_MUESTRA})`
                        : `${horaLabel(hora)}: ${total} llamadas · ${tasa}% contestadas ✓ confiable`
                  }
                >
                  <div
                    className={`w-full ${color} rounded-t-sm transition-all ${!confiable && total > 0 ? "opacity-50" : ""}`}
                    style={{ height }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 mt-1">
            {HORAS.map(hora => (
              <div key={hora} className="flex-1 text-center">
                <span className="text-[9px] text-zinc-400">{horaLabel(hora)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-50">
        {[
          { color: "bg-emerald-500", label: "+60%" },
          { color: "bg-yellow-400",  label: "40–60%" },
          { color: "bg-orange-400",  label: "20–40%" },
          { color: "bg-red-400",     label: "-20%" },
          { color: "bg-gray-200 opacity-50", label: `<${MIN_MUESTRA} llamadas` },
          { color: "bg-gray-100",    label: "Sin datos" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1 text-[10px] text-zinc-500">
            <span className={`w-2.5 h-2.5 rounded-sm ${color} inline-block`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
