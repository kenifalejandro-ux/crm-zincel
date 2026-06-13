/** client/src/pages/InteligenciaPage.tsx */

import { COLORS, CARD_CLASS, HEADER_CLASS, GLASS_BASE, MODAL_BASE, BADGE_BASE, INPUT_BASE, STICKY_BASE, PANEL_BASE } from "../lib/tokens";
import { useEffect, useState, Component, type ReactNode, type ErrorInfo } from "react";
import { TrendingUp, Phone, CalendarDays, FileText, Package, AlertTriangle, CheckCircle, Info, Lightbulb, ChevronDown, Pencil, X, Check, Clock, Target, Zap } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getFunnelPipeline, getAnalisisRegion, getMotivosPerdida, getProspecto, getScoresLeads } from "../services/prospectos.api";
import { getHeatmapLlamadas }  from "../services/llamadas.api";
import { getMetricasDashboard } from "../services/dashboard.api";
import { ProspectoDetalle } from "../components/prospectos/ProspectoDetalle";
import type { Prospecto } from "../types/prospecto.types";
import { useNavigate, useLocation } from "react-router-dom";
import { getInsights, getLeadsEstancados, getPrioridadOperacional, getForecast, getForecastLeads, getObjetivos, actualizarObjetivos, getTendencias } from "../services/inteligencia.api";
import type { Tendencias } from "../services/inteligencia.api";
import { FunnelConversion }    from "../components/inteligencia/FunnelConversion";
import { RegionInteligente }   from "../components/inteligencia/RegionInteligente";
import { PrioridadOperacional } from "../components/inteligencia/PrioridadOperacional";
import { CicloVenta }          from "../components/inteligencia/CicloVenta";
import { AbandonoPipelineChart }       from "../components/inteligencia/AbandonoPipeline";
import { TiempoPrimeraRespuestaChart } from "../components/inteligencia/TiempoPrimeraRespuesta";
import { ForecastIngresosChart }       from "../components/inteligencia/ForecastIngresos";
import { ForecastHistoricoChart }      from "../components/inteligencia/ForecastHistoricoChart";
import { RechazosDualesChart }         from "../components/inteligencia/RechazosDuales";
import { LeadScatterChart }            from "../components/inteligencia/LeadScatterChart";
import { CanalEfectividadChart }      from "../components/inteligencia/CanalEfectividad";
import { ConversacionChart }          from "../components/inteligencia/ConversacionChart";
import { CoberturaLlamadas }         from "../components/inteligencia/CoberturaLlamadas";
import { IntentosCobertura }         from "../components/inteligencia/IntentosCobertura";
import { EstadoWebChart }             from "../components/inteligencia/EstadoWebChart";
import { PaquetesWebChart }          from "../components/inteligencia/PaquetesWebChart";
import { HeatmapHoras }        from "../components/llamadas/HeatmapHoras";
import { MotivosChart }        from "../components/llamadas/MotivosChart";
import { ActividadAnual }          from "../components/dashboard/ActividadAnual";
import { ActividadMensualDiaria }  from "../components/dashboard/ActividadMensualDiaria";
import { TemperaturaLeadsChart }   from "../components/dashboard/TemperaturaLeadsChart";
import { AnalisisPropuestas }       from "../components/inteligencia/AnalisisPropuestas";
import { InsightServicios }         from "../components/inteligencia/InsightServicios";
import { RankingSubcategorias }    from "../components/inteligencia/RankingSubcategorias";
import { PropuestasMesChart }       from "../components/dashboard/PropuestasMesChart";
import type { FunnelEtapa, RegionEtapa } from "../services/prospectos.api";
import type { Insight, LeadEstancado, AccionPrioridad, Forecast, ObjetivosDiarios, LeadPrioridad } from "../services/inteligencia.api";
import { FiltroPeriodoBotones, type FiltroPeriodo } from "../components/shared/FiltroPeriodoBotones";
import { calcularRangoFecha } from "../utils/date";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function periodoToDashboard(p: FiltroPeriodo, fecha: string): { periodo: string; mes?: number; anio?: number; fecha?: string } {
  if (p === "mes") {
    const [anio, mes] = fecha.split("-").map(Number);
    return { periodo: "mes", mes, anio };
  }
  if (p === "dia") return { periodo: "dia", fecha };
  return { periodo: p };
}

function periodoLabel(p: FiltroPeriodo, fecha: string): string {
  const hoy = new Date();
  if (p === "hoy")   return "Hoy";
  if (p === "semana") return "Esta semana";
  if (p === "anio")  return `Año ${hoy.getFullYear()}`;
  if (p === "mes") {
    const [anio, mes] = fecha.split("-").map(Number);
    return `${MESES_FULL[mes - 1]} ${anio}`;
  }
  if (p === "dia") {
    const [, m, d] = fecha.split("-").map(Number);
    return `${d} ${MESES_FULL[m - 1]}`;
  }
  return "";
}


const ETAPA_LABEL: Record<string, string> = {
  nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado",
  propuesta_enviada: "Propuesta", negociacion: "Negociación",
  cerrado_ganado: "Cerrado", perdido: "Perdido",
};

const INSIGHT_STYLES: Record<string, { icon: React.ReactNode; chartColor: string; countColor: string }> = {
  positivo:    { icon: <CheckCircle   size={13} className="text-zinc-500 shrink-0" />, chartColor: COLORS.primary, countColor: "text-brand"    },
  alerta:      { icon: <AlertTriangle size={13} className="text-red-500 shrink-0"  />, chartColor: COLORS.danger,  countColor: "text-red-500"  },
  info:        { icon: <Info          size={13} className="text-zinc-500 shrink-0" />, chartColor: COLORS.dark,    countColor: "text-zinc-800" },
  oportunidad: { icon: <Lightbulb     size={13} className="text-brand shrink-0"    />, chartColor: COLORS.primary, countColor: "text-brand"    },
};

