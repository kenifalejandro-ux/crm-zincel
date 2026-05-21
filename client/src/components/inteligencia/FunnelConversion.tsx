/** client/src/components/inteligencia/FunnelConversion.tsx */

import type { FunnelEtapa } from "../../services/prospectos.api";

const LABELS: Record<string, string> = {
  nuevo:             "Nuevo",
  contactado:        "Contactado",
  interesado:        "Interesado",
  propuesta_enviada: "Propuesta enviada",
  negociacion:       "Negociación",
  cerrado_ganado:    "Cerrado ✓",
  perdido:           "Perdido ✗",
};

const COLORES: Record<string, string> = {
  nuevo:             "bg-slate-400",
  contactado:        "bg-blue-400",
  interesado:        "bg-amber-400",
  propuesta_enviada: "bg-violet-400",
  negociacion:       "bg-amber-400",
  cerrado_ganado:    "bg-emerald-500",
  perdido:           "bg-red-400",
};

interface Props {
  data: FunnelEtapa[];
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function FunnelConversion({ data }: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-32 text-xs text-zinc-400">
      Sin datos de pipeline
    </div>
  );

  const ETAPAS_ACTIVAS = ["nuevo","contactado","interesado","propuesta_enviada","negociacion"];
  const activos  = data.filter(d => d.etapa !== "perdido");
  const maxTotal = Math.max(...activos.map(d => d.total), 1);

  // Cuello de botella
  const conConversion = activos.filter(d => d.conversion !== null && d.etapa !== "cerrado_ganado");
  const cuello = conConversion.reduce<FunnelEtapa | null>(
    (min, d) => (!min || (d.conversion! < min.conversion!)) ? d : min, null
  );

  const totalGlobal    = data.reduce((s, d) => s + d.total, 0);
  const cerrados       = data.find(d => d.etapa === "cerrado_ganado")?.total ?? 0;
  const perdidos       = data.find(d => d.etapa === "perdido")?.total ?? 0;
  const tasaCierre     = totalGlobal > 0 ? Math.round((cerrados / totalGlobal) * 100) : 0;

  // Valor económico
  const valorActivo  = data.filter(d => ETAPAS_ACTIVAS.includes(d.etapa)).reduce((s, d) => s + d.valor, 0);
  const valorCerrado = data.find(d => d.etapa === "cerrado_ganado")?.valor ?? 0;
  const hayValor     = valorActivo > 0 || valorCerrado > 0;

  function fmtSol(n: number) {
    if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(1)}k`;
    return `S/ ${n}`;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800">Funnel de conversión</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Estado actual del pipeline por etapa</p>
        </div>
        <div className="flex gap-4">
          {hayValor && (
            <div className="text-right">
              <p className="text-[10px] text-zinc-400">Valor pipeline activo</p>
              <p className="text-lg font-bold text-amber-600">{fmtSol(valorActivo)}</p>
              {valorCerrado > 0 && (
                <p className="text-[10px] text-emerald-600 font-medium">+ {fmtSol(valorCerrado)} cerrado</p>
              )}
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] text-zinc-400">Tasa de cierre</p>
            <p className="text-lg font-bold text-emerald-600">{tasaCierre}%</p>
            <p className="text-[10px] text-zinc-400">{cerrados} cerrados · {perdidos} perdidos</p>
          </div>
        </div>
      </div>

      {!hayValor && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <span className="text-amber-400 text-sm">💡</span>
          <p className="text-xs text-amber-600">
            Asigna un <strong>valor estimado</strong> a tus leads en el Pipeline para ver el potencial económico aquí.
          </p>
        </div>
      )}

      {/* Cuello de botella */}
      {cuello && cuello.conversion! < 40 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-amber-500 text-sm">⚠</span>
          <p className="text-xs text-amber-700">
            <strong>Cuello de botella:</strong> "{LABELS[cuello.etapa]}" con solo {cuello.conversion}% de conversión desde la etapa anterior
          </p>
        </div>
      )}

      {/* Barras del funnel */}
      <div className="space-y-2">
        {activos.map((d) => {
          const pct    = maxTotal > 0 ? Math.round((d.total / maxTotal) * 100) : 0;
          const esCuello = cuello?.etapa === d.etapa && d.conversion !== null && d.conversion < 40;
          return (
            <div key={d.etapa}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600 w-36 truncate">{LABELS[d.etapa]}</span>
                  {d.conversion !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      esCuello
                        ? "bg-amber-100 text-amber-700"
                        : d.conversion >= 50
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {d.conversion}% ↓
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${d.valor > 0 ? "text-amber-500 font-medium" : "text-zinc-300"}`}>
                    {d.valor > 0 ? fmtSol(d.valor) : "S/—"}
                  </span>
                  <span className="text-xs font-semibold text-zinc-700 w-8 text-right">{d.total}</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${esCuello ? "bg-amber-400" : COLORES[d.etapa] ?? "bg-amber-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
