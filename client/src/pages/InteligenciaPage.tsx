/** client/src/pages/InteligenciaPage.tsx */

import { useEffect, useState, useRef } from "react";
import { TrendingUp, Phone, CalendarDays, FileText, Package, AlertTriangle, CheckCircle, Info, Lightbulb, ChevronDown, ChevronLeft, ChevronRight, Calendar, Pencil, X, Check } from "lucide-react";
import { getFunnelPipeline, getAnalisisRegion, getMotivosPerdida } from "../services/prospectos.api";
import { getHeatmapLlamadas }  from "../services/llamadas.api";
import { getMetricasDashboard } from "../services/dashboard.api";
import { getInsights, getLeadsEstancados, getPrioridadOperacional, getForecast, getObjetivos, actualizarObjetivos, getTendencias } from "../services/inteligencia.api";
import type { Tendencias } from "../services/inteligencia.api";
import { FunnelConversion }    from "../components/inteligencia/FunnelConversion";
import { RegionChart }         from "../components/inteligencia/RegionChart";
import { PrioridadOperacional } from "../components/inteligencia/PrioridadOperacional";
import { HeatmapHoras }        from "../components/llamadas/HeatmapHoras";
import { MotivosChart }        from "../components/llamadas/MotivosChart";
import type { FunnelEtapa, RegionEtapa } from "../services/prospectos.api";
import type { Insight, LeadEstancado, AccionPrioridad, Forecast, ObjetivosDiarios } from "../services/inteligencia.api";

// ─── Tipos y helpers ──────────────────────────────────────────────────────────

type Periodo = "7d" | "30d" | "90d" | "todo" | "mes";

const PERIODOS: { label: string; value: Periodo }[] = [
  { label: "7 días",  value: "7d"   },
  { label: "30 días", value: "30d"  },
  { label: "90 días", value: "90d"  },
  { label: "Todo",    value: "todo" },
];

const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_FULL  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function periodoToDashboard(p: Periodo, mesAno?: { mes: number; anio: number }): { periodo: string; mes?: number; anio?: number } {
  if (p === "mes" && mesAno) return { periodo: "mes", mes: mesAno.mes, anio: mesAno.anio };
  switch (p) {
    case "7d":   return { periodo: "semana" };
    case "30d":  return { periodo: "mes" };
    case "90d":  return { periodo: "trimestre" };
    case "todo": return { periodo: "todo" };
    default:     return { periodo: "mes" };
  }
}

function heatmapFiltro(p: Periodo, mesAno?: { mes: number; anio: number }) {
  if (p === "mes" && mesAno) {
    const ini = `${mesAno.anio}-${String(mesAno.mes).padStart(2,"0")}-01`;
    const fin = new Date(mesAno.anio, mesAno.mes, 1).toISOString().split("T")[0];
    return { fecha_inicio: ini, fecha_fin: fin };
  }
  if (p === "todo") return undefined;
  const d = new Date();
  d.setDate(d.getDate() - (p === "7d" ? 7 : p === "30d" ? 30 : 90));
  return { fecha_inicio: d.toISOString().split("T")[0] };
}

function getPeriodoFechas(p: Periodo, mesAno?: { mes: number; anio: number }) {
  const hoy = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  if (p === "todo") return null;
  if (p === "mes" && mesAno) {
    const ini  = `${mesAno.anio}-${String(mesAno.mes).padStart(2,"0")}-01`;
    const fin  = fmt(new Date(mesAno.anio, mesAno.mes, 1));
    const pm   = mesAno.mes === 1 ? 12 : mesAno.mes - 1;
    const pa   = mesAno.mes === 1 ? mesAno.anio - 1 : mesAno.anio;
    const iniP = `${pa}-${String(pm).padStart(2,"0")}-01`;
    return { current: { fecha_inicio: ini, fecha_fin: fin }, previous: { fecha_inicio: iniP, fecha_fin: ini } };
  }
  const dias = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  const d1 = new Date(hoy); d1.setDate(hoy.getDate() - dias);
  const d2 = new Date(hoy); d2.setDate(hoy.getDate() - dias * 2);
  return {
    current:  { fecha_inicio: fmt(d1), fecha_fin: fmt(hoy) },
    previous: { fecha_inicio: fmt(d2), fecha_fin: fmt(d1)  },
  };
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
  positivo:    { bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle size={14} className="text-emerald-500 shrink-0" /> },
  alerta:      { bg: "bg-red-50",     border: "border-red-200",     icon: <AlertTriangle size={14} className="text-red-500 shrink-0" /> },
  info:        { bg: "bg-blue-50",    border: "border-blue-200",    icon: <Info size={14} className="text-blue-500 shrink-0" /> },
  oportunidad: { bg: "bg-amber-50",   border: "border-amber-200",   icon: <Lightbulb size={14} className="text-amber-500 shrink-0" /> },
};

