/** client/src/pages/InteligenciaPage.tsx */

import { COLORS, CARD_CLASS, HEADER_CLASS } from "../lib/tokens";
import { useEffect, useState } from "react";
import { TrendingUp, Phone, CalendarDays, FileText, Package, AlertTriangle, CheckCircle, Info, Lightbulb, ChevronDown, Pencil, X, Check } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getFunnelPipeline, getAnalisisRegion, getMotivosPerdida, getProspecto } from "../services/prospectos.api";
import { getHeatmapLlamadas }  from "../services/llamadas.api";
import { getMetricasDashboard } from "../services/dashboard.api";
import { ProspectoDetalle } from "../components/prospectos/ProspectoDetalle";
import type { Prospecto } from "../types/prospecto.types";
import { useNavigate } from "react-router-dom";
import { getInsights, getLeadsEstancados, getPrioridadOperacional, getForecast, getObjetivos, actualizarObjetivos, getTendencias } from "../services/inteligencia.api";
import type { Tendencias } from "../services/inteligencia.api";
import { FunnelConversion }    from "../components/inteligencia/FunnelConversion";
import { RegionChart }         from "../components/inteligencia/RegionChart";
import { PrioridadOperacional } from "../components/inteligencia/PrioridadOperacional";
import { CicloVenta }          from "../components/inteligencia/CicloVenta";
import { AbandonoPipelineChart }       from "../components/inteligencia/AbandonoPipeline";
import { TiempoPrimeraRespuestaChart } from "../components/inteligencia/TiempoPrimeraRespuesta";
import { ForecastIngresosChart }       from "../components/inteligencia/ForecastIngresos";
import { RechazosDualesChart }         from "../components/inteligencia/RechazosDuales";
import { LeadScatterChart }            from "../components/inteligencia/LeadScatterChart";
import { CanalEfectividadChart }      from "../components/inteligencia/CanalEfectividad";
import { HeatmapHoras }        from "../components/llamadas/HeatmapHoras";
import { MotivosChart }        from "../components/llamadas/MotivosChart";
import { ResumenEstadosPropuestas } from "../components/propuestas/ResumenEstadosPropuestas";
import type { FunnelEtapa, RegionEtapa } from "../services/prospectos.api";
import type { Insight, LeadEstancado, AccionPrioridad, Forecast, ObjetivosDiarios } from "../services/inteligencia.api";
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
          <Pie
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
        <span className="text-[13px] font-bold text-zinc-900 leading-none">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Mini contador para insights con cantidad ─────────────────────────────────
