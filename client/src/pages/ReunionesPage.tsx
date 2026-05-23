/** client/src/pages/ReunionesPage.tsx */

import { useEffect, useState, useMemo } from "react";
import { Plus, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import {
  getReuniones,
  crearReunion,
  actualizarReunion,
  eliminarReunionesMasivoService,
  getEstadisticasReuniones,
  getKpisReuniones,
} from "../services/reuniones.api";
import { getProspectos } from "../services/prospectos.api";
import type { Reunion } from "../types/reunion.types";

import { ListaReuniones }                from "../components/reuniones/ListaReuniones";
import { ModalReunion, type FormReunion } from "../components/reuniones/ModalReunion";
import { ModalEditarReunion }            from "../components/reuniones/ModalEditarReunion";
import { TableBulkActions }              from "../components/ui/TableBulkActions";
import { KpisReuniones }                 from "../components/reuniones/KpisReuniones";
import { EstadisticasReuniones }         from "../components/reuniones/EstadisticasReuniones";
import { FiltroPeriodoBotones, type FiltroPeriodo } from "../components/shared/FiltroPeriodoBotones";
import { useEditar }                     from "../hooks/useEditar";
import { calcularRangoFecha }            from "../utils/date";

const ESTADOS = ["programada", "realizada", "cancelada", "reprogramada", "en_proceso"];

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

const FORM_INICIAL: FormReunion = {
  prospecto_id: "",
  titulo:       "",
  fecha_hora:   "",
  modalidad:    "google_meet",
  enlace:       "",
  estado:       "programada",
  notas:        "",
};

export default function ReunionesPage() {
  const [reuniones,     setReuniones]     = useState<Reunion[]>([]);
  const [prospectos,    setProspectos]    = useState<any[]>([]);
  const [modalAbierto,  setModalAbierto]  = useState(false);
  const [cargando,      setCargando]      = useState(false);
  const [filtroEstado,  setFiltroEstado]  = useState("");
  const [form,          setForm]          = useState<FormReunion>(FORM_INICIAL);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const [estadisticas, setEstadisticas] = useState<any[]>([]);
  const [kpisData,     setKpisData]     = useState<{ total: number; programadas: number; realizadas: number; canceladas: number; reprogramadas: number }>({ total: 0, programadas: 0, realizadas: 0, canceladas: 0, reprogramadas: 0 });
  const [modalidadData, setModalidadData] = useState<any[]>([]);

  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>("mes");
  const [filtroFecha,   setFiltroFecha]   = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const editar = useEditar<Reunion>();

  const handleGuardarEdicion = async (form: any) => {
    await editar.guardar(async () => {
      await actualizarReunion(editar.editando!.id, form);
      cargarAnalisis(filtroFecha, filtroPeriodo);
    });
  };

  const [rangoActual, setRangoActual] = useState<{ fecha_inicio?: string; fecha_fin?: string }>({});

  // ── Carga lista de reuniones ─────────────────────────────
  const cargar = async (rango?: { fecha_inicio?: string; fecha_fin?: string }) => {
    try {
      const r = rango ?? rangoActual;
      const [reuns, pros] = await Promise.all([
        getReuniones({ estado: filtroEstado || undefined, desde: r.fecha_inicio, hasta: r.fecha_fin }),
        getProspectos({ limite: 200 }),
      ]);
      setReuniones(reuns);
      setProspectos(pros.data);
    } catch (err) { console.error(err); }
  };

  // ── Carga análisis por período ───────────────────────────
  const periodoEfectivo = (p: FiltroPeriodo): "hoy" | "dia" | "semana" | "mes" | "anio" => p;

  const cargarAnalisis = async (fecha: string, periodo: FiltroPeriodo) => {
    try {
      const rango = calcularRangoFecha(fecha, periodoEfectivo(periodo));
      setRangoActual(rango);
      const gran: "hora" | "dia" | "mes" =
        (periodo === "dia" || periodo === "hoy") ? "hora" : periodo === "anio" ? "mes" : "dia";
      const [stats, kpis] = await Promise.all([
        getEstadisticasReuniones(gran, rango),
        getKpisReuniones(rango),
        cargar(rango),
      ]);
      setEstadisticas(stats);
      setKpisData(kpis.kpis);
      setModalidadData(kpis.modalidad);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    cargarAnalisis(filtroFecha, filtroPeriodo);
  }, []);

  useEffect(() => { cargar(); }, [filtroEstado]);

  const handleFiltroChange = (periodo: FiltroPeriodo, fecha: string) => {
    setFiltroPeriodo(periodo);
    setFiltroFecha(fecha);
    cargarAnalisis(fecha, periodo);
  };

  // ── Selección ───────────────────────────────────────────
  const toggleUno = (id: string) =>
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleTodos = () => {
    if (seleccionados.length === reuniones.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(reuniones.map((r) => r.id));
    }
  };

  const todosSeleccionados = reuniones.length > 0 && seleccionados.length === reuniones.length;

  const borrarReunion = async (id: string) => {
    if (!confirm("¿Eliminar esta reunión?")) return;
    try {
      await eliminarReunionesMasivoService([id]);
      setReuniones((prev) => prev.filter((r) => r.id !== id));
      setSeleccionados((prev) => prev.filter((s) => s !== id));
    } catch {
      alert("Error al eliminar la reunión");
    }
  };

  const eliminarSeleccionados = async () => {
    if (!confirm(`¿Eliminar ${seleccionados.length} reunión${seleccionados.length > 1 ? "es" : ""}?`)) return;
    try {
      await eliminarReunionesMasivoService(seleccionados);
      setSeleccionados([]);
      cargarAnalisis(filtroFecha, filtroPeriodo);
    } catch {
      alert("Error eliminando reuniones");
    }
  };

  const handleGuardar = async () => {
    if (!form.prospecto_id || !form.titulo || !form.fecha_hora) return;
    setCargando(true);
    try {
      await crearReunion({
        ...form,
        enlace:    form.enlace    || undefined,
        modalidad: form.modalidad as any,
        estado:    form.estado    as any,
      });
      setModalAbierto(false);
      setForm(FORM_INICIAL);
      cargarAnalisis(filtroFecha, filtroPeriodo);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  const exportarExcel = () => {
    const rows = reuniones.map((r) => ({
      "Título":       r.titulo,
      "Empresa":      r.empresa         ?? "",
      "Contacto":     r.nombre_contacto ?? "",
      "Email":        r.email_contacto  ?? "",
      "Fecha y hora": new Date(r.fecha_hora).toLocaleString("es-PE"),
      "Modalidad":    r.modalidad,
      "Estado":       r.estado,
      "Enlace":       r.enlace ?? "",
      "Notas":        r.notas  ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reuniones");
    XLSX.writeFile(wb, `reuniones_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const cambiarEstado = async (id: string, estado: string) => {
    try {
      await actualizarReunion(id, { estado: estado as any });
      cargar();
    } catch (err) { console.error(err); }
  };

  // ── Estadísticas formateadas ─────────────────────────────
  const estadisticasPorPeriodo = useMemo(() => estadisticas.map((stat) => {
    let fechaLabel: string;
    if (filtroPeriodo === "dia") {
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
    return { fecha: fechaLabel, total: stat.total, realizadas: stat.realizadas, programadas: stat.programadas, canceladas: stat.canceladas };
  }), [estadisticas, filtroPeriodo]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Reuniones</h1>
          <p className="text-xs text-zinc-600 mt-0.5">{reuniones.length} reuniones</p>
        </div>
        <div className="flex gap-2">
          <TableBulkActions count={seleccionados.length} onDelete={eliminarSeleccionados} />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 text-gray-600"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e} className="capitalize">{e}</option>
            ))}
          </select>
          {reuniones.length > 0 && (
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
            <Plus size={15} /> Nueva reunión
          </button>
        </div>
      </div>

      {/* Filtros de período */}
      <FiltroPeriodoBotones
        periodo={filtroPeriodo}
        filtroFecha={filtroFecha}
        onChange={handleFiltroChange}
      />

      {/* KPIs */}
      <KpisReuniones
        total={kpisData.total}
        programadas={kpisData.programadas}
        realizadas={kpisData.realizadas}
        canceladas={kpisData.canceladas}
      />

      {/* Gráfico + modalidad */}
      <EstadisticasReuniones
        estadisticas={estadisticasPorPeriodo}
        modalidad={modalidadData}
        filtroPeriodo={filtroPeriodo}
        onPeriodoChange={(p) => handleFiltroChange(p as FiltroPeriodo, filtroFecha)}
      />

      {/* Lista */}
      <ListaReuniones
        reuniones={reuniones}
        onEditar={editar.abrir}
        onBorrar={borrarReunion}
        seleccionados={seleccionados}
        todosSeleccionados={todosSeleccionados}
        onToggleUno={toggleUno}
        onToggleTodos={toggleTodos}
        onCambiarEstado={cambiarEstado}
      />

      {editar.editando && (
        <ModalEditarReunion
          reunion={editar.editando}
          guardando={editar.guardando}
          error={editar.error}
          onGuardar={handleGuardarEdicion}
          onCerrar={editar.cerrar}
        />
      )}

      {modalAbierto && (
        <ModalReunion
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
