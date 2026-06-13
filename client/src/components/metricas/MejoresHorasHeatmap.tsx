/** src/components/metricas/MejoresHorasHeatmap.tsx */

import { MejorHora } from "../../types/instagramOrganico.types";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const HORAS = Array.from({ length: 24 }, (_, i) => i);

function fmtHora(h: number) {
  return h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

function intensidad(val: number, max: number): string {
  if (max === 0 || val === 0) return "bg-zinc-100";
  const ratio = val / max;
  if (ratio >= 0.8) return "bg-violet-600";
  if (ratio >= 0.6) return "bg-violet-400";
  if (ratio >= 0.4) return "bg-violet-300";
  if (ratio >= 0.2) return "bg-violet-200";
  return "bg-violet-100";
}

interface Props {
  datos: MejorHora[];
}

export function MejoresHorasHeatmap({ datos }: Props) {
  if (datos.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-zinc-500">
        Sin datos suficientes — sincroniza posts para ver el heatmap
      </div>
    );
  }

  const num = (v: number | string) => Number(v) || 0;

  // Normalizar: PG devuelve NUMERIC como string
  const datosN = datos.map(d => ({
    ...d,
    dia_semana:          Number(d.dia_semana),
    hora:                Number(d.hora),
    total_posts:         Number(d.total_posts),
    engagement_promedio: num(d.engagement_promedio),
    alcance_promedio:    num(d.alcance_promedio),
    likes_promedio:      num(d.likes_promedio),
  }));

  // Mapa rápido dia,hora → engagement
  const mapa = new Map<string, typeof datosN[0]>();
  let maxEng = 0;
  for (const d of datosN) {
    mapa.set(`${d.dia_semana}-${d.hora}`, d);
    if (d.engagement_promedio > maxEng) maxEng = d.engagement_promedio;
  }

  // Top 3 slots
  const top3 = [...datosN]
    .sort((a, b) => b.engagement_promedio - a.engagement_promedio)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Top 3 */}
      <div className="flex gap-3 flex-wrap">
        {top3.map((h, i) => (
          <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
            i === 0
              ? "bg-violet-50 border-violet-200 text-violet-800"
              : "bg-zinc-800/40 border-white/10 text-zinc-300"
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              i === 0 ? "bg-violet-600 text-white" : "bg-zinc-700 text-zinc-400"
            }`}>
              {i + 1}
            </span>
            {DIAS[h.dia_semana]} a las {fmtHora(h.hora)}
            <span className="text-zinc-500 font-normal">
              · {h.engagement_promedio.toFixed(1)}% eng. · {h.total_posts} posts
            </span>
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Cabecera horas */}
          <div className="flex">
            <div className="w-8 shrink-0" />
            {HORAS.map(h => (
              <div key={h} className="flex-1 text-center text-[9px] text-zinc-400 pb-1">
                {h % 3 === 0 ? fmtHora(h) : ""}
              </div>
            ))}
          </div>

          {/* Filas por día */}
          {DIAS.map((dia, dIdx) => (
            <div key={dIdx} className="flex items-center gap-0 mb-0.5">
              <div className="w-8 shrink-0 text-[10px] text-zinc-500 text-right pr-1.5">{dia}</div>
              {HORAS.map(hora => {
                const cell = mapa.get(`${dIdx}-${hora}`);
                return (
                  <div
                    key={hora}
                    className={`flex-1 h-5 rounded-[2px] mx-px ${intensidad(cell?.engagement_promedio ?? 0, maxEng)} cursor-default`}
                    title={cell
                      ? `${dia} ${fmtHora(hora)}: ${cell.engagement_promedio.toFixed(2)}% eng · ${cell.total_posts} posts`
                      : `${dia} ${fmtHora(hora)}: sin datos`
                    }
                  />
                );
              })}

            </div>
          ))}

          {/* Leyenda */}
          <div className="flex items-center gap-2 mt-2 justify-end">
            <span className="text-[10px] text-zinc-400">Menor</span>
            {["bg-zinc-100", "bg-violet-100", "bg-violet-200", "bg-violet-300", "bg-violet-400", "bg-violet-600"].map(c => (
              <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
            ))}
            <span className="text-[10px] text-zinc-400">Mayor engagement</span>
          </div>
        </div>
      </div>
    </div>
  );
}
