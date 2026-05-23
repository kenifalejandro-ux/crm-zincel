/**client/src/pages/DashboardPage.tsx */

import { useEffect, useState } from "react";
import { Flame, TrendingUp, MoveRight, Snowflake } from 'lucide-react';
import { CARD_CLASS, HEADER_CLASS } from "../lib/tokens";
import { ChevronDown, ChevronLeft, ChevronRight, CheckSquare, AlertCircle, Clock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMetricasDashboard } from "../services/dashboard.api";
import { getReuniones } from "../services/reuniones.api";
import { getResumenTareas } from "../services/tareas.api";
import { getScoresLeads } from "../services/prospectos.api";
import type { ResumenTareas } from "../types/tarea.types";

import { LlamadasChart }         from "../components/dashboard/LlamadasChart";
import { LlamadasCanalChart }    from "../components/dashboard/LlamadasCanalChart";
import { ReunionesChart }        from "../components/dashboard/ReunionesChart";
import { ActividadChart }        from "../components/dashboard/ActividadChart";
import { ActividadHoy }          from "../components/dashboard/ActividadHoy";
import { ActividadMes }          from "../components/dashboard/ActividadMes";
import { ProximasReuniones }     from "../components/dashboard/ProximasReuniones";
import { ProspectosPorEstado }   from "../components/dashboard/ProspectosPorEstado";
import { ProspectosPorCiudad }   from "../components/dashboard/ProspectosPorCiudad";
import { VentasChart }           from "../components/dashboard/VentasChart";
import { BrochuresChart }        from "../components/dashboard/BrochuresChart";
import { TasaConversion }        from "../components/dashboard/TasaConversion";
import { WebActivaChart }        from "../components/dashboard/WebActivaChart";
import { ResumenEstadosPropuestas } from "../components/propuestas/ResumenEstadosPropuestas";
import { FasesCicloVenta }         from "../components/dashboard/FasesCicloVenta";
import { ActividadAnual }          from "../components/dashboard/ActividadAnual";
import { ActividadMensualDiaria }  from "../components/dashboard/ActividadMensualDiaria";

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
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [cargando,        setCargando]        = useState(true);
  const [actualizando,    setActualizando]    = useState(false);
  const [reuniones, setReuniones] = useState<any[]>([]);
  const [metricas, setMetricas]   = useState<Metricas | null>(null);
  const [resumenTareas, setResumenTareas] = useState<ResumenTareas | null>(null);
  const [scoreStats, setScoreStats] = useState<{ caliente: number; activo: number; tibio: number; frio: number } | null>(null);
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>("anio");
  const [mesSeleccionado, setMesSeleccionado] = useState({
    mes:  hoy.getMonth(),
    anio: hoy.getFullYear(),
  });
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(hoyStr);
  const [pickerAbierto,   setPickerAbierto]   = useState(false);
  const [calAbierto,      setCalAbierto]       = useState(false);
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
      getScoresLeads()
        .then(scores => {
          const stats = { caliente: 0, activo: 0, tibio: 0, frio: 0 };
          scores.forEach(s => { stats[s.nivel]++; });
          setScoreStats(stats);
        })
        .catch(console.error);
    }
    cargar();
  }, [filtroPeriodo, mesSeleccionado, diaSeleccionado]);

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header + Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
            {actualizando && (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            )}
          </div>
          <p className="text-xs text-zinc-700 mt-0.5">Resumen de tu actividad comercial</p>
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
      {/* Fila 1 — Actividades de hoy */}
 {metricas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <ActividadHoy metricas={metricas} />
          <ActividadMes metricas={metricas} />
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

      {/* Temperatura de Leads */}
      {scoreStats && (
        <div
          className={`${CARD_CLASS} cursor-pointer hover:shadow-md transition-shadow`}
          onClick={() => navigate("/prospectos")}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={HEADER_CLASS}>Temperatura de Leads</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Score automático — ordenados por prioridad de cierre</p>
            </div>
            <span className="text-xs text-brand hover:underline">Ver prospectos →</span>
          </div>
         

{(() => {
  const totalLeads = (scoreStats.caliente + scoreStats.activo + scoreStats.tibio + scoreStats.frio) || 1;
  const pct = (n: number) => Math.round((n / totalLeads) * 100);
  const grupos = [
    { label: "Calientes", valor: scoreStats.caliente, pct: pct(scoreStats.caliente), icon: <Flame className="w-3.5 h-3.5 text-red-500" />,        color: "text-red-600",    bg: "bg-red-50",    bar: "bg-red-400",    score: "75+" },
    { label: "Activos",   valor: scoreStats.activo,   pct: pct(scoreStats.activo),   icon: <TrendingUp className="w-3.5 h-3.5 text-amber-500" />,  color: "text-amber-600",  bg: "bg-amber-50",  bar: "bg-amber-400",  score: "50–74" },
    { label: "Tibios",    valor: scoreStats.tibio,    pct: pct(scoreStats.tibio),    icon: <MoveRight className="w-3.5 h-3.5 text-emerald-500" />, color: "text-emerald-600",bg: "bg-emerald-50",bar: "bg-emerald-400",score: "25–49" },
    { label: "Fríos",     valor: scoreStats.frio,     pct: pct(scoreStats.frio),     icon: <Snowflake className="w-3.5 h-3.5 text-blue-400" />,   color: "text-blue-600",   bg: "bg-blue-50",   bar: "bg-blue-300",   score: "0–24" },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {grupos.map(g => (
        <div key={g.label} className={`${g.bg} rounded-2xl p-4 flex flex-col gap-2`}>
          <div className="flex items-center gap-1.5">
            {g.icon}
            <span className="text-[11px] font-semibold text-zinc-700">{g.label}</span>
          </div>
          <div className="flex items-end justify-between">
            <p className={`text-3xl font-bold leading-none ${g.color}`}>{g.valor}</p>
            <p className="text-[11px] font-semibold text-zinc-500">{g.pct}%</p>
          </div>
          <div className="w-full bg-white/60 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${g.bar}`} style={{ width: `${Math.max(g.pct, 2)}%` }} />
          </div>
          <p className="text-[10px] text-zinc-500">Score {g.score}</p>
        </div>
      ))}
    </div>
  );
})()}

          
        </div>
      )}

      {/* Fila 2 — Nuevos KPIs */}
      {metricas && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <ResumenEstadosPropuestas />
          <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FasesCicloVenta />
            <TasaConversion metricas={metricas} />
            <BrochuresChart metricas={metricas} />
            <VentasChart    metricas={metricas} />
          </div>
        </div>
      )}

      {/* Fila 3 — Prospectos */}
      {metricas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <ProspectosPorEstado metricas={metricas} />
          <ProspectosPorCiudad metricas={metricas} />
          <WebActivaChart      metricas={metricas} />
        </div>
      )}

      {/* Actividad completa */}
      {metricas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <ActividadChart metricas={metricas} />
        </div>
      )}

      {/* Comparativas históricas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <ActividadAnual />
        <ActividadMensualDiaria />
      </div>

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