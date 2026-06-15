/** client/src/components/inteligencia/FunnelConversion.tsx — PREMIUM NEON
 * Antes: KPIs con labels text-zinc-100 lavados + text-green-700; conectores de conversión
 * bg-red-100/bg-amber-50; banner bg-red-50; panel lateral bg-slate-800/60 + bg-brand;
 * iconos de etapa con bg-* sólidos pastel. Ahora: todo neon con glow. Las barras ya usaban
 * useChartColors. Lógica (drill-down, getEtapaLeads, cuello de botella) INTACTA.
 */

import { useState } from "react";
import {
  TrendingUp, DollarSign, Percent,
  ChevronRight, X, Phone, AlertTriangle,
  Users, CheckCircle2, XCircle,
} from "lucide-react";
import { CARD_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { getEtapaLeads } from "../../services/prospectos.api";
import type { FunnelEtapa, EtapaLead } from "../../services/prospectos.api";

function fmtSol(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(1)}k`;
  if (n > 0)          return `S/ ${n.toFixed(0)}`;
  return "S/ —";
}

function diasAtras(fecha: string | null) {
  if (!fecha) return null;
  const d = Math.round((Date.now() - new Date(fecha).getTime()) / 86400000);
  return d === 0 ? "hoy" : `hace ${d}d`;
}

// hex por etapa ("accent" → rgb(var(--accent)))
const ETAPA_META: Record<string, { label: string; hex: string; icon: React.ReactNode }> = {
  volver_a_llamar:      { label: "Volver a llamar",      hex: "#fbbf24", icon: <Phone size={13} className="text-white" /> },
  solicita_informacion: { label: "Solicita información", hex: "#3b82f6", icon: <Users size={13} className="text-white" /> },
  interesado:           { label: "Interesado",           hex: "#34d399", icon: <TrendingUp size={13} className="text-white" /> },
  propuesta_enviada:    { label: "Propuesta enviada",    hex: "accent", icon: <DollarSign size={13} className="text-white" /> },
  negociacion:          { label: "Negociación",          hex: "#f59e0b", icon: <Percent size={13} className="text-white" /> },
  cerrado_ganado:       { label: "Cerrado ✓",            hex: "#10b981", icon: <CheckCircle2 size={13} className="text-white" /> },
  perdido:              { label: "Perdido",              hex: "#ef4444", icon: <XCircle size={13} className="text-white" /> },
};

const ETAPAS_FUNNEL = ["volver_a_llamar","solicita_informacion","interesado","propuesta_enviada","negociacion","cerrado_ganado"];

const solid = (hex: string) => hex === "accent" ? "rgb(var(--accent))" : hex;

function LeadsPanel({ etapa, leads, cargando, onCerrar }: {
  etapa: string; leads: EtapaLead[]; cargando: boolean; onCerrar: () => void;
}) {
  const c = useChartColors();
  const meta = ETAPA_META[etapa];
  const hex = meta ? solid(meta.hex) : "#71717a";
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onCerrar} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md shadow-2xl flex flex-col" style={{ background: "rgba(10,16,31,0.97)", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: hex, boxShadow: `0 0 10px ${hex}66` }}>
              {meta?.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">{meta?.label ?? etapa}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {cargando ? "Cargando…" : `${leads.length} empresa${leads.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-white/5 transition">
            <X size={16} className="text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cargando ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" style={{ borderColor: "rgb(var(--accent))", borderTopColor: "transparent" }} />
            </div>
          ) : leads.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-12">Sin empresas en esta etapa</p>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {leads.map(lead => (
                <div key={lead.id} className="px-5 py-3.5 hover:bg-white/[0.03] transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{lead.empresa}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{lead.nombre_contacto ?? "—"}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {lead.ciudad && <span className="text-[10px] text-zinc-400">{lead.ciudad}</span>}
                        {lead.ultima_llamada && (
                          <span className="text-[10px] text-zinc-400">Últ. llamada {diasAtras(lead.ultima_llamada)}</span>
                        )}
                        {lead.total_propuestas > 0 && (
                          <span className="text-[10px] text-accent bg-accent-10 px-1.5 py-0.5 rounded-full border border-accent-20">
                            {lead.total_propuestas} propuesta{lead.total_propuestas > 1 ? "s" : ""}
                          </span>
                        )}
                        {lead.valor_pipeline > 0 && (
                          <span className="text-[10px] font-semibold text-amber-300">{fmtSol(lead.valor_pipeline)}</span>
                        )}
                      </div>
                    </div>
                    {lead.telefono && (
                      <a href={`tel:${lead.telefono}`} onClick={e => e.stopPropagation()}
                        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white text-[11px] font-semibold hover:opacity-90 transition"
                        style={{ backgroundColor: c.palette[1], boxShadow: `0 0 10px ${c.palette[1]}55` }}>
                        <Phone size={11} />
                        {lead.telefono}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Badge de conversión entre etapas (neon)
function ConvBadge({ conv }: { conv: number | null }) {
  if (conv === null) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">—</span>;
  if (conv === 0)    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#ef4444" }}>⚠ 0% ALERTA</span>;
  const hex = conv < 20 ? "#f87171" : conv < 40 ? "#fbbf24" : "#34d399";
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: hex, background: `${hex}1a`, border: `1px solid ${hex}38` }}>▼ {conv}%</span>;
}

interface Props { data: FunnelEtapa[]; }

export function FunnelConversion({ data }: Props) {
  const c = useChartColors();
  const [panelEtapa,  setPanelEtapa]  = useState<string | null>(null);
  const [panelLeads,  setPanelLeads]  = useState<EtapaLead[]>([]);
  const [cargandoLds, setCargandoLds] = useState(false);

  if (!data.length) return null;

  const funnel       = data.filter(d => ETAPAS_FUNNEL.includes(d.etapa));
  const cerradoRow   = data.find(d => d.etapa === "cerrado_ganado");
  const perdidoRow   = data.find(d => d.etapa === "perdido");
  const maxTotal     = Math.max(...funnel.map(d => d.total), 1);

  const ganadas      = cerradoRow?.ganadas  ?? cerradoRow?.total ?? 0;
  const perdidas     = cerradoRow?.perdidas ?? perdidoRow?.total ?? 0;
  const valorActivo  = funnel.filter(d => d.etapa !== "cerrado_ganado").reduce((s, d) => s + d.valor, 0);
  const valorCerrado = cerradoRow?.valor ?? 0;
  const tasaCierre   = (ganadas + perdidas) > 0 ? Math.round((ganadas / (ganadas + perdidas)) * 100) : 0;
  const perdidos     = perdidoRow?.total  ?? 0;

  const bottleneck = funnel
    .filter(d => d.conversion !== null && d.etapa !== "volver_a_llamar")
    .find(d => d.conversion === 0)
    ?? funnel
        .filter(d => d.conversion !== null && d.etapa !== "volver_a_llamar" && d.conversion! < 15)
        .sort((a, b) => a.conversion! - b.conversion!)[0];

  const abrirPanel = async (etapa: string) => {
    setPanelEtapa(etapa);
    setPanelLeads([]);
    setCargandoLds(true);
    try { setPanelLeads(await getEtapaLeads(etapa)); }
    catch { /* silencioso */ }
    finally { setCargandoLds(false); }
  };

  const tasaHex = tasaCierre >= 40 ? "#34d399" : tasaCierre >= 20 ? "#fbbf24" : tasaCierre > 0 ? "#f87171" : null;

  return (
    <>
    <div className={CARD_CLASS}>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-white/10 p-4 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Valor activo</p>
          <p className="font-display text-2xl font-bold text-zinc-100 tabular-nums">{fmtSol(valorActivo)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">
            {funnel.filter(d => !["cerrado_ganado","perdido"].includes(d.etapa)).reduce((s, d) => s + d.total, 0)} leads en pipeline
          </p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={valorCerrado > 0 ? { background: "rgba(52,211,153,0.07)", borderColor: "rgba(52,211,153,0.3)" } : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Cerrado ganado</p>
          <p className="font-display text-2xl font-bold tabular-nums" style={{ color: valorCerrado > 0 ? "#34d399" : "#f4f4f5", textShadow: valorCerrado > 0 ? "0 0 12px rgba(52,211,153,0.5)" : "none" }}>
            {valorCerrado > 0 ? fmtSol(valorCerrado) : "S/ —"}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            {ganadas} ganada{ganadas !== 1 ? "s" : ""} · {perdidas} perdida{perdidas !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={tasaHex ? { background: `${tasaHex}0d`, borderColor: `${tasaHex}30` } : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Tasa de cierre</p>
          <p className="font-display text-2xl font-bold tabular-nums" style={{ color: tasaHex ?? "#a1a1aa", textShadow: tasaHex ? `0 0 12px ${tasaHex}55` : "none" }}>
            {tasaCierre > 0 ? `${tasaCierre}%` : "—"}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            {ganadas} ganadas · {perdidas} perdidas · {ganadas + perdidas} resueltas
          </p>
        </div>
      </div>

      {/* Funnel visual */}
      <div className="space-y-1.5">
        {funnel.map((etapa, i) => {
          const meta     = ETAPA_META[etapa.etapa];
          const widthPct = Math.max(Math.round((etapa.total / maxTotal) * 100), etapa.total > 0 ? 4 : 0);
          const isBottle = bottleneck?.etapa === etapa.etapa;
          const prevEtapa = i > 0 ? funnel[i - 1] : null;
          const col = isBottle ? c.danger : solid(meta?.hex ?? "#3b82f6");

          return (
            <div key={etapa.etapa}>
              {i > 0 && (
                <div className="flex items-center gap-2 py-1 px-1">
                  <div className="h-4 w-px bg-white/10 ml-3.5" />
                  <ConvBadge conv={etapa.conversion} />
                  {isBottle && prevEtapa && (
                    <span className="text-[10px] text-red-400 font-medium">{prevEtapa.total} leads trabados aquí</span>
                  )}
                </div>
              )}

              <button onClick={() => abrirPanel(etapa.etapa)}
                className="w-full group flex items-center gap-3 rounded-xl hover:bg-white/[0.03] transition px-1 py-1.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: col, boxShadow: `0 0 10px ${col}66` }}>
                  {meta?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-zinc-100">
                      {meta?.label ?? etapa.etapa}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-bold text-zinc-200 tabular-nums">
                        {etapa.total} {etapa.total === 1 ? "lead" : "leads"}
                      </span>
                      {etapa.valor > 0 && (
                        <span className="text-[11px] font-semibold text-amber-300 w-16 text-right tabular-nums">{fmtSol(etapa.valor)}</span>
                      )}
                      <ChevronRight size={13} className="text-zinc-600 group-hover:text-accent transition" />
                    </div>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${widthPct}%`, backgroundColor: col, boxShadow: `0 0 8px ${col}88` }} />
                  </div>
                </div>
              </button>
            </div>
          );
        })}

        {perdidos > 0 && (
          <div className="mt-2 pt-2 border-t border-white/[0.08]">
            <button onClick={() => abrirPanel("perdido")}
              className="w-full group flex items-center gap-3 rounded-xl hover:bg-white/[0.03] transition px-1 py-1.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500 shrink-0" style={{ boxShadow: "0 0 10px #ef444466" }}>
                <XCircle size={13} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-red-400">Perdido</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-bold text-zinc-200 tabular-nums">{perdidos} leads</span>
                    <ChevronRight size={13} className="text-zinc-600 group-hover:text-accent transition" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Banner cuello de botella */}
      {bottleneck && (
        <div className="mt-5 rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)" }}>
          <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-300 leading-relaxed">
            {bottleneck.conversion === 0
              ? `La etapa "${ETAPA_META[bottleneck.etapa]?.label ?? bottleneck.etapa}" está en 0% de conversión — ningún lead avanza desde aquí. Clic en la etapa para ver las empresas.`
              : `Solo el ${bottleneck.conversion}% avanza desde "${ETAPA_META[bottleneck.etapa]?.label ?? bottleneck.etapa}" — es el mayor cuello de botella del pipeline.`
            }
          </p>
        </div>
      )}

      <p className="text-[10px] text-zinc-500 mt-3 text-center">
        Clic en cualquier etapa para ver las empresas sin cambiar de página
      </p>
    </div>

    {panelEtapa && (
      <LeadsPanel etapa={panelEtapa} leads={panelLeads} cargando={cargandoLds} onCerrar={() => setPanelEtapa(null)} />
    )}
    </>
  );
}