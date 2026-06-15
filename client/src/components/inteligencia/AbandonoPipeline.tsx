/** client/src/components/inteligencia/AbandonoPipeline.tsx — PREMIUM NEON
 * Antes: icono header bg-red-50, toggle bg-zinc-800/bg-slate-800/60, barras bg-zinc-800,
 * motivos con barras recharts en HSL, tabla cruce thead text-zinc-100, badges con texto blanco.
 * Ahora: todo neon — icono translúcido, toggle neon, barras con glow, motivos como barras
 * horizontales coloreadas, tabla cruce con badges translúcidos. Lógica/datos INTACTOS.
 */

import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";
import { getAbandonoPipeline, type AbandonoPipeline } from "../../services/inteligencia.api";

const ETAPA_LABEL: Record<string, string> = {
  nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado",
  propuesta_enviada: "Propuesta", negociacion: "Negociación",
  perdido: "Perdido", descartado: "Descartado",
};

const ETAPA_TONO: Record<string, string> = {
  nuevo: "p3", contactado: "muted", interesado: "accent",
  propuesta_enviada: "accent", negociacion: "axis", perdido: "danger", descartado: "muted",
};

type Capa = "primer_contacto" | "propuesta";

export function AbandonoPipelineChart() {
  const clr = useChartColors();
  const tono: Record<string, string> = { p3: clr.palette[3], muted: clr.muted, accent: clr.accent, axis: clr.axis, danger: clr.danger };
  const colorEtapa = (etapa: string) => tono[ETAPA_TONO[etapa]] ?? clr.muted;
  const [data, setData] = useState<AbandonoPipeline | null>(null);
  const [capa, setCapa] = useState<Capa>("primer_contacto");

  useEffect(() => { getAbandonoPipeline().then(setData).catch(() => {}); }, []);

  if (!data) return null;

  const totalPerdidos = data.por_etapa.reduce((s, e) => s + e.total, 0);
  const totalMotivos1 = data.por_motivo.reduce((s, m) => s + m.total, 0);
  const totalMotivos2 = data.motivos_propuesta?.reduce((s, m) => s + m.total, 0) ?? 0;

  const motivoData1 = data.por_motivo.map((m) => ({ motivo: m.motivo, total: m.total }));
  const motivoData2 = (data.motivos_propuesta ?? []).map((m) => ({ motivo: m.motivo, total: m.total }));

  const motivoActivo = capa === "primer_contacto" ? motivoData1 : motivoData2;
  const totalActivo  = capa === "primer_contacto" ? totalMotivos1 : totalMotivos2;
  const maxMotivo    = Math.max(...motivoActivo.map(m => m.total), 1);

  return (
    <div className={`${CARD_CLASS} space-y-4`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)" }}>
            <XCircle size={14} className="text-red-400" />
          </div>
          <div>
            <h3 className={HEADER_CLASS}>Análisis de abandono del pipeline</h3>
            <p className="text-[11px] text-zinc-500">{totalPerdidos} leads perdidos/descartados · ¿dónde y por qué se pierden?</p>
          </div>
        </div>

        {/* Toggle capas */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-lg p-1">
          <button onClick={() => setCapa("primer_contacto")}
            className={`px-3 py-1 text-xs rounded-md transition ${capa === "primer_contacto" ? "bg-white/[0.08] text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300"}`}>
            📞 Primer contacto
          </button>
          <button onClick={() => setCapa("propuesta")}
            className={`px-3 py-1 text-xs rounded-md transition ${capa === "propuesta" ? "bg-white/[0.08] text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300"}`}>
            📄 Etapa propuesta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Abandono por etapa */}
        <div>
          <p className="text-xs font-medium text-zinc-300 mb-2">Pérdidas por etapa del pipeline</p>
          <div className="space-y-2">
            {data.por_etapa.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Sin datos de pérdida</p>
            ) : (
              data.por_etapa.map((e) => {
                const pct = totalPerdidos > 0 ? Math.round((e.total / totalPerdidos) * 100) : 0;
                const color = colorEtapa(e.etapa);
                return (
                  <div key={e.etapa} className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 w-20 shrink-0">{ETAPA_LABEL[e.etapa] ?? e.etapa}</span>
                    <div className="flex-1 bg-white/[0.06] rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.max(pct, 2)}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-400 w-8 text-right tabular-nums">{e.total}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Motivos */}
        <div>
          <p className="text-xs font-medium text-zinc-300 mb-2">
            {capa === "primer_contacto" ? "Motivos — no interesado (llamadas)" : "Motivos — venta perdida (propuestas)"}
          </p>
          <p className="text-[10px] text-zinc-500 mb-1">
            {capa === "primer_contacto"
              ? "¿Por qué el cliente rechazó en el primer contacto?"
              : "¿Por qué se cayó la venta en etapa de propuesta/negociación?"}
          </p>

          {motivoActivo.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-zinc-400">Sin motivos registrados</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                {capa === "propuesta"
                  ? 'Selecciona el motivo al marcar una propuesta como "Cerrada perdida" o "Vencida"'
                  : 'Selecciona el motivo al registrar una llamada con resultado "No interesado"'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 mt-2">
              {motivoActivo.map((m, i) => {
                const col = capa === "primer_contacto" ? `hsl(${220 + i * 15}, 65%, 60%)` : `hsl(${8 + i * 16}, 68%, 58%)`;
                const label = m.motivo.length > 24 ? m.motivo.slice(0, 24) + "…" : m.motivo;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 w-28 shrink-0 truncate" title={m.motivo}>{label}</span>
                    <div className="flex-1 h-3.5 rounded-full overflow-hidden bg-white/[0.04]">
                      <div className="h-full rounded-full flex items-center justify-end pr-1.5" style={{ width: `${Math.max((m.total / maxMotivo) * 100, 6)}%`, background: col, boxShadow: `0 0 6px ${col}88` }}>
                        <span className="text-[9px] font-bold text-white/90">{m.total}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {motivoActivo.length > 0 && (
            <p className="text-[10px] text-zinc-500 mt-2 text-right">{totalActivo} registros con motivo</p>
          )}
        </div>
      </div>

      {/* Cruce etapa × motivo */}
      {data.cruce.length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-300 mb-2">Cruce etapa × motivo (primer contacto)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-500">
                  <th className="text-left py-1.5 font-medium uppercase text-[10px] tracking-wide">Etapa</th>
                  <th className="text-left py-1.5 font-medium uppercase text-[10px] tracking-wide">Motivo</th>
                  <th className="text-right py-1.5 pr-1 font-medium uppercase text-[10px] tracking-wide">Leads</th>
                </tr>
              </thead>
              <tbody>
                {data.cruce.slice(0, 8).map((c, i) => {
                  const col = colorEtapa(c.etapa);
                  return (
                    <tr key={i} className="border-b border-white/[0.05]">
                      <td className="py-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ color: col, background: `${col}1a`, border: `1px solid ${col}55` }}>
                          {ETAPA_LABEL[c.etapa] ?? c.etapa}
                        </span>
                      </td>
                      <td className="py-1.5 text-zinc-400 max-w-[180px] truncate">{c.motivo}</td>
                      <td className="py-1.5 pr-1 text-right font-semibold text-zinc-300 tabular-nums">{c.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}