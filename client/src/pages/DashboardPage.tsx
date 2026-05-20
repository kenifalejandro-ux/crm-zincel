/**client/src/pages/DashboardPage.tsx */

import { useEffect, useState } from "react";
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

const MESES_FULL = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

type FiltroPeriodo = "hoy" | "semana" | "mes" | "anio";

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
  const [cargando, setCargando]   = useState(true);
  const [reuniones, setReuniones] = useState<any[]>([]);
  const [metricas, setMetricas]   = useState<Metricas | null>(null);
  const [resumenTareas, setResumenTareas] = useState<ResumenTareas | null>(null);
  const [scoreStats, setScoreStats] = useState<{ caliente: number; activo: number; tibio: number; frio: number } | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>("anio");
  const [mesSeleccionado, setMesSeleccionado] = useState({
    mes:  new Date().getMonth(),
    anio: new Date().getFullYear(),
  });
  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [anioNavegando, setAnioNavegando] = useState(new Date().getFullYear());

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        const [metricasData, reunionesData, resumenTar] = await Promise.all([
          getMetricasDashboard({
            periodo: filtroPeriodo,
            mes:  filtroPeriodo === "mes" ? mesSeleccionado.mes + 1 : undefined,
            anio: filtroPeriodo === "mes" ? mesSeleccionado.anio   : undefined,
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
      }
      // Scores — independiente, no bloquea el dashboard
      getScoresLeads()
        .then(scores => {
          const stats = { caliente: 0, activo: 0, tibio: 0, frio: 0 };
          scores.forEach(s => { stats[s.nivel]++; });
          setScoreStats(stats);
        })
        .catch(console.error);
    }
    cargar();
  }, [filtroPeriodo, mesSeleccionado]);

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header + Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-zinc-800">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Resumen de tu actividad comercial</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center relative">
          {(["hoy", "semana"] as FiltroPeriodo[]).map(p => (
            <button key={p} onClick={() => setFiltroPeriodo(p)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize
                ${filtroPeriodo === p
                  ? "bg-blue-600 text-zinc-100 shadow-sm"
                  : "bg-white border border-gray-200 gray-100 hover:bg-gray-50"}`}>
              {p === "hoy" ? "Hoy" : "Semana"}
            </button>
          ))}

          <div className="relative">
            <button
              onClick={() => { setFiltroPeriodo("mes"); setPickerAbierto(p => !p); }}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-all
                ${filtroPeriodo === "mes"
                  ? "bg-blue-600 text-zinc-100 shadow-sm"
                  : "bg-white border border-gray-200 gray-100 hover:bg-gray-50"}`}>
              {filtroPeriodo === "mes"
                ? `${MESES_FULL[mesSeleccionado.mes]} ${mesSeleccionado.anio}`
                : "Mes"}
              <ChevronDown size={12} />
            </button>
            {pickerAbierto && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-[calc(100%+8px)] z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64 sm:w-72">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setAnioNavegando(a => Math.max(2020, a - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-sm font-medium text-zinc-100">{anioNavegando}</span>
                  <button onClick={() => setAnioNavegando(a => Math.min(2030, a + 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {MESES_FULL.map((mes, i) => {
                    const isSelected = i === mesSeleccionado.mes && anioNavegando === mesSeleccionado.anio;
                    return (
                      <button key={i}
                        onClick={() => { setMesSeleccionado({ mes: i, anio: anioNavegando }); setPickerAbierto(false); }}
                        className={`py-2 rounded-lg text-xs font-medium transition-all
                          ${isSelected ? "bg-blue-600 text-zinc-100" : "border border-gray-100 gray-100 hover:bg-gray-50"}`}>
                        {mes.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => { setFiltroPeriodo("anio"); setPickerAbierto(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all
              ${filtroPeriodo === "anio"
                ? "bg-blue-600 text-zinc-100 shadow-sm"
                : "bg-white border border-gray-200 gray-100 hover:bg-gray-50"}`}>
            Año
          </button>
        </div>
      </div>

      {/* Fila 1 — Charts principales */}
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
          className="bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/prospectos")}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-zinc-800">Temperatura de Leads</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Score automático — ordenados por prioridad de cierre</p>
            </div>
            <span className="text-xs text-blue-500 hover:underline">Ver prospectos →</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{scoreStats.caliente}</p>
              <p className="text-[11px] text-red-400 mt-0.5 font-medium">🔥 Calientes</p>
              <p className="text-[10px] text-red-300">Score 75+</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">{scoreStats.activo}</p>
              <p className="text-[11px] text-indigo-400 mt-0.5 font-medium">⬆ Activos</p>
              <p className="text-[10px] text-indigo-300">Score 50–74</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{scoreStats.tibio}</p>
              <p className="text-[11px] text-yellow-500 mt-0.5 font-medium">→ Tibios</p>
              <p className="text-[10px] text-yellow-300">Score 25–49</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-400">{scoreStats.frio}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">❄ Fríos</p>
              <p className="text-[10px] text-gray-300">Score 0–24</p>
            </div>
          </div>
        </div>
      )}

      {/* Fila 2 — Nuevos KPIs */}
      {metricas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <TasaConversion   metricas={metricas} />
          <BrochuresChart   metricas={metricas} />
          <VentasChart      metricas={metricas} />
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

      {/* Widget tareas */}
      {resumenTareas && (
        <div
          onClick={() => navigate("/tareas")}
          className="bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-indigo-500" />
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
            <div className="text-center p-3 rounded-xl bg-blue-50">
              <Calendar size={14} className="mx-auto text-blue-400 mb-1" />
              <p className="text-lg font-bold text-blue-600">{resumenTareas.proximas}</p>
              <p className="text-[10px] text-blue-400 uppercase tracking-wide">Próximas</p>
            </div>
          </div>
        </div>
      )}

      <ProximasReuniones reuniones={reuniones} />

      {metricas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <ActividadHoy metricas={metricas} />
          <ActividadMes metricas={metricas} />
        </div>
      )}

    </div>
  );
}