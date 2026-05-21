/** client/src/pages/FinanzasPage.tsx */

import { useEffect, useState, useMemo } from "react";
import { DollarSign, TrendingDown, TrendingUp, AlertCircle, Plus, FileDown } from "lucide-react";
import * as XLSX from "xlsx";

import { useFinanzas }            from "../hooks/useFinanzas";
import { useEditar }              from "../hooks/useEditar";
import { KpiCards, type KpiItem } from "@/components/shared/KpisCards";
import { TableBulkActions }       from "../components/ui/TableBulkActions";

import { TabsFinanzas, type TabFinanzas } from "../components/finanzas/TabsFinanzas";
import { TablaIngresos }          from "../components/finanzas/TablaIngresos";
import { ModalIngreso }           from "../components/finanzas/ModalIngreso";
import { ModalEditarIngreso }     from "../components/finanzas/ModalEditarIngreso";
import { TablaEgresos }           from "../components/finanzas/TablaEgresos";
import { ModalEgreso }            from "../components/finanzas/ModalEgreso";
import { ModalEditarEgreso }      from "../components/finanzas/ModalEditarEgreso";
import { TablaPrestamos }         from "../components/finanzas/TablaPrestamos";
import { ModalPrestamo }          from "../components/finanzas/ModalPrestamo";
import { ModalEditarPrestamo }    from "../components/finanzas/ModalEditarPrestamo";
import { ResumenFinanzas }        from "../components/finanzas/ResumenFinanzas";
import { AlertasVencimiento }     from "../components/finanzas/AlertasVencimiento";
import { FiltrosFinanzas }        from "../components/finanzas/FiltrosFinanzas";

import {
  actualizarIngreso, actualizarEgreso, actualizarPrestamo,
  eliminarIngresosMasivo, eliminarEgresosMasivo, eliminarPrestamosMasivo,
} from "../services/finanzas.api";
import { getTipoCambio } from "../services/configuracion.api";
import type { FormIngreso, FormEgreso, FormPrestamo } from "../types/finanzas.types";
import { fechaHoy } from "../utils/date";

const hoy = () => fechaHoy();

const formIngresoInicial = (tc: number): FormIngreso => ({
  empresa: "", descripcion: "", tipo_servicio: "otro",
  monto_total: "", adelanto: "0", moneda: "PEN", tipo_cambio: String(tc),
  estado: "por_cobrar", fecha: hoy(), fecha_vencimiento: "", notas: "",
});

const formEgresoInicial = (tc: number): FormEgreso => ({
  categoria: "publicidad_digital", descripcion: "", proveedor: "",
  monto: "", moneda: "PEN", tipo_cambio: String(tc), frecuencia: "unico",
  estado: "pendiente", fecha: hoy(), fecha_vencimiento: "", notas: "",
});

const formPrestamoInicial = (tc: number): FormPrestamo => ({
  categoria: "otro", descripcion: "", prestamista: "", monto: "", moneda: "PEN",
  tipo_cambio: String(tc), estado: "por_pagar", fecha: hoy(), fecha_vencimiento: "", fecha_pago: "", notas: "",
});

