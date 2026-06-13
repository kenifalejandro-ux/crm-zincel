/** client/src/components/inteligencia/FunnelConversion.tsx */

import { useState } from "react";
import {
  TrendingUp, DollarSign, Percent,
  ChevronRight, X, Phone, AlertTriangle,
  Users, CheckCircle2, XCircle,
} from "lucide-react";
import { COLORS, CARD_CLASS, BADGE_BASE } from "../../lib/tokens";
import { getEtapaLeads } from "../../services/prospectos.api";
import type { FunnelEtapa, EtapaLead } from "../../services/prospectos.api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Config de etapas ─────────────────────────────────────────────────────────

const ETAPA_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  volver_a_llamar:      { label: "Volver a llamar",      color: "#ca8a04", bg: "bg-yellow-500",  icon: <Phone size={13} className="text-white" /> },
  solicita_informacion: { label: "Solicita información", color: "#2563eb", bg: "bg-blue-500",    icon: <Users size={13} className="text-white" /> },
  interesado:           { label: "Interesado",           color: "#16a34a", bg: "bg-green-600",   icon: <TrendingUp size={13} className="text-white" /> },
  propuesta_enviada:    { label: "Propuesta enviada",    color: COLORS.primary, bg: "bg-brand",  icon: <DollarSign size={13} className="text-white" /> },
  negociacion:          { label: "Negociación",          color: "#b45309", bg: "bg-amber-700",   icon: <Percent size={13} className="text-white" /> },
  cerrado_ganado:       { label: "Cerrado ✓",            color: "#16a34a", bg: "bg-green-700",   icon: <CheckCircle2 size={13} className="text-white" /> },
  perdido:              { label: "Perdido",              color: "#ef4444", bg: "bg-red-500",     icon: <XCircle size={13} className="text-white" /> },
};

const ETAPAS_FUNNEL = ["volver_a_llamar","solicita_informacion","interesado","propuesta_enviada","negociacion","cerrado_ganado"];

// ─── Panel lateral de leads ────────────────────────────────────────────────────

