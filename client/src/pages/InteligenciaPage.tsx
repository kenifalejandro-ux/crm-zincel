/** client/src/pages/InteligenciaPage.tsx */

import { COLORS } from "../lib/tokens";
import { useEffect, useState } from "react";
import { TrendingUp, Phone, CalendarDays, FileText, Package, AlertTriangle, CheckCircle, Info, Lightbulb, ChevronDown, Pencil, X, Check } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
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
import { ConversionFunnelChart }       from "../components/inteligencia/ConversionFunnel";
import { RechazosDualesChart }         from "../components/inteligencia/RechazosDuales";
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

function calcTrend(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

const ETAPA_LABEL: Record<string, string> = {
  nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado",
  propuesta_enviada: "Propuesta", negociacion: "Negociación",
  cerrado_ganado: "Cerrado", perdido: "Perdido",
};

const INSIGHT_STYLES: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
  positivo:    { bg: "bg-zinc-50",  border: "border-zinc-200",  icon: <CheckCircle  size={14} className="text-zinc-400 shrink-0" /> },
  alerta:      { bg: "bg-red-50",   border: "border-red-200",   icon: <AlertTriangle size={14} className="text-red-500 shrink-0" /> },
  info:        { bg: "bg-brand/5",  border: "border-brand/20",  icon: <Info         size={14} className="text-brand shrink-0" /> },
  oportunidad: { bg: "bg-brand/5",  border: "border-brand/20",  icon: <Lightbulb    size={14} className="text-brand shrink-0" /> },
};

// ─── Componente leads estancados acordeón ────────────────────────────────────

