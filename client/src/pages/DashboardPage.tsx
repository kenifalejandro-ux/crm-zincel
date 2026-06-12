/**client/src/pages/DashboardPage.tsx */

import { useEffect, useState } from "react";
import { CARD_CLASS, HEADER_CLASS } from "../lib/tokens";
import { ChevronDown, ChevronLeft, ChevronRight, CheckSquare, AlertCircle, Clock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChevronDown as ChevronDownIcon } from "lucide-react";
import { getMetricasDashboard } from "../services/dashboard.api";
import { getReuniones } from "../services/reuniones.api";
import { getResumenTareas } from "../services/tareas.api";
import { getScoresLeads, getAnalisisRegion } from "../services/prospectos.api";
import type { RegionEtapa } from "../services/prospectos.api";
import type { ResumenTareas } from "../types/tarea.types";

import { LlamadasChart }         from "../components/dashboard/LlamadasChart";
import { LlamadasCanalChart }    from "../components/dashboard/LlamadasCanalChart";
import { ReunionesChart }        from "../components/dashboard/ReunionesChart";
import { TemperaturaLeadsChart } from "../components/dashboard/TemperaturaLeadsChart";
import { ActividadHoy }          from "../components/dashboard/ActividadHoy";
import { ProximasReuniones }     from "../components/dashboard/ProximasReuniones";
import { DashboardEstadoLeads }  from "../components/dashboard/DashboardEstadoLeads";
import { DashboardMapRegion }    from "../components/dashboard/DashboardMapRegion";
import { VentasChart }           from "../components/dashboard/VentasChart";
import { BrochuresChart }        from "../components/dashboard/BrochuresChart";
import { TasaConversion }        from "../components/dashboard/TasaConversion";
import { WebResumenChart }       from "../components/dashboard/WebResumenChart";
import { ResumenEstadosPropuestas } from "../components/propuestas/ResumenEstadosPropuestas";
import { VentasGanadasCharts }     from "../components/dashboard/VentasGanadasCharts";

const MESES_FULL  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_CORTO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const DIAS_SEMANA = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

type FiltroPeriodo = "hoy" | "semana" | "mes" | "anio" | "dia";

function generarCeldasMes(mes: number, anio: number): (number | null)[] {
  const primerDia = new Date(anio, mes, 1).getDay(); // 0=Dom
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const ajuste    = (primerDia + 6) % 7; // lunes primero
  const celdas: (number | null)[] = Array(ajuste).fill(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);
  return celdas;
}

function formatDiaBtn(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  return `${d} ${MESES_CORTO[m - 1]} ${y}`;
}

