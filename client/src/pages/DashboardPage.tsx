/**client/src/pages/DashboardPage.tsx */

import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getMetricasDashboard } from "../services/dashboard.api";
import { getReuniones } from "../services/reuniones.api";

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
  const [cargando, setCargando]   = useState(true);
  const [reuniones, setReuniones] = useState<any[]>([]);
  const [metricas, setMetricas]   = useState<Metricas | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>("mes");
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
        const [metricasData, reunionesData] = await Promise.all([
          getMetricasDashboard({
            periodo: filtroPeriodo,
            mes:  filtroPeriodo === "mes" ? mesSeleccionado.mes + 1 : undefined,
            anio: filtroPeriodo === "mes" ? mesSeleccionado.anio   : undefined,
          }),
          getReuniones({ estado: "programada", periodo: filtroPeriodo }),
        ]);
        setMetricas(metricasData);
        setReuniones(reunionesData.slice(0, 5));
      } catch (err) {
        console.error("Error cargando métricas:", err);
      } finally {
        setCargando(false);
      }
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