export default function FinanzasPage() {
  const {
    ingresos, egresos, prestamos, resumen,
    cargarIngresos, cargarEgresos, cargarPrestamos, cargarResumen,
    agregarIngreso,  borrarIngreso,
    agregarEgreso,   borrarEgreso,
    agregarPrestamo, borrarPrestamo,
  } = useFinanzas();

  const [tab,            setTab]           = useState<TabFinanzas>("ingresos");
  const [modalIngreso,   setModalIngreso]  = useState(false);
  const [modalEgreso,    setModalEgreso]   = useState(false);
  const [modalPrestamo,  setModalPrestamo] = useState(false);
  const [cargando,       setCargando]      = useState(false);
  const [tipoCambio,     setTipoCambio]    = useState<number>(3.75);
  const [formIngreso,    setFormIngreso]   = useState<FormIngreso>(() => formIngresoInicial(3.75));
  const [formEgreso,     setFormEgreso]    = useState<FormEgreso>(() => formEgresoInicial(3.75));
  const [formPrestamo,   setFormPrestamo]  = useState<FormPrestamo>(() => formPrestamoInicial(3.75));
  const [seleccionados,  setSeleccionados] = useState<string[]>([]);
  const [filtroMes,      setFiltroMes]     = useState(0);
  const [filtroAnio,     setFiltroAnio]    = useState(0);
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const editarIngreso  = useEditar<any>();
  const editarEgreso   = useEditar<any>();
  const editarPrestamo = useEditar<any>();

  // ── Carga inicial ───────────────────────────────────────────
  useEffect(() => {
    cargarIngresos();
    cargarEgresos();
    cargarPrestamos();
    getTipoCambio()
      .then((tc) => setTipoCambio(tc.valor))
      .catch(() => {});
  }, []);

  useEffect(() => {
    cargarResumen({ tipo_cambio: tipoCambio });
  }, [tipoCambio]);

  // ── Limpiar selección y filtros al cambiar tab ────────────
  useEffect(() => {
    setSeleccionados([]);
    setFiltroMes(0);
    setFiltroAnio(0);
    setFiltroCategoria("");
  }, [tab]);

  // ── Datos filtrados ────────────────────────────────────────
  const egresosFiltrados = useMemo(() => egresos.filter(eg => {
    if (filtroMes > 0 && filtroAnio > 0) {
      const f = new Date(eg.fecha.split("T")[0] + "T12:00:00");
      if (f.getMonth() + 1 !== filtroMes || f.getFullYear() !== filtroAnio) return false;
    }
    if (filtroCategoria && eg.categoria !== filtroCategoria) return false;
    return true;
  }), [egresos, filtroMes, filtroAnio, filtroCategoria]);

  const prestamosFiltrados = useMemo(() => prestamos.filter(p => {
    if (filtroMes > 0 && filtroAnio > 0) {
      const f = new Date(p.fecha.split("T")[0] + "T12:00:00");
      if (f.getMonth() + 1 !== filtroMes || f.getFullYear() !== filtroAnio) return false;
    }
    if (filtroCategoria && p.categoria !== filtroCategoria) return false;
    return true;
  }), [prestamos, filtroMes, filtroAnio, filtroCategoria]);

  // ── Selección dinámica según tab ───────────────────────────
  const listaActual =
    tab === "ingresos"  ? ingresos          :
    tab === "egresos"   ? egresosFiltrados  :
    tab === "prestamos" ? prestamosFiltrados : [];

  const toggleUno = (id: string) =>
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const toggleTodos = () =>
    setSeleccionados(
      seleccionados.length === listaActual.length ? [] : listaActual.map((i: any) => i.id)
    );

  const todosSeleccionados =
    seleccionados.length === listaActual.length && listaActual.length > 0;

  // ── Eliminación masiva ─────────────────────────────────────
  const eliminarSeleccionados = async () => {
    const tipo =
      tab === "ingresos"  ? "ingreso"  :
      tab === "egresos"   ? "egreso"   : "préstamo";
    if (!confirm(`¿Eliminar ${seleccionados.length} ${tipo}(s)?`)) return;
    if (tab === "ingresos") {
      await eliminarIngresosMasivo(seleccionados);
      cargarIngresos(); cargarResumen();
    } else if (tab === "egresos") {
      await eliminarEgresosMasivo(seleccionados);
      cargarEgresos(); cargarResumen();
    } else {
      await eliminarPrestamosMasivo(seleccionados);
      cargarPrestamos();
    }
    setSeleccionados([]);
  };

  // ── Guardar ingreso ────────────────────────────────────────
  const handleGuardarIngreso = async () => {
    if (!formIngreso.empresa || !formIngreso.descripcion || !formIngreso.monto_total) return;
    setCargando(true);
    try {
      await agregarIngreso({
        ...formIngreso,
        monto_total:       parseFloat(formIngreso.monto_total),
        adelanto:          parseFloat(formIngreso.adelanto || "0"),
        tipo_cambio:       parseFloat(formIngreso.tipo_cambio || "1"),
        fecha_vencimiento: formIngreso.fecha_vencimiento || undefined,
      });
      setModalIngreso(false);
      setFormIngreso(formIngresoInicial(tipoCambio));
      cargarResumen();
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  // ── Guardar egreso ─────────────────────────────────────────
  const handleGuardarEgreso = async () => {
    if (!formEgreso.descripcion || !formEgreso.monto) return;
    setCargando(true);
    try {
      await agregarEgreso({
        ...formEgreso,
        monto:             parseFloat(formEgreso.monto),
        tipo_cambio:       parseFloat(formEgreso.tipo_cambio || "1"),
        fecha_vencimiento: formEgreso.fecha_vencimiento || undefined,
      });
      setModalEgreso(false);
      setFormEgreso(formEgresoInicial(tipoCambio));
      cargarResumen();
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  // ── Guardar préstamo ───────────────────────────────────────
  const handleGuardarPrestamo = async () => {
    if (!formPrestamo.descripcion || !formPrestamo.monto) return;
    setCargando(true);
    try {
      await agregarPrestamo({
        ...formPrestamo,
        monto:       parseFloat(formPrestamo.monto),
        tipo_cambio: parseFloat(formPrestamo.tipo_cambio || "1"),
        fecha_pago:  formPrestamo.fecha_pago || undefined,
      });
      setModalPrestamo(false);
      setFormPrestamo(formPrestamoInicial(tipoCambio));
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  // ── Editar ingreso ─────────────────────────────────────────
  const handleGuardarEdicionIngreso = async (form: any) => {
    await editarIngreso.guardar(async () => {
      await actualizarIngreso(editarIngreso.editando!.id, {
        ...form,
        monto_total:       parseFloat(form.monto_total),
        adelanto:          parseFloat(form.adelanto || "0"),
        tipo_cambio:       parseFloat(form.tipo_cambio || "1"),
        fecha_vencimiento: form.fecha_vencimiento || undefined,
      });
      cargarIngresos(); cargarResumen();
    });
  };

  // ── Editar egreso ──────────────────────────────────────────
  const handleGuardarEdicionEgreso = async (form: any) => {
    await editarEgreso.guardar(async () => {
      await actualizarEgreso(editarEgreso.editando!.id, {
        ...form,
        monto:             parseFloat(form.monto),
        tipo_cambio:       parseFloat(form.tipo_cambio || "1"),
        fecha_vencimiento: form.fecha_vencimiento || undefined,
      });
      cargarEgresos(); cargarResumen();
    });
  };

  // ── Editar préstamo ────────────────────────────────────────
  const handleGuardarEdicionPrestamo = async (form: any) => {
    await editarPrestamo.guardar(async () => {
      await actualizarPrestamo(editarPrestamo.editando!.id, {
        ...form,
        monto:       parseFloat(form.monto),
        tipo_cambio: parseFloat(form.tipo_cambio || "1"),
        fecha_pago:  form.fecha_pago || undefined,
      });
      cargarPrestamos();
    });
  };

  // ── Exportar Excel ────────────────────────────────────────
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    if (ingresos.length) {
      const ws = XLSX.utils.json_to_sheet(ingresos.map((i: any) => ({
        "Empresa":          i.empresa,
        "Descripción":      i.descripcion,
        "Servicio":         i.tipo_servicio,
        "Monto total":      i.monto_total,
        "Adelanto":         i.adelanto,
        "Saldo pendiente":  i.saldo_pendiente,
        "Moneda":           i.moneda,
        "Estado":           i.estado,
        "Fecha":            i.fecha ? new Date(i.fecha).toLocaleDateString("es-PE") : "",
        "Vencimiento":      i.fecha_vencimiento ? new Date(i.fecha_vencimiento).toLocaleDateString("es-PE") : "",
        "Notas":            i.notas ?? "",
      })));
      XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
    }

    if (egresos.length) {
      const ws = XLSX.utils.json_to_sheet(egresos.map((e: any) => ({
        "Categoría":    e.categoria,
        "Descripción":  e.descripcion,
        "Proveedor":    e.proveedor ?? "",
        "Monto":        e.monto,
        "Moneda":       e.moneda,
        "Frecuencia":   e.frecuencia,
        "Estado":       e.estado,
        "Fecha":        e.fecha ? new Date(e.fecha).toLocaleDateString("es-PE") : "",
        "Vencimiento":  e.fecha_vencimiento ? new Date(e.fecha_vencimiento).toLocaleDateString("es-PE") : "",
        "Notas":        e.notas ?? "",
      })));
      XLSX.utils.book_append_sheet(wb, ws, "Egresos");
    }

    if (prestamos.length) {
      const ws = XLSX.utils.json_to_sheet(prestamos.map((p: any) => ({
        "Categoría":    p.categoria,
        "Descripción":  p.descripcion,
        "Prestamista":  p.prestamista ?? "",
        "Monto":        p.monto,
        "Moneda":       p.moneda,
        "Estado":       p.estado,
        "Fecha":        p.fecha ? new Date(p.fecha).toLocaleDateString("es-PE") : "",
        "Vencimiento":  p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString("es-PE") : "",
        "Fecha pago":   p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString("es-PE") : "",
        "Notas":        p.notas ?? "",
      })));
      XLSX.utils.book_append_sheet(wb, ws, "Préstamos");
    }

    if (!wb.SheetNames.length) return;
    XLSX.writeFile(wb, `finanzas_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── Botón header dinámico ──────────────────────────────────
  const handleNuevo = () => {
    if (tab === "ingresos")  setModalIngreso(true);
    if (tab === "egresos")   setModalEgreso(true);
    if (tab === "prestamos") setModalPrestamo(true);
  };

  const labelNuevo =
    tab === "ingresos"  ? "Agregar ingreso"    :
    tab === "egresos"   ? "Registrar egreso"   : "Registrar préstamo";

  // ── KPIs del header ────────────────────────────────────────
  const totalPorPagarPrestamos = prestamos
    .filter((p: any) => p.estado === "por_pagar")
    .reduce((sum: number, p: any) => sum + Number(p.monto), 0);

  const kpis: KpiItem[] = resumen ? [
    {
      label: "Ingresos cobrados",
      valor: `S/ ${Number(resumen.ingresos.total_cobrado).toLocaleString("es-PE")}`,
      icon:  <TrendingUp size={18} />,
      color: "text-green-600", bg: "bg-green-50",
    },
    {
      label: "Egresos del mes",
      valor: `S/ ${Number(resumen.egresos.total_egresos).toLocaleString("es-PE")}`,
      icon:  <TrendingDown size={18} />,
      color: "text-red-500", bg: "bg-red-50",
    },
    {
      label: "Utilidad neta",
      valor: `S/ ${Number(resumen.ingresos.utilidad_neta).toLocaleString("es-PE")}`,
      icon:  <DollarSign size={18} />,
      color: resumen.ingresos.utilidad_neta >= 0 ? "text-blue-600" : "text-red-600",
      bg:    resumen.ingresos.utilidad_neta >= 0 ? "bg-blue-50"    : "bg-red-50",
    },
    {
      label: "Préstamos por pagar",
      valor: `S/ ${totalPorPagarPrestamos.toLocaleString("es-PE")}`,
      icon:  <AlertCircle size={18} />,
      color: totalPorPagarPrestamos > 0 ? "text-orange-500" : "text-zinc-400",
      bg:    totalPorPagarPrestamos > 0 ? "bg-orange-50"    : "bg-gray-50",
    },
  ] : [];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">Finanzas</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Sistema contable digital personal</p>
        </div>

        <div className="flex gap-2">
          {(ingresos.length > 0 || egresos.length > 0 || prestamos.length > 0) && (
            <button
              onClick={exportarExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
            >
              <FileDown size={15} /> Exportar Excel
            </button>
          )}
          {tab !== "resumen" && (
            <>
              <TableBulkActions count={seleccionados.length} onDelete={eliminarSeleccionados} />
              <button
                onClick={handleNuevo}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <Plus size={15} />
                {labelNuevo}
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      {resumen && <KpiCards items={kpis} />}

      {/* Alertas de vencimiento */}
      <AlertasVencimiento egresos={egresos} prestamos={prestamos} />

      {/* Tabs */}
      <TabsFinanzas tab={tab} onChange={setTab} />

      {/* Filtros por mes/categoría */}
      <FiltrosFinanzas
        tab={tab}
        filtroMes={filtroMes}
        filtroAnio={filtroAnio}
        filtroCategoria={filtroCategoria}
        onMesChange={(mes, anio) => { setFiltroMes(mes); setFiltroAnio(anio); setSeleccionados([]); }}
        onCategoriaChange={(cat) => { setFiltroCategoria(cat); setSeleccionados([]); }}
      />

      {/* Contenido */}
      {tab === "ingresos" && (
        <TablaIngresos
          ingresos={ingresos}
          onEditar={editarIngreso.abrir}
          onBorrar={borrarIngreso}
          seleccionados={seleccionados}
          todosSeleccionados={todosSeleccionados}
          onToggleUno={toggleUno}
          onToggleTodos={toggleTodos}
        />
      )}

      {tab === "egresos" && (
        <TablaEgresos
          egresos={egresosFiltrados}
          onEditar={editarEgreso.abrir}
          onBorrar={borrarEgreso}
          seleccionados={seleccionados}
          todosSeleccionados={todosSeleccionados}
          onToggleUno={toggleUno}
          onToggleTodos={toggleTodos}
        />
      )}

      {tab === "prestamos" && (
        <TablaPrestamos
          prestamos={prestamosFiltrados}
          onEditar={editarPrestamo.abrir}
          onBorrar={borrarPrestamo}
          seleccionados={seleccionados}
          todosSeleccionados={todosSeleccionados}
          onToggleUno={toggleUno}
          onToggleTodos={toggleTodos}
        />
      )}

      {tab === "resumen" && resumen && (
        <ResumenFinanzas
          resumen={resumen}
          tipoCambio={tipoCambio}
          onTipoCambioChange={setTipoCambio}
        />
      )}
      {tab === "resumen" && !resumen && (
        <div className="text-center py-12 text-xs text-zinc-400">Cargando resumen…</div>
      )}

      {/* Modales editar */}
      {editarIngreso.editando && (
        <ModalEditarIngreso
          ingreso={editarIngreso.editando}
          guardando={editarIngreso.guardando}
          error={editarIngreso.error}
          onGuardar={handleGuardarEdicionIngreso}
          onCerrar={editarIngreso.cerrar}
        />
      )}
      {editarEgreso.editando && (
        <ModalEditarEgreso
          egreso={editarEgreso.editando}
          guardando={editarEgreso.guardando}
          error={editarEgreso.error}
          onGuardar={handleGuardarEdicionEgreso}
          onCerrar={editarEgreso.cerrar}
        />
      )}
      {editarPrestamo.editando && (
        <ModalEditarPrestamo
          prestamo={editarPrestamo.editando}
          guardando={editarPrestamo.guardando}
          error={editarPrestamo.error}
          onGuardar={handleGuardarEdicionPrestamo}
          onCerrar={editarPrestamo.cerrar}
        />
      )}

      {/* Modales crear */}
      {modalIngreso && (
        <ModalIngreso
          form={formIngreso}
          cargando={cargando}
          onFormChange={setFormIngreso}
          onGuardar={handleGuardarIngreso}
          onCerrar={() => setModalIngreso(false)}
        />
      )}
      {modalEgreso && (
        <ModalEgreso
          form={formEgreso}
          cargando={cargando}
          onFormChange={setFormEgreso}
          onGuardar={handleGuardarEgreso}
          onCerrar={() => setModalEgreso(false)}
        />
      )}
      {modalPrestamo && (
        <ModalPrestamo
          form={formPrestamo}
          cargando={cargando}
          onFormChange={setFormPrestamo}
          onGuardar={handleGuardarPrestamo}
          onCerrar={() => setModalPrestamo(false)}
        />
      )}

    </div>
  );
}