export interface Metricas {
  llamadas: {
    total_llamadas:          number;
    llamadas_contestadas:    number;
    llamadas_no_contestadas: number;
    llamadas_hoy:            number;
    llamadas_mes:            number;
  };
  llamadas_por_canal:  Array<{ canal: string; cantidad: number }>;
  brochures_por_canal: Array<{ canal: string; cantidad: number }>;
  brochures: {
    total_brochures:    number;
    brochures_correo:   number;
    brochures_whatsapp: number;
    brochures_hoy:      number;
    brochures_mes:      number;
  };
  reuniones: {
    total_reuniones:       number;
    reuniones_programadas: number;
    reuniones_realizadas:  number;
    reuniones_canceladas:    number;
    reuniones_descartadas:   number;
    reuniones_reprogramadas: number;
    reuniones_hoy:         number;
    reuniones_mes:         number;
  };
  prospectos: {
    total_prospectos:           number;
    prospectos_interesados:     number;
    prospectos_no_interesados:  number;
    prospectos_no_contesta:     number;
    prospectos_volver_llamar:   number;
    prospectos_buzon:           number;
    prospectos_tiene_proveedor: number;
    prospectos_con_web:         number;
    prospectos_sin_web:         number;
    web_actualizada:            number;
    web_por_actualizar:         number;
    web_vencida:                number;
    web_en_mantenimiento:       number;
    web_sin_informacion:        number;
    prospectos_hoy:             number;
    prospectos_mes:             number;
  };
  ventas: {
    cerradas:   number;
    en_proceso: number;
    no:         number;
  };
  ventas_por_servicio: Array<{ servicio: string; cantidad: number; monto_total: number }>;
  tasa_conversion:       number;
  prospectos_por_ciudad: Array<{ ciudad: string; total: number }>;
  prospectos_por_estado: Array<{ estado_lead: string; total: number }>;
  finanzas: {
    ingresos_mes:  number;
    ingresos_anio: number;
  };
  propuestas: {
    total_propuestas:    number;
    propuestas_ganadas:  number;
    propuestas_perdidas: number;
    propuestas_activas:  number;
    propuestas_hoy:      number;
    propuestas_mes:      number;
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [cargando,        setCargando]        = useState(true);
  const [actualizando,    setActualizando]    = useState(false);
  const [reuniones, setReuniones] = useState<any[]>([]);
  const [metricas, setMetricas]   = useState<Metricas | null>(null);
  const [resumenTareas, setResumenTareas] = useState<ResumenTareas | null>(null);
  const [scoreStats, setScoreStats] = useState<{ caliente: number; activo: number; tibio: number; frio: number } | null>(null);
  const [regiones,   setRegiones]   = useState<RegionEtapa[]>([]);
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>("anio");
  const [mesSeleccionado, setMesSeleccionado] = useState({
    mes:  hoy.getMonth(),
    anio: hoy.getFullYear(),
  });
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(hoyStr);

  function calcFechaDesde(): string | undefined {
    if (filtroPeriodo === "hoy") return hoyStr;
    if (filtroPeriodo === "semana") {
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
      return lunes.toISOString().slice(0, 10);
    }
    if (filtroPeriodo === "mes") {
      const { mes, anio } = mesSeleccionado;
      return `${anio}-${String(mes + 1).padStart(2, "0")}-01`;
    }
    if (filtroPeriodo === "anio") return `${hoy.getFullYear()}-01-01`;
    if (filtroPeriodo === "dia")  return diaSeleccionado;
    return undefined;
  }

  function calcFechaHasta(): string | undefined {
    if (filtroPeriodo === "hoy") return hoyStr;
    if (filtroPeriodo === "semana") {
      const domingo = new Date(hoy);
      domingo.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? 0 : 7));
      return domingo.toISOString().slice(0, 10);
    }
    if (filtroPeriodo === "mes") {
      const { mes, anio } = mesSeleccionado;
      const ultimoDia = new Date(anio, mes + 1, 0).getDate();
      return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
    }
    if (filtroPeriodo === "anio") return `${hoy.getFullYear()}-12-31`;
    if (filtroPeriodo === "dia")  return diaSeleccionado;
    return undefined;
  }
  const [pickerAbierto,   setPickerAbierto]   = useState(false);
  const [calAbierto,      setCalAbierto]       = useState(false);
  const [dropdownModulo,  setDropdownModulo]  = useState(false);
  const [intelAbierto,    setIntelAbierto]    = useState(false);
  const [anioNavegando,   setAnioNavegando]    = useState(hoy.getFullYear());
  const [calNav, setCalNav] = useState({ mes: hoy.getMonth(), anio: hoy.getFullYear() });

  const esInicial = metricas === null;

  useEffect(() => {
    async function cargar() {
      if (esInicial) setCargando(true); else setActualizando(true);
      try {
        const [metricasData, reunionesData, resumenTar] = await Promise.all([
          getMetricasDashboard({
            periodo: filtroPeriodo,
            mes:   filtroPeriodo === "mes" ? mesSeleccionado.mes + 1 : undefined,
            anio:  filtroPeriodo === "mes" ? mesSeleccionado.anio   : undefined,
            fecha: filtroPeriodo === "dia" ? diaSeleccionado        : undefined,
          }),
          getReuniones({ estado: "programada", periodo: filtroPeriodo }),
          getResumenTareas(),
        ]);
        setMetricas(metricasData);
        setReuniones(reunionesData.slice(0, 5));
        setResumenTareas(resumenTar);
      } catch (err) {
        console.error("Error cargando métricas:", err);
      } finally {
        setCargando(false);
        setActualizando(false);
      }
      const scoreParams: { periodo?: string; mes?: number; anio?: number; fecha?: string } = {
        periodo: filtroPeriodo,
      };
      if (filtroPeriodo === "mes") {
        scoreParams.mes  = mesSeleccionado.mes + 1;
        scoreParams.anio = mesSeleccionado.anio;
      }
      if (filtroPeriodo === "dia") scoreParams.fecha = diaSeleccionado;

      getScoresLeads(scoreParams)
        .then(scores => {
          const stats = { caliente: 0, activo: 0, tibio: 0, frio: 0 };
          scores.forEach(s => { stats[s.nivel]++; });
          setScoreStats(stats);
        })
        .catch(console.error);
      getAnalisisRegion().then(setRegiones).catch(console.error);
    }
    cargar();
  }, [filtroPeriodo, mesSeleccionado, diaSeleccionado]);

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 ">

      {/* Header + Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="crm-section-accent h-8" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Análisis</h1>
              {actualizando && (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              )}
            </div>

          {/* Dropdown selector de módulo */}
          <div className="relative">
            <button
              onClick={() => { setDropdownModulo(v => !v); setIntelAbierto(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition"
            >
              Dashboard <ChevronDownIcon size={16} />
            </button>

            {dropdownModulo && (
              <>
                {/* Backdrop para cerrar al click fuera */}
                <div className="fixed inset-0 z-40" onClick={() => { setDropdownModulo(false); setIntelAbierto(false); }} />

                <div className="absolute left-0 top-[calc(100%+6px)] z-50 bg-white border border-zinc-100 rounded-xl shadow-xl w-56 py-1.5">

                  {/* Dashboard — activo */}
                  <button className="w-full  text-left px-3 py-2 text-xs font-semibold text-brand bg-brand/5 flex items-center gap-2">
                    📊 Dashboard
                  </button>

                  {/* Objetivos */}
                  <button
                    onClick={() => { navigate("/objetivos"); setDropdownModulo(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-brand transition flex items-center gap-2"
                  >
                    🎯 Objetivos
                  </button>

                  {/* Separador */}
                  <div className="mx-3 my-1 border-t border-zinc-100" />

                  {/* Inteligencia — sección colapsable */}
                  <button
                    onClick={() => setIntelAbierto(v => !v)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 flex items-center justify-between transition"
                  >
                    <span>🧠 Inteligencia</span>
                    <ChevronDown size={12} className={`transition-transform ${intelAbierto ? "rotate-180" : ""}`} />
                  </button>

                  {intelAbierto && (
                    <div className="pb-1">
                      {[
                        { id: "forecasting", emoji: "📈", label: "Forecast comercial" },
                        { id: "pipeline",    emoji: "💼", label: "Pipeline y propuestas" },
                        { id: "cicloventa",  emoji: "🔄", label: "Ciclo de venta" },
                        { id: "scoring",     emoji: "🎯", label: "Lead Scoring" },
                        { id: "churn",       emoji: "⚠️", label: "Análisis de churn" },
                        { id: "acciones",    emoji: "⚡", label: "Próxima acción" },
                        { id: "realtime",    emoji: "📡", label: "Actividad en tiempo real" },
                        { id: "web",         emoji: "🌐", label: "Páginas web" },
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => { navigate("/inteligencia", { state: { modulo: m.id } }); setDropdownModulo(false); setIntelAbierto(false); }}
                          className="w-full text-left pl-6 pr-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 hover:text-brand transition flex items-center gap-2"
                        >
                          <span>{m.emoji}</span> {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
           </div>

        <div className="flex flex-wrap gap-2 items-center relative">

          {/* Hoy / Semana */}
          {(["hoy", "semana"] as FiltroPeriodo[]).map(p => (
            <button key={p}
              onClick={() => { setFiltroPeriodo(p); setPickerAbierto(false); setCalAbierto(false); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all
                ${filtroPeriodo === p
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white border border-gray-200 text-zinc-700 hover:bg-gray-50"}`}>
              {p === "hoy" ? "Hoy" : "Semana"}
            </button>
          ))}

          {/* Mes — picker */}
          <div className="relative">
            <button
              onClick={() => { setPickerAbierto(v => !v); setCalAbierto(false); if (filtroPeriodo !== "mes") setFiltroPeriodo("mes"); }}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-all
                ${filtroPeriodo === "mes"
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white border border-gray-200 text-zinc-700 hover:bg-gray-50"}`}>
              <Calendar size={12} />
              {filtroPeriodo === "mes"
                ? `${MESES_CORTO[mesSeleccionado.mes]} ${mesSeleccionado.anio}`
                : "Mes"}
              <ChevronDown size={12} />
            </button>

            {pickerAbierto && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-56">
                {/* Nav año */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setAnioNavegando(y => y - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs font-semibold text-zinc-800">{anioNavegando}</span>
                  <button
                    onClick={() => setAnioNavegando(y => y + 1)}
                    disabled={anioNavegando >= hoy.getFullYear()}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">
                    <ChevronRight size={14} />
                  </button>
                </div>
                {/* Grid meses */}
                <div className="grid grid-cols-4 gap-1">
                  {MESES_CORTO.map((m, i) => {
                    const esFuturo   = anioNavegando === hoy.getFullYear() && i > hoy.getMonth();
                    const esActual   = filtroPeriodo === "mes" && mesSeleccionado.mes === i && mesSeleccionado.anio === anioNavegando;
                    return (
                      <button
                        key={m}
                        disabled={esFuturo}
                        onClick={() => {
                          setMesSeleccionado({ mes: i, anio: anioNavegando });
                          setFiltroPeriodo("mes");
                          setPickerAbierto(false);
                        }}
                        className={`py-1.5 text-xs rounded-lg transition capitalize ${
                          esActual  ? "bg-brand text-white font-semibold" :
                          esFuturo  ? "text-zinc-700 cursor-not-allowed" :
                                      "text-zinc-600 hover:bg-brand/5 hover:text-brand"
                        }`}>
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Año */}
          <button onClick={() => { setFiltroPeriodo("anio"); setPickerAbierto(false); setCalAbierto(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all
              ${filtroPeriodo === "anio"
                ? "bg-brand text-white shadow-sm"
                : "bg-white border border-gray-200 text-zinc-700 hover:bg-gray-50"}`}>
            Año
          </button>

          {/* Día — calendario */}
          <div className="relative">
            <button
              onClick={() => { setFiltroPeriodo("dia"); setCalAbierto(c => !c); setPickerAbierto(false); }}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-all
                ${filtroPeriodo === "dia"
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white border border-gray-200 text-zinc-700 hover:bg-gray-50"}`}>
              <Calendar size={12} />
              {filtroPeriodo === "dia" ? formatDiaBtn(diaSeleccionado) : "Día"}
              <ChevronDown size={12} />
            </button>

            {calAbierto && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72">
                {/* Nav mes/año */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setCalNav(n => {
                      const d = new Date(n.anio, n.mes - 1, 1);
                      return { mes: d.getMonth(), anio: d.getFullYear() };
                    })}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs font-semibold text-zinc-800">
                    {MESES_FULL[calNav.mes]} {calNav.anio}
                  </span>
                  <button
                    onClick={() => setCalNav(n => {
                      const d = new Date(n.anio, n.mes + 1, 1);
                      return { mes: d.getMonth(), anio: d.getFullYear() };
                    })}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* Cabecera días */}
                <div className="grid grid-cols-7 mb-1">
                  {DIAS_SEMANA.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-zinc-600 py-1">{d}</div>
                  ))}
                </div>

                {/* Celdas */}
                <div className="grid grid-cols-7 gap-y-0.5">
                  {generarCeldasMes(calNav.mes, calNav.anio).map((dia, i) => {
                    if (!dia) return <div key={i} />;
                    const fechaStr = `${calNav.anio}-${String(calNav.mes + 1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
                    const esHoy      = fechaStr === hoyStr;
                    const seleccionado = fechaStr === diaSeleccionado && filtroPeriodo === "dia";
                    return (
                      <button key={i}
                        onClick={() => { setDiaSeleccionado(fechaStr); setCalAbierto(false); }}
                        className={`
                          w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all
                          ${seleccionado ? "bg-brand text-white" :
                            esHoy        ? "border-2 border-brand text-brand" :
                                           "text-zinc-700 hover:bg-brand/5"}
                        `}>
                        {dia}
                      </button>
                    );
                  })}
                </div>

                {/* Atajo hoy */}
                <button
                  onClick={() => { setDiaSeleccionado(hoyStr); setCalAbierto(false); }}
                  className="mt-3 w-full py-1.5 text-xs text-brand border border-brand/20 rounded-lg hover:bg-brand/5 transition">
                  Ir a hoy
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
      {/* Fila 1 — Actividad de hoy  y temperatura de leads*/}
      {metricas && scoreStats &&(
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
      <ActividadHoy metricas={metricas} />
       <TemperaturaLeadsChart
          caliente={scoreStats.caliente}
          activo={scoreStats.activo}
          tibio={scoreStats.tibio}
          frio={scoreStats.frio}
          onClick={() => navigate("/prospectos")}/>
      </div>
      )}


      {/* Fila 2 — Charts principales */}
      {metricas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <LlamadasChart      metricas={metricas} />
          <LlamadasCanalChart metricas={metricas} />
          <ReunionesChart     metricas={metricas} />
        </div>
      )}




      {/* Fila — KPIs de conversión */}
      {metricas && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <ResumenEstadosPropuestas
            filtroPeriodo={filtroPeriodo}
            mesSeleccionado={mesSeleccionado}
            diaSeleccionado={diaSeleccionado}
          />
          <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <TasaConversion metricas={metricas} />
            <BrochuresChart metricas={metricas} />
            <VentasChart    metricas={metricas} />
          </div>
        </div>
      )}


      {/* Fila — Ventas: ganadas vs perdidas por empresa, servicio y categoría */}
      <VentasGanadasCharts />

      {/* Fila — Estado de leads (respeta el filtro global del dashboard) */}
      <DashboardEstadoLeads fechaDesde={calcFechaDesde()} fechaHasta={calcFechaHasta()} />

      {/* Fila — Webs */}
      {metricas && (
        <WebResumenChart metricas={metricas} />
      )}

      {/* Fila — Mapa por región (ancho completo) */}
      {regiones.length > 0 && (
        <DashboardMapRegion datos={regiones} />
      )}

     

      {/* Widget tareas */}
      {resumenTareas && (
        <div
          onClick={() => navigate("/tareas")}
          className="bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-amber-500" />
              <p className="text-sm font-semibold text-zinc-800">Tareas pendientes</p>
            </div>
            {(resumenTareas.vencidas + resumenTareas.hoy) > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-semibold">
                {resumenTareas.vencidas + resumenTareas.hoy} urgentes
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-red-50">
              <AlertCircle size={14} className="mx-auto text-red-400 mb-1" />
              <p className="text-lg font-bold text-red-600">{resumenTareas.vencidas}</p>
              <p className="text-[10px] text-red-400 uppercase tracking-wide">Vencidas</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-orange-50">
              <Clock size={14} className="mx-auto text-orange-400 mb-1" />
              <p className="text-lg font-bold text-orange-600">{resumenTareas.hoy}</p>
              <p className="text-[10px] text-orange-400 uppercase tracking-wide">Hoy</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-brand/5">
              <Calendar size={14} className="mx-auto text-brand/70 mb-1" />
              <p className="text-lg font-bold text-brand">{resumenTareas.proximas}</p>
              <p className="text-[10px] text-brand/70 uppercase tracking-wide">Próximas</p>
            </div>
          </div>
        </div>
      )}

      <ProximasReuniones reuniones={reuniones} />

     

    </div>
  );
}