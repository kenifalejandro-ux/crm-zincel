/** client/src/pages/ProspectosPage.tsx — REDISEÑO NEON
 * Cambios SOLO de presentación:
 *  - Header con kicker + botones de acción unificados (antes bg-violet-600/teal-600/zinc-800 sueltos).
 *  - Banner de leads calientes neon (antes from-red-50 to-orange-50 / text-orange-700 — parche claro).
 *  - Error de importación neon (antes bg-red-50 border-red-100 text-red-600).
 *  Toda la lógica (Excel import/export, filtros, selección masiva, modales) queda INTACTA.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProspectos } from "../hooks/useProspectos";
import { Plus, Upload, AlertTriangle, FileDown, BarChart2, Flame } from "lucide-react";
import * as XLSX from "xlsx";
import api from "../services/api";
import { getScoresLeads, getResumenProspectos } from "../services/prospectos.api";
import type { ScoreLead, ResumenProspectos } from "../services/prospectos.api";

import { ProspectoDetalle } from "../components/prospectos/ProspectoDetalle";
import { ProspectoForm } from "../components/prospectos/ProspectoForm";
import { FiltrosProspectos } from "../components/prospectos/FiltrosProspectos";
import { TablaProspectos } from "../components/prospectos/TablaProspectos";
import { PreviewImportacion } from "../components/prospectos/PreviewImportacion";
import { KpisProspectos } from "../components/prospectos/KpisProspectos";
import { mapearExcelACRM } from "../utils/prospectos.mappers";
import { TableBulkActions } from "../components/ui/TableBulkActions";

const LIMITE = 50;

export default function ProspectosPage() {
  const { prospectos, total, cargando, cargar, eliminar } = useProspectos();

  const location = useLocation();
  const navigate = useNavigate();
  const estadoInicial = (location.state as any)?.filtroEstado ?? "";

  const [busqueda, setBusqueda]         = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState(estadoInicial);
  const [pagina, setPagina]             = useState(1);

  const [preview, setPreview]           = useState<any[]>([]);
  const [importando, setImportando]     = useState(false);
  const [errorImport, setErrorImport]   = useState<string | null>(null);

  const [prospectoSeleccionado, setProspectoSeleccionado] = useState<any | null>(null);
  const [prospectoEditar, setProspectoEditar]             = useState<any | null>(null);
  const [mostrarNuevo, setMostrarNuevo]                   = useState(false);

  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreLead>>({});
  const [resumen, setResumen] = useState<ResumenProspectos | null>(null);

  useEffect(() => {
    cargar({ busqueda, estado_lead: estadoFiltro, pagina, limite: LIMITE });
    getScoresLeads().then(s => setScores(Object.fromEntries(s.map(sc => [sc.id, sc])))).catch(console.error);
    getResumenProspectos().then(setResumen).catch(console.error);
  }, [busqueda, estadoFiltro, pagina]);

  const prospectosOrdenados = useMemo(() => {
    if (Object.keys(scores).length === 0) return prospectos;
    return [...prospectos].sort((a, b) => (scores[b.id]?.score ?? 0) - (scores[a.id]?.score ?? 0));
  }, [prospectos, scores]);

  const handleBusqueda = (valor: string) => { setBusqueda(valor); setPagina(1); };
  const handleEstado = (valor: string) => { setEstadoFiltro(valor); setPagina(1); };

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };
  const toggleTodos = () => {
    if (seleccionados.length === prospectos.length) setSeleccionados([]);
    else setSeleccionados(prospectos.map((p) => p.id as string));
  };
  const eliminarSeleccionados = async () => {
    if (!confirm(`¿Eliminar ${seleccionados.length} prospectos?`)) return;
    await Promise.all(seleccionados.map((id) => eliminar(id)));
    setSeleccionados([]);
    cargar({ busqueda, estado_lead: estadoFiltro, pagina, limite: LIMITE });
  };

  const exportarExcel = () => {
    const rows = prospectos.map((p) => ({
      "Empresa": p.empresa, "Actividad Economica": p.actividad_economica ?? "", "Sector": p.sector ?? "",
      "Perfil": p.perfil_empresa ?? "", "Trabajadores": p.cantidad_trabajadores ?? "",
      "Contacto": p.nombre_contacto ?? "", "Cargo": p.cargo ?? "", "Teléfono": p.telefono ?? "",
      "Email": p.email_contacto ?? "", "Ciudad": p.ciudad ?? "", "País": p.pais,
      "Estado lead": p.estado_lead, "Clasificación": p.clasificacion, "Estado venta": p.estado_venta,
      "Prioridad": p.prioridad, "Fuente": p.fuente ?? "", "Página web": p.pagina_web ?? "",
      "Notas": p.notas ?? "", "Creado": new Date(p.creado_en).toLocaleDateString("es-PE"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prospectos");
    XLSX.writeFile(wb, `prospectos_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorImport(null);
    setPreview([]);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", sheetRows: 1000 });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        if (rows.length === 0) { setErrorImport("El archivo está vacío."); return; }
        setPreview(mapearExcelACRM(rows));
      } catch {
        setErrorImport("No se pudo leer el archivo. Verifica que sea un Excel válido.");
      }
    };
    reader.onerror = () => setErrorImport("Error al leer el archivo.");
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const confirmarImportacion = async () => {
    setImportando(true);
    try {
      const LOTE = 50;
      let totalInsertados = 0;
      for (let i = 0; i < preview.length; i += LOTE) {
        const lote = preview.slice(i, i + LOTE);
        const { data } = await api.post("/prospectos/importar", { prospectos: lote });
        totalInsertados += data.insertados;
      }
      alert(`✅ Importación completada: ${totalInsertados} registros`);
      setPreview([]);
      cargar({ busqueda, estado_lead: estadoFiltro, pagina, limite: LIMITE });
    } catch (err: any) {
      setErrorImport(err.response?.data?.message || "Error al importar");
    } finally {
      setImportando(false);
    }
  };

  const calientes = Object.values(scores).filter(s => s.nivel === "caliente" && s.etapa_pipeline !== "cerrado_ganado" && s.etapa_pipeline !== "perdido" && !["venta_ganada","baja_de_oficio","suspension_temporal","no_habido","perdida"].includes(s.estado_lead)).length;

  // Botón de acción del header (estilo unificado, solo cambia el ícono/color de acento)
  const accion = "relative group p-2.5 btn-ghost text-zinc-300";

  return (
    <div className="space-y-5">
      {prospectoSeleccionado && (
        <ProspectoDetalle prospecto={prospectoSeleccionado} onCerrar={() => setProspectoSeleccionado(null)}
          onActualizado={(_id) => cargar({ busqueda, estado_lead: estadoFiltro, pagina, limite: LIMITE })} />
      )}
      {prospectoEditar && (
        <ProspectoForm prospecto={prospectoEditar} onCerrar={() => setProspectoEditar(null)}
          onGuardado={() => { setProspectoEditar(null); cargar({ busqueda, estado_lead: estadoFiltro, pagina, limite: LIMITE }); }} />
      )}
      {mostrarNuevo && (
        <ProspectoForm onCerrar={() => setMostrarNuevo(false)}
          onGuardado={() => { setMostrarNuevo(false); cargar({ busqueda, estado_lead: estadoFiltro, pagina, limite: LIMITE }); }} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Comercial</p>
          <h1 className="font-display text-[26px] font-bold text-zinc-50 tracking-tight leading-tight mt-1">Prospectos</h1>
          <p className="text-[13px] text-zinc-500 mt-1">{total} registros en total</p>
        </div>
        <div className="flex items-center gap-2">
          <TableBulkActions count={seleccionados.length} onDelete={eliminarSeleccionados} />

          <label className={accion + " cursor-pointer"}>
            <Upload size={16} />
            <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
            <Tip>Importar Excel</Tip>
          </label>
          <button onClick={() => navigate("/analisis-comercial")} className={accion}>
            <BarChart2 size={16} /><Tip>Análisis comercial</Tip>
          </button>
          {prospectos.length > 0 && (
            <button onClick={exportarExcel} className={accion}>
              <FileDown size={16} /><Tip>Exportar Excel</Tip>
            </button>
          )}
          <button onClick={() => setMostrarNuevo(true)} className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-[13px]">
            <Plus size={15} /> Nuevo
          </button>
        </div>
      </div>

      {/* KPIs resumen */}
      {resumen && (
        <KpisProspectos resumen={resumen} filtroActivo={estadoFiltro} onFiltro={(key) => handleEstado(key)} />
      )}

      {/* Banner leads calientes — neon */}
      {calientes > 0 && (
        <div className="flex items-center gap-3.5 px-4 py-3 rounded-xl"
             style={{ background: "linear-gradient(90deg, rgba(248,113,113,0.12), rgba(251,146,60,0.06) 70%)", border: "1px solid rgba(248,113,113,0.25)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(248,113,113,0.14)", border: "1px solid rgba(248,113,113,0.3)" }}>
            <Flame size={16} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-red-300">{calientes} leads calientes listos para cierre</p>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">Están en la parte superior de la lista — prioriza el contacto hoy</p>
          </div>
          <span className="text-[10px] font-bold text-red-400/80 shrink-0 uppercase tracking-wider">Score 75+</span>
        </div>
      )}

      {/* Filtros */}
      <FiltrosProspectos busqueda={busqueda} estadoFiltro={estadoFiltro} onBusqueda={handleBusqueda} onEstado={handleEstado} />

      {/* Error importación — neon */}
      {errorImport && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs text-red-300"
             style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.3)" }}>
          <AlertTriangle size={15} /> {errorImport}
        </div>
      )}

      {/* Preview importación */}
      <PreviewImportacion preview={preview} importando={importando} onCancelar={() => setPreview([])} onConfirmar={confirmarImportacion} />

      {/* Tabla */}
      <TablaProspectos
        prospectos={prospectosOrdenados} total={total} cargando={cargando} pagina={pagina} limite={LIMITE}
        onVerDetalle={setProspectoSeleccionado} onEditar={setProspectoEditar} onEliminar={eliminar}
        onPaginaAnterior={() => setPagina((p) => Math.max(1, p - 1))}
        onPaginaSiguiente={() => setPagina((p) => p + 1)}
        seleccionados={seleccionados} onToggleSeleccion={toggleSeleccion} onToggleTodos={toggleTodos}
        todosSeleccionados={seleccionados.length === prospectos.length && prospectos.length > 0}
        scores={scores}
      />
    </div>
  );
}

/** Tooltip neon reutilizable para los botones-ícono del header. */
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] bg-[#0a101f] text-zinc-200 px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
          style={{ border: "1px solid rgb(var(--accent) / 0.3)" }}>
      {children}
    </span>
  );
}
