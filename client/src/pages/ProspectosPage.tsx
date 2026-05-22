/** client/src/pages/ProspectosPage.tsx */

import { useEffect, useMemo, useState } from "react";
import { useProspectos } from "../hooks/useProspectos";
import { Plus, Upload, AlertTriangle, FileDown } from "lucide-react";
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

// ✅ Importar componentes reutilizables
import { TableBulkActions } from "../components/ui/TableBulkActions";



const LIMITE = 50;

export default function ProspectosPage() {
  const { prospectos, total, cargando, cargar, eliminar } = useProspectos();

  const [busqueda, setBusqueda]         = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [pagina, setPagina]             = useState(1);

  const [preview, setPreview]           = useState<any[]>([]);
  const [importando, setImportando]     = useState(false);
  const [errorImport, setErrorImport]   = useState<string | null>(null);

  const [prospectoSeleccionado, setProspectoSeleccionado] = useState<any | null>(null);
  const [prospectoEditar, setProspectoEditar]             = useState<any | null>(null);
  const [mostrarNuevo, setMostrarNuevo]                   = useState(false);

  // ✅ Estado selección masiva
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  // Scores — carga independiente, no bloquea la tabla
  const [scores, setScores] = useState<Record<string, ScoreLead>>({});

  const [resumen, setResumen] = useState<ResumenProspectos | null>(null);

  // ── Cargar al cambiar filtros ───────────────────────────
  useEffect(() => {
    cargar({ busqueda, estado_lead: estadoFiltro, pagina, limite: LIMITE });
    getScoresLeads()
      .then(s => setScores(Object.fromEntries(s.map(sc => [sc.id, sc]))))
      .catch(console.error);
    getResumenProspectos()
      .then(setResumen)
      .catch(console.error);
  }, [busqueda, estadoFiltro, pagina]);

  // Leads calientes primero
  const prospectosOrdenados = useMemo(() => {
    if (Object.keys(scores).length === 0) return prospectos;
    return [...prospectos].sort((a, b) => (scores[b.id]?.score ?? 0) - (scores[a.id]?.score ?? 0));
  }, [prospectos, scores]);

  // ── Handlers de filtros ─────────────────────────────────
  const handleBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPagina(1);
  };

  const handleEstado = (valor: string) => {
    setEstadoFiltro(valor);
    setPagina(1);
  };

  // ✅ Toggle individual
const toggleSeleccion = (id: string) => {   // ← string, no number
  setSeleccionados((prev) =>
    prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
  );
};

  // ✅ Toggle todos
const toggleTodos = () => {
  if (seleccionados.length === prospectos.length) {
    setSeleccionados([]);
  } else {
    setSeleccionados(prospectos.map((p) => p.id as string)); // ← cast por si acaso
  }
};

  // ✅ Eliminar masivo
