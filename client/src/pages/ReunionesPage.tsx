/** client/src/pages/ReunionesPage.tsx */

import { useEffect, useState } from "react";
import { Plus, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { getReuniones, crearReunion, actualizarReunion, eliminarReunionesMasivoService } from "../services/reuniones.api";
import { getProspectos } from "../services/prospectos.api";
import type { Reunion } from "../types/reunion.types";

import { ListaReuniones }                from "../components/reuniones/ListaReuniones";
import { ModalReunion, type FormReunion } from "../components/reuniones/ModalReunion";
import { ModalEditarReunion }            from "../components/reuniones/ModalEditarReunion";
import { TableBulkActions }              from "../components/ui/TableBulkActions";
import { useEditar }                     from "../hooks/useEditar";

const ESTADOS = ["programada", "realizada", "cancelada", "reprogramada", "en_proceso"];

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
  const editar = useEditar<Reunion>();

  const handleGuardarEdicion = async (form: any) => {
    await editar.guardar(async () => {
      await actualizarReunion(editar.editando!.id, form);
      cargar();
    });
  };

  // ── Carga de datos ──────────────────────────────────────
  const cargar = async () => {
    try {
      const [reuns, pros] = await Promise.all([
        getReuniones({ estado: filtroEstado || undefined }),
        getProspectos({ limite: 200 }),
      ]);
      setReuniones(reuns);
      setProspectos(pros.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

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

  // ── Eliminar individual ─────────────────────────────────
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

  // ── Eliminar masivo ─────────────────────────────────────
  const eliminarSeleccionados = async () => {
    if (!confirm(`¿Eliminar ${seleccionados.length} reunión${seleccionados.length > 1 ? "es" : ""}?`)) return;
    try {
      await eliminarReunionesMasivoService(seleccionados);
      setSeleccionados([]);
      cargar();
    } catch {
      alert("Error eliminando reuniones");
    }
  };

  // ── Guardar reunión ─────────────────────────────────────
  const handleGuardar = async () => {
    if (!form.prospecto_id || !form.titulo || !form.fecha_hora) return;
    setCargando(true);
    try {
      await crearReunion({
        ...form,
        enlace:    form.enlace || undefined,
        modalidad: form.modalidad as any,
        estado:    form.estado as any,
      });
      setModalAbierto(false);
      setForm(FORM_INICIAL);
      cargar();
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  // ── Exportar Excel ──────────────────────────────────────
  const exportarExcel = () => {
    const rows = reuniones.map((r) => ({
      "Título":          r.titulo,
      "Empresa":         r.empresa          ?? "",
      "Contacto":        r.nombre_contacto  ?? "",
      "Email":           r.email_contacto   ?? "",
      "Fecha y hora":    new Date(r.fecha_hora).toLocaleString("es-PE"),
      "Modalidad":       r.modalidad,
      "Estado":          r.estado,
      "Enlace":          r.enlace ?? "",
      "Notas":           r.notas  ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reuniones");
    XLSX.writeFile(wb, `reuniones_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── Cambiar estado ──────────────────────────────────────
  const cambiarEstado = async (id: string, estado: string) => {
    try {
      await actualizarReunion(id, { estado: estado as any });
      cargar();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">Reuniones</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{reuniones.length} reuniones</p>
        </div>

        <div className="flex gap-2">

          {/* Aparece solo cuando hay seleccionados */}
          <TableBulkActions
            count={seleccionados.length}
            onDelete={eliminarSeleccionados}
          />

          {/* Filtro de estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e} className="capitalize">{e}</option>
            ))}
          </select>

          {reuniones.length > 0 && (
            <button
              onClick={exportarExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
            >
              <FileDown size={15} /> Exportar Excel
            </button>
          )}
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus size={15} /> Nueva reunión
          </button>
        </div>
      </div>

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

      {/* Modal editar reunión */}
      {editar.editando && (
        <ModalEditarReunion
          reunion={editar.editando}
          guardando={editar.guardando}
          error={editar.error}
          onGuardar={handleGuardarEdicion}
          onCerrar={editar.cerrar}
        />
      )}

      {/* Modal nueva reunión */}
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