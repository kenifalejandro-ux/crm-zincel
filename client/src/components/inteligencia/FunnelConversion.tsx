/** client/src/components/inteligencia/FunnelConversion.tsx */

import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { BarChart2, AlertTriangle } from "lucide-react";
import type { FunnelEtapa } from "../../services/prospectos.api";

const ETAPA_LABEL: Record<string, string> = {
  nuevo:             "Nuevo",
  contactado:        "Contactado",
  interesado:        "Interesado",
  propuesta_enviada: "Propuesta enviada",
  negociacion:       "Negociación",
  cerrado_ganado:    "Cerrado ✓",
  perdido:           "Perdido ✗",
};

const ETAPAS_ACTIVAS = ["nuevo","contactado","interesado","propuesta_enviada","negociacion","cerrado_ganado"];

function fmtSol(n: number): string {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(1)}k`;
  if (n > 0)          return `S/ ${n.toFixed(2)}`;
  return "S/ —";
}

function convBadgeCls(pct: number | null): string {
  if (pct === null) return "bg-zinc-100 text-zinc-500";
  if (pct === 0)    return "bg-red-500 text-white";
  if (pct < 20)     return "bg-red-100 text-red-600";
  if (pct < 40)     return "bg-amber-100 text-amber-700";
  return "bg-zinc-800 text-white";
}

function barFill(index: number): string {
  const fills = [COLORS.dark, COLORS.dark, COLORS.mutedDark, COLORS.mutedDark, COLORS.primary, COLORS.dark];
  return fills[index] ?? COLORS.mutedDark;
}

interface Props {
  data: FunnelEtapa[];
}

export function FunnelConversion({ data }: Props) {
  if (!data.length) return null;

  const activos   = data.filter(d => ETAPAS_ACTIVAS.includes(d.etapa));
  const perdidos  = data.find(d => d.etapa === "perdido")?.total ?? 0;
  const cerrados  = data.find(d => d.etapa === "cerrado_ganado")?.total ?? 0;
  const maxTotal  = Math.max(...activos.map(d => d.total), 1);

  const valorPipeline = activos
    .filter(d => d.etapa !== "cerrado_ganado")
    .reduce((s, d) => s + d.valor, 0);
  const valorCerrado  = data.find(d => d.etapa === "cerrado_ganado")?.valor ?? 0;
  const tasaCierre    = (cerrados + perdidos) > 0
    ? Math.round((cerrados / (cerrados + perdidos)) * 100)
    : 0;

  // Cuello de botella: primera etapa con conversión === 0, o la más baja < 15%
  const conConv    = activos.filter(d => d.conversion !== null && d.etapa !== "nuevo");
  const bottleneck = conConv.find(d => d.conversion === 0)
    ?? conConv.filter(d => d.conversion! < 15)
              .sort((a, b) => a.conversion! - b.conversion!)[0];
  const idxBottle  = bottleneck ? activos.findIndex(d => d.etapa === bottleneck.etapa) : -1;
  const prevEtapa  = idxBottle > 0 ? activos[idxBottle - 1] : null;

  return (
    <div className={CARD_CLASS}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-5">
        <BarChart2 size={14} className="text-zinc-500" strokeWidth={2} />
        <h3 className={HEADER_CLASS}>Pipeline de Ventas y Conversión</h3>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-zinc-200 rounded-xl p-4 text-center">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Valor activo</p>
          <p className="text-2xl font-bold text-zinc-900">{fmtSol(valorPipeline)}</p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {activos.filter(d => d.etapa !== "cerrado_ganado").reduce((s, d) => s + d.total, 0)} leads activos
          </p>
        </div>
        <div className="border border-zinc-200 rounded-xl p-4 text-center">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Cerrado ganado</p>
          <p className="text-2xl font-bold text-zinc-900">{fmtSol(valorCerrado)}</p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {cerrados} ganado{cerrados !== 1 ? "s" : ""} · {perdidos} perdido{perdidos !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="border border-zinc-200 rounded-xl p-4 text-center">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Tasa de cierre</p>
          <p className={`text-2xl font-bold ${tasaCierre >= 40 ? "text-zinc-900" : tasaCierre >= 20 ? "text-amber-600" : "text-red-500"}`}>
            {tasaCierre}%
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {cerrados} de {cerrados + perdidos} resueltos
          </p>
        </div>
      </div>

      {/* ── Funnel ── */}
      <div className="space-y-0">
        {activos.map((etapa, i) => {
          const pct      = Math.round((etapa.total / maxTotal) * 100);
          const barW     = Math.max(pct, etapa.total > 0 ? 3 : 0);
          const isEmpty  = etapa.total === 0;
          const isBottle = bottleneck?.etapa === etapa.etapa;
          const label    = ETAPA_LABEL[etapa.etapa] ?? etapa.etapa;
          const conv     = etapa.conversion;

          return (
            <div key={etapa.etapa}>

              {/* Conector entre etapas */}
              {i > 0 && (
                <div className="flex items-center py-2">
                  <div className="w-36 shrink-0" />
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 border-t border-dashed border-zinc-200" />
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${convBadgeCls(conv)}`}>
                      {conv === null ? "—" : conv === 0 ? "⚠ 0% ¡ALERTA!" : `▼ ${conv}%`}
                    </span>
                    <div className="flex-1 border-t border-dashed border-zinc-200" />
                  </div>
                  <div className="w-36 shrink-0" />
                </div>
              )}

              {/* Fila etapa */}
              <div className="flex items-center gap-3">

                {/* Label */}
                <span className="text-[12px] font-medium text-zinc-600 w-36 shrink-0">
                  {label}
                </span>

                {/* Barra */}
                <div className="flex-1 h-8 relative">
                  {isEmpty ? (
                    <div
                      className="h-full w-full rounded-lg border-2"
                      style={{ borderColor: COLORS.danger, opacity: 0.5 }}
                    />
                  ) : (
                    <div className="h-full bg-zinc-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                        style={{
                          width: `${barW}%`,
                          backgroundColor: isBottle ? COLORS.danger : barFill(i),
                        }}
                      >
                        {barW > 18 && (
                          <span className="text-[11px] font-semibold text-white truncate">{label}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="w-36 shrink-0 flex items-center justify-end gap-3">
                  <span className="text-[13px] font-bold text-zinc-800">
                    {etapa.total} {etapa.total === 1 ? "lead" : "leads"}
                  </span>
                  <span className={`text-[11px] w-16 text-right font-medium ${etapa.valor > 0 ? "text-amber-600" : "text-zinc-400"}`}>
                    {etapa.valor > 0 ? fmtSol(etapa.valor) : "S/ —"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Banner cuello de botella ── */}
      {bottleneck && (
        <div className="mt-5 rounded-xl overflow-hidden" style={{ border: `1.5px solid ${COLORS.danger}` }}>
          <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: COLORS.danger }}>
            <AlertTriangle size={13} className="text-white shrink-0" />
            <p className="text-[11px] font-bold text-white uppercase tracking-wider">
              Cuello de botella crítico
            </p>
          </div>
          <div className="bg-red-50 px-4 py-3">
            <p className="text-[12px] text-red-700 leading-relaxed">
              {bottleneck.conversion === 0 && prevEtapa
                ? `⚠ La etapa "${ETAPA_LABEL[bottleneck.etapa] ?? bottleneck.etapa}" está en 0%. Tienes ${prevEtapa.total} leads listos en "${ETAPA_LABEL[prevEtapa.etapa] ?? prevEtapa.etapa}" que no están recibiendo cotizaciones. ¡Aquí se está trabando tu dinero!`
                : `⚠ Solo el ${bottleneck.conversion}% de leads avanza desde "${ETAPA_LABEL[bottleneck.etapa] ?? bottleneck.etapa}". Es el punto de mayor fuga del pipeline — actúa esta semana.`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