// ─── Componente leads estancados acordeón ────────────────────────────────────

function gravedadDias(dias: number | null): { label: string; cls: string } {
  if (dias === null || dias < 7)  return { label: "Bajo",    cls: "bg-zinc-100 text-zinc-500"     };
  if (dias < 14)                  return { label: "Medio",   cls: "bg-yellow-100 text-yellow-700"  };
  if (dias < 30)                  return { label: "Alto",    cls: "bg-orange-100 text-orange-700"  };
  return                                 { label: "Crítico", cls: "bg-red-100 text-red-700 font-bold" };
}

function LeadsEstancadosPanel({ leads }: { leads: LeadEstancado[] }) {
  const [abierto, setAbierto] = useState(false);
  const criticos = leads.filter(l => {
    const d = l.ultima_actividad ? Math.round((Date.now() - new Date(l.ultima_actividad).getTime()) / 86400000) : 999;
    return d >= 30;
  }).length;

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      {/* Cabecera — siempre visible, click para toggle */}
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-zinc-800">
              Leads sin actividad (+14 días)
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {leads.length} leads sin actividad reciente{criticos > 0 ? ` · ${criticos} críticos` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {criticos > 0 && (
            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
              {criticos} críticos
            </span>
          )}
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
          <ChevronDown
            size={15}
            className={`text-zinc-400 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Contenido desplegable */}
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
                return (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-2 px-5">
                      <p className="font-medium text-zinc-800 truncate max-w-[160px]">{lead.empresa}</p>
                      <p className="text-zinc-400 truncate max-w-[160px]">{lead.nombre_contacto}</p>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-zinc-600 text-[10px]">
                        {ETAPA_LABEL[lead.etapa_pipeline] ?? lead.etapa_pipeline}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${g.cls}`}>
                        {g.label}
                      </span>
                    </td>
                    <td className="py-2 pr-5">
                      {dias !== null
                        ? <span className="text-[10px] text-zinc-500">{dias} días</span>
                        : <span className="text-[10px] text-zinc-300">Sin actividad</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
          <p className={`text-[10px] font-medium mt-0.5 ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
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
  subiendo: { text: "text-emerald-600", label: "↑ Subiendo", bg: "bg-emerald-50" },
  estable:  { text: "text-blue-600",    label: "→ Estable",  bg: "bg-blue-50"    },
  bajando:  { text: "text-red-500",     label: "↓ Bajando",  bg: "bg-red-50"     },
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
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-500 font-medium">Cierres proyectados este mes</p>
          <p className="text-3xl font-bold text-indigo-700 mt-1">{f.cierres_proyectados}</p>
          <p className="text-xs text-indigo-400 mt-0.5">{f.cierres_mes_actual} ya cerrados · {f.ciclo_promedio_dias}d ciclo promedio</p>
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
          { label: "Llamadas / semana",     value: f.llamadas_semana_prom, color: "text-blue-600"    },
          { label: "Leads activos",          value: f.leads_activos,        color: "text-zinc-700"    },
          { label: "Leads calientes",        value: f.leads_calientes,      color: "text-orange-600"  },
          { label: "Contactos necesarios",   value: f.contactos_necesarios > 0 ? f.contactos_necesarios : "—", color: "text-violet-600" },
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
          {cumplido && <Check size={11} className="text-emerald-500" />}
          <span className={`text-xs font-bold ${cumplido ? "text-emerald-600" : textCls}`}>
            {real} / {meta}
          </span>
        </div>
      </div>
      <div className={`h-2 rounded-full ${trackCls}`}>
        <div
          className={`h-2 rounded-full transition-all duration-500 ${cumplido ? "bg-emerald-500" : fillCls}`}
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

  const inputCls = "w-16 text-center px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400";

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
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-600 transition"
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
              className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-lg transition disabled:opacity-60"
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
            textCls="text-blue-600"
            fillCls="bg-blue-600"
            trackCls="bg-blue-100"
          />
          <ObjetivoBar
            label="Reuniones"
            real={obj.reuniones_hoy}
            meta={obj.reuniones_meta}
            icon={<CalendarDays size={13} />}
            textCls="text-indigo-600"
            fillCls="bg-indigo-600"
            trackCls="bg-indigo-100"
          />
          <ObjetivoBar
            label="Brochures"
            real={obj.brochures_hoy}
            meta={obj.brochures_meta}
            icon={<Package size={13} />}
            textCls="text-amber-600"
            fillCls="bg-amber-600"
            trackCls="bg-amber-100"
          />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InteligenciaPage() {
  const hoy       = new Date();
  const [periodo,   setPeriodo]   = useState<Periodo>("todo");
  const [mesAno,    setMesAno]    = useState({ mes: hoy.getMonth() + 1, anio: hoy.getFullYear() });
  const [anioPicker,setAnioPicker]= useState(hoy.getFullYear());
  const [showPicker,setShowPicker]= useState(false);
  const pickerRef                 = useRef<HTMLDivElement>(null);

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

  // Cerrar picker al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    const params = periodoToDashboard(periodo, mesAno);
    const filtroH = heatmapFiltro(periodo, mesAno);
    setCargandoPeriodo(true);
    Promise.all([
      getMetricasDashboard(params),
      getHeatmapLlamadas(filtroH),
    ])
      .then(([m, h]) => { setMetricas(m); setHeatmap(h); })
      .catch(console.error)
      .finally(() => setCargandoPeriodo(false));

    // Tendencias vs período anterior
    if (periodo !== "todo") {
      getTendencias(periodo, periodo === "mes" ? mesAno.mes : undefined, periodo === "mes" ? mesAno.anio : undefined)
        .then(setTendencias)
        .catch(console.error);
    } else {
      setTendencias(null);
    }
  }, [periodo, mesAno]);

  async function handleActualizarObjetivos(metas: { llamadas_meta: number; reuniones_meta: number; brochures_meta: number }) {
    try {
      const updated = await actualizarObjetivos(metas);
      setObjetivos(updated);
    } catch (err) {
      console.error(err);
    }
  }

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
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-500" />
            Inteligencia comercial
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            KPIs de actividad · Funnel · Insights automáticos · Región
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Períodos fijos */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {PERIODOS.map(p => (
              <button
                key={p.value}
                onClick={() => { setPeriodo(p.value); setShowPicker(false); }}
                className={`px-3 py-1 text-xs rounded-md transition ${
                  periodo === p.value
                    ? "bg-white shadow-sm text-zinc-800 font-medium"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Selector de mes específico */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => { setShowPicker(v => !v); setAnioPicker(mesAno.anio); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition ${
                periodo === "mes"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-zinc-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              <Calendar size={12} />
              {periodo === "mes"
                ? `${MESES_CORTO[mesAno.mes - 1]} ${mesAno.anio}`
                : "Por mes"
              }
              <ChevronDown size={11} className={`transition-transform ${showPicker ? "rotate-180" : ""}`} />
            </button>

            {showPicker && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64">
                {/* Navegación de año */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setAnioPicker(y => y - 1)}
                    className="p-1 rounded hover:bg-gray-100 text-zinc-500 transition"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-sm font-semibold text-zinc-800">{anioPicker}</span>
                  <button
                    onClick={() => setAnioPicker(y => y + 1)}
                    disabled={anioPicker >= hoy.getFullYear()}
                    className="p-1 rounded hover:bg-gray-100 text-zinc-500 transition disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* Grid de meses */}
                <div className="grid grid-cols-4 gap-1">
                  {MESES_CORTO.map((m, i) => {
                    const esFuturo = anioPicker === hoy.getFullYear() && i + 1 > hoy.getMonth() + 1;
                    const esActual = periodo === "mes" && mesAno.mes === i + 1 && mesAno.anio === anioPicker;
                    return (
                      <button
                        key={m}
                        disabled={esFuturo}
                        onClick={() => {
                          setMesAno({ mes: i + 1, anio: anioPicker });
                          setPeriodo("mes");
                          setShowPicker(false);
                        }}
                        className={`py-1.5 text-xs rounded-lg transition ${
                          esActual
                            ? "bg-indigo-600 text-white font-semibold"
                            : esFuturo
                              ? "text-zinc-300 cursor-not-allowed"
                              : "text-zinc-600 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>

                {/* Label del mes seleccionado */}
                {periodo === "mes" && mesAno.anio === anioPicker && (
                  <p className="text-[10px] text-center text-indigo-500 mt-3 font-medium">
                    {MESES_FULL[mesAno.mes - 1]} {mesAno.anio}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500" />
        </div>
      ) : (

        <div className="space-y-6">

          {/* ── KPIs de actividad ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Actividad comercial —{" "}
                {periodo === "mes"
                  ? `${MESES_FULL[mesAno.mes - 1]} ${mesAno.anio}`
                  : periodo === "todo"
                    ? "todo el tiempo"
                    : `últimos ${periodo.replace("d"," días")}`
                }
              </p>
              {cargandoPeriodo && (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-indigo-400" />
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard
                icon={<Phone size={14} className="text-blue-500" />}
                label="Llamadas"
                value={metricas?.llamadas?.total_llamadas ?? 0}
                sub={`${metricas?.llamadas?.llamadas_contestadas ?? 0} contestadas · ${
                  metricas?.llamadas?.total_llamadas > 0
                    ? Math.round((metricas.llamadas.llamadas_contestadas / metricas.llamadas.total_llamadas) * 100)
                    : 0
                }% tasa`}
                color="text-blue-600"
                trend={tendencias?.llamadas.pct ?? null}
              />
              <KpiCard
                icon={<CalendarDays size={14} className="text-indigo-500" />}
                label="Reuniones"
                value={metricas?.reuniones?.total_reuniones ?? 0}
                sub={`${metricas?.reuniones?.reuniones_realizadas ?? 0} realizadas · ${metricas?.reuniones?.reuniones_canceladas ?? 0} canceladas`}
                color="text-indigo-600"
                trend={tendencias?.reuniones.pct ?? null}
              />
              <KpiCard
                icon={<FileText size={14} className="text-violet-500" />}
                label="Prospectos interesados"
                value={metricas?.prospectos?.prospectos_interesados ?? 0}
                sub={`de ${metricas?.prospectos?.total_prospectos ?? 0} totales · ${metricas?.tasa_conversion ?? 0}% conversión`}
                color="text-violet-600"
                trend={null}
              />
              <KpiCard
                icon={<Package size={14} className="text-amber-500" />}
                label="Brochures"
                value={metricas?.brochures?.total_brochures ?? 0}
                sub={`WA: ${metricas?.brochures?.brochures_whatsapp ?? 0} · Correo: ${metricas?.brochures?.brochures_correo ?? 0}`}
                color="text-amber-600"
                trend={tendencias?.brochures.pct ?? null}
              />
            </div>
          </div>

          {/* ── KPIs del pipeline ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Total leads",       value: totalPipeline,                                           color: "text-zinc-800"    },
              { label: "Valor en pipeline", value: fmtSolKpi(valorPipeline),                                color: "text-indigo-600"  },
              { label: "Cerrados",          value: cerrados,                                                 color: "text-emerald-600" },
              { label: "No contesta",       value: metricas?.prospectos?.prospectos_no_contesta ?? 0,       color: "text-red-500"     },
              { label: "Volver a llamar",   value: metricas?.prospectos?.prospectos_volver_llamar ?? 0,     color: "text-amber-600"   },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-[11px] text-zinc-400">{kpi.label}</p>
                <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

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

        </div>
      )}
    </div>
  );
}
