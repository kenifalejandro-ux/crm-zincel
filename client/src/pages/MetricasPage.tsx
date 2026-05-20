/** src/pages/MetricasPage.tsx */

import { useEffect, useState, useMemo } from "react";
import { Plus, Upload, Zap, FileDown }  from "lucide-react";

import { useMetricas }            from "../hooks/useMetricas";
import { useEditar }              from "../hooks/useEditar";
import { FiltrosMetricas }        from "../components/metricas/FiltrosMetricas";
import { KpisMetricas }           from "../components/metricas/KpisMetricas";
import { TablaMetricas }          from "../components/metricas/detalle/TablaMetricas";
import { TabsPlataforma }         from "../components/metricas/TabsPlataforma";
import { ResumenPlataforma }      from "../components/metricas/ResumenPlataforma";
import { MetricasLineChart }      from "../components/metricas/MetricasLineChart";
import { MetricasBarChart }       from "../components/metricas/MetricasBarChart";
import { ModalRegistroMetrica }   from "../components/metricas/ModalRegistroMetrica";
import { ModalEditarMetrica }     from "../components/metricas/ModalEditarMetrica";
import { ImportarCSVMetrica }     from "../components/metricas/ImportarCSVMetrica";
import { ModalImportarAPI }      from "../components/metricas/ModalImportarAPI";

import { TableBulkActions }       from "../components/ui/TableBulkActions";

import { deleteMetricasMasivo, updateMetrica } from "../services/metricas.api";
import { exportarReportePDF }                  from "../utils/exportarPDF";

import {
  FiltrosMetrica,
  FormMetrica,
  Metrica,
  Plataforma,
} from "../types/metricas.types";

// ─── Constantes ────────────────────────────────────────────────────────────────
const hoy = () => new Date().toISOString().split("T")[0];

const FORM_INICIAL: FormMetrica = {
  empresa:            "",
  campana_nombre:     "",
  plataforma:         "meta",
  sub_plataforma:     "",
  periodo_inicio:     hoy(),
  periodo_fin:        hoy(),

  // Alcance
  impresiones:        "0",
  alcance:            "0",
  clics:              "0",
  ctr:                "0",

  // Costo
  gasto:              "0",
  cpc:                "0",
  cpm:                "0",
  cpa:                "0",

  // Ingresos
  ingresos:           "0",
  costo_total:        "0",

  // Resultados
  conversiones:       "0",
  leads:              "0",
  mensajes:           "0",
  roas:               "0",
  roi:                "0",
  costo_por_lead:     "0",

  // Comunidad
  seguidores_ganados: "0",
  perfil_visitas:     "0",
  frecuencia:         "0",

  // Engagement
  interacciones:      "0",
  me_gusta:           "0",
  comentarios:        "0",
  compartidos:        "0",
  guardados:          "0",
  tasa_engagement:    "0",
  costo_por_mensaje:  "0",

  // Video
  reproducciones:     "0",
  tasa_reproduccion:  "0",

  notas:              "",
};