const eliminarSeleccionados = async () => {
  if (!confirm(`¿Eliminar ${seleccionados.length} prospectos?`)) return;
  await Promise.all(seleccionados.map((id) => eliminar(id)));
  setSeleccionados([]);
  cargar({ busqueda, estado_lead: estadoFiltro, pagina, limite: LIMITE });
};

  // ── Exportar Excel ──────────────────────────────────────
  const exportarExcel = () => {
    const rows = prospectos.map((p) => ({
      "Empresa":         p.empresa,
      "Rubro":           p.rubro              ?? "",
      "Contacto":        p.nombre_contacto    ?? "",
      "Cargo":           p.cargo              ?? "",
      "Teléfono":        p.telefono           ?? "",
      "Email":           p.email_contacto     ?? "",
      "Ciudad":          p.ciudad             ?? "",
      "País":            p.pais,
      "Estado lead":     p.estado_lead,
      "Clasificación":   p.clasificacion,
      "Estado venta":    p.estado_venta,
      "Prioridad":       p.prioridad,
      "Fuente":          p.fuente             ?? "",
      "Página web":      p.pagina_web         ?? "",
      "Notas":           p.notas              ?? "",
      "Creado":          new Date(p.creado_en).toLocaleDateString("es-PE"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prospectos");
    XLSX.writeFile(wb, `prospectos_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── Leer Excel ──────────────────────────────────────────
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

  // ── Confirmar importación ───────────────────────────────
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

  return (
    <div className="space-y-5">

      {/* Modal detalle */}
      {prospectoSeleccionado && (
        <ProspectoDetalle
          prospecto={prospectoSeleccionado}
          onCerrar={() => setProspectoSeleccionado(null)}
          onEditar={() => {
            setProspectoEditar(prospectoSeleccionado);
            setProspectoSeleccionado(null);
          }}
        />
      )}

      {/* Modal editar */}
      {prospectoEditar && (
        <ProspectoForm
          prospecto={prospectoEditar}
          onCerrar={() => setProspectoEditar(null)}
          onGuardado={() => {
            setProspectoEditar(null);
            cargar({ busqueda, estado_lead: estadoFiltro, pagina, limite: LIMITE });
          }}
        />
      )}

      {/* Modal nuevo */}
      {mostrarNuevo && (
        <ProspectoForm
          onCerrar={() => setMostrarNuevo(false)}
          onGuardado={() => {
            setMostrarNuevo(false);
            cargar({ busqueda, estado_lead: estadoFiltro, pagina, limite: LIMITE });
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">Prospectos</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{total} registros en total</p>
        </div>
        <div className="flex gap-2">

          {/* ✅ Aparece solo cuando hay seleccionados */}
          <TableBulkActions
            count={seleccionados.length}
            onDelete={eliminarSeleccionados}
          />

          <label className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-zinc-800 hover:bg-zinc-900 text-white transition cursor-pointer">
            <Upload size={15} /> Importar Excel
            <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
          </label>
          {prospectos.length > 0 && (
            <button
              onClick={exportarExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
            >
              <FileDown size={15} /> Exportar Excel
            </button>
          )}
          <button
            onClick={() => setMostrarNuevo(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-brand hover:bg-brand-hover text-white rounded-lg transition"
          >
            <Plus size={15} /> Nuevo
          </button>
        </div>
      </div>

      {/* KPIs resumen */}
      {resumen && (
        <KpisProspectos
          resumen={resumen}
          filtroActivo={estadoFiltro}
          onFiltro={(key) => { handleEstado(key); }}
        />
      )}

      {/* Alerta leads calientes */}
      {Object.values(scores).filter(s => s.nivel === "caliente").length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200 rounded-xl">
          <span className="text-lg">🔥</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-orange-700">
              {Object.values(scores).filter(s => s.nivel === "caliente").length} leads calientes listos para cierre
            </p>
            <p className="text-[11px] text-orange-500 mt-0.5">
              Están en la parte superior de la lista — prioriza el contacto hoy
            </p>
          </div>
          <span className="text-[10px] font-medium text-orange-400 shrink-0">Score 75+</span>
        </div>
      )}

      {/* Filtros */}
      <FiltrosProspectos
        busqueda={busqueda}
        estadoFiltro={estadoFiltro}
        onBusqueda={handleBusqueda}
        onEstado={handleEstado}
      />

      {/* Error importación */}
      {errorImport && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle size={15} />
          {errorImport}
        </div>
      )}

      {/* Preview importación */}
      <PreviewImportacion
        preview={preview}
        importando={importando}
        onCancelar={() => setPreview([])}
        onConfirmar={confirmarImportacion}
      />

      {/* Tabla de prospectos */}
      <TablaProspectos
        prospectos={prospectosOrdenados}
        total={total}
        cargando={cargando}
        pagina={pagina}
        limite={LIMITE}
        onVerDetalle={setProspectoSeleccionado}
        onEditar={setProspectoEditar}
        onEliminar={eliminar}
        onPaginaAnterior={() => setPagina((p) => Math.max(1, p - 1))}
        onPaginaSiguiente={() => setPagina((p) => p + 1)}
        seleccionados={seleccionados}
        onToggleSeleccion={toggleSeleccion}
        onToggleTodos={toggleTodos}
        todosSeleccionados={seleccionados.length === prospectos.length && prospectos.length > 0}
        scores={scores}
      />

    </div>
  );
}