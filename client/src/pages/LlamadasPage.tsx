/** client/src/pages/LlamadasPage.tsx — REDISEÑO NEON
 * Cambios SOLO de presentación: header con kicker, botones de acción unificados
 * (antes bg-violet-600/bg-zinc-800/bg-brand sueltos), tooltips neon, spinner con acento.
 * Toda la lógica (carga, filtros, export, edición, eliminación) queda INTACTA.
 */
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileDown, BarChart2 } from "lucide-react";
import * as XLSX from "xlsx";
import {
  getResumenLlamadas, getAllLlamadas, getEstadisticasLlamadas,
  actualizarLlamada, eliminarLlamada, eliminarLlamadasMasivo, getHeatmapLlamadas,
} from "../services/llamadas.api";
import { getProspectos, getProspecto } from "../services/prospectos.api";
import { getMotivosPerdida } from "../services/prospectos.api";
import { ProspectoDetalle } from "../components/prospectos/ProspectoDetalle";
import { ProspectoForm } from "../components/prospectos/ProspectoForm";
import type { Prospecto } from "../types/prospecto.types";

import { KpisLlamadas } from "../components/llamadas/KpisLlamadas";
import { EstadisticasPeriodo } from "../components/llamadas/EstadisticasPeriodo";
import { HistorialLlamadas } from "../components/llamadas/HistorialLlamadas";
import { LlamadaForm } from "../components/llamadas/LlamadaForm";
import { ModalEditarLlamada } from "../components/llamadas/ModalEditarLlamada";
import { HeatmapHoras } from "../components/llamadas/HeatmapHoras";
import { MotivosChart } from "../components/llamadas/MotivosChart";
import { FiltroPeriodoBotones, type FiltroPeriodo } from "../components/shared/FiltroPeriodoBotones";
import { useEditar } from "../hooks/useEditar";
import { toLocalISOString, calcularRangoFecha } from "../utils/date";
import { TableBulkActions } from "../components/ui/TableBulkActions";

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function fechaInicial(): { periodo: FiltroPeriodo; filtroFecha: string } {
  const now = new Date();
  return { periodo: "mes", filtroFecha: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}` };
}

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
    try { const p = await getProspecto(prospecto_id); setProspectoDetalle(p); }
    catch (err) { console.error(err); }
    finally { setCargandoProspecto(false); }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta llamada?")) return;
    try { await eliminarLlamada(id); await cargarLlamadas(filtroFecha, filtroPeriodo); setSeleccionados(prev => prev.filter(x => x !== id)); }
    catch (err) { console.error(err); }
  };

  const handleEliminarMasivo = async () => {
    if (!confirm(`¿Eliminar ${seleccionados.length} llamada${seleccionados.length > 1 ? "s" : ""}?`)) return;
    try { await eliminarLlamadasMasivo(seleccionados); setSeleccionados([]); await cargarLlamadas(filtroFecha, filtroPeriodo); }
    catch (err) { console.error(err); }
  };

  const init = fechaInicial();
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>(init.periodo);
  const [filtroFecha,   setFiltroFecha]   = useState(init.filtroFecha);

  const periodoEfectivo = (p: FiltroPeriodo): "hoy" | "dia" | "semana" | "mes" | "anio" => p;
  const granularidad = (p: FiltroPeriodo): "dia" | "semana" | "mes" | "anio" =>
    p === "hoy" || p === "dia" ? "dia" : p === "semana" ? "semana" : p === "mes" ? "mes" : "anio";

  const cargarLlamadas = async (fecha: string, periodo: FiltroPeriodo) => {
    try {
      const rango = calcularRangoFecha(fecha, periodoEfectivo(periodo));
      const gran  = granularidad(periodo);
      const [res, llam, stats, heat] = await Promise.all([
        getResumenLlamadas(rango), getAllLlamadas(rango), getEstadisticasLlamadas(gran, rango), getHeatmapLlamadas(rango),
      ]);
      setResumen(res); setLlamadas(llam); setEstadisticas(stats); setHeatmap(heat);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    cargarLlamadas(filtroFecha, filtroPeriodo);
    getProspectos({ limite: 200 }).then(p => setProspectos(p.data)).catch(console.error);
    getMotivosPerdida().then(setMotivos).catch(console.error);
  }, []);

  const handleFiltroChange = (periodo: FiltroPeriodo, fecha: string) => {
    setFiltroPeriodo(periodo); setFiltroFecha(fecha); cargarLlamadas(fecha, periodo);
  };

  const handleGuardarEdicion = async (formEdit: any) => {
    await editar.guardar(async () => {
      const { hora_inicio, fecha, hora_fin, resultado, motivo_no_interes, accion_acordada, ...resto } = formEdit;
      const payload: any = {
        ...resto, hora_fin: hora_fin || null, resultado: resultado || null,
        motivo_no_interes: motivo_no_interes || null, accion_acordada: accion_acordada || null,
      };
      const fechaBase = fecha || editar.editando?.fecha?.split("T")[0];
      if (fechaBase && hora_inicio) payload.fecha = toLocalISOString(fechaBase, hora_inicio);
      await actualizarLlamada(editar.editando!.id, payload);
      await cargarLlamadas(filtroFecha, filtroPeriodo);
    });
  };

  const exportarExcel = () => {
    const rows = llamadas.map((l: any) => ({
      "Empresa": l.empresa ?? "", "Contacto": l.nombre_contacto ?? "", "Canal": l.canal,
      "Contestada": l.contestada ? "Sí" : "No",
      "Hora inicio": l.fecha ? new Date(l.fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "",
      "Hora fin": l.hora_fin ?? "", "Resultado": l.resultado ?? "", "Notas": l.notas ?? "",
      "Fecha": l.fecha ? new Date(l.fecha).toLocaleDateString("es-PE") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Llamadas");
    XLSX.writeFile(wb, `llamadas_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

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
      const dateStr = (stat.periodo instanceof Date) ? stat.periodo.toISOString().split("T")[0] : String(stat.periodo).split("T")[0];
      const [, mo, dy] = dateStr.split("-").map(Number);
      fechaLabel = `${dy} ${MESES[mo - 1]}`;
    }
    return { fecha: fechaLabel, total: stat.total, contestadas: stat.contestadas, no_contestadas: stat.no_contestadas };
  }), [estadisticas, filtroPeriodo]);

  const accion = "relative group p-2.5 btn-ghost text-zinc-300";
  const Tip = ({ children }: { children: React.ReactNode }) => (
    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] bg-[#0a101f] text-zinc-200 px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ border: "1px solid rgb(var(--accent) / 0.3)" }}>{children}</span>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Comercial</p>
          <h1 className="font-display text-[26px] font-bold text-zinc-50 tracking-tight leading-tight mt-1">Llamadas</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Registro de contactos realizados</p>
        </div>
        <div className="flex items-center gap-2">
          <TableBulkActions count={seleccionados.length} onDelete={handleEliminarMasivo} />
          <button onClick={() => navigate("/analisis-llamadas")} className={accion}>
            <BarChart2 size={16} /><Tip>Análisis de intentos</Tip>
          </button>
          {llamadas.length > 0 && (
            <button onClick={exportarExcel} className={accion}>
              <FileDown size={16} /><Tip>Exportar Excel</Tip>
            </button>
          )}
          <button onClick={() => setModalAbierto(true)} className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-[13px]">
            <Plus size={15} /> Registrar llamada
          </button>
        </div>
      </div>

      <FiltroPeriodoBotones periodo={filtroPeriodo} filtroFecha={filtroFecha} onChange={handleFiltroChange} />

      <KpisLlamadas total={totalLlamadas} contestadas={totalContestadas} noContestadas={totalNoContestadas} />

      <EstadisticasPeriodo estadisticas={estadisticasPorPeriodo} resumen={resumen.canales} filtroPeriodo={filtroPeriodo} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HeatmapHoras data={heatmap} />
        <MotivosChart data={motivos} />
      </div>

      <HistorialLlamadas
        llamadas={llamadas} seleccionados={seleccionados}
        onToggle={toggleUno} onToggleTodos={toggleTodos}
        onEditar={editar.abrir} onEliminar={handleEliminar} onVerProspecto={handleVerProspecto}
      />

      {editar.editando && (
        <ModalEditarLlamada llamada={editar.editando} guardando={editar.guardando} error={editar.error}
          onGuardar={handleGuardarEdicion} onCerrar={editar.cerrar} />
      )}

      <LlamadaForm abierto={modalAbierto} onCerrar={() => setModalAbierto(false)}
        onGuardado={() => cargarLlamadas(filtroFecha, filtroPeriodo)} prospectos={prospectos} />

      {cargandoProspecto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/10" style={{ borderBottomColor: "rgb(var(--accent))" }} />
        </div>
      )}

      {prospectoDetalle && (
        <ProspectoDetalle prospecto={prospectoDetalle} onCerrar={() => setProspectoDetalle(null)}
          onEditar={() => { setProspectoEditar(prospectoDetalle); setProspectoDetalle(null); }}
          onActualizado={async (id) => { const p = await getProspecto(id); setProspectoDetalle(p); }} />
      )}
      {prospectoEditar && (
        <ProspectoForm prospecto={prospectoEditar} onCerrar={() => setProspectoEditar(null)}
          onGuardado={async () => { const p = await getProspecto(prospectoEditar.id); setProspectoEditar(null); setProspectoDetalle(p); }} />
      )}
    </div>
  );
}