type TabPlataforma = Plataforma | "todas";

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MetricasPage() {
  const {
    metricas, resumen,
    cargarMetricas, cargarResumen,
    agregarMetrica, borrarMetrica,
  } = useMetricas();

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [filtros,        setFiltros]        = useState<FiltrosMetrica>({});
  const [tabPlataforma,  setTabPlataforma]  = useState<TabPlataforma>("todas");
  const [modal,          setModal]          = useState(false);
  const [modalCSV,       setModalCSV]       = useState(false);
  const [modalAPI,       setModalAPI]       = useState(false);
  const [form,           setForm]           = useState<FormMetrica>(FORM_INICIAL);
  const [guardando,      setGuardando]      = useState(false);
  const [seleccionados,  setSeleccionados]  = useState<string[]>([]);

  // ── Edición ──────────────────────────────────────────────────────────────────
  const editar = useEditar<Metrica>();

  const handleGuardarEdicion = async (form: any) => {
    await editar.guardar(async () => {
      await updateMetrica(editar.editando!.id, form);
      cargarMetricas(filtros);
      if (filtros.empresa) cargarResumen(filtros.empresa);
    });
  };

  // ── Carga inicial y al cambiar filtros ──────────────────────────────────────
  useEffect(() => {
    cargarMetricas(filtros);
  }, [filtros]);

  // ── Cargar resumen cuando cambia empresa ────────────────────────────────────
  useEffect(() => {
    if (filtros.empresa) cargarResumen(filtros.empresa);
  }, [filtros.empresa]);

  // ── Limpiar selección al cambiar tab de plataforma ──────────────────────────
  useEffect(() => {
    setSeleccionados([]);
  }, [tabPlataforma]);

  // ── Empresas únicas para el selector ────────────────────────────────────────
  const empresas = useMemo(
    () => [...new Set(metricas.map((m) => m.empresa))],
    [metricas]
  );

  // ── Métricas filtradas por tab de plataforma ─────────────────────────────────
  const metricasFiltradas = useMemo(
    () =>
      tabPlataforma === "todas"
        ? metricas
        : metricas.filter((m) => m.plataforma === tabPlataforma),
    [metricas, tabPlataforma]
  );

  // ── Selección masiva ─────────────────────────────────────────────────────────
  const toggleUno = (id: string) =>
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const toggleTodos = () =>
    setSeleccionados(
      seleccionados.length === metricasFiltradas.length
        ? []
        : metricasFiltradas.map((m) => m.id)
    );

  const todosSeleccionados =
    seleccionados.length === metricasFiltradas.length && metricasFiltradas.length > 0;

  // ── Eliminar masivo ──────────────────────────────────────────────────────────
  const eliminarSeleccionados = async () => {
    if (!confirm(`¿Eliminar ${seleccionados.length} métrica(s)?`)) return;
    await deleteMetricasMasivo(seleccionados);
    setSeleccionados([]);
    cargarMetricas(filtros);
  };

  // ── Guardar registro manual ──────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!form.empresa || !form.campana_nombre) return;
    setGuardando(true);
    try {
      await agregarMetrica(form);
      setModal(false);
      setForm(FORM_INICIAL);
      cargarMetricas(filtros);
      if (filtros.empresa) cargarResumen(filtros.empresa);
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  // ── Callback tras importar CSV ───────────────────────────────────────────────
  const handleImportado = () => {
    cargarMetricas(filtros);
    if (filtros.empresa) cargarResumen(filtros.empresa);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">Métricas de campañas</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Meta Ads · Google Ads · TikTok Ads
          </p>
        </div>

        <div className="flex gap-2">
          {/* Bulk delete */}
          <TableBulkActions
            count={seleccionados.length}
            onDelete={eliminarSeleccionados}
          />

          {/* Exportar PDF */}
          {metricasFiltradas.length > 0 && (
            <button
              onClick={() => {
                const paraExportar = seleccionados.length > 0
                  ? metricasFiltradas.filter(m => seleccionados.includes(m.id))
                  : metricasFiltradas;
                exportarReportePDF(paraExportar, filtros.empresa ?? "");
              }}
              className="flex items-center gap-1.5 px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
              title={seleccionados.length > 0 ? `Exportar ${seleccionados.length} campaña(s) seleccionada(s)` : "Exportar todas las campañas"}
            >
              <FileDown size={12} />
              {seleccionados.length > 0 ? `Exportar (${seleccionados.length})` : "Exportar PDF"}
            </button>
          )}

          {/* Importar desde API */}
          <button
            onClick={() => setModalAPI(true)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
          >
            <Zap size={12} />
            Importar desde API
          </button>

          {/* Importar CSV */}
          <button
            onClick={() => setModalCSV(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition"
          >
            <Upload size={12} />
            Importar CSV
          </button>

          {/* Registro manual */}
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus size={12} />
            Registrar métricas
          </button>
        </div>
      </div>

      {/* ── Filtros empresa + plataforma ── */}
      <FiltrosMetricas
        filtros={filtros}
        empresas={empresas}
        onChange={setFiltros}
      />

      {/* ── KPIs globales ── */}
      {metricasFiltradas.length > 0 && (
        <KpisMetricas metricas={metricasFiltradas} />
      )}

      {/* ── Tabs Meta | Google | TikTok | Todas ── */}
      <TabsPlataforma
        activa={tabPlataforma}
        onChange={setTabPlataforma}
      />

      {/* ── Resumen por plataforma (solo si hay empresa seleccionada) ── */}
      {filtros.empresa && resumen.length > 0 && (
        <ResumenPlataforma resumen={resumen} />
      )}

      {/* ── Charts ── */}
      {metricasFiltradas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MetricasLineChart metricas={metricasFiltradas} />
          <MetricasBarChart  metricas={metricasFiltradas} />
        </div>
      )}

      {/* ── Tabla ── */}
      <TablaMetricas
        metricas={metricasFiltradas}
        seleccionados={seleccionados}
        todosSeleccionados={todosSeleccionados}
        onToggleUno={toggleUno}
        onToggleTodos={toggleTodos}
        onEditar={editar.abrir}
        onBorrar={borrarMetrica}
      />

      {/* ── Modal registro manual ── */}
      {modal && (
        <ModalRegistroMetrica
          form={form}
          cargando={guardando}
          onFormChange={setForm}
          onGuardar={handleGuardar}
          onCerrar={() => { setModal(false); setForm(FORM_INICIAL); }}
        />
      )}

      {/* ── Modal editar métrica ── */}
      {editar.editando && (
        <ModalEditarMetrica
          metrica={editar.editando}
          guardando={editar.guardando}
          error={editar.error}
          onGuardar={handleGuardarEdicion}
          onCerrar={editar.cerrar}
        />
      )}

      {/* ── Modal importar desde API ── */}
      {modalAPI && (
        <ModalImportarAPI
          onCerrar={() => setModalAPI(false)}
          onSincronizado={() => {
            setModalAPI(false);
            cargarMetricas(filtros);
            if (filtros.empresa) cargarResumen(filtros.empresa);
          }}
        />
      )}

      {/* ── Modal importar CSV ── */}
      {modalCSV && (
        <ImportarCSVMetrica
          onImportado={handleImportado}
          onCerrar={() => setModalCSV(false)}
        />
      )}

    </div>
  );
}