function LeadsPanel({
  etapa,
  leads,
  cargando,
  onCerrar,
}: {
  etapa:    string;
  leads:    EtapaLead[];
  cargando: boolean;
  onCerrar: () => void;
}) {
  const meta = ETAPA_META[etapa];
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onCerrar}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-slate-800/60 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta?.bg ?? "bg-zinc-700"}`}>
              {meta?.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">{meta?.label ?? etapa}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {cargando ? "Cargando…" : `${leads.length} empresa${leads.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-zinc-800 transition">
            <X size={16} className="text-zinc-400" />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {cargando ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
            </div>
          ) : leads.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-12">Sin empresas en esta etapa</p>
          ) : (
            <div className="divide-y divide-white/5">
              {leads.map(lead => (
                <div key={lead.id} className="px-5 py-3.5 hover:bg-zinc-800/40 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{lead.empresa}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{lead.nombre_contacto ?? "—"}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {lead.ciudad && (
                          <span className="text-[10px] text-zinc-400">{lead.ciudad}</span>
                        )}
                        {lead.ultima_llamada && (
                          <span className="text-[10px] text-zinc-400">
                            Últ. llamada {diasAtras(lead.ultima_llamada)}
                          </span>
                        )}
                        {lead.total_propuestas > 0 && (
                          <span className="text-[10px] bg-brand/10 text-zinc-300 px-1.5 py-0.5 rounded-full">
                            {lead.total_propuestas} propuesta{lead.total_propuestas > 1 ? "s" : ""}
                          </span>
                        )}
                        {lead.valor_pipeline > 0 && (
                          <span className="text-[10px] font-semibold text-amber-700">
                            {fmtSol(lead.valor_pipeline)}
                          </span>
                        )}
                      </div>
                    </div>
                    {lead.telefono && (
                      <a
                        href={`tel:${lead.telefono}`}
                        onClick={e => e.stopPropagation()}
                        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white text-[11px] font-semibold hover:opacity-90 transition"
                        style={{ backgroundColor: COLORS.dark }}
                      >
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

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  data: FunnelEtapa[];
}

export function FunnelConversion({ data }: Props) {
  const [panelEtapa,  setPanelEtapa]  = useState<string | null>(null);
  const [panelLeads,  setPanelLeads]  = useState<EtapaLead[]>([]);
  const [cargandoLds, setCargandoLds] = useState(false);

  if (!data.length) return null;

  const funnel        = data.filter(d => ETAPAS_FUNNEL.includes(d.etapa));
  const cerradoRow    = data.find(d => d.etapa === "cerrado_ganado");
  const perdidoRow    = data.find(d => d.etapa === "perdido");
  const maxTotal      = Math.max(...funnel.map(d => d.total), 1);

  // Use real propuestas-based stats when available (backend provides ganadas/perdidas)
  const ganadas       = cerradoRow?.ganadas  ?? cerradoRow?.total ?? 0;
  const perdidas      = cerradoRow?.perdidas ?? perdidoRow?.total ?? 0;
  const valorActivo   = funnel.filter(d => d.etapa !== "cerrado_ganado").reduce((s, d) => s + d.valor, 0);
  const valorCerrado  = cerradoRow?.valor ?? 0;
  const tasaCierre    = (ganadas + perdidas) > 0
    ? Math.round((ganadas / (ganadas + perdidas)) * 100)
    : 0;
  const cerrados      = cerradoRow?.total ?? 0;
  const perdidos      = perdidoRow?.total  ?? 0;

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
    try {
      const leads = await getEtapaLeads(etapa);
      setPanelLeads(leads);
    } catch { /* silencioso */ }
    finally { setCargandoLds(false); }
  };

  return (
    <>
    <div className={CARD_CLASS}>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-white/8 p-4 text-center">
          <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest mb-1">Valor activo</p>
          <p className="text-2xl font-bold text-zinc-100">{fmtSol(valorActivo)}</p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {funnel.filter(d => !["cerrado_ganado","perdido"].includes(d.etapa)).reduce((s, d) => s + d.total, 0)} leads en pipeline
          </p>
        </div>
        <div className="rounded-xl border border-white/8 p-4 text-center">
          <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest mb-1">Cerrado ganado</p>
          <p className={`text-2xl font-bold ${valorCerrado > 0 ? "text-green-700" : "text-zinc-100"}`}>
            {valorCerrado > 0 ? fmtSol(valorCerrado) : "S/ —"}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {ganadas} ganada{ganadas !== 1 ? "s" : ""} · {perdidas} perdida{perdidas !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 p-4 text-center">
          <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest mb-1">Tasa de cierre</p>
          <p className={`text-2xl font-bold ${tasaCierre >= 40 ? "text-green-700" : tasaCierre >= 20 ? "text-amber-600" : tasaCierre > 0 ? "text-red-500" : "text-zinc-400"}`}>
            {tasaCierre > 0 ? `${tasaCierre}%` : "—"}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {ganadas} ganadas · {perdidas} perdidas · {ganadas + perdidas} resueltas
          </p>
        </div>
      </div>

      {/* ── Funnel visual ── */}
      <div className="space-y-1.5">
        {funnel.map((etapa, i) => {
          const meta       = ETAPA_META[etapa.etapa];
          const widthPct   = Math.max(Math.round((etapa.total / maxTotal) * 100), etapa.total > 0 ? 4 : 0);
          const isBottle   = bottleneck?.etapa === etapa.etapa;
          const conv       = etapa.conversion;
          const prevEtapa  = i > 0 ? funnel[i - 1] : null;

          return (
            <div key={etapa.etapa}>
              {/* Conector de conversión */}
              {i > 0 && (
                <div className="flex items-center gap-2 py-1 px-1">
                  <div className="w-2 shrink-0" />
                  <div className="h-4 w-px bg-zinc-700 ml-3" />
                  <span className={`${BADGE_BASE} text-[10px] font-bold px-2 py-0.5 shrink-0 ${ conv === null ? "bg-zinc-800 text-zinc-400" : conv === 0 ? "bg-red-500 text-white" : conv < 20 ? "bg-red-100 text-red-600" : conv < 40 ? "bg-amber-50 text-amber-700" : "bg-zinc-800 text-zinc-400" }`}>
                    {conv === null ? "—" : conv === 0 ? "⚠ 0% ALERTA" : `▼ ${conv}%`}
                  </span>
                  {isBottle && prevEtapa && (
                    <span className="text-[10px] text-red-500 font-medium">
                      {prevEtapa.total} leads trabados aquí
                    </span>
                  )}
                </div>
              )}

              {/* Fila de etapa */}
              <button
                onClick={() => abrirPanel(etapa.etapa)}
                className="w-full group flex items-center gap-3 rounded-xl hover:bg-zinc-800/40 transition px-1 py-1.5"
              >
                {/* Icono */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta?.bg ?? "bg-zinc-700"}`}>
                  {meta?.icon}
                </div>

                {/* Barra */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-zinc-100">
                      {meta?.label ?? etapa.etapa}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-bold text-zinc-200">
                        {etapa.total} {etapa.total === 1 ? "lead" : "leads"}
                      </span>
                      {etapa.valor > 0 && (
                        <span className="text-[11px] font-semibold text-amber-600 w-16 text-right">
                          {fmtSol(etapa.valor)}
                        </span>
                      )}
                      <ChevronRight size={13} className="text-zinc-300 group-hover:text-brand transition" />
                    </div>
                  </div>
                  {/* Barra proporcional */}
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: isBottle ? COLORS.danger : (meta?.color ?? COLORS.dark),
                      }}
                    />
                  </div>
                </div>
              </button>
            </div>
          );
        })}

        {/* Perdidos (fuera del funnel principal) */}
        {perdidos > 0 && (
          <div className="mt-2 pt-2 border-t border-white/8">
            <button
              onClick={() => abrirPanel("perdido")}
              className="w-full group flex items-center gap-3 rounded-xl hover:bg-zinc-800/40 transition px-1 py-1.5"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500 shrink-0">
                <XCircle size={13} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-red-500">Perdido</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-bold text-zinc-200">{perdidos} leads</span>
                    <ChevronRight size={13} className="text-zinc-300 group-hover:text-brand transition" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ── Banner cuello de botella ── */}
      {bottleneck && (
        <div className="mt-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-700 leading-relaxed">
            {bottleneck.conversion === 0
              ? `La etapa "${ETAPA_META[bottleneck.etapa]?.label ?? bottleneck.etapa}" está en 0% de conversión — ningún lead avanza desde aquí. Clic en la etapa para ver las empresas.`
              : `Solo el ${bottleneck.conversion}% avanza desde "${ETAPA_META[bottleneck.etapa]?.label ?? bottleneck.etapa}" — es el mayor cuello de botella del pipeline.`
            }
          </p>
        </div>
      )}

      {/* Hint drill-down */}
      <p className="text-[10px] text-zinc-400 mt-3 text-center">
        Clic en cualquier etapa para ver las empresas sin cambiar de página
      </p>
    </div>

    {/* Panel lateral */}
    {panelEtapa && (
      <LeadsPanel
        etapa={panelEtapa}
        leads={panelLeads}
        cargando={cargandoLds}
        onCerrar={() => setPanelEtapa(null)}
      />
    )}
    </>
  );
}
