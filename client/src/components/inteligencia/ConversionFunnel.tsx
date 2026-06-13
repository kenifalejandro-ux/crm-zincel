/** client/src/components/inteligencia/ConversionFunnel.tsx */

import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useEffect, useState } from "react";
import { BarChart2, AlertTriangle, TrendingUp, DollarSign, Target } from "lucide-react";
import { getConversionFunnel, type ConversionFunnel } from "../../services/inteligencia.api";

const ETAPA_LABEL: Record<string, string> = {
  nuevo:             "Nuevo",
  contactado:        "Contactado",
  interesado:        "Interesado",
  propuesta_enviada: "Propuesta env.",
  negociacion:       "Negociación",
  cerrado_ganado:    "Cerrado",
};

function fmtSol(n: number): string {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(1)}k`;
  if (n > 0)          return `S/ ${n.toFixed(2)}`;
  return "S/ 0.00";
}

// Color de barra según posición y cantidad
function barColor(index: number, total: number): string {
  if (total === 0) return "transparent";
  const palette = [COLORS.dark, COLORS.dark, COLORS.mutedDark, COLORS.mutedDark, COLORS.primary, COLORS.dark];
  return palette[index] ?? COLORS.mutedDark;
}

// Estilo del badge de conversión
function convBadgeStyle(pct: number | null): string {
  if (pct === null)  return "bg-zinc-100 text-zinc-500";
  if (pct === 0)     return "bg-red-500 text-white";
  if (pct < 20)      return "bg-red-100 text-red-600";
  if (pct < 40)      return "bg-amber-100 text-amber-700";
  return "bg-zinc-800 text-white";
}

export function ConversionFunnelChart() {
  const [data, setData] = useState<ConversionFunnel | null>(null);

  useEffect(() => {
    getConversionFunnel().then(setData).catch(() => {});
  }, []);

  if (!data || data.etapas.length === 0) return null;

  const maxTotal = Math.max(...data.etapas.map((e) => e.total), 1);

  // Cuello de botella: primera etapa con pct_conversion === 0 o la más baja < 15%
  const bottleneck = data.etapas.find((e) => e.pct_conversion === 0)
    ?? data.etapas
        .filter((e) => e.pct_conversion !== null && e.pct_conversion < 15)
        .sort((a, b) => (a.pct_conversion ?? 100) - (b.pct_conversion ?? 100))[0];

  // Etapa anterior al cuello de botella (leads estancados ahí)
  const idxBottle  = bottleneck ? data.etapas.findIndex((e) => e.etapa === bottleneck.etapa) : -1;
  const prevEtapa  = idxBottle > 0 ? data.etapas[idxBottle - 1] : null;

  return (
    <div className={CARD_CLASS}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-5">
        <BarChart2 size={14} className="text-zinc-500" strokeWidth={2} />
        <h3 className={HEADER_CLASS}>Pipeline de Ventas y Conversión</h3>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] font-semibold text-zinc-100 uppercase tracking-wider mb-1">Valor activo</p>
          <p className="text-2xl font-bold text-zinc-100">{fmtSol(data.valor_pipeline)}</p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {data.etapas.filter(e => !["cerrado_ganado"].includes(e.etapa)).reduce((s, e) => s + e.total, 0)} leads activos
          </p>
        </div>
        <div className="border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] font-semibold text-zinc-100 uppercase tracking-wider mb-1">Cerrado ganado</p>
          <p className="text-2xl font-bold text-zinc-100">{fmtSol(data.valor_cerrado)}</p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {data.etapas.find(e => e.etapa === "cerrado_ganado")?.total ?? 0} ganado · {data.perdidos} perdido
          </p>
        </div>
        <div className="border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] font-semibold text-zinc-100 uppercase tracking-wider mb-1">Tasa de cierre</p>
          <p className={`text-2xl font-bold ${data.tasa_cierre >= 40 ? "text-zinc-100" : data.tasa_cierre >= 20 ? "text-amber-600" : "text-red-500"}`}>
            {data.tasa_cierre}%
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {data.etapas.find(e => e.etapa === "cerrado_ganado")?.total ?? 0} de {((data.etapas.find(e => e.etapa === "cerrado_ganado")?.total ?? 0) + data.perdidos)} resueltos
          </p>
        </div>
      </div>

      {/* ── Funnel ── */}
      <div className="space-y-0">
        {data.etapas.map((etapa, i) => {
          const pct      = Math.round((etapa.total / maxTotal) * 100);
          const barW     = Math.max(pct, etapa.total > 0 ? 3 : 0);
          const isEmpty  = etapa.total === 0;
          const isBottle = bottleneck?.etapa === etapa.etapa;
          const label    = ETAPA_LABEL[etapa.etapa] ?? etapa.etapa;
          const conv     = etapa.pct_conversion;

          return (
            <div key={etapa.etapa}>

              {/* Conector entre etapas: línea punteada + badge */}
              {i > 0 && (
                <div className="flex items-center gap-0 py-2">
                  {/* Spacer igual al ancho del label */}
                  <div className="w-32 shrink-0" />
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 border-t border-dashed border-white/10" />
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${convBadgeStyle(conv)}`}>
                      {conv === null ? "—" : conv === 0 ? "⚠ 0% ¡ALERTA!" : `▼ ${conv}%`}
                    </span>
                    <div className="flex-1 border-t border-dashed border-white/10" />
                  </div>
                  {/* Spacer derecho */}
                  <div className="w-32 shrink-0" />
                </div>
              )}

              {/* Fila de etapa */}
              <div className="flex items-center gap-3">

                {/* Label izquierdo */}
                <span className="text-[12px] font-medium text-zinc-400 w-32 shrink-0">
                  {label}
                </span>

                {/* Barra */}
                <div className="flex-1 h-8 relative">
                  {isEmpty ? (
                    // Barra vacía: outlined rojo
                    <div
                      className="h-full w-full rounded-lg border-2"
                      style={{ borderColor: COLORS.danger, opacity: 0.6 }}
                    />
                  ) : (
                    // Barra llena
                    <div className="h-full bg-zinc-800 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                        style={{
                          width: `${barW}%`,
                          backgroundColor: isBottle ? COLORS.danger : barColor(i, etapa.total),
                        }}
                      >
                        {barW > 20 && (
                          <span className="text-[11px] font-semibold text-white truncate">
                            {label}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats derecha */}
                <div className="w-32 shrink-0 flex items-center justify-end gap-3">
                  <span className="text-[13px] font-bold text-zinc-200">
                    {etapa.total} {etapa.total === 1 ? "lead" : "leads"}
                  </span>
                  <span className="text-[11px] text-zinc-400 w-16 text-right">
                    {fmtSol(etapa.valor)}
                  </span>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* ── Perdidos / descartados ── */}
      {(data.perdidos > 0 || data.descartados > 0) && (
        <div className="mt-4 pt-3 border-t border-white/8 flex items-center gap-5 text-xs text-zinc-500">
          <span className="font-medium">Fuera del funnel:</span>
          {data.perdidos > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.danger }} />
              Perdidos: <strong className="text-zinc-300">{data.perdidos}</strong>
            </span>
          )}
          {data.descartados > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-300" />
              Descartados: <strong className="text-zinc-300">{data.descartados}</strong>
            </span>
          )}
        </div>
      )}

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
              {bottleneck.pct_conversion === 0 && prevEtapa
                ? `⚠ La etapa "${ETAPA_LABEL[bottleneck.etapa] ?? bottleneck.etapa}" está en 0%. Tienes ${prevEtapa.total} leads listos en "${ETAPA_LABEL[prevEtapa.etapa] ?? prevEtapa.etapa}" que no están recibiendo cotizaciones. ¡Aquí se está trabando tu dinero!`
                : `⚠ Solo el ${bottleneck.pct_conversion}% de leads avanza desde "${ETAPA_LABEL[bottleneck.etapa] ?? bottleneck.etapa}". Es el punto de mayor fuga del pipeline — actúa esta semana.`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