function gravedadDias(dias: number | null): { label: string; cls: string } {
  if (dias === null || dias < 7)  return { label: "Bajo",    cls: "bg-zinc-100 text-zinc-500"       };
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
            <AlertTriangle size={14} className="text-zinc-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-zinc-800">Leads sin actividad (+14 días)</p>
              <p className="text-xs text-zinc-400 mt-0.5">
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
            <ChevronDown size={15} className={`text-zinc-400 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} />
          </div>
        </button>

        {abierto && (
          <div className="border-t border-gray-100 overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-5 text-zinc-400 font-medium">Empresa</th>
                  <th className="text-left py-2 pr-4 text-zinc-400 font-medium">Etapa</th>
                  <th className="text-left py-2 pr-4 text-zinc-400 font-medium">Riesgo</th>
                  <th className="text-left py-2 pr-5 text-zinc-400 font-medium">Sin actividad</th>
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
                        <p className="text-zinc-400 truncate max-w-[160px]">{lead.nombre_contacto}</p>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-zinc-600 text-[10px]">
                          {ETAPA_LABEL[lead.etapa_pipeline] ?? lead.etapa_pipeline}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${g.cls}`}>{g.label}</span>
                      </td>
                      <td className="py-2 pr-5">
                        <div className="flex items-center gap-2">
                          {dias !== null
                            ? <span className="text-[10px] text-zinc-500">{dias} días</span>
                            : <span className="text-[10px] text-zinc-300">Sin actividad</span>
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

// ─── Componente KPI card ──────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color = "text-zinc-800", trend }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string; trend?: number | null;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-gray-50 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-400 truncate">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        {trend !== null && trend !== undefined && (
          <p className={`text-[10px] font-medium mt-0.5 ${trend >= 0 ? "text-zinc-500" : "text-red-500"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs período anterior
          </p>
        )}
        {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Forecast panel ──────────────────────────────────────────────────────────

const TENDENCIA_STYLE = {
  subiendo: { text: "text-zinc-600", label: "↑ Subiendo", bg: "bg-zinc-100" },
  estable:  { text: "text-brand",   label: "→ Estable",  bg: "bg-brand/5"  },
  bajando:  { text: "text-red-500", label: "↓ Bajando",  bg: "bg-red-50"   },
};

function ForecastPanel({ f }: { f: Forecast }) {
  const t = TENDENCIA_STYLE[f.tendencia];
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800">Pronóstico comercial</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Proyección basada en tu ritmo actual</p>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${t.bg} ${t.text}`}>
          {t.label}
        </span>
      </div>

      {/* Main projection */}
      <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-brand font-medium">Cierres proyectados este mes</p>
          <p className="text-3xl font-bold text-zinc-800 mt-1">{f.cierres_proyectados}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{f.cierres_mes_actual} ya cerrados · {f.ciclo_promedio_dias}d ciclo promedio</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-zinc-400">Tasa de conversión</p>
          <p className="text-2xl font-bold text-zinc-800">{f.tasa_conversion_pct}%</p>
          <p className="text-xs text-zinc-400">últimos 90 días</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Llamadas / semana",     value: f.llamadas_semana_prom, color: "text-brand"    },
          { label: "Leads activos",          value: f.leads_activos,        color: "text-zinc-700" },
          { label: "Leads calientes",        value: f.leads_calientes,      color: "text-zinc-700" },
          { label: "Contactos necesarios",   value: f.contactos_necesarios > 0 ? f.contactos_necesarios : "—", color: "text-zinc-700" },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {f.contactos_necesarios > 0 && (
        <p className="text-[11px] text-zinc-500 mt-3 text-center">
          Necesitas {f.contactos_necesarios} contactos más para cerrar {Math.max(5, f.cierres_mes_actual + 2)} clientes este mes
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
          <span className="text-xs font-medium text-zinc-700">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {cumplido && <Check size={11} className="text-zinc-400" />}
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
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
            <span className="text-base">🎯</span> Objetivos del día
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">Meta vs real de hoy</p>
        </div>
        {!editando ? (
          <button
            onClick={() => setEditando(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-brand transition"
          >
            <Pencil size={12} /> Editar metas
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelar}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition"
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
          <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-brand" />
            Inteligencia comercial
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            KPIs de actividad · Funnel · Insights automáticos · Región · Ciclo de venta
          </p>
        </div>
        <FiltroPeriodoBotones
          periodo={periodo}
          filtroFecha={filtroFecha}
          onChange={handleFiltroPeriodo}
        />
      </div>

      {cargando ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand" />
        </div>
      ) : (

        <div className="space-y-6">

          {/* ── Gráficos KPI ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Chart 1 — Actividad comercial */}
            <div className="bg-white/85 backdrop-blur-xl rounded-xl border border-zinc-200/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Actividad comercial</p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {periodoLabel(periodo, filtroFecha)}
                  </p>
                </div>
                {cargandoPeriodo && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-brand" />}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  layout="vertical"
                  data={[
                    { name: "Llamadas",    value: metricas?.llamadas?.total_llamadas ?? 0,              color: COLORS.dark },
                    { name: "Prospectos",  value: metricas?.prospectos?.prospectos_interesados ?? 0,    color: COLORS.primary },
                    { name: "Brochures",   value: metricas?.brochures?.total_brochures ?? 0,            color: COLORS.muted },
                    { name: "Reuniones",   value: metricas?.reuniones?.total_reuniones ?? 0,            color: COLORS.mutedDark },
                  ]}
                  margin={{ left: 16, right: 24, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "#f4f4f5" }}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb", padding: "4px 10px" }}
                    formatter={(v: any) => [v, ""]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                    {[
                      { color: COLORS.dark },
                      { color: COLORS.primary },
                      { color: COLORS.muted },
                      { color: COLORS.mutedDark },
                    ].map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Sub-stats */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-100">
                <p className="text-[10px] text-zinc-400">
                  <span className="font-semibold text-zinc-800">{metricas?.llamadas?.llamadas_contestadas ?? 0}</span> llamadas contestadas
                  · <span className="font-semibold">{metricas?.llamadas?.total_llamadas > 0 ? Math.round((metricas.llamadas.llamadas_contestadas / metricas.llamadas.total_llamadas) * 100) : 0}%</span> tasa
                </p>
                <p className="text-[10px] text-zinc-400">
                  <span className="font-semibold text-brand">{metricas?.tasa_conversion ?? 0}%</span> conversión prospectos
                </p>
              </div>
            </div>

            {/* Chart 2 — Pipeline */}
            <div className="bg-white/85 backdrop-blur-xl rounded-xl border border-zinc-200/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6">
              <div className="mb-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estado del pipeline</p>
                <p className="text-[11px] text-zinc-400 mt-1">Distribución de leads y valor activo</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Donut */}
                <div className="shrink-0">
                  <ResponsiveContainer width={130} height={130}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Cerrados",        value: cerrados,                                              fill: COLORS.dark },
                          { name: "No contesta",     value: metricas?.prospectos?.prospectos_no_contesta ?? 0,    fill: COLORS.danger },
                          { name: "Volver a llamar", value: metricas?.prospectos?.prospectos_volver_llamar ?? 0,  fill: COLORS.primary },
                          { name: "Resto",           value: Math.max(0, totalPipeline - cerrados - (metricas?.prospectos?.prospectos_no_contesta ?? 0) - (metricas?.prospectos?.prospectos_volver_llamar ?? 0)), fill: "#e4e4e7" },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={35} outerRadius={58}
                        dataKey="value" strokeWidth={0}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Leyenda + stats */}
                <div className="flex-1 space-y-2">
                  {[
                    { label: "Total leads",       value: totalPipeline,          color: "text-zinc-800", dot: "bg-zinc-300",  dotStyle: undefined },
                    { label: "Valor activo",      value: fmtSolKpi(valorPipeline), color: "text-brand",   dot: "bg-brand",     dotStyle: undefined },
                    { label: "Cerrados",           value: cerrados,                                                                 color: "text-zinc-800",  dot: "",  dotStyle: COLORS.dark   },
                    { label: "No contesta",        value: metricas?.prospectos?.prospectos_no_contesta ?? 0,                       color: "text-red-500",   dot: "bg-red-400", dotStyle: undefined },
                    { label: "Volver a llamar",    value: metricas?.prospectos?.prospectos_volver_llamar ?? 0,                     color: "text-zinc-500",  dot: "",  dotStyle: COLORS.muted  },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`}
                          style={s.dotStyle ? { backgroundColor: s.dotStyle } : undefined}
                        />
                        <p className="text-[11px] text-zinc-500 truncate">{s.label}</p>
                      </div>
                      <p className={`text-xs font-bold shrink-0 ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ── Estado de propuestas ── */}
          <ResumenEstadosPropuestas />

          {/* ── Objetivos del día ── */}
          {objetivos && (
            <ObjetivosPanel obj={objetivos} onActualizar={handleActualizarObjetivos} />
          )}

          {/* ── Prioridad operacional ── */}
          <PrioridadOperacional acciones={prioridad} />

          {/* ── Pronóstico comercial ── */}
          {forecast && <ForecastPanel f={forecast} />}

          {/* ── Insights automáticos ── */}
          {insights.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
                Insights automáticos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {insights.map((ins, i) => {
                  const style = INSIGHT_STYLES[ins.tipo];
                  return (
                    <div key={i} className={`rounded-xl border p-4 ${style.bg} ${style.border}`}>
                      <div className="flex items-start gap-2 mb-1">
                        {style.icon}
                        <p className="text-xs font-semibold text-zinc-800">{ins.icono} {ins.titulo}</p>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed pl-5">{ins.texto}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Leads estancados (acordeón) ── */}
          {estancados.length > 0 && (
            <LeadsEstancadosPanel leads={estancados} />
          )}

          {/* ── Funnel ── */}
          <FunnelConversion data={funnel} />

          {/* ── Heatmap + Motivos ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <HeatmapHoras data={heatmap} />
            <MotivosChart data={motivos} />
          </div>

          {/* ── Región ── */}
          <RegionChart data={regiones} />

          {/* ── Análisis avanzado ── */}
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
              Análisis estratégico avanzado
            </p>
            <div className="space-y-4">
              {/* Fila 1: conversión funnel + primera respuesta */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ConversionFunnelChart />
                <TiempoPrimeraRespuestaChart />
              </div>
              {/* Fila 2: forecast ingresos */}
              <ForecastIngresosChart />
              {/* Fila 3: rechazos duales primer contacto + propuestas */}
              <RechazosDualesChart />
              {/* Fila 4: abandono pipeline */}
              <AbandonoPipelineChart />
            </div>
          </div>

          {/* ── Ciclo de venta ── */}
          <div className="bg-zinc-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-800">Ciclo de venta</p>
                <p className="text-[10px] text-zinc-400">Tiempo promedio desde primer contacto hasta cierre</p>
              </div>
            </div>
            <CicloVenta />
          </div>

        </div>
      )}
    </div>
  );
}