function MiniCount({ valor, color, label = "total" }: { valor: number; color: string; label?: string }) {
  return (
    <div className="shrink-0 flex flex-col items-center justify-center bg-zinc-50 rounded-2xl px-4 py-3 min-w-[64px]">
      <span className={`text-2xl font-bold leading-none ${color}`}>{valor}</span>
      <span className="text-[9px] text-zinc-400 uppercase tracking-widest mt-1">{label}</span>
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
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <button
          onClick={() => setAbierto(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={14} className="text-zinc-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-zinc-800">Leads sin actividad (+14 días)</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                {leads.length} leads sin actividad reciente{criticos > 0 ? ` · ${criticos} críticos` : ""} · clic para gestionar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {criticos > 0 && (
              <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                {criticos} críticos
              </span>
            )}
            <span className="text-xs bg-zinc-100 text-zinc-700 font-semibold px-2 py-0.5 rounded-full">
              {leads.length}
            </span>
            <ChevronDown size={15} className={`text-zinc-600 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} />
          </div>
        </button>

        {abierto && (
          <div className="border-t border-gray-100 overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-5 text-zinc-600 font-medium">Empresa</th>
                  <th className="text-left py-2 pr-4 text-zinc-600 font-medium">Etapa</th>
                  <th className="text-left py-2 pr-4 text-zinc-600 font-medium">Riesgo</th>
                  <th className="text-left py-2 pr-5 text-zinc-600 font-medium">Sin actividad</th>
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
                      className="border-b border-gray-50 hover:bg-brand/5 hover:cursor-pointer transition group"
                    >
                      <td className="py-2 px-5">
                        <p className="font-medium text-zinc-800 truncate max-w-[160px] group-hover:text-brand">{lead.empresa}</p>
                        <p className="text-zinc-600 truncate max-w-[160px]">{lead.nombre_contacto}</p>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-zinc-800 text-[10px]">
                          {ETAPA_LABEL[lead.etapa_pipeline] ?? lead.etapa_pipeline}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${g.cls}`}>{g.label}</span>
                      </td>
                      <td className="py-2 pr-5">
                        <div className="flex items-center gap-2">
                          {dias !== null
                            ? <span className="text-[10px] text-zinc-700">{dias} días</span>
                            : <span className="text-[10px] text-zinc-700">Sin actividad</span>
                          }
                          {cargando && (
                            <div className="w-3 h-3 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                          )}
                        </div>
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

function ForecastPanel({ f }: { f: Forecast }) {
  const t       = TENDENCIA_STYLE[f.tendencia];
  const progPct = f.cierres_proyectados > 0
    ? Math.min(100, Math.round((f.cierres_mes_actual / f.cierres_proyectados) * 100))
    : 0;

  return (
    <div className={CARD_CLASS}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-zinc-500 shrink-0" strokeWidth={2} />
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Pronóstico comercial</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Proyección basada en ritmo actual</p>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${t.bg} ${t.text}`}>
          {t.label}
        </span>
      </div>

      {/* Cierres progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-zinc-700">Cierres este mes</span>
          <span className="text-[11px] text-zinc-500">{progPct}% del objetivo</span>
        </div>
        <div className="relative h-8 bg-zinc-100 rounded-xl overflow-hidden">
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
          <span className="text-[10px] text-zinc-500">{f.cierres_mes_actual} cerrados</span>
          <span className="text-[10px] text-zinc-500">{f.cierres_proyectados} proyectados · {f.ciclo_promedio_dias}d ciclo</span>
        </div>
      </div>

      {/* Stats + Conversión gauge */}
      <div className="flex items-start gap-4">
        <div className="flex-1 grid grid-cols-2 gap-2">
          {[
            { label: "Llamadas / sem.",   value: f.llamadas_semana_prom,                                       icon: <Phone size={11} className="text-zinc-400" />       },
            { label: "Leads activos",     value: f.leads_activos,                                              icon: <TrendingUp size={11} className="text-zinc-400" />  },
            { label: "Leads calientes",   value: f.leads_calientes,                                            icon: <Lightbulb size={11} className="text-zinc-400" />   },
            { label: "Contactos neces.",  value: f.contactos_necesarios > 0 ? f.contactos_necesarios : "—",   icon: <CalendarDays size={11} className="text-zinc-400" /> },
          ].map(s => (
            <div key={s.label} className="border border-zinc-100 rounded-xl p-3 flex items-center gap-2">
              <span className="shrink-0">{s.icon}</span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-zinc-800 leading-none">{s.value}</p>
                <p className="text-[9px] text-zinc-500 mt-0.5 leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Gauge tasa conversión */}
        <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
          <MiniGauge valor={f.tasa_conversion_pct} color={COLORS.primary} />
          <p className="text-[9px] text-zinc-400 text-center leading-tight">Tasa<br/>conversión</p>
          <p className="text-[8px] text-zinc-400">90 días</p>
        </div>
      </div>

      {/* Mensaje accionable */}
      {f.contactos_necesarios > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <p className="text-[11px] text-zinc-700 text-center">
            Necesitas <span className="font-bold text-zinc-900">{f.contactos_necesarios}</span> contactos más
            para cerrar <span className="font-bold">{Math.max(5, f.cierres_mes_actual + 2)}</span> clientes este mes
          </p>
        </div>
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
          <span className="text-zinc-600">{icon}</span>
          <span className="text-xs font-medium text-zinc-700">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {cumplido && <Check size={11} className="text-zinc-600" />}
          <span className={`text-xs font-bold ${cumplido ? "text-zinc-600" : textCls}`}>
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
      <p className="text-[10px] text-zinc-600 mt-1">{pct}% de la meta diaria</p>
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
          <p className="text-xs text-zinc-600 mt-0.5">Meta vs real de hoy</p>
        </div>
        {!editando ? (
          <button
            onClick={() => setEditando(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-700 hover:text-brand transition"
          >
            <Pencil size={12} /> Editar metas
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelar}
              className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-600 transition"
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
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="text-zinc-600">{icon}</span>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InteligenciaPage() {
  const hoy = new Date();
  const [periodo,     setPeriodo]     = useState<FiltroPeriodo>("anio");
  const [filtroFecha, setFiltroFecha] = useState<string>(String(hoy.getFullYear()));

  const [funnel,    setFunnel]    = useState<FunnelEtapa[]>([]);
  const [regiones,  setRegiones]  = useState<RegionEtapa[]>([]);
  const [heatmap,   setHeatmap]   = useState<any[]>([]);
  const [motivos,   setMotivos]   = useState<any[]>([]);
  const [metricas,  setMetricas]  = useState<any>(null);
  const [insights,  setInsights]  = useState<Insight[]>([]);
  const [estancados,setEstancados]= useState<LeadEstancado[]>([]);
  const [prioridad, setPrioridad] = useState<AccionPrioridad[]>([]);
  const [forecast,      setForecast]      = useState<Forecast | null>(null);
  const [objetivos,     setObjetivos]     = useState<ObjetivosDiarios | null>(null);
  const [tendencias, setTendencias] = useState<Tendencias | null>(null);
  const [cargando,        setCargando]        = useState(true);
  const [cargandoPeriodo, setCargandoPeriodo] = useState(false);
  const [analisisAbierto, setAnalisisAbierto] = useState(false);

  // Carga estática — funnel, región, insights, estancados, motivos (una vez)
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
        setFunnel(f);
        setRegiones(r);
        setMotivos(m);
        setInsights(ins);
        setEstancados(est);
        setPrioridad(pri);
      })
      .catch(console.error)
      .finally(() => setCargando(false));

    // Carga independiente — no bloquea si falla
    getForecast().then(setForecast).catch(console.error);
    getObjetivos().then(setObjetivos).catch(console.error);
  }, []);

  // Carga por período — usa el mismo servicio del Dashboard
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

    getTendencias(
      params.periodo,
      params.mes,
      params.anio,
    ).then(setTendencias).catch(console.error);
  }, [periodo, filtroFecha]);

  async function handleActualizarObjetivos(metas: { llamadas_meta: number; reuniones_meta: number; brochures_meta: number }) {
    try {
      const updated = await actualizarObjetivos(metas);
      setObjetivos(updated);
    } catch (err) {
      console.error(err);
    }
  }

  const handleFiltroPeriodo = (p: FiltroPeriodo, fecha: string) => {
    setPeriodo(p);
    setFiltroFecha(fecha);
  };

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

  return (
    <div className="p-6 max-w-9xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <TrendingUp size={20} className="text-brand" />
            Inteligencia comercial
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            KPIs de actividad · Funnel · Insights automáticos · Región · Ciclo de venta
          </p>
        </div>
        <div className="flex items-center gap-3">
          {cargandoPeriodo && (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-brand" />
          )}
          <FiltroPeriodoBotones
            periodo={periodo}
            filtroFecha={filtroFecha}
            onChange={handleFiltroPeriodo}
          />
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand" />
        </div>
      ) : (

        <div className="space-y-6">

          {/* ━━━ ZONA 1: Hero KPI tiles ━━━ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(() => {
              const tiles = [
                {
                  label: "Llamadas",
                  value: metricas?.llamadas?.total_llamadas ?? 0,
                  sub: `${metricas?.llamadas?.llamadas_contestadas ?? 0} contestadas · ${
                    (metricas?.llamadas?.total_llamadas ?? 0) > 0
                      ? Math.round(((metricas?.llamadas?.llamadas_contestadas ?? 0) / metricas.llamadas.total_llamadas) * 100)
                      : 0
                  }% tasa`,
                  icon: <Phone size={13} className="text-zinc-500" />,
                  delta: tendencias?.llamadas?.pct ?? null,
                },
                {
                  label: "Reuniones",
                  value: metricas?.reuniones?.total_reuniones ?? 0,
                  sub: `${periodoLabel(periodo, filtroFecha)}`,
                  icon: <CalendarDays size={13} className="text-zinc-500" />,
                  delta: tendencias?.reuniones?.pct ?? null,
                },
                {
                  label: "Brochures",
                  value: metricas?.brochures?.total_brochures ?? 0,
                  sub: `${periodoLabel(periodo, filtroFecha)}`,
                  icon: <FileText size={13} className="text-zinc-500" />,
                  delta: tendencias?.brochures?.pct ?? null,
                },
                {
                  label: "Valor activo",
                  value: fmtSolKpi(valorPipeline),
                  sub: `${totalPipeline - cerrados} leads en pipeline`,
                  icon: <TrendingUp size={13} className="text-zinc-500" />,
                  delta: null,
                },
              ];
              return tiles.map(tile => (
                <div key={tile.label} className={CARD_CLASS}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-1.5 rounded-lg bg-zinc-100 shrink-0">{tile.icon}</div>
                    {tile.delta !== null && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        tile.delta > 0  ? "bg-zinc-800 text-white"
                        : tile.delta < 0 ? "bg-red-100 text-red-600"
                        : "bg-zinc-100 text-zinc-500"
                      }`}>
                        {tile.delta > 0 ? `▲${tile.delta}%` : tile.delta < 0 ? `▼${Math.abs(tile.delta)}%` : "="}
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-zinc-900 leading-none">{tile.value}</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-2">{tile.label}</p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-tight">{tile.sub}</p>
                </div>
              ));
            })()}
          </div>

          {/* ━━━ Divider ━━━ */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Diagnóstico del día</span>
            <div className="flex-1 border-t border-zinc-100" />
          </div>

          {/* ━━━ ZONA 2: Diagnóstico del día ━━━ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PrioridadOperacional acciones={prioridad} />
            {objetivos && (
              <ObjetivosPanel obj={objetivos} onActualizar={handleActualizarObjetivos} />
            )}
          </div>

          {/* ━━━ Divider ━━━ */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Pipeline & Conversión</span>
            <div className="flex-1 border-t border-zinc-100" />
          </div>

          {/* ━━━ ZONA 3: Pipeline & Canal ━━━ */}
          <FunnelConversion data={funnel} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CanalEfectividadChart />
            {forecast && <ForecastPanel f={forecast} />}
          </div>

          {/* ━━━ Divider ━━━ */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Inteligencia automática</span>
            <div className="flex-1 border-t border-zinc-100" />
          </div>

          {/* ━━━ ZONA 4: Insights & Alertas ━━━ */}
          {insights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {insights.map((ins, i) => {
                const style      = INSIGHT_STYLES[ins.tipo];
                const tieneVizual = ins.valor !== undefined;
                return (
                  <div key={i} className={`${CARD_CLASS} flex items-center gap-4`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2">
                        {style.icon}
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider leading-none">
                          {ins.titulo}
                        </p>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed">{ins.texto}</p>
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

          {estancados.length > 0 && <LeadsEstancadosPanel leads={estancados} />}

          {/* ━━━ ZONA 5: Análisis profundo (colapsable) ━━━ */}
          <button
            onClick={() => setAnalisisAbierto(v => !v)}
            className="w-full flex items-center gap-3 pt-2 group"
          >
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0 group-hover:text-zinc-600 transition">
              Análisis profundo
            </span>
            <div className="flex-1 border-t border-zinc-100" />
            <span className="text-[10px] text-zinc-400 flex items-center gap-1 shrink-0 group-hover:text-zinc-600 transition">
              {analisisAbierto ? "Ocultar" : "Expandir"}
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${analisisAbierto ? "rotate-180" : ""}`}
              />
            </span>
          </button>

          {analisisAbierto && (
            <div className="space-y-5">

              {/* Heatmap + Motivos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <HeatmapHoras data={heatmap} />
                <MotivosChart data={motivos} />
              </div>

              {/* Región */}
              <RegionChart data={regiones} />

              {/* Propuestas + Ciclo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ResumenEstadosPropuestas />
                <div className={CARD_CLASS}>
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays size={14} className="text-zinc-500" strokeWidth={2} />
                    <div>
                      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Ciclo de venta</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Tiempo promedio desde primer contacto hasta cierre</p>
                    </div>
                  </div>
                  <CicloVenta />
                </div>
              </div>

              {/* Tiempo primera respuesta */}
              <TiempoPrimeraRespuestaChart />

              {/* Rechazos duales */}
              <RechazosDualesChart />

              {/* Forecast ingresos + Abandono */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ForecastIngresosChart />
                <AbandonoPipelineChart />
              </div>

              {/* Scatter score vs días */}
              <LeadScatterChart />

            </div>
          )}

        </div>
      )}
    </div>
  );
}
