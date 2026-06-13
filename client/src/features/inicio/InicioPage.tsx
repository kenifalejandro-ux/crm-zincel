/** client/src/features/inicio/InicioPage.tsx
 *
 *  Página de Inicio — rediseño premium neon.
 *  Consume la API real (getResumenInicio) vía useResumenInicio().
 *  Estilos: clases .neon-* de styles/neon.css + tokens de lib/tokens.ts.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getFunnelPipeline, type FunnelEtapa } from "../../services/prospectos.api";
import {
  CARD_BASE, GLASS_HOVER, BTN_GHOST,
} from "../../lib/tokens";
import {
  ETAPA_LABEL, ETAPA_COLOR, ETAPAS_DONUT,
  fmtSoles, fechaLarga, saludo,
} from "./inicio.constants";
import {
  Zap, Calendar, AlertTri, ChevronR, TrendUp, Clock, Users,
} from "./inicio.icons";
import { NeonDonut } from "../../components/ui/NeonDonut";
import { LeadDrawer } from "./LeadDrawer";
import { useResumenInicio } from "./useResumenInicio";
import type { LeadCaliente, ReunionHoy } from "../../services/inicio.api";

export function InicioPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth() as any;
  const nombre = usuario?.nombre?.split(" ")[0] ?? "asesor";

  const { data, cargando, error, recargar } = useResumenInicio();
  const [seccion, setSeccion] = useState<string>("reuniones");
  const [lead, setLead] = useState<LeadCaliente | null>(null);

  const leads     = data?.leads_calientes ?? [];
  const reuniones = data?.reuniones_hoy ?? [];
  const alertas   = data?.alertas ?? { estancados: 0, criticos: 0, urgentes: 0 };
  const totalAlertas = alertas.criticos + alertas.urgentes + alertas.estancados;

  // Distribución REAL por etapa EFECTIVA del pipeline (calculada desde propuestas:
  // ganadas/perdidas/negociación/propuesta incluidas) — endpoint /prospectos/funnel
  const [funnel, setFunnel] = useState<FunnelEtapa[] | null>(null);
  useEffect(() => {
    getFunnelPipeline().then(setFunnel).catch(() => {});
  }, []);

  // Embudo completo: todas las etapas (las vacías quedan en 0)
  const distribucion = useMemo(() => {
    if (!funnel) return [];
    const map = new Map(funnel.map((f) => [f.etapa, f]));
    return ETAPAS_DONUT.map((e) => ({
      etapa: e,
      label: ETAPA_LABEL[e] ?? e,
      count: map.get(e)?.total ?? 0,
      valor: map.get(e)?.valor ?? 0,
    }));
  }, [funnel]);
  const valorPipeline  = distribucion.reduce((s, d) => s + d.valor, 0);
  const totalPipeline  = distribucion.reduce((s, d) => s + d.count, 0);

  function handleAccion(accion: "llamar" | "agendar" | "ficha", l: LeadCaliente) {
    if (accion === "llamar" && l.telefono) { window.location.href = `tel:${l.telefono}`; return; }
    if (accion === "agendar") { navigate("/reuniones"); return; }
    navigate("/prospectos");
  }

  const items = [
    { id: "leads",     Icon: Zap,      label: "Leads prioritarios",  sub: `${leads.length} leads calientes para contactar`,    badge: leads.length,     urgente: false },
    { id: "reuniones", Icon: Calendar, label: "Reuniones de hoy",    sub: `${reuniones.length} programadas para hoy`,           badge: reuniones.length, urgente: false },
    { id: "alertas",   Icon: AlertTri, label: "Alertas activas",     sub: `${totalAlertas} requieren atención`,                 badge: totalAlertas,     urgente: true  },
    { id: "pipeline",  Icon: TrendUp,  label: "Estado del pipeline", sub: `${leads.length} oportunidades activas`,              badge: 0,                urgente: false },
  ] as const;

  const stats = [
    { label: "Leads calientes", value: String(leads.length),       accent: true },
    { label: "Reuniones hoy",   value: String(reuniones.length) },
    { label: "Alertas",         value: String(totalAlertas),       danger: true },
    { label: "Valor pipeline",  value: fmtSoles(valorPipeline),    accent: true, small: true },
  ];

  if (cargando) return <InicioSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTri size={28} className="text-red-400" />
        <p className="mt-3 text-zinc-300">{error}</p>
        <button onClick={recargar} className={`${BTN_GHOST} mt-4 px-4 py-2 text-sm text-zinc-200`}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px]">
      {/* ── Hero ── */}
      <div className={`${CARD_BASE} ${GLASS_HOVER} relative overflow-hidden p-6 sm:p-7 fade-up`}>
        <div
          className="absolute -top-16 -right-10 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgb(var(--accent)/0.14), transparent 65%)" }}
        />
        <div className="relative flex flex-col xl:flex-row xl:items-center gap-6 xl:gap-10">
          <div className="min-w-0 xl:flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Tu jornada comercial</p>
            <h1 className="font-display text-[26px] sm:text-[30px] font-bold text-zinc-50 leading-tight mt-2 tracking-tight">
              {saludo()}, {nombre}
            </h1>
            <p className="text-[13px] text-zinc-500 mt-1.5 capitalize">{fechaLarga()}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.06] shrink-0">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#0a101f]/90 px-5 py-4 min-w-[120px]">
                <p
                  className={`font-display font-bold leading-none tabular-nums ${s.small ? "text-[19px]" : "text-[26px]"} ${
                    s.danger ? "text-red-400" : s.accent ? "text-accent" : "text-zinc-100"
                  }`}
                  style={
                    s.accent ? { textShadow: "0 0 18px rgb(var(--accent) / calc(0.5*var(--glow)))" }
                    : s.danger ? { textShadow: "0 0 18px rgba(248,113,113,0.45)" } : undefined
                  }
                >
                  {s.value}
                </p>
                <p className="text-[9.5px] text-zinc-500 mt-2 uppercase tracking-[0.16em]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start mt-5">
        {/* Checklist */}
        <div className={`${CARD_BASE} overflow-hidden lg:col-span-2 fade-up`} style={{ animationDelay: "60ms" }}>
          <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Tu jornada</p>
            <span className="text-[10.5px] text-zinc-600">{items.length} frentes</span>
          </div>
          {items.map(({ id, Icon, label, sub, badge, urgente }) => {
            const act = seccion === id;
            return (
              <button
                key={id}
                onClick={() => setSeccion(id)}
                className="relative w-full flex items-center gap-3.5 px-5 py-[15px] border-b border-white/[0.05] last:border-0 text-left transition-all"
                style={act ? { background: "linear-gradient(90deg, rgb(var(--accent)/0.10), transparent 70%)" } : undefined}
              >
                {act && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-9 rounded-full bg-accent"
                    style={{ boxShadow: "0 0 12px rgb(var(--accent) / calc(0.9*var(--glow)))" }}
                  />
                )}
                <div
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                    act ? "bg-accent-15 border-accent-30 text-accent" : "bg-white/[0.04] border-white/[0.07] text-zinc-500"
                  }`}
                  style={act ? { boxShadow: "0 0 14px rgb(var(--accent) / calc(0.3*var(--glow)))" } : undefined}
                >
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13.5px] font-semibold truncate ${act ? "text-accent" : "text-zinc-200"}`}>{label}</p>
                  <p className="text-[11.5px] text-zinc-500 truncate mt-0.5">{sub}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold tabular-nums border ${
                      urgente ? "text-red-400 bg-red-500/10 border-red-500/25" : "text-zinc-400 bg-white/[0.05] border-white/[0.08]"
                    }`}>
                      {badge}
                    </span>
                  )}
                  <ChevronR size={14} className={act ? "text-accent" : "text-zinc-700"} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalle */}
        <div className="lg:col-span-3 space-y-5">
          <div className={`${CARD_BASE} overflow-hidden fade-up`} style={{ animationDelay: "120ms" }}>
            <div className="px-6 py-5 min-h-[330px]">
              {seccion === "leads"     && <DetalleLeads leads={leads} onLead={setLead} />}
              {seccion === "reuniones" && <DetalleReuniones reuniones={reuniones} />}
              {seccion === "alertas"   && <DetalleAlertas alertas={alertas} />}
              {seccion === "pipeline"  && <DetallePipeline distribucion={distribucion} />}
            </div>
          </div>

          {/* Donut */}
          {distribucion.length > 0 && (
            <div className={`${CARD_BASE} p-6 fade-up`} style={{ animationDelay: "180ms" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Leads por etapa del pipeline</p>
                <span className="text-[11px] text-zinc-600">{totalPipeline} en el pipeline</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-7">
                <NeonDonut
                  data={distribucion.map((d) => ({ label: d.label, value: d.count, color: ETAPA_COLOR[d.etapa] ?? "#06b6d4" }))}
                  size={168}
                  centerValue={totalPipeline}
                  centerLabel="LEADS"
                />
                <div className="flex-1 w-full min-w-0 space-y-2.5">
                  {distribucion.map((d) => (
                    <div key={d.etapa} className="flex items-center gap-2.5 text-[12.5px]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ETAPA_COLOR[d.etapa], boxShadow: `0 0 7px ${ETAPA_COLOR[d.etapa]}` }} />
                      <span className="text-zinc-300 flex-1 truncate">{d.label}</span>
                      <span className="text-zinc-500 tabular-nums hidden sm:block">{d.valor > 0 ? fmtSoles(d.valor) : "—"}</span>
                      <span className="font-display font-bold text-zinc-100 w-5 text-right tabular-nums">{d.count}</span>
                    </div>
                  ))}
                  <div className="pt-3 mt-1 border-t border-white/[0.07] flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Valor pipeline</span>
                    <span className="font-display text-[15px] font-bold text-accent tabular-nums" style={{ textShadow: "0 0 14px rgb(var(--accent) / calc(0.5*var(--glow)))" }}>
                      {fmtSoles(valorPipeline)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {lead && <LeadDrawer lead={lead} onClose={() => setLead(null)} onAccion={handleAccion} />}
    </div>
  );
}

/* ── Sub-secciones del panel de detalle ────────────────────────────────── */
function DetalleLeads({ leads, onLead }: { leads: LeadCaliente[]; onLead: (l: LeadCaliente) => void }) {
  if (leads.length === 0) return <Vacio icon={Zap} texto="No hay leads calientes por ahora." />;
  return (
    <div className="space-y-2">
      {leads.map((lead) => (
        <div key={lead.id} onClick={() => onLead(lead)} className="neon-panel neon-panel-hover flex items-center justify-between gap-3 px-4 py-3 cursor-pointer group">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0 glow-dot" style={{ color: ETAPA_COLOR[lead.etapa_pipeline], background: ETAPA_COLOR[lead.etapa_pipeline] }} />
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-zinc-100 truncate group-hover:text-accent transition-colors">{lead.empresa}</p>
              <p className="text-[11.5px] text-zinc-500 mt-0.5 truncate">
                {ETAPA_LABEL[lead.etapa_pipeline]}
                {lead.valor_pipeline > 0 && <> · <span className="text-zinc-400 font-medium tabular-nums">{fmtSoles(lead.valor_pipeline)}</span></>}
              </p>
            </div>
          </div>
          <ChevronR size={14} className="text-zinc-600 group-hover:text-accent transition-colors shrink-0" />
        </div>
      ))}
    </div>
  );
}

function DetalleReuniones({ reuniones }: { reuniones: ReunionHoy[] }) {
  if (reuniones.length === 0) return <Vacio icon={Calendar} texto="No tienes reuniones hoy." />;
  return (
    <div className="space-y-2.5">
      {reuniones.map((r) => {
        const hora = new Date(r.fecha_hora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
        return (
          <div key={r.id} className="neon-panel neon-panel-hover flex items-start gap-3.5 p-4 cursor-pointer group">
            <div className="shrink-0 w-[58px] rounded-xl flex flex-col items-center justify-center py-2.5 border bg-white/[0.04] border-white/[0.08]">
              <span className="font-display text-[13px] font-bold leading-none tabular-nums text-zinc-300">{hora}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold text-zinc-100 truncate group-hover:text-accent transition-colors">{r.empresa}</p>
              <p className="text-[12px] text-zinc-400 mt-1 truncate">{r.titulo}</p>
            </div>
            <ChevronR size={14} className="text-zinc-600 group-hover:text-accent mt-1 shrink-0 transition-colors" />
          </div>
        );
      })}
    </div>
  );
}

function DetalleAlertas({ alertas }: { alertas: { estancados: number; criticos: number; urgentes: number } }) {
  const filas = [
    { n: alertas.criticos,   Icon: AlertTri, label: "Críticos · +90 días en pipeline", color: "#f87171", bg: "rgba(248,113,113,0.08)", bd: "rgba(248,113,113,0.25)" },
    { n: alertas.urgentes,   Icon: Clock,    label: "Urgentes · +45 días en pipeline", color: "#fbbf24", bg: "rgba(251,191,36,0.07)",  bd: "rgba(251,191,36,0.22)" },
    { n: alertas.estancados, Icon: Users,    label: "Sin actividad · +14 días",         color: "#a1a1aa", bg: "rgba(255,255,255,0.03)", bd: "rgba(255,255,255,0.08)" },
  ];
  return (
    <div className="space-y-2.5">
      {filas.map(({ n, Icon, label, color, bg, bd }) => (
        <div key={label} className="flex items-center justify-between px-4 py-3.5 rounded-xl border" style={{ background: bg, borderColor: bd }}>
          <div className="flex items-center gap-3">
            <Icon size={15} style={{ color }} />
            <span className="text-[13px] font-medium text-zinc-200">{label}</span>
          </div>
          <span className="font-display text-[17px] font-bold tabular-nums" style={{ color, textShadow: `0 0 12px ${color}66` }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

function DetallePipeline({ distribucion }: { distribucion: { etapa: string; label: string; count: number; valor: number }[] }) {
  const max = Math.max(...distribucion.map((d) => d.count), 1);
  return (
    <div className="space-y-2.5">
      {distribucion.map((d) => (
        <div key={d.etapa} className="flex items-center gap-3">
          <span className="text-[11.5px] text-zinc-400 w-[120px] shrink-0 truncate">{d.label}</span>
          <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(d.count / max) * 100}%`, background: ETAPA_COLOR[d.etapa], boxShadow: `0 0 10px ${ETAPA_COLOR[d.etapa]}` }} />
          </div>
          <span className="font-display text-[13px] font-bold text-zinc-200 w-7 text-right tabular-nums shrink-0">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function Vacio({ icon: Icon, texto }: { icon: typeof Zap; texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={26} className="text-zinc-600" />
      <p className="mt-3 text-[13px] text-zinc-500">{texto}</p>
    </div>
  );
}

function InicioSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1240px] animate-pulse">
      <div className="neon-card h-[140px]" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mt-5">
        <div className="neon-card h-[320px] lg:col-span-2" />
        <div className="neon-card h-[320px] lg:col-span-3" />
      </div>
    </div>
  );
}
