/** src/pages/MetricasPage.tsx */

import { useEffect, useState, useMemo, Component, ReactNode } from "react";

class ComparativaErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 space-y-2">
          <p className="font-bold">Error en Comparativa:</p>
          <pre className="text-xs whitespace-pre-wrap">{(this.state.error as Error).message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
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
import { ProyeccionTab }          from "../components/metricas/ProyeccionTab";
import { ComparativaTab }         from "../components/metricas/ComparativaTab";
import { RentabilidadTab }        from "../components/metricas/RentabilidadTab";
import { BenchmarksTab }          from "../components/metricas/BenchmarksTab";
import { AlertasMetricas }        from "../components/metricas/AlertasMetricas";
import { BudgetOptimizerTab }     from "../components/metricas/BudgetOptimizerTab";
import { FormatosTab }            from "../components/metricas/FormatosTab";

import { TableBulkActions }       from "../components/ui/TableBulkActions";

import { deleteMetricasMasivo, updateMetrica, getProyectos, asignarProyectoBulk } from "../services/metricas.api";
import { exportarReportePDF }                  from "../utils/exportarPDF";
import { fechaHoy }                            from "../utils/date";

import {
  FiltrosMetrica,
  FormMetrica,
  Metrica,
  Plataforma,
} from "../types/metricas.types";

type TabPlataforma = Plataforma | "todas" | "proyeccion" | "comparativa" | "rentabilidad" | "benchmarks" | "optimizador" | "formatos";

// ─── Constantes ────────────────────────────────────────────────────────────────
const hoy = () => fechaHoy();

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
  objetivo:           "venta",
  proyecto:           "",
};

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
  const [soloVentas,     setSoloVentas]     = useState(false);
  const [proyectos,      setProyectos]      = useState<string[]>([]);
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

  // ── Cargar resumen y proyectos cuando cambia empresa ────────────────────────
  useEffect(() => {
    if (filtros.empresa) {
      cargarResumen(filtros.empresa);
      getProyectos(filtros.empresa).then(setProyectos).catch(() => {});
    } else {
      getProyectos().then(setProyectos).catch(() => {});
    }
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
  const tabsCompletas = new Set(["todas", "comparativa", "proyeccion", "rentabilidad", "benchmarks", "optimizador", "formatos"]);
  const metricasFiltradas = useMemo(() => {
    let base = tabsCompletas.has(tabPlataforma)
      ? metricas
      : metricas.filter((m) => m.plataforma === tabPlataforma);
    if (soloVentas) base = base.filter((m) => !m.objetivo || m.objetivo === "venta");
    return base;
  }, [metricas, tabPlataforma, soloVentas]);

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

  const asignarProyecto = async (proyecto: string) => {
    await asignarProyectoBulk(seleccionados, proyecto);
    setSeleccionados([]);
    cargarMetricas(filtros);
    getProyectos(filtros.empresa).then(setProyectos).catch(() => {});
  };

  const recargarProyectos = () => {
    cargarMetricas(filtros);
    getProyectos(filtros.empresa).then(setProyectos).catch(() => {});
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
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Métricas de campañas</h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            Meta Ads · Google Ads · TikTok Ads
          </p>
        </div>

        <div className="flex gap-2">
          {/* Bulk delete */}
          <TableBulkActions
            count={seleccionados.length}
            proyectos={proyectos}
            onDelete={eliminarSeleccionados}
            onAsignarProyecto={asignarProyecto}
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
              className="relative group p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition"
            >
              <FileDown size={17} />
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] bg-zinc-900 text-white px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                {seleccionados.length > 0 ? `Exportar (${seleccionados.length})` : "Exportar PDF"}
              </span>
            </button>
          )}

          {/* Importar desde API */}
          <button
            onClick={() => setModalAPI(true)}
            className="relative group p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition"
          >
            <Zap size={17} />
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] bg-zinc-900 text-white px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
              Importar desde API
            </span>
          </button>

          {/* Importar CSV */}
          <button
            onClick={() => setModalCSV(true)}
            className="relative group p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
          >
            <Upload size={17} />
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] bg-zinc-900 text-white px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
              Importar CSV
            </span>
          </button>

          {/* Registro manual */}
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-brand hover:bg-brand-hover text-white rounded-lg transition"
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
        proyectos={proyectos}
        onChange={setFiltros}
      />

      {/* ── Alertas inteligentes (Brecha 3) ── */}
      <AlertasMetricas empresa={filtros.empresa} />

      {/* ── Filtro de objetivo ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSoloVentas((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            soloVentas
              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
              : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${soloVentas ? "bg-emerald-500" : "bg-zinc-300"}`} />
          Solo campañas de venta
        </button>
        {soloVentas && (
          <span className="text-[10px] text-zinc-400">
            Excluye campañas de branding y comunidad del KPI total
          </span>
        )}
      </div>

      {/* ── KPIs globales ── */}
      {metricasFiltradas.length > 0 && (
        <KpisMetricas metricas={metricasFiltradas} />
      )}

      {/* ── Tabs Meta | Google | TikTok | Todas | Proyección ── */}
      <TabsPlataforma
        activa={tabPlataforma}
        onChange={setTabPlataforma}
      />

      {/* ── Tabs analíticos ── */}
      {tabPlataforma === "proyeccion" ? (
        <ProyeccionTab metricas={metricas} empresa={filtros.empresa} />
      ) : tabPlataforma === "comparativa" ? (
        <ComparativaErrorBoundary>
          <ComparativaTab metricas={metricasFiltradas} empresa={filtros.empresa} />
        </ComparativaErrorBoundary>
      ) : tabPlataforma === "rentabilidad" ? (
        <RentabilidadTab metricas={metricas} empresa={filtros.empresa} />
      ) : tabPlataforma === "optimizador" ? (
        <BudgetOptimizerTab empresa={filtros.empresa} />
      ) : tabPlataforma === "benchmarks" ? (
        <BenchmarksTab />
      ) : tabPlataforma === "formatos" ? (
        <FormatosTab empresa={filtros.empresa} />
      ) : (
        <>
          {/* ── Resumen por plataforma (solo si hay empresa seleccionada) ── */}
          {filtros.empresa && resumen.length > 0 && (() => {
            const resumenFiltrado = tabsCompletas.has(tabPlataforma)
              ? resumen
              : resumen.filter((r) => r.plataforma === tabPlataforma);
            return resumenFiltrado.length > 0
              ? <ResumenPlataforma resumen={resumenFiltrado} />
              : null;
          })()}

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
            proyectos={proyectos}
            onToggleUno={toggleUno}
            onToggleTodos={toggleTodos}
            onEditar={editar.abrir}
            onBorrar={borrarMetrica}
            onProyectoGuardado={recargarProyectos}
          />
        </>
      )}

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