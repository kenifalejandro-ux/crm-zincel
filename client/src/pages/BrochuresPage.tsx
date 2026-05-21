/** client/src/pages/BrochuresPage.tsx */

import { useEffect, useState } from "react";
import { Plus, FileDown } from "lucide-react";
import * as XLSX from "xlsx";

// ✅ Import correcto: brochure.api (singular, sin "s")
import { getBrochures, crearBrochure, getResumenBrochures, actualizarBrochure, eliminarBrochuresMasivo } from "../services/brochures.api";
import { getProspectos } from "../services/prospectos.api";

import { ResumenCanales }                   from "../components/brochures/ResumenCanales";
import { TablaBrochures }                   from "../components/brochures/TablaBrochures";
import { ModalBrochure, type FormBrochure } from "../components/brochures/ModalBrochure";
import { ModalEditarBrochure }              from "../components/brochures/ModalEditarBrochure";
import { TableBulkActions }                 from "@/components/ui/TableBulkActions";
import { useEditar }                        from "../hooks/useEditar";
import { fechaHoy }                         from "../utils/date";

const FORM_INICIAL: FormBrochure = {
  prospecto_id: "",
  canal:        "correo",
  fecha_envio:  fechaHoy(),
  notas:        "",
};

export default function BrochuresPage() {
  const [brochures,    setBrochures]    = useState<any[]>([]);
  const [resumen,      setResumen]      = useState<any[]>([]);
  const [prospectos,   setProspectos]   = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando,     setCargando]     = useState(false);
  const [form,         setForm]         = useState<FormBrochure>(FORM_INICIAL);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const editar = useEditar<any>();

  const handleGuardarEdicion = async (form: { canal: string; fecha_envio: string; notas: string }) => {
    await editar.guardar(async () => {
      await actualizarBrochure(editar.editando!.id, form);
      cargar();
    });
  };

  const cargar = async () => {
    try {
      const [broch, res, pros] = await Promise.all([
        getBrochures(),
        getResumenBrochures(),
        getProspectos({ limite: 200 }),
      ]);
      setBrochures(broch);
      setResumen(res);
      setProspectos(pros.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { cargar(); }, []);

  const handleGuardar = async () => {
    if (!form.prospecto_id || !form.canal) return;
    setCargando(true);
    try {
      await crearBrochure(form);
      setModalAbierto(false);
      setForm(FORM_INICIAL);
      cargar();
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
      cargar();
    } catch {
      alert("Error eliminando brochures");
    }
  };
  

  const exportarExcel = () => {
    const rows = brochures.map((b: any) => ({
      "Empresa":   b.empresa          ?? "",
      "Contacto":  b.nombre_contacto  ?? "",
      "Canal":     b.canal,
      "Notas":     b.notas            ?? "",
      "Fecha":     b.fecha ? new Date(b.fecha).toLocaleDateString("es-PE") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Brochures");
    XLSX.writeFile(wb, `brochures_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const totalBrochures    = resumen.reduce((a, r) => a + parseInt(r.total || 0), 0);
  const todosSeleccionados = brochures.length > 0 && seleccionados.length === brochures.length;

  return (
    <div className="space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">Brochures</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{totalBrochures} envíos registrados</p>
        </div>
        <div className="flex gap-2">
          <TableBulkActions count={seleccionados.length} onDelete={eliminarSeleccionados} />
          {brochures.length > 0 && (
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
            <Plus size={15} /> Registrar envío
          </button>
        </div>
      </div>

      <ResumenCanales resumen={resumen} />

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