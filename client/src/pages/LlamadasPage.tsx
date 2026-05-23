/** client/src/pages/LlamadasPage.tsx */

import { useEffect, useState, useMemo } from "react";
import { Plus, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import {
  getResumenLlamadas,
  getAllLlamadas,
  getEstadisticasLlamadas,
  crearLlamada,
  actualizarLlamada,
  getHeatmapLlamadas,
} from "../services/llamadas.api";
import { getProspectos }    from "../services/prospectos.api";
import { getMotivosPerdida } from "../services/prospectos.api";

import { KpisLlamadas }           from "../components/llamadas/KpisLlamadas";
import { EstadisticasPeriodo }    from "../components/llamadas/EstadisticasPeriodo";
import { HistorialLlamadas }      from "../components/llamadas/HistorialLlamadas";
import { ModalRegistrarLlamada, type FormLlamada } from "../components/llamadas/ModalRegistrarLlamada";
import { ModalEditarLlamada }     from "../components/llamadas/ModalEditarLlamada";
import { HeatmapHoras }           from "../components/llamadas/HeatmapHoras";
import { MotivosChart }           from "../components/llamadas/MotivosChart";
import { FiltroPeriodoBotones, type FiltroPeriodo } from "../components/shared/FiltroPeriodoBotones";
import { useEditar }              from "../hooks/useEditar";
import { fechaHoy, calcularRangoFecha } from "../utils/date";

// ── Helpers ──────────────────────────────────────────────────────────────────

const getNow = () => {
  const now = new Date();
  return {
    fecha:       fechaHoy(),
    hora_inicio: `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,
  };
};

const getFormInicial = (): FormLlamada => ({
  prospecto_id: "",
  ...getNow(),
  hora_fin:     "",
  canal:        "llamada",
  contestada:   false,
  resultado:    "",
  notas:        "",
});

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function fechaInicial(): { periodo: FiltroPeriodo; filtroFecha: string } {
  const now = new Date();
  return {
    periodo:     "mes",
    filtroFecha: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}`,
  };
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function LlamadasPage() {
  const [resumen,      setResumen]      = useState<any[]>([]);
  const [llamadas,     setLlamadas]     = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState<any[]>([]);
  const [prospectos,   setProspectos]   = useState<any[]>([]);
  const [heatmap,      setHeatmap]      = useState<any[]>([]);
  const [motivos,      setMotivos]      = useState<any[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando,     setCargando]     = useState(false);
  const [form,         setForm]         = useState<FormLlamada>(getFormInicial);

  const editar = useEditar<any>();

  const init = fechaInicial();
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>(init.periodo);
  const [filtroFecha,   setFiltroFecha]   = useState(init.filtroFecha);

  // periodo efectivo para calcularRangoFecha ("hoy" → "dia")
  const periodoEfectivo = (p: FiltroPeriodo): "hoy" | "dia" | "semana" | "mes" | "anio" => p;

  // granularidad para la API de estadísticas
  const granularidad = (p: FiltroPeriodo): "dia" | "semana" | "mes" | "anio" =>
    p === "hoy" || p === "dia" ? "dia" : p === "semana" ? "semana" : p === "mes" ? "mes" : "anio";

  // ── Carga de datos ──────────────────────────────────────
  const cargarLlamadas = async (fecha: string, periodo: FiltroPeriodo) => {
    try {
      const rango = calcularRangoFecha(fecha, periodoEfectivo(periodo));
      const gran  = granularidad(periodo);
      const [res, llam, stats, heat] = await Promise.all([
        getResumenLlamadas(rango),
        getAllLlamadas(rango),
        getEstadisticasLlamadas(gran, rango),
        getHeatmapLlamadas(rango),
      ]);
      setResumen(res);
      setLlamadas(llam);
      setEstadisticas(stats);
      setHeatmap(heat);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    cargarLlamadas(filtroFecha, filtroPeriodo);
    getProspectos({ limite: 200 }).then(p => setProspectos(p.data)).catch(console.error);
    getMotivosPerdida().then(setMotivos).catch(console.error);
  }, []);

  const handleFiltroChange = (periodo: FiltroPeriodo, fecha: string) => {
    setFiltroPeriodo(periodo);
    setFiltroFecha(fecha);
    cargarLlamadas(fecha, periodo);
  };

  const handleGuardarEdicion = async (formEdit: any) => {
    await editar.guardar(async () => {
      const { hora_inicio, ...resto } = formEdit;
      const payload: any = { ...resto };
      if (hora_inicio && editar.editando?.fecha) {
        const fechaBase = editar.editando.fecha.split("T")[0];
        payload.fecha = `${fechaBase}T${hora_inicio}:00.000Z`;
      }
      await actualizarLlamada(editar.editando!.id, payload);
      await cargarLlamadas(filtroFecha, filtroPeriodo);
    });
  };

  // ── Guardar llamada ─────────────────────────────────────
  const handleGuardar = async () => {
    if (!form.prospecto_id) return;
    setCargando(true);
    try {
      const fechaISO = `${form.fecha}T${form.hora_inicio}:00.000Z`;
      await crearLlamada({
        prospecto_id: form.prospecto_id,
        fecha:        fechaISO,
        hora_fin:     form.hora_fin || undefined,
        canal:        form.canal,
        contestada:   form.contestada,
        resultado:    form.resultado || undefined,
        notas:        form.notas    || undefined,
      });
      setModalAbierto(false);
      setForm(getFormInicial());
      await cargarLlamadas(filtroFecha, filtroPeriodo);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  // ── Exportar Excel ──────────────────────────────────────
  const exportarExcel = () => {
    const rows = llamadas.map((l: any) => ({
      "Empresa":    l.empresa          ?? "",
      "Contacto":   l.nombre_contacto  ?? "",
      "Canal":      l.canal,
      "Contestada": l.contestada ? "Sí" : "No",
      "Hora inicio": l.fecha ? new Date(l.fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "",
      "Hora fin":   l.hora_fin ?? "",
      "Resultado":  l.resultado ?? "",
      "Notas":      l.notas    ?? "",
      "Fecha":      l.fecha ? new Date(l.fecha).toLocaleDateString("es-PE") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Llamadas");
    XLSX.writeFile(wb, `llamadas_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── KPIs ────────────────────────────────────────────────
  const totalLlamadas      = resumen.reduce((acc, r) => acc + parseInt(r.por_canal  || 0), 0);
  const totalContestadas   = resumen.reduce((acc, r) => acc + parseInt(r.contestadas || 0), 0);
  const totalNoContestadas = resumen.reduce((acc, r) => acc + parseInt(r.no_contestadas || 0), 0);

  const estadisticasPorPeriodo = useMemo(() => estadisticas.map((stat) => {
    let fechaLabel: string;
    if (filtroPeriodo === "hoy" || filtroPeriodo === "dia") {
      const hora = typeof stat.periodo === "number" ? stat.periodo : parseInt(String(stat.periodo));
      fechaLabel = `${String(hora).padStart(2, "0")}:00`;
    } else if (filtroPeriodo === "anio") {
      const mes = typeof stat.periodo === "number" ? stat.periodo : parseInt(String(stat.periodo));
      fechaLabel = MESES[mes - 1] ?? `Mes ${mes}`;
    } else {
      const dateStr = (stat.periodo instanceof Date)
        ? stat.periodo.toISOString().split("T")[0]
        : String(stat.periodo).split("T")[0];
      const [, mo, dy] = dateStr.split("-").map(Number);
      fechaLabel = `${dy} ${MESES[mo - 1]}`;
    }
    return { fecha: fechaLabel, total: stat.total, contestadas: stat.contestadas, no_contestadas: stat.no_contestadas };
  }), [estadisticas, filtroPeriodo]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Llamadas</h1>
          <p className="text-xs text-zinc-600 mt-0.5">Registro de contactos realizados</p>
        </div>
        <div className="flex gap-2">
          {llamadas.length > 0 && (
            <button
              onClick={exportarExcel}
              className="relative group p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition"
            >
              <FileDown size={17} />
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] bg-zinc-900 text-white px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                Exportar Excel
              </span>
            </button>
          )}
          <button onClick={() => { setForm(getFormInicial()); setModalAbierto(true); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-brand hover:bg-brand-hover text-white rounded-lg transition">
            <Plus size={15} /> Registrar llamada
          </button>
        </div>
      </div>

      {/* Filtros */}
      <FiltroPeriodoBotones
        periodo={filtroPeriodo}
        filtroFecha={filtroFecha}
        onChange={handleFiltroChange}
      />

      {/* KPIs */}
      <KpisLlamadas total={totalLlamadas} contestadas={totalContestadas} noContestadas={totalNoContestadas} />

      {/* Estadísticas + canal */}
      <EstadisticasPeriodo
        estadisticas={estadisticasPorPeriodo}
        resumen={resumen}
        filtroPeriodo={filtroPeriodo}
      />

      {/* Heatmap + Motivos en paralelo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HeatmapHoras data={heatmap} />
        <MotivosChart data={motivos} />
      </div>

      {/* Historial */}
      <HistorialLlamadas llamadas={llamadas} onEditar={editar.abrir} />

      {editar.editando && (
        <ModalEditarLlamada
          llamada={editar.editando}
          guardando={editar.guardando}
          error={editar.error}
          onGuardar={handleGuardarEdicion}
          onCerrar={editar.cerrar}
        />
      )}

      {modalAbierto && (
        <ModalRegistrarLlamada
          form={form}
          prospectos={prospectos}
          cargando={cargando}
          onFormChange={setForm}
          onGuardar={handleGuardar}
          onCerrar={() => setModalAbierto(false)}
        />
      )}

    </div>
  );
}
