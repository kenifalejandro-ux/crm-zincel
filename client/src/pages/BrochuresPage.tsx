/** client/src/pages/BrochuresPage.tsx */

import { useEffect, useState, useMemo } from "react";
import { Plus, FileDown } from "lucide-react";
import * as XLSX from "xlsx";

import {
  getBrochures,
  crearBrochure,
  actualizarBrochure,
  eliminarBrochuresMasivo,
  getEstadisticasBrochures,
  getResumenBrochuresFiltrado,
} from "../services/brochures.api";
import { getProspectos } from "../services/prospectos.api";

import { TablaBrochures }                   from "../components/brochures/TablaBrochures";
import { ModalBrochure, type FormBrochure } from "../components/brochures/ModalBrochure";
import { ModalEditarBrochure }              from "../components/brochures/ModalEditarBrochure";
import { KpisBrochures }                    from "../components/brochures/KpisBrochures";
import { EstadisticasBrochures }            from "../components/brochures/EstadisticasBrochures";
import { FiltroPeriodoBotones, type FiltroPeriodo } from "../components/shared/FiltroPeriodoBotones";
import { TableBulkActions }                 from "@/components/ui/TableBulkActions";
import { useEditar }                        from "../hooks/useEditar";
import { fechaHoy, calcularRangoFecha }     from "../utils/date";

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

const FORM_INICIAL: FormBrochure = {
  prospecto_id: "",
  canal:        "correo",
  fecha_envio:  fechaHoy(),
  notas:        "",
};

export default function BrochuresPage() {
  const [brochures,    setBrochures]    = useState<any[]>([]);
  const [prospectos,   setProspectos]   = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando,     setCargando]     = useState(false);
  const [form,         setForm]         = useState<FormBrochure>(FORM_INICIAL);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [rangoActual,   setRangoActual]   = useState<{ fecha_inicio?: string; fecha_fin?: string }>({});

  const [estadisticas, setEstadisticas] = useState<any[]>([]);
  const [totalEnvios,  setTotalEnvios]  = useState(0);
  const [canalesData,  setCanalesData]  = useState<any[]>([]);

  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>("mes");
  const [filtroFecha,   setFiltroFecha]   = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const editar = useEditar<any>();

  const handleGuardarEdicion = async (form: { canal: string; fecha_envio: string; notas: string }) => {
    await editar.guardar(async () => {
      await actualizarBrochure(editar.editando!.id, form);
      cargarAnalisis(filtroFecha, filtroPeriodo);
    });
  };

  const cargar = async (rango?: { fecha_inicio?: string; fecha_fin?: string }) => {
    try {
      const r = rango ?? rangoActual;
      const [broch, pros] = await Promise.all([
        getBrochures(r.fecha_inicio || r.fecha_fin ? r : undefined),
        getProspectos({ limite: 200 }),
      ]);
      setBrochures(broch);
      setProspectos(pros.data);
    } catch (err) { console.error(err); }
  };

  const cargarAnalisis = async (fecha: string, periodo: FiltroPeriodo) => {
    try {
      const rango = calcularRangoFecha(fecha, periodo);
      setRangoActual(rango);
      const gran: "hora" | "dia" | "mes" =
        (periodo === "dia" || periodo === "hoy") ? "hora" : periodo === "anio" ? "mes" : "dia";
      const [stats, resumen] = await Promise.all([
        getEstadisticasBrochures(gran, rango),
        getResumenBrochuresFiltrado(rango),
        cargar(rango),
      ]);
      setEstadisticas(stats);
      setTotalEnvios(resumen.total);
      setCanalesData(resumen.canales);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    cargarAnalisis(filtroFecha, filtroPeriodo);
  }, []);

  const handleFiltroChange = (periodo: FiltroPeriodo, fecha: string) => {
    setFiltroPeriodo(periodo);
    setFiltroFecha(fecha);
    cargarAnalisis(fecha, periodo);
  };

  const handleGuardar = async () => {
    if (!form.prospecto_id || !form.canal) return;
    setCargando(true);
    try {
      await crearBrochure(form);
      setModalAbierto(false);
      setForm(FORM_INICIAL);
      cargarAnalisis(filtroFecha, filtroPeriodo);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  const toggleUno = (id: string) =>
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleTodos = () => {
    if (seleccionados.length === brochures.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(brochures.map((b) => b.id as string));
    }
  };

  const eliminarSeleccionados = async () => {
    if (!confirm(`¿Eliminar ${seleccionados.length} brochure${seleccionados.length > 1 ? "s" : ""}?`)) return;
    try {
      await eliminarBrochuresMasivo(seleccionados);
      setSeleccionados([]);
      cargarAnalisis(filtroFecha, filtroPeriodo);
    } catch {
      alert("Error eliminando brochures");
    }
  };

  const exportarExcel = () => {
    const rows = brochures.map((b: any) => ({
      "Empresa":  b.empresa         ?? "",
      "Contacto": b.nombre_contacto ?? "",
      "Canal":    b.canal,
      "Notas":    b.notas           ?? "",
      "Fecha":    b.fecha ? new Date(b.fecha).toLocaleDateString("es-PE") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Brochures");
    XLSX.writeFile(wb, `brochures_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const todosSeleccionados = brochures.length > 0 && seleccionados.length === brochures.length;

  // ── Estadísticas formateadas ─────────────────────────────
  const estadisticasPorPeriodo = useMemo(() => estadisticas.map((stat) => {
    let fechaLabel: string;
    if (filtroPeriodo === "dia" || filtroPeriodo === "hoy") {
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
    return { fecha: fechaLabel, total: stat.total };
  }), [estadisticas, filtroPeriodo]);

  return (
    <div className="space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Brochures</h1>
          <p className="text-xs text-zinc-600 mt-0.5">{brochures.length} envíos registrados</p>
        </div>
        <div className="flex gap-2">
          <TableBulkActions count={seleccionados.length} onDelete={eliminarSeleccionados} />
          {brochures.length > 0 && (
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
            <Plus size={15} /> Registrar envío
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
      <KpisBrochures total={totalEnvios} canales={canalesData} />

      {/* Gráfico + canales */}
      <EstadisticasBrochures
        estadisticas={estadisticasPorPeriodo}
        canales={canalesData}
        filtroPeriodo={filtroPeriodo}
        onPeriodoChange={(p) => handleFiltroChange(p as FiltroPeriodo, filtroFecha)}
      />

      {/* Tabla */}
      <TablaBrochures
        brochures={brochures}
        seleccionados={seleccionados}
        todosSeleccionados={todosSeleccionados}
        onToggleUno={toggleUno}
        onToggleTodos={toggleTodos}
        onEditar={editar.abrir}
      />

      {editar.editando && (
        <ModalEditarBrochure
          brochure={editar.editando}
          guardando={editar.guardando}
          error={editar.error}
          onGuardar={handleGuardarEdicion}
          onCerrar={editar.cerrar}
        />
      )}

      {modalAbierto && (
        <ModalBrochure
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