// ─── Mini gauge para insights con porcentaje ──────────────────────────────────
function MiniGauge({ valor, color }: { valor: number; color: string }) {
  const pct  = Math.min(Math.max(valor, 0), 100);
  const data = [{ value: pct }, { value: 100 - pct }];
  return (
    <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie filter="url(#neon-glow)"
            data={data}
            cx="50%" cy="50%"
            innerRadius={26} outerRadius={34}
            startAngle={90} endAngle={-270}
            dataKey="value" stroke="none" paddingAngle={0}
          >
            <Cell fill={color} />
            <Cell fill={COLORS.surface} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[13px] font-bold text-zinc-100 leading-none">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Mini contador para insights con cantidad ─────────────────────────────────
function MiniCount({ valor, color, label = "total" }: { valor: number; color: string; label?: string }) {
  return (
    <div className={`${PANEL_BASE} shrink-0 flex flex-col items-center justify-center px-4 py-3 min-w-[64px]`}>
      <span className={`text-2xl font-bold leading-none ${color}`}>{valor}</span>
      <span className="text-[9px] text-zinc-100 uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
}

// ─── Componente leads estancados acordeón ────────────────────────────────────

function gravedadDias(dias: number | null): { label: string; cls: string } {
  if (dias === null || dias < 7)  return { label: "Bajo",    cls: "bg-zinc-100 text-zinc-700"       };
  if (dias < 14)                  return { label: "Medio",   cls: "bg-zinc-200 text-zinc-600"       };
  if (dias < 30)                  return { label: "Alto",    cls: "bg-brand/10 text-zinc-700"       };
  return                                 { label: "Crítico", cls: "bg-red-100 text-red-700 font-bold" };
}

function LeadsEstancadosPanel({ leads }: { leads: LeadEstancado[] }) {
  const navigate = useNavigate();
  const [abierto,          setAbierto]          = useState(false);
  const [prospectoDetalle, setProspectoDetalle] = useState<Prospecto | null>(null);
  const [cargandoId,       setCargandoId]       = useState<string | null>(null);

  const criticos = leads.filter(l => {
    const d = l.ultima_actividad ? Math.round((Date.now() - new Date(l.ultima_actividad).getTime()) / 86400000) : 999;
    return d >= 30;
  }).length;

  const abrirDetalle = async (id: string) => {
    setCargandoId(id);
    try {
      const p = await getProspecto(id);
      setProspectoDetalle(p);
    } catch { /* silencioso */ }
    finally { setCargandoId(null); }
  };

  return (
    <>
      <div className={`${GLASS_BASE} overflow-hidden`}>
        <button
          onClick={() => setAbierto(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/40 transition text-left"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={14} className="text-zinc-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-zinc-200">Leads sin actividad (+14 días)</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {leads.length} leads sin actividad reciente{criticos > 0 ? ` · ${criticos} críticos` : ""} · clic para gestionar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {criticos > 0 && (
              <span className={`${BADGE_BASE} text-xs text-red-700 font-semibold px-2 py-0.5`}>
                {criticos} críticos
              </span>
            )}
            <span className={`${BADGE_BASE} text-xs text-zinc-300 font-semibold px-2 py-0.5`}>
              {leads.length}
            </span>
            <ChevronDown size={15} className={`text-zinc-400 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} />
          </div>
        </button>

        {abierto && (
          <div className="border-t border-white/8 overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className={`${STICKY_BASE} sticky top-0 z-10`}>
                <tr className="border-b border-white/8">
                  <th className="text-left py-2 px-5 text-zinc-100 font-medium">Empresa</th>
                  <th className="text-left py-2 pr-4 text-zinc-100 font-medium">Etapa</th>
                  <th className="text-left py-2 pr-4 text-zinc-100 font-medium">Riesgo</th>
                  <th className="text-left py-2 pr-5 text-zinc-100 font-medium">Sin actividad</th>
                  <th className="py-2 pr-3 text-zinc-100 font-medium" />
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  const dias = lead.ultima_actividad
                    ? Math.round((Date.now() - new Date(lead.ultima_actividad).getTime()) / 86400000)
                    : null;
                  const g = gravedadDias(dias);
                  const cargando = cargandoId === lead.id;
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => abrirDetalle(lead.id)}
                      className="border-b border-white/5 hover:bg-brand/5 hover:cursor-pointer transition group"
                    >
                      <td className="py-2 px-5">
                        <p className="font-medium text-zinc-200 truncate max-w-[160px] group-hover:text-brand">{lead.empresa}</p>
                        <p className="text-zinc-400 truncate max-w-[160px]">{lead.nombre_contacto}</p>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`${BADGE_BASE} px-2 py-0.5 text-zinc-200 text-[10px]`}>
                          {ETAPA_LABEL[lead.etapa_pipeline] ?? lead.etapa_pipeline}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${g.cls}`}>{g.label}</span>
                      </td>
                      <td className="py-2 pr-5">
                        <div className="flex items-center gap-2">
                          {dias !== null
                            ? <span className="text-[10px] text-zinc-300">{dias} días</span>
                            : <span className="text-[10px] text-zinc-300">Sin actividad</span>
                          }
                          {cargando && (
                            <div className="w-3 h-3 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3" onClick={e => e.stopPropagation()}>
                        {lead.telefono && (
                          <a
                            href={`tel:${lead.telefono}`}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 text-white text-[10px] font-semibold hover:bg-zinc-700 transition whitespace-nowrap"
                          >
                            <Phone size={10} /> {lead.telefono}
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {prospectoDetalle && (
        <ProspectoDetalle
          prospecto={prospectoDetalle}
          onCerrar={() => setProspectoDetalle(null)}
          onEditar={() => { navigate("/prospectos"); setProspectoDetalle(null); }}
        />
      )}
    </>
  );
}


// ─── Forecast panel ──────────────────────────────────────────────────────────

const TENDENCIA_STYLE = {
  subiendo: { text: "text-zinc-700", label: "↑ Subiendo", bg: "bg-zinc-100" },
  estable:  { text: "text-brand",   label: "→ Estable",  bg: "bg-brand/10" },
  bajando:  { text: "text-red-500", label: "↓ Bajando",  bg: "bg-red-50"   },
};

type Salud = "buena" | "atencion" | "critica";

const SALUD_STYLE: Record<Salud, { badge: string; valor: string; dot: string; label: string }> = {
  buena:    { badge: "bg-green-50 text-green-700",  valor: "text-zinc-900", dot: "bg-green-500",  label: "Saludable" },
  atencion: { badge: "bg-amber-50 text-amber-700",  valor: "text-amber-600", dot: "bg-amber-500", label: "Atención"  },
  critica:  { badge: "bg-red-50 text-red-600",      valor: "text-red-500",  dot: "bg-red-500",    label: "Crítico"   },
};

function saludLlamadas(prom: number): Salud {
  if (prom >= 5)  return "buena";
  if (prom >= 2)  return "atencion";
  return "critica";
}
function saludCobertura(x: number): Salud {
  if (x === 0)             return "atencion"; // sin historia aún
  if (x >= 3 && x <= 6)   return "buena";
  if (x > 1 && x < 3)     return "atencion";
  return "critica"; // <1 (sin pipeline) o >6 (pipeline estancado / sin convertir)
}
function saludAging(dias: number): Salud {
  if (dias === 0 || dias <= 21) return "buena";
  if (dias <= 45)               return "atencion";
  return "critica";
}
function saludTasa(pct: number): Salud {
  if (pct >= 40) return "buena";
  if (pct >= 20) return "atencion";
  return "critica";
}

function ForecastPanel({ f, onVerLeads, onEditarMeta }: {
  f:             Forecast;
  onVerLeads?:   (tipo: "calientes" | "activos" | "cierres", label: string) => void;
  onEditarMeta?: (meta: number) => void;
}) {
  const t       = TENDENCIA_STYLE[f.tendencia];
  const progPct = f.cierres_proyectados > 0
    ? Math.min(100, Math.round((f.cierres_mes_actual / f.cierres_proyectados) * 100))
    : 0;

  function fmtSol(n: number) {
    if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(1)}k`;
    if (n > 0)          return `S/ ${n}`;
    return "S/ —";
  }

  const ESCENARIOS = [
    { label: "Pesimista",  value: f.escenario_pesimista, bg: "bg-zinc-50",    num: "text-zinc-700",  border: "" },
    { label: "Realista",   value: f.escenario_realista,  bg: "bg-brand/5",    num: "text-zinc-900",  border: "border border-brand/20" },
    { label: "Optimista",  value: f.escenario_optimista, bg: "bg-amber-50",   num: "text-amber-700", border: "" },
  ];

  return (
    <div className={CARD_CLASS}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-zinc-500 shrink-0" strokeWidth={2} />
          <div>
            <p className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider">Pronóstico comercial</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Proyección basada en ritmo actual</p>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${t.bg} ${t.text}`}>
          {t.label}
        </span>
      </div>

      {/* Velocidad comercial */}
      {f.velocidad_comercial > 0 && (
        <div className="mb-4 px-4 py-3 bg-zinc-900 rounded-2xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={11} className="text-zinc-400" />
              <p className="text-[9px] text-zinc-100 uppercase tracking-widest font-semibold">Velocidad comercial</p>
            </div>
            <p className="text-2xl font-bold text-white leading-none">
              {fmtSol(f.velocidad_comercial)}
              <span className="text-sm font-normal text-zinc-400"> / día</span>
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">pipeline activo generando por día</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-zinc-100 uppercase tracking-widest mb-0.5">Tasa cierre</p>
            <p className={`text-lg font-bold ${SALUD_STYLE[saludTasa(f.tasa_conversion_pct)].valor.replace("text-zinc-100","text-zinc-300")}`}>
              {f.tasa_conversion_pct}%
            </p>
            <p className={`text-[9px] font-semibold ${SALUD_STYLE[saludTasa(f.tasa_conversion_pct)].badge} px-1.5 py-0.5 rounded-full mt-1 inline-block`}>
              {SALUD_STYLE[saludTasa(f.tasa_conversion_pct)].label}
            </p>
            <p className="text-[9px] text-zinc-400 mt-1">Meta: ≥ 40%</p>
          </div>
        </div>
      )}

      {/* Escenarios */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {ESCENARIOS.map(s => (
          <div key={s.label} className={`rounded-xl p-3 text-center ${s.bg} ${s.border}`}>
            <p className="text-[9px] font-semibold text-zinc-100 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-base font-bold leading-none ${s.num}`}>
              {s.value > 0 ? fmtSol(s.value) : "S/ —"}
            </p>
          </div>
        ))}
      </div>

      {/* Cierres progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-zinc-300">Cierres este mes</span>
          <span className="text-[11px] text-zinc-500">{progPct}% del objetivo</span>
        </div>
        <div className="relative h-7 bg-zinc-800 rounded-xl overflow-hidden">
          <div
            className="h-full rounded-xl transition-all duration-700 flex items-center justify-end pr-3"
            style={{ width: `${Math.max(progPct, f.cierres_mes_actual > 0 ? 6 : 0)}%`, backgroundColor: COLORS.primary }}
          >
            {progPct > 18 && (
              <span className="text-[11px] font-bold text-white">{f.cierres_mes_actual}</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          {onVerLeads ? (
            <button
              onClick={() => onVerLeads("cierres", "Cierres del mes")}
              className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline transition"
            >
              {f.cierres_mes_actual} cerrados este mes
              <ChevronDown size={11} className="-rotate-90" />
            </button>
          ) : (
            <span className="text-[10px] text-zinc-500">{f.cierres_mes_actual} cerrados</span>
          )}
          <span className="text-[10px] text-zinc-500">{f.cierres_proyectados} proyectados · {f.ciclo_promedio_dias}d ciclo</span>
        </div>
      </div>

      {/* Stats grid con semáforo y meta */}
      <div className="grid grid-cols-2 gap-2">

        {/* Llamadas por semana */}
        {(() => {
          const s = saludLlamadas(f.llamadas_semana_prom);
          const st = SALUD_STYLE[s];
          return (
            <div className="border border-white/8 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Phone size={10} className="text-zinc-400" />
                  <span className="text-[9px] text-zinc-500 font-medium">Llamadas / sem.</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
              </div>
              <p className={`text-xl font-bold leading-none ${st.valor}`}>{f.llamadas_semana_prom}</p>
              <p className="text-[9px] text-zinc-400 mt-1.5">Meta: ≥ 5 / semana</p>
            </div>
          );
        })()}

        {/* Propuestas activas */}
        {(() => {
          const clickable = !!onVerLeads;
          const inner = (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={10} className="text-zinc-400" />
                  <span className="text-[9px] text-zinc-500 font-medium">Propuestas activas</span>
                </div>
                <span className={`${BADGE_BASE} text-[9px] font-bold px-1.5 py-0.5 text-zinc-400`}>
                  {f.leads_calientes > 0 ? `${f.leads_calientes} abiertas` : "Sin pipeline"}
                </span>
              </div>
              <p className="text-xl font-bold leading-none text-zinc-100">{f.leads_calientes}</p>
              <p className="text-[9px] text-zinc-400 mt-1.5">Enviadas + en negociación</p>
            </>
          );
          return clickable ? (
            <button
              onClick={() => onVerLeads!("calientes", "Propuestas activas")}
              className="border border-white/8 rounded-xl p-3 hover:border-brand/40 hover:bg-brand/5 transition group text-left"
            >
              {inner}
            </button>
          ) : (
            <div className="border border-white/8 rounded-xl p-3">{inner}</div>
          );
        })()}

        {/* Cobertura pipeline */}
        {(() => {
          const val = f.pipeline_cobertura_meses;
          const s   = saludCobertura(val);
          const st  = SALUD_STYLE[s];
          const sinHistoria = val === 0;
          return (
            <div className="border border-white/8 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Target size={10} className="text-zinc-400" />
                  <span className="text-[9px] text-zinc-500 font-medium">Cobertura pipeline</span>
                </div>
                <span className={`${BADGE_BASE} text-[9px] font-bold px-1.5 py-0.5 ${sinHistoria ? "bg-zinc-800 text-zinc-400" : st.badge}`}>
                  {sinHistoria ? "Sin historia" : st.label}
                </span>
              </div>
              <p className={`text-xl font-bold leading-none ${sinHistoria ? "text-zinc-400" : st.valor}`}>
                {sinHistoria ? "—" : `${val}x`}
              </p>
              <p className="text-[9px] text-zinc-400 mt-1.5">Meta: 3 – 6x · +6x = pipeline estancado</p>
            </div>
          );
        })()}

        {/* Aging propuestas */}
        {(() => {
          const dias = f.aging_promedio_dias;
          const s    = saludAging(dias);
          const st   = SALUD_STYLE[s];
          return (
            <div className="border border-white/8 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock size={10} className="text-zinc-400" />
                  <span className="text-[9px] text-zinc-500 font-medium">Aging propuestas</span>
                </div>
                <span className={`${BADGE_BASE} text-[9px] font-bold px-1.5 py-0.5 ${dias === 0 ? "bg-zinc-800 text-zinc-400" : st.badge}`}>
                  {dias === 0 ? "Sin datos" : st.label}
                </span>
              </div>
              <p className={`text-xl font-bold leading-none ${dias === 0 ? "text-zinc-400" : st.valor}`}>
                {dias === 0 ? "—" : `${dias}d`}
              </p>
              <p className="text-[9px] text-zinc-400 mt-1.5">Meta: &lt; 30d · +45d = riesgo de caída</p>
            </div>
          );
        })()}

      </div>

      {/* ── Quota forecast (Zoho-style) ── */}
      <QuotaSection f={f} onEditarMeta={onEditarMeta} />
    </div>
  );
}

// ─── Quota Section ────────────────────────────────────────────────────────────

function QuotaSection({
  f,
  onEditarMeta,
}: {
  f:            Forecast;
  onEditarMeta?: (meta: number) => void;
}) {
  const [editando,  setEditando]  = useState(false);
  const [metaInput, setMetaInput] = useState(String(f.meta_ingresos));

  function fmt(n: number) {
    if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(1)}k`;
    if (n > 0)          return `S/ ${Math.round(n)}`;
    return "S/ 0";
  }

  const meta      = f.meta_ingresos      || 5000;
  const logrado   = f.logrado_ingresos_mes;
  const predicted = f.predicted_ingresos;
  const gap       = f.gap_ingresos;

  const pctLogrado   = Math.min(100, Math.round((logrado   / meta) * 100));
  const pctPredicted = Math.min(100, Math.round((predicted / meta) * 100));

  const hoy = new Date();
  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const handleGuardar = () => {
    const val = parseFloat(metaInput.replace(/[^0-9.]/g, ""));
    if (val > 0 && onEditarMeta) onEditarMeta(val);
    setEditando(false);
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/8 space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-zinc-100 uppercase tracking-wider">
            Meta de ingresos — {MESES[hoy.getMonth()]}
          </p>
        </div>
        {!editando ? (
          <button
            onClick={() => { setMetaInput(String(meta)); setEditando(true); }}
            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-brand transition"
          >
            <Pencil size={10} /> Editar meta
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={metaInput}
              onChange={e => setMetaInput(e.target.value)}
              className={`${INPUT_BASE} w-24 text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand/40 text-right`}
              min={100}
              autoFocus
            />
            <button onClick={() => setEditando(false)} className="p-1 text-zinc-400 hover:text-zinc-400 transition">
              <X size={12} />
            </button>
            <button onClick={handleGuardar} className="flex items-center gap-1 text-[11px] text-white bg-brand px-2 py-1 rounded-lg hover:bg-brand-hover transition">
              <Check size={11} /> Guardar
            </button>
          </div>
        )}
      </div>

      {/* 4 KPIs estilo Zoho */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Logrado",   value: fmt(logrado),   sub: "cerrado este mes",      cls: logrado >= meta ? "text-green-600" : "text-zinc-900" },
          { label: "Meta",      value: fmt(meta),       sub: "objetivo mensual",       cls: "text-zinc-900" },
          { label: "Gap",       value: gap > 0 ? fmt(gap) : "✓ Meta cumplida", sub: gap > 0 ? "aún te falta" : "objetivo alcanzado", cls: gap > 0 ? "text-red-500" : "text-green-600" },
          { label: "Predicho",  value: fmt(predicted),  sub: "logrado + pipeline",    cls: predicted >= meta ? "text-green-600" : "text-amber-600" },
        ].map(k => (
          <div key={k.label} className="bg-zinc-800/40 rounded-xl p-2.5 text-center">
            <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`text-sm font-bold leading-none ${k.cls}`}>{k.value}</p>
            <p className="text-[9px] text-zinc-400 mt-1 leading-tight">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Barra doble: logrado (sólido) + predicho (semitransparente) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-zinc-500">Progreso vs meta</span>
          <span className="text-[10px] font-semibold text-zinc-300">{pctLogrado}% logrado · {pctPredicted}% predicho</span>
        </div>
        <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden">
          {/* Barra predicho (fondo, más ancha) */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{ width: `${pctPredicted}%`, backgroundColor: COLORS.primary, opacity: 0.25 }}
          />
          {/* Barra logrado (encima, sólida) */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
            style={{ width: `${Math.max(pctLogrado, logrado > 0 ? 4 : 0)}%`, backgroundColor: COLORS.primary }}
          >
            {pctLogrado > 15 && (
              <span className="text-[9px] font-bold text-white">{pctLogrado}%</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />
            <span className="text-[9px] text-zinc-500">Logrado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full opacity-30" style={{ backgroundColor: COLORS.primary }} />
            <span className="text-[9px] text-zinc-500">Predicho (con pipeline)</span>
          </div>
        </div>
      </div>

      {/* Mensaje accionable */}
      {gap > 0 && f.contactos_necesarios > 0 && (
        <p className={`${PANEL_BASE} text-[11px] text-zinc-400 text-center py-2 px-3`}>
          Necesitas <span className="font-bold text-zinc-100">{f.contactos_necesarios}</span> contactos más
          · te faltan <span className="font-bold text-red-500">{fmt(gap)}</span> para tu meta
        </p>
      )}
      {gap === 0 && (
        <p className="text-[11px] text-green-700 text-center bg-green-50 rounded-xl py-2 px-3 font-semibold">
          ✓ Meta de ingresos alcanzada este mes
        </p>
      )}
    </div>
  );
}

// ─── Objetivos diarios panel ─────────────────────────────────────────────────

interface ObjetivoBarProps {
  label:    string;
  real:     number;
  meta:     number;
  fillCls:  string;
  trackCls: string;
  textCls:  string;
  icon:     React.ReactNode;
}

function ObjetivoBar({ label, real, meta, fillCls, trackCls, textCls, icon }: ObjetivoBarProps) {
  const pct      = meta > 0 ? Math.min(100, Math.round((real / meta) * 100)) : 0;
  const cumplido = pct >= 100;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">{icon}</span>
          <span className="text-xs font-medium text-zinc-300">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {cumplido && <Check size={11} className="text-zinc-400" />}
          <span className={`text-xs font-bold ${cumplido ? "text-zinc-400" : textCls}`}>
            {real} / {meta}
          </span>
        </div>
      </div>
      <div className={`h-2 rounded-full ${trackCls}`}>
        <div
          className={`h-2 rounded-full transition-all duration-500 ${cumplido ? "bg-zinc-400" : fillCls}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-zinc-400 mt-1">{pct}% de la meta diaria</p>
    </div>
  );
}

function ObjetivosPanel({
  obj,
  onActualizar,
}: {
  obj: ObjetivosDiarios;
  onActualizar: (metas: { llamadas_meta: number; reuniones_meta: number; brochures_meta: number }) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    llamadas_meta:  obj.llamadas_meta,
    reuniones_meta: obj.reuniones_meta,
    brochures_meta: obj.brochures_meta,
  });
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    setGuardando(true);
    await onActualizar(form);
    setGuardando(false);
    setEditando(false);
  };

  const handleCancelar = () => {
    setForm({ llamadas_meta: obj.llamadas_meta, reuniones_meta: obj.reuniones_meta, brochures_meta: obj.brochures_meta });
    setEditando(false);
  };

  const inputCls = "w-16 text-center px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50";

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`${HEADER_CLASS} gap-2`}>
            <span className="text-base">🎯</span> Objetivos del día
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">Meta vs real de hoy</p>
        </div>
        {!editando ? (
          <button
            onClick={() => setEditando(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-brand transition"
          >
            <Pencil size={12} /> Editar metas
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelar}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-400 transition"
            >
              <X size={12} /> Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex items-center gap-1 text-xs text-white bg-brand hover:bg-brand-hover px-2.5 py-1 rounded-lg transition disabled:opacity-60"
            >
              <Check size={12} /> {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}
      </div>

      {editando ? (
        <div className="space-y-3">
          {[
            { key: "llamadas_meta",  label: "Meta llamadas diarias",  icon: <Phone size={13} /> },
            { key: "reuniones_meta", label: "Meta reuniones diarias",  icon: <CalendarDays size={13} /> },
            { key: "brochures_meta", label: "Meta brochures diarios",  icon: <Package size={13} /> },
          ].map(({ key, label, icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-zinc-400">{icon}</span>
                {label}
              </div>
              <input
                type="number"
                min={1}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 1 }))}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-5">
          <ObjetivoBar
            label="Llamadas"
            real={obj.llamadas_hoy}
            meta={obj.llamadas_meta}
            icon={<Phone size={13} />}
            textCls="text-brand"
            fillCls="bg-brand"
            trackCls="bg-brand/15"
          />
          <ObjetivoBar
            label="Reuniones"
            real={obj.reuniones_hoy}
            meta={obj.reuniones_meta}
            icon={<CalendarDays size={13} />}
            textCls="text-zinc-700"
            fillCls="bg-zinc-400"
            trackCls="bg-zinc-100"
          />
          <ObjetivoBar
            label="Brochures"
            real={obj.brochures_hoy}
            meta={obj.brochures_meta}
            icon={<Package size={13} />}
            textCls="text-zinc-700"
            fillCls="bg-zinc-400"
            trackCls="bg-zinc-100"
          />
        </div>
      )}
    </div>
  );
}

// ─── Divider de sección ──────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest shrink-0">{label}</span>
      <div className="flex-1 border-t border-white/8" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ModuloId = 'forecasting' | 'pipeline' | 'cicloventa' | 'scoring' | 'churn' | 'acciones' | 'realtime' | 'web' | 'intentos';

const MODULO_META: Record<ModuloId, {
  emoji:       string;
  titulo:      string;
  subtitulo:   string;
  descripcion: string;
}> = {
  forecasting: {
    emoji:       '📈',
    titulo:      'Forecast comercial',
    subtitulo:   'Pronóstico · Ingresos ponderados · Tendencia',
    descripcion: 'Proyecta cierres con tu tasa de cierre real y el ritmo actual de actividad.',
  },
  pipeline: {
    emoji:       '💼',
    titulo:      'Pipeline y propuestas',
    subtitulo:   'Objetivos · Brecha · Por empresa y servicio',
    descripcion: 'Objetivos mensuales vs real, diagnóstico de brecha y análisis por empresa y servicio con drill-down.',
  },
  cicloventa: {
    emoji:       '🔄',
    titulo:      'Ciclo de venta',
    subtitulo:   'Tiempo de cierre · Velocidad · Etapas',
    descripcion: 'Mide cuánto tarda un lead desde el primer contacto hasta el cierre.',
  },
  scoring: {
    emoji:       '🎯',
    titulo:      'Lead Scoring',
    subtitulo:   'Probabilidad · Canal · Temperatura',
    descripcion: 'Identifica qué leads tienen más probabilidad de convertir y por qué canal llegan.',
  },
  churn: {
    emoji:       '⚠️',
    titulo:      'Análisis de churn',
    subtitulo:   'Estancados · Abandono · Tiempo de respuesta',
    descripcion: 'Detecta leads en riesgo de perderse por inactividad, lentitud o abandono.',
  },
  acciones: {
    emoji:       '⚡',
    titulo:      'Próxima acción',
    subtitulo:   'Prioridades · Insights · Objetivos',
    descripcion: 'Acciones ordenadas por impacto con insights automáticos y seguimiento de metas.',
  },
  realtime: {
    emoji:       '📡',
    titulo:      'Actividad en tiempo real',
    subtitulo:   'KPIs · Horas · Región · Tendencias',
    descripcion: 'Vista completa de la actividad comercial por período, hora pico y región.',
  },
  web: {
    emoji:       '🌐',
    titulo:      'Páginas web',
    subtitulo:   'Estado de proyectos · Paquetes vendidos',
    descripcion: 'Estado de proyectos web activos y distribución de ventas por tipo de paquete.',
  },
  intentos: {
    emoji:       '📞',
    titulo:      'Intentos vs Cobertura',
    subtitulo:   'Llamadas totales · Empresas únicas · Eficiencia',
    descripcion: 'Cuántas llamadas reales hiciste vs cuántas empresas distintas contactaste y cuántos intentos necesitó cada una.',
  },
};

const ESTADO_BADGE = {
  critico: 'bg-red-50 text-red-700 border-red-200',
  urgente: 'bg-amber-50 text-amber-700 border-amber-200',
  ok:      'bg-zinc-50 text-zinc-500 border-zinc-200',
};
const ESTADO_LABEL = {
  critico: 'Requiere atención',
  urgente: 'Revisar',
  ok:      'Al día',
};

class ModuloErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(e: Error, info: ErrorInfo) { console.error("[ModuloErrorBoundary]", e, info); }
  render() {
    if (this.state.error) return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle size={28} className="text-amber-400 mb-2" />
        <p className="text-sm text-zinc-300 font-medium">Ocurrió un error al cargar este módulo</p>
        <button onClick={() => this.setState({ error: false })} className="mt-3 text-xs text-brand hover:underline">
          Reintentar
        </button>
      </div>
    );
    return this.props.children;
  }
}

export default function InteligenciaPage() {
  const hoy      = new Date();
  const location = useLocation();
  const [periodo,      setPeriodo]      = useState<FiltroPeriodo>("anio");
  const [filtroFecha,  setFiltroFecha]  = useState<string>(String(hoy.getFullYear()));
  const [moduloActivo, setModuloActivo] = useState<ModuloId | null>(
    (location.state as any)?.modulo ?? null
  );
  const [anioCV, setAnioCV] = useState<number | undefined>(hoy.getFullYear());

  const [funnel,     setFunnel]     = useState<FunnelEtapa[]>([]);
  const [regiones,   setRegiones]   = useState<RegionEtapa[]>([]);
  const [heatmap,    setHeatmap]    = useState<any[]>([]);
  const [motivos,    setMotivos]    = useState<any[]>([]);
  const [metricas,   setMetricas]   = useState<any>(null);
  const [insights,   setInsights]   = useState<Insight[]>([]);
  const [estancados, setEstancados] = useState<LeadEstancado[]>([]);
  const [prioridad,  setPrioridad]  = useState<AccionPrioridad[]>([]);
  const [forecast,    setForecast]    = useState<Forecast | null>(null);
  const [objetivos,   setObjetivos]   = useState<ObjetivosDiarios | null>(null);
  const [tendencias,  setTendencias]  = useState<Tendencias | null>(null);
  const [scoreStats,  setScoreStats]  = useState<{ caliente: number; activo: number; tibio: number; frio: number } | null>(null);

  // Modal de leads del forecast
  const [forecastModal, setForecastModal] = useState<{ tipo: "calientes" | "activos" | "cierres"; label: string } | null>(null);
  const [forecastLeads, setForecastLeads] = useState<LeadPrioridad[]>([]);
  const [cargandoForecastLeads, setCargandoForecastLeads] = useState(false);
  const [cargando,        setCargando]        = useState(true);
  const [cargandoPeriodo, setCargandoPeriodo] = useState(false);

  useEffect(() => {
    setCargando(true);
    Promise.all([
      getFunnelPipeline(),
      getAnalisisRegion(),
      getMotivosPerdida(),
      getInsights(),
      getLeadsEstancados(14),
      getPrioridadOperacional(),
    ])
      .then(([f, r, m, ins, est, pri]) => {
        setFunnel(f); setRegiones(r); setMotivos(m);
        setInsights(ins); setEstancados(est); setPrioridad(pri);
      })
      .catch(console.error)
      .finally(() => setCargando(false));

    getForecast().then(setForecast).catch(e => console.error("getForecast error:", e));
    getObjetivos().then(setObjetivos).catch(console.error);
    getScoresLeads()
      .then(scores => {
        const stats = { caliente: 0, activo: 0, tibio: 0, frio: 0 };
        scores.forEach(s => { stats[s.nivel as keyof typeof stats]++; });
        setScoreStats(stats);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const params  = periodoToDashboard(periodo, filtroFecha);
    const filtroH = periodo !== "anio" ? calcularRangoFecha(filtroFecha, periodo) : undefined;
    setCargandoPeriodo(true);
    Promise.all([
      getMetricasDashboard(params),
      getHeatmapLlamadas(filtroH),
    ])
      .then(([m, h]) => { setMetricas(m); setHeatmap(h); })
      .catch(console.error)
      .finally(() => setCargandoPeriodo(false));

    getTendencias(params.periodo, params.mes, params.anio)
      .then(setTendencias).catch(console.error);
  }, [periodo, filtroFecha]);

  async function handleActualizarObjetivos(metas: { llamadas_meta: number; reuniones_meta: number; brochures_meta: number; meta_ingresos_mensual?: number }) {
    try {
      const updated = await actualizarObjetivos(metas);
      setObjetivos(updated);
    } catch (err) { console.error(err); }
  }

  const handleEditarMetaIngresos = async (meta: number) => {
    if (!objetivos) return;
    try {
      const updated = await actualizarObjetivos({
        llamadas_meta:        objetivos.llamadas_meta,
        reuniones_meta:       objetivos.reuniones_meta,
        brochures_meta:       objetivos.brochures_meta,
        meta_ingresos_mensual: meta,
      });
      setObjetivos(updated);
      // Actualiza el forecast en memoria para que la UI refleje la nueva meta inmediatamente
      setForecast(prev => prev ? {
        ...prev,
        meta_ingresos:      meta,
        gap_ingresos:       Math.max(0, meta - prev.logrado_ingresos_mes),
        predicted_ingresos: Math.round(prev.logrado_ingresos_mes + prev.escenario_realista),
      } : prev);
    } catch (err) { console.error(err); }
  };

  const handleFiltroPeriodo = (p: FiltroPeriodo, fecha: string) => {
    setPeriodo(p); setFiltroFecha(fecha);
  };

  const abrirForecastLeads = async (tipo: "calientes" | "activos" | "cierres", label: string) => {
    setForecastModal({ tipo, label });
    setForecastLeads([]);
    setCargandoForecastLeads(true);
    try {
      const data = await getForecastLeads(tipo);
      setForecastLeads(data);
    } catch { /* silencioso */ }
    finally { setCargandoForecastLeads(false); }
  };

  // ── Computed values ──
  const totalPipeline = funnel.reduce((s, e) => s + e.total, 0);
  const cerrados      = funnel.find(e => e.etapa === "cerrado_ganado")?.total ?? 0;
  const valorPipeline = funnel
    .filter(e => !["cerrado_ganado", "perdido"].includes(e.etapa))
    .reduce((s, e) => s + e.valor, 0);
  const fmtSolKpi = (n: number) =>
    n >= 1_000_000 ? `S/ ${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `S/ ${(n / 1_000).toFixed(0)}k`
    : n > 0        ? `S/ ${n}`
    : "S/ —";

  // Stats para las tarjetas de módulos
  const criticos   = prioridad.filter(a => a.nivel === 'critica').length;
  const urgentes   = prioridad.filter(a => a.nivel === 'urgente').length;
  const pendientes = prioridad.filter(a => a.nivel === 'pendiente').length;
  const insAlertas = insights.filter(i => i.tipo === 'alerta').length;
  const insOport   = insights.filter(i => i.tipo === 'oportunidad').length;
  const pctConv    = totalPipeline > 0 ? Math.round((cerrados / totalPipeline) * 100) : 0;

  const modulosCards: Array<{
    id:     ModuloId;
    stats:  Array<{ label: string; value: string | number }>;
    estado: 'critico' | 'urgente' | 'ok';
  }> = [
    {
      id: 'forecasting',
      stats: [
        { label: 'leads calientes', value: forecast?.leads_calientes ?? '—' },
        { label: 'leads activos',   value: forecast?.leads_activos   ?? '—' },
        { label: 'proy. cierre',    value: forecast?.cierres_proyectados ?? '—' },
      ],
      estado: pctConv < 15 ? 'critico' : pctConv < 35 ? 'urgente' : 'ok',
    },
    {
      id: 'pipeline',
      stats: [
        { label: 'valor activo', value: fmtSolKpi(valorPipeline) },
        { label: 'conversión',   value: `${pctConv}%`            },
        { label: 'cerrados',     value: cerrados                 },
      ],
      estado: pctConv < 15 ? 'critico' : pctConv < 35 ? 'urgente' : 'ok',
    },
    {
      id: 'cicloventa',
      stats: [],
      estado: 'ok',
    },
    {
      id: 'scoring',
      stats: [
        { label: 'calientes', value: scoreStats?.caliente ?? '—' },
        { label: 'activos',   value: scoreStats?.activo   ?? '—' },
        { label: 'tibios',    value: scoreStats?.tibio    ?? '—' },
      ],
      estado: (scoreStats?.caliente ?? 0) === 0 ? 'urgente' : 'ok',
    },
    {
      id: 'churn',
      stats: [
        { label: 'estancados', value: estancados.length },
        { label: 'alertas',    value: insAlertas        },
        { label: 'urgentes',   value: urgentes          },
      ],
      estado: estancados.length > 10 ? 'critico' : insAlertas >= 2 ? 'urgente' : 'ok',
    },
    {
      id: 'acciones',
      stats: [
        { label: 'críticos',   value: criticos   },
        { label: 'urgentes',   value: urgentes   },
        { label: 'pendientes', value: pendientes },
      ],
      estado: criticos > 0 ? 'critico' : urgentes > 0 ? 'urgente' : 'ok',
    },
    {
      id: 'realtime',
      stats: [
        { label: 'llamadas',  value: metricas?.llamadas?.total_llamadas     ?? 0 },
        { label: 'reuniones', value: metricas?.reuniones?.total_reuniones   ?? 0 },
        { label: 'brochures', value: metricas?.brochures?.total_brochures   ?? 0 },
      ],
      estado: 'ok',
    },
    {
      id: 'web',
      stats: [],
      estado: 'ok',
    },
    {
      id: 'intentos',
      stats: [
        { label: 'llamadas',  value: metricas?.llamadas?.total_llamadas ?? 0 },
        { label: 'empresas',  value: '—' },
        { label: 'promedio',  value: '—' },
      ],
      estado: 'ok',
    },
  ];

  // ── KPI tiles (reutilizados en landing y en módulo diagnóstico) ──
  const kpiTilesData = [
    {
      label: "Llamadas",
      value: metricas?.llamadas?.total_llamadas ?? 0,
      sub:   `${metricas?.llamadas?.llamadas_contestadas ?? 0} contestadas · ${
        (metricas?.llamadas?.total_llamadas ?? 0) > 0
          ? Math.round(((metricas?.llamadas?.llamadas_contestadas ?? 0) / metricas.llamadas.total_llamadas) * 100)
          : 0
      }% tasa`,
      icon:  <Phone size={13} className="text-zinc-500" />,
      delta: tendencias?.llamadas?.pct ?? null,
    },
    {
      label: "Reuniones",
      value: metricas?.reuniones?.total_reuniones ?? 0,
      sub:   periodoLabel(periodo, filtroFecha),
      icon:  <CalendarDays size={13} className="text-zinc-500" />,
      delta: tendencias?.reuniones?.pct ?? null,
    },
    {
      label: "Brochures",
      value: metricas?.brochures?.total_brochures ?? 0,
      sub:   periodoLabel(periodo, filtroFecha),
      icon:  <FileText size={13} className="text-zinc-500" />,
      delta: tendencias?.brochures?.pct ?? null,
    },
    {
      label: "Valor activo",
      value: fmtSolKpi(valorPipeline),
      sub:   `${totalPipeline - cerrados} leads en pipeline`,
      icon:  <TrendingUp size={13} className="text-zinc-500" />,
      delta: null,
    },
  ];

  const kpiTilesJsx = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpiTilesData.map(tile => (
        <div key={tile.label} className={CARD_CLASS}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-1.5 rounded-lg bg-zinc-800 shrink-0">{tile.icon}</div>
            {tile.delta !== null && (
              <span className={`${BADGE_BASE} text-[9px] font-bold px-1.5 py-0.5 shrink-0 ${ tile.delta > 0 ? "bg-zinc-800 text-white" : tile.delta < 0 ? "bg-red-100 text-red-600" : "bg-zinc-800 text-zinc-500" }`}>
                {tile.delta > 0 ? `▲${tile.delta}%` : tile.delta < 0 ? `▼${Math.abs(tile.delta)}%` : "="}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-zinc-100 leading-none">{tile.value}</p>
          <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest mt-2">{tile.label}</p>
          <p className="text-[10px] text-zinc-500 mt-1 leading-tight">{tile.sub}</p>
        </div>
      ))}
    </div>
  );

  // ── Header común ──
  const filtroBotonesJsx = (
    <div className="flex items-center gap-3">
      {cargandoPeriodo && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-brand" />}
      <FiltroPeriodoBotones periodo={periodo} filtroFecha={filtroFecha} onChange={handleFiltroPeriodo} />
    </div>
  );

  // Selector de año para ciclo de venta
  const aniosCV = Array.from({ length: 3 }, (_, i) => hoy.getFullYear() - 1 + i); // año pasado, actual, próximo
  const selectorAnioCV = (
    <div className="flex items-center gap-1.5 bg-zinc-800 rounded-xl p-1">
      {aniosCV.map(a => (
        <button
          key={a}
          onClick={() => setAnioCV(a === anioCV ? undefined : a)}
          className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
            anioCV === a
              ? "bg-slate-800/60 text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {a}
        </button>
      ))}
      <button
        onClick={() => setAnioCV(undefined)}
        className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
          anioCV === undefined
            ? "bg-slate-800/60 text-zinc-100 shadow-sm"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        Todos
      </button>
    </div>
  );

  if (cargando) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand" />
      </div>
    );
  }

  // ━━━ LANDING: grid de módulos ━━━
  const ventas:        ModuloId[] = ['forecasting', 'pipeline', 'cicloventa'];
  const estrategicos:  ModuloId[] = ['scoring', 'churn'];
  const operacionales: ModuloId[] = ['acciones', 'realtime', 'web', 'intentos'];

  const renderCard = (id: ModuloId) => {
    const m    = modulosCards.find(c => c.id === id)!;
    const meta = MODULO_META[id];
    return (
      <button
        key={id}
        onClick={() => setModuloActivo(id)}
        className={`text-left ${GLASS_BASE} p-5 hover:border-brand/40 hover:shadow-sm transition-all duration-200 group flex flex-col`}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-lg leading-none">{meta.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-zinc-100 group-hover:text-brand transition-colors leading-tight">{meta.titulo}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{meta.subtitulo}</p>
            </div>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ml-2 ${ESTADO_BADGE[m.estado]}`}>
            {ESTADO_LABEL[m.estado]}
          </span>
        </div>

        {/* Descripción — 1 línea */}
        <p className="text-xs text-zinc-500 leading-relaxed mb-4">{meta.descripcion}</p>

        {/* Stats en vivo */}
        {m.stats.length > 0 && (
          <div className="flex gap-2 mt-auto">
            {m.stats.map(s => (
              <div key={s.label} className="flex-1 bg-zinc-800/40 rounded-xl px-2 py-2 text-center">
                <p className="text-sm font-bold text-zinc-200 leading-none">{s.value}</p>
                <p className="text-[9px] text-zinc-100 mt-0.5 uppercase tracking-wide leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-end mt-3">
          <span className="text-xs font-semibold text-brand inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Analizar <ChevronDown size={12} className="-rotate-90" />
          </span>
        </div>
      </button>
    );
  };

  if (moduloActivo === null) {
    return (
      <div className="p-6 max-w-9xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <TrendingUp size={20} className="text-brand" />
              Inteligencia comercial
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Selecciona el módulo que quieres analizar</p>
          </div>
          {filtroBotonesJsx}
        </div>

        {/* KPI resumen */}
        {kpiTilesJsx}

        {/* Módulos de ventas */}
        <div className="space-y-3">
          <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest">Ventas y pipeline</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ventas.map(renderCard)}
          </div>
        </div>

        {/* Módulos estratégicos */}
        <div className="space-y-3">
          <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest">Análisis estratégico</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {estrategicos.map(renderCard)}
          </div>
        </div>

        {/* Módulos operacionales */}
        <div className="space-y-3">
          <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-widest">Gestión operacional</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {operacionales.map(renderCard)}
          </div>
        </div>

      </div>
    );
  }

  // ━━━ VISTA DE MÓDULO ━━━
  const meta = MODULO_META[moduloActivo];

  return (
    <>
    <div className="p-6 max-w-9xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModuloActivo(null)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <ChevronDown size={13} className="rotate-90" />
            Inteligencia
          </button>
          <span className="text-zinc-300">/</span>

          {/* Selector de módulo — dropdown inline */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-zinc-200 hover:text-brand transition-colors">
              {meta.emoji} {meta.titulo}
              <ChevronDown size={13} className="text-zinc-400" />
            </button>
            <div className="absolute left-0 top-[calc(100%+6px)] z-50 bg-slate-800/60 border border-white/8 rounded-xl shadow-xl w-52 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              {([
                { id: "forecasting", emoji: "📈", label: "Forecast comercial" },
                { id: "pipeline",    emoji: "💼", label: "Pipeline y propuestas" },
                { id: "cicloventa",  emoji: "🔄", label: "Ciclo de venta" },
                { id: "scoring",     emoji: "🎯", label: "Lead Scoring" },
                { id: "churn",       emoji: "⚠️", label: "Análisis de churn" },
                { id: "acciones",    emoji: "⚡", label: "Próxima acción" },
                { id: "realtime",    emoji: "📡", label: "Actividad en tiempo real" },
                { id: "web",         emoji: "🌐", label: "Páginas web" },
                { id: "intentos",    emoji: "📞", label: "Intentos vs Cobertura" },
              ] as Array<{ id: ModuloId; emoji: string; label: string }>).map(m => (
                <button
                  key={m.id}
                  onClick={() => setModuloActivo(m.id)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition
                    ${moduloActivo === m.id
                      ? "bg-brand/5 text-brand font-semibold"
                      : "text-zinc-300 hover:bg-zinc-800/40 hover:text-brand"
                    }`}
                >
                  <span>{m.emoji}</span> {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {moduloActivo === 'cicloventa' && selectorAnioCV}
        {moduloActivo === 'realtime'  && filtroBotonesJsx}
      </div>

      {/* Contenido del módulo */}

      {moduloActivo === 'forecasting' && (
        <div className="space-y-6">
          <Divider label="Pronóstico comercial" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {forecast
              ? <ForecastPanel f={forecast} onVerLeads={abrirForecastLeads} onEditarMeta={handleEditarMetaIngresos} />
              : <div className={`${CARD_CLASS} flex items-center justify-center py-10`}>
                  <div className="text-center">
                    <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">Cargando pronóstico...</p>
                  </div>
                </div>
            }
            <ForecastIngresosChart />
          </div>
          <Divider label="Histórico de ingresos cerrados" />
          <ForecastHistoricoChart />
        </div>
      )}

      {moduloActivo === 'pipeline' && (
        <div className="space-y-6">
          <Divider label="Propuestas por mes" />
          <PropuestasMesChart anio={hoy.getFullYear()} />
          <Divider label="Embudo de conversión" />
          <FunnelConversion data={funnel} />
          <Divider label="Inteligencia por servicio" />
          <InsightServicios />
          <Divider label="Ranking por subcategoría · paquetes y plataformas" />
          <RankingSubcategorias />
          <Divider label="Análisis de propuestas · objetivos · brechas" />
          <AnalisisPropuestas />
        </div>
      )}

      {moduloActivo === 'cicloventa' && (
        <div className="space-y-6">
          <Divider label="Ciclo de venta" />
          <div className={CARD_CLASS}>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={14} className="text-zinc-500" strokeWidth={2} />
              <div>
                <p className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider">Ciclo de venta</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Tiempo promedio desde primer contacto hasta cierre</p>
              </div>
            </div>
            <ModuloErrorBoundary>
              <CicloVenta anio={anioCV} />
            </ModuloErrorBoundary>
          </div>
        </div>
      )}

      {moduloActivo === 'scoring' && (
        <div className="space-y-6">
          <Divider label="Distribución por temperatura" />
          {scoreStats && (
            <TemperaturaLeadsChart
              caliente={scoreStats.caliente}
              activo={scoreStats.activo}
              tibio={scoreStats.tibio}
              frio={scoreStats.frio}
            />
          )}
          <Divider label="Score vs tiempo en pipeline" />
          <LeadScatterChart />
          <Divider label="Efectividad por canal de origen" />
          <CanalEfectividadChart />
        </div>
      )}

      {moduloActivo === 'churn' && (
        <div className="space-y-6">
          <Divider label="Leads estancados (sin actividad +14 días)" />
          {estancados.length > 0
            ? <LeadsEstancadosPanel leads={estancados} />
            : <p className="text-sm text-zinc-500 text-center py-6">No hay leads estancados — buen trabajo.</p>
          }
          <Divider label="Tiempo de primera respuesta" />
          <TiempoPrimeraRespuestaChart />
          <Divider label="Rechazos y abandono de pipeline" />
          <RechazosDualesChart />
          <AbandonoPipelineChart />
        </div>
      )}

      {moduloActivo === 'acciones' && (
        <div className="space-y-6">
          <Divider label="Acciones prioritarias" />
          <PrioridadOperacional acciones={prioridad} />
          <Divider label="Insights automáticos" />
          {insights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {insights.map((ins, i) => {
                const style       = INSIGHT_STYLES[ins.tipo];
                const tieneVizual = ins.valor !== undefined;
                return (
                  <div key={i} className={`${CARD_CLASS} flex items-center gap-4`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2">
                        {style.icon}
                        <p className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider leading-none">
                          {ins.titulo}
                        </p>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{ins.texto}</p>
                    </div>
                    {tieneVizual && (
                      ins.unidad === "pct"
                        ? <MiniGauge valor={ins.valor!} color={style.chartColor} />
                        : <MiniCount
                            valor={ins.valor!}
                            color={style.countColor}
                            label={
                              ins.titulo.includes("propuesta") || ins.titulo.includes("Propuesta") ? "propuestas"
                              : ins.titulo.includes("Negociaci") ? "en neg."
                              : "leads"
                            }
                          />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <Divider label="Objetivos del día" />
          {objetivos && (
            <ObjetivosPanel obj={objetivos} onActualizar={handleActualizarObjetivos} />
          )}
        </div>
      )}

      {moduloActivo === 'realtime' && (
        <div className="space-y-6">

          <Divider label="Cobertura y resultados de llamadas" />
          <CoberturaLlamadas />

          <Divider label="KPIs del período" />
          {kpiTilesJsx}

          <Divider label="Tendencias de actividad" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ActividadAnual />
            <ActividadMensualDiaria />
          </div>

          <Divider label="Horas pico y motivos" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <HeatmapHoras data={heatmap} />
            <MotivosChart data={motivos} />
          </div>

          <Divider label="Inteligencia de conversación" />
          <ConversacionChart
            filtros={calcularRangoFecha(filtroFecha, periodo)}
            periodoLabel={periodoLabel(periodo, filtroFecha)}
          />

          <Divider label="Actividad por región" />
          <RegionInteligente data={regiones} />

        </div>
      )}

      {moduloActivo === 'web' && (
        <div className="space-y-6">
          <Divider label="Estado de proyectos" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EstadoWebChart />
            <PaquetesWebChart />
          </div>
        </div>
      )}

      {moduloActivo === 'intentos' && (
        <div className="space-y-6">
          <Divider label="Llamadas totales vs empresas únicas contactadas" />
          <IntentosCobertura />
        </div>
      )}

    </div>
    {/* Modal leads del forecast — fuera del árbol de módulos para evitar stacking context */}
    {forecastModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setForecastModal(null)} />
        <div className={`${MODAL_BASE} relative w-full max-w-lg max-h-[80vh] flex flex-col`}>
          <div className="flex items-center justify-between p-5 border-b border-white/8">
            <div>
              <p className="text-sm font-semibold text-zinc-100">{forecastModal.label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {cargandoForecastLeads ? "Cargando..." : `${forecastLeads.length} leads · clic para llamar`}
              </p>
            </div>
            <button onClick={() => setForecastModal(null)} className="p-1.5 rounded-lg hover:bg-zinc-800 transition">
              <X size={16} className="text-zinc-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cargandoForecastLeads ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              </div>
            ) : forecastLeads.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8">Sin leads en esta categoría</p>
            ) : forecastLeads.map(lead => (
              <div key={lead.id} className="p-3 rounded-xl border border-white/8 hover:border-brand/20 hover:bg-zinc-800/40 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-100 truncate">{lead.empresa}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{lead.nombre_contacto}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {lead.ciudad && (
                        <span className="text-[11px] text-zinc-500">{lead.ciudad}</span>
                      )}
                      <span className={`${BADGE_BASE} text-[11px] font-medium px-2 py-0.5 text-zinc-300 capitalize`}>
                        {lead.etapa_pipeline.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  {lead.telefono && (
                    <a
                      href={`tel:${lead.telefono}`}
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold transition hover:opacity-90"
                      style={{ backgroundColor: COLORS.dark }}
                    >
                      <Phone size={12} />
                      {lead.telefono}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
