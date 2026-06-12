/** client/src/pages/LlamadasPage.tsx */

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileDown, BarChart2 } from "lucide-react";
import * as XLSX from "xlsx";
import {
  getResumenLlamadas,
  getAllLlamadas,
  getEstadisticasLlamadas,
  actualizarLlamada,
  eliminarLlamada,
  eliminarLlamadasMasivo,
  getHeatmapLlamadas,
} from "../services/llamadas.api";
import { getProspectos, getProspecto } from "../services/prospectos.api";
import { getMotivosPerdida }           from "../services/prospectos.api";
import { ProspectoDetalle }            from "../components/prospectos/ProspectoDetalle";
import { ProspectoForm }               from "../components/prospectos/ProspectoForm";
import type { Prospecto }              from "../types/prospecto.types";

import { KpisLlamadas }           from "../components/llamadas/KpisLlamadas";
import { EstadisticasPeriodo }    from "../components/llamadas/EstadisticasPeriodo";
import { HistorialLlamadas }      from "../components/llamadas/HistorialLlamadas";
import { LlamadaForm } from "../components/llamadas/LlamadaForm";
import { ModalEditarLlamada }     from "../components/llamadas/ModalEditarLlamada";
import { HeatmapHoras }           from "../components/llamadas/HeatmapHoras";
import { MotivosChart }           from "../components/llamadas/MotivosChart";
import { FiltroPeriodoBotones, type FiltroPeriodo } from "../components/shared/FiltroPeriodoBotones";
import { useEditar }              from "../hooks/useEditar";
import { fechaHoy, calcularRangoFecha, toLocalISOString } from "../utils/date";
import { TableBulkActions } from "../components/ui/TableBulkActions";

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  const navigate = useNavigate();
  const [resumen,      setResumen]      = useState<{ canales: any[]; totales: { empresas: number; contactadas: number; no_contactadas: number } }>({ canales: [], totales: { empresas: 0, contactadas: 0, no_contactadas: 0 } });
  const [llamadas,     setLlamadas]     = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState<any[]>([]);
  const [prospectos,   setProspectos]   = useState<any[]>([]);
  const [heatmap,      setHeatmap]      = useState<any[]>([]);
  const [motivos,      setMotivos]      = useState<any[]>([]);

  const [modalAbierto,        setModalAbierto]        = useState(false);
  const [seleccionados,       setSeleccionados]       = useState<string[]>([]);
  const [prospectoDetalle,    setProspectoDetalle]    = useState<Prospecto | null>(null);
  const [prospectoEditar,     setProspectoEditar]     = useState<Prospecto | null>(null);
  const [cargandoProspecto,   setCargandoProspecto]   = useState(false);

  const editar = useEditar<any>();

  const toggleUno   = (id: string) => setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleTodos = () => setSeleccionados(prev => prev.length === llamadas.length ? [] : llamadas.map(l => l.id));

  const handleVerProspecto = async (prospecto_id: string) => {
    setCargandoProspecto(true);
    try {
      const p = await getProspecto(prospecto_id);
      setProspectoDetalle(p);
    } catch (err) { console.error(err); }
    finally { setCargandoProspecto(false); }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta llamada?")) return;
    try {
      await eliminarLlamada(id);
      await cargarLlamadas(filtroFecha, filtroPeriodo);
      setSeleccionados(prev => prev.filter(x => x !== id));
    } catch (err) { console.error(err); }
  };

  const handleEliminarMasivo = async () => {
    if (!confirm(`¿Eliminar ${seleccionados.length} llamada${seleccionados.length > 1 ? "s" : ""}?`)) return;
    try {
      await eliminarLlamadasMasivo(seleccionados);
      setSeleccionados([]);
      await cargarLlamadas(filtroFecha, filtroPeriodo);
    } catch (err) { console.error(err); }
  };

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
      const { hora_inicio, fecha, hora_fin, resultado, motivo_no_interes, accion_acordada, ...resto } = formEdit;
      const payload: any = {
        ...resto,
        hora_fin:          hora_fin          || null,
        resultado:         resultado         || null,
        motivo_no_interes: motivo_no_interes || null,
        accion_acordada:   accion_acordada   || null,
      };
      const fechaBase = fecha || editar.editando?.fecha?.split("T")[0];
      if (fechaBase && hora_inicio) {
        payload.fecha = toLocalISOString(fechaBase, hora_inicio);
      }
      await actualizarLlamada(editar.editando!.id, payload);
      await cargarLlamadas(filtroFecha, filtroPeriodo);
    });
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
  const totalLlamadas      = resumen.totales.empresas;
  const totalContestadas   = resumen.totales.contactadas;
  const totalNoContestadas = resumen.totales.no_contactadas;

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
        <div className="flex items-center gap-3">
          <div className="crm-section-accent h-8" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Llamadas</h1>
            <p className="text-xs text-slate-500 mt-0.5">Registro de contactos realizados</p>
          </div>
        </div>
        <div className="flex gap-2">
          <TableBulkActions count={seleccionados.length} onDelete={handleEliminarMasivo} />
          <button
            onClick={() => navigate("/analisis-llamadas")}
            className="relative group p-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition"
          >
            <BarChart2 size={17} />
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] bg-zinc-900 text-white px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
              Análisis de intentos
            </span>
          </button>
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
          <button onClick={() => setModalAbierto(true)}
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
        resumen={resumen.canales}
        filtroPeriodo={filtroPeriodo}
      />

      {/* Heatmap + Motivos en paralelo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HeatmapHoras data={heatmap} />
        <MotivosChart data={motivos} />
      </div>

      {/* Historial */}
      <HistorialLlamadas
        llamadas={llamadas}
        seleccionados={seleccionados}
        onToggle={toggleUno}
        onToggleTodos={toggleTodos}
        onEditar={editar.abrir}
        onEliminar={handleEliminar}
        onVerProspecto={handleVerProspecto}
      />

      {editar.editando && (
        <ModalEditarLlamada
          llamada={editar.editando}
          guardando={editar.guardando}
          error={editar.error}
          onGuardar={handleGuardarEdicion}
          onCerrar={editar.cerrar}
        />
      )}

      <LlamadaForm
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={() => cargarLlamadas(filtroFecha, filtroPeriodo)}
        prospectos={prospectos}
      />

      {/* Spinner mientras carga el detalle */}
      {cargandoProspecto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      )}

      {/* Modal ficha de cliente */}
      {prospectoDetalle && (
        <ProspectoDetalle
          prospecto={prospectoDetalle}
          onCerrar={() => setProspectoDetalle(null)}
          onEditar={() => {
            setProspectoEditar(prospectoDetalle);
            setProspectoDetalle(null);
          }}
          onActualizado={async (id) => {
            const p = await getProspecto(id);
            setProspectoDetalle(p);
          }}
        />
      )}

      {/* Modal editar prospecto */}
      {prospectoEditar && (
        <ProspectoForm
          prospecto={prospectoEditar}
          onCerrar={() => setProspectoEditar(null)}
          onGuardado={async () => {
            const p = await getProspecto(prospectoEditar.id);
            setProspectoEditar(null);
            setProspectoDetalle(p);
          }}
        />
      )}

    </div>
  );
}
