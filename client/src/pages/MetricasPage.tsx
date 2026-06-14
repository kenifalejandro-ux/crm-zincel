/** src/pages/MetricasPage.tsx */

import { useEffect, useState, useMemo, Component, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

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
import { TabsPlataforma }         from "../components/metricas/TabsPlataforma";
import { FiltrosMetricas }        from "../components/metricas/FiltrosMetricas";
import { KpisMetricas }           from "../components/metricas/KpisMetricas";
import { TablaMetricas }          from "../components/metricas/detalle/TablaMetricas";
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
import { CostoLeadTab }           from "../components/metricas/CostoLeadTab";
import { BenchmarksTab }          from "../components/metricas/BenchmarksTab";
import { AlertasMetricas }        from "../components/metricas/AlertasMetricas";
import { BudgetOptimizerTab }     from "../components/metricas/BudgetOptimizerTab";
import { FormatosTab }            from "../components/metricas/FormatosTab";
import { CicloVentaTab }          from "../components/metricas/CicloVentaTab";
import { OrganicoTab }            from "../components/metricas/OrganicoTab";
import { CompetidoresTab }        from "../components/metricas/CompetidoresTab";
import { TikTokAdsTab }           from "../components/metricas/TikTokAdsTab";

import { TableBulkActions }       from "../components/ui/TableBulkActions";

import { deleteMetricasMasivo, updateMetrica, getProyectos, asignarProyectosBulk } from "../services/metricas.api";
import { exportarReportePDF }                  from "../utils/exportarPDF";
import { fechaHoy }                            from "../utils/date";

import {
  FiltrosMetrica,
  FormMetrica,
  Metrica,
  Plataforma,
} from "../types/metricas.types";

type TabPlataforma = Plataforma | "todas" | "cpl" | "roi" | "proyeccion" | "comparativa" | "rentabilidad" | "benchmarks" | "optimizador" | "formatos" | "ciclo" | "organico" | "competidores";

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
  proyectos:          [],
};

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MetricasPage() {
  const {
    metricas, resumen,
    cargarMetricas, cargarResumen,
    agregarMetrica, borrarMetrica,
  } = useMetricas();

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [searchParams,   setSearchParams]   = useSearchParams();
  const tabPlataforma = (searchParams.get("tab") as TabPlataforma) || "todas";
  const setTabPlataforma = (tab: TabPlataforma) =>
    setSearchParams(prev => { prev.set("tab", tab); return prev; }, { replace: true });

  // empresa viene del sidebar via URL param
  const empresaUrl = searchParams.get("empresa") || undefined;
  const [filtros, setFiltros] = useState<FiltrosMetrica>({ empresa: empresaUrl });

  // sincronizar filtros.empresa cuando cambia en la URL (desde el sidebar)
  useEffect(() => {
    setFiltros(f => ({ ...f, empresa: empresaUrl || undefined }));
  }, [empresaUrl]);
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

  // ── Detectar callback OAuth (Meta/TikTok) y abrir tab Orgánico ──────────────
  useEffect(() => {
    if (searchParams.get("meta_conectado") === "1" || searchParams.get("tiktok_conectado") === "1") {
      setSearchParams(prev => { prev.set("tab", "organico"); return prev; }, { replace: true });
    }
  }, []);

  // ── Sincronizar tab de plataforma con filtros (para que el server también filtre) ──
  const PLATS_DIRECTAS = new Set(["meta", "google", "tiktok"]);
  useEffect(() => {
    setFiltros(f => ({
      ...f,
      plataforma: PLATS_DIRECTAS.has(tabPlataforma) ? tabPlataforma as any : undefined,
    }));
    setSeleccionados([]);
  }, [tabPlataforma]);

  // ── Empresas únicas para el selector ────────────────────────────────────────
  const empresas = useMemo(
    () => [...new Set(metricas.map((m) => m.empresa))],
    [metricas]
  );

  // ── Métricas filtradas por tab de plataforma ─────────────────────────────────
  const tabsCompletas = new Set(["todas", "comparativa", "proyeccion", "rentabilidad", "cpl", "roi", "benchmarks", "optimizador", "formatos", "ciclo", "organico", "competidores"]);
  const metricasFiltradas = useMemo(() => {
    let base = tabsCompletas.has(tabPlataforma)
      ? metricas
      : metricas.filter((m) => m.plataforma === tabPlataforma);
    if (soloVentas) base = base.filter((m) => !m.objetivo || m.objetivo === "venta");
    return base;
  }, [metricas, tabPlataforma, soloVentas]);

  // ── Resumen calculado desde metricasFiltradas (respeta filtro de proyecto) ───
  const resumenCalculado = useMemo(() => {
    const porPlataforma: Record<string, typeof resumen[0]> = {};
    for (const m of metricasFiltradas) {
      const key = m.plataforma;
      if (!porPlataforma[key]) {
        porPlataforma[key] = {
          plataforma: m.plataforma, sub_plataforma: null,
          campanas: 0, total_gasto: 0, total_leads: 0,
          total_conversiones: 0, total_seguidores: 0, total_reproducciones: 0,
          roas_promedio: 0, cpa_promedio: 0, engagement_promedio: 0,
        };
      }
      const r = porPlataforma[key];
      r.campanas         += 1;
      r.total_gasto      += Number(m.gasto);
      r.total_leads      += Number(m.leads);
      r.total_conversiones += Number(m.conversiones);
      r.roas_promedio    += Number(m.roas);
    }
    return Object.values(porPlataforma).map(r => ({
      ...r,
      roas_promedio: r.campanas > 0 ? Math.round((r.roas_promedio / r.campanas) * 100) / 100 : 0,
    }));
  }, [metricasFiltradas]);

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

  const asignarProyecto = async (proyectos: string[]) => {
    await asignarProyectosBulk(seleccionados, proyectos);
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

  // ── Pestañas de ads/detalle: solo estas muestran el resumen grande de campañas ──
  const esTabAds = new Set(["todas", "meta", "google", "tiktok"]).has(tabPlataforma);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Marketing</p>
          <h1 className="font-display text-[28px] font-bold text-zinc-50 tracking-tight leading-tight mt-1">Métricas de campañas</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Meta Ads · Google Ads · TikTok Ads</p>
        </div>

        {/* Header (zona derecha, solo visible en tabs de Ads) — NEON style */}
        {esTabAds && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalAPI(true)}
              className="relative group p-2.5 rounded-xl text-white transition"
              style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 0 14px rgba(168,85,247,0.45)" }}
              title="Importar desde API"
            >
              <Zap size={16} />
            </button>
            <button onClick={() => setModalCSV(true)} className="btn-ghost p-2.5 text-zinc-300" title="Importar CSV">
              <Upload size={16} />
            </button>
            <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-[13px]">
              <Plus size={15} /> Registrar
            </button>
          </div>
        )}
      </div>

      {/* ── Navegación de 2 niveles (grupos + sub-tabs) — NEON style ── */}
      <TabsPlataforma activa={tabPlataforma} onChange={setTabPlataforma} />

      {/* ── Filtros empresa + plataforma ── */}
      <FiltrosMetricas
        filtros={filtros}
        empresas={empresas}
        onChange={setFiltros}
      />

      {/* ── Resumen grande de campañas (alertas + filtro + KPIs) — SOLO en pestañas de ads/detalle ── */}
      {esTabAds && (
        <>
          {/* ── Alertas inteligentes ── */}
          <AlertasMetricas empresa={filtros.empresa} />

          {/* ── Filtro de objetivo ── */}
          <button
            onClick={() => setSoloVentas((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              soloVentas
                ? "bg-emerald-500/12 border-emerald-500/30 text-emerald-300"
                : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${soloVentas ? "bg-emerald-400" : "bg-zinc-600"}`} />
            Solo campañas de venta
          </button>

          {/* ── KPIs globales ── */}
          {metricasFiltradas.length > 0 && (
            <KpisMetricas metricas={metricasFiltradas} />
          )}
        </>
      )}


      {/* ── Tabs analíticos ── */}
      {tabPlataforma === "proyeccion" ? (
        <ProyeccionTab metricas={metricas} empresa={filtros.empresa} />
      ) : tabPlataforma === "comparativa" ? (
        <ComparativaErrorBoundary>
          <ComparativaTab metricas={metricasFiltradas} empresa={filtros.empresa} />
        </ComparativaErrorBoundary>
      ) : tabPlataforma === "rentabilidad" ? (
        <RentabilidadTab metricas={metricas} empresa={filtros.empresa} view="roas" />
      ) : tabPlataforma === "roi" ? (
        <RentabilidadTab metricas={metricas} empresa={filtros.empresa} view="roi" />
      ) : tabPlataforma === "cpl" ? (
        <CostoLeadTab metricas={metricas} empresa={filtros.empresa} />
      ) : tabPlataforma === "optimizador" ? (
        <BudgetOptimizerTab empresa={filtros.empresa} />
      ) : tabPlataforma === "benchmarks" ? (
        <BenchmarksTab />
      ) : tabPlataforma === "formatos" ? (
        <FormatosTab empresa={filtros.empresa} />
      ) : tabPlataforma === "ciclo" ? (
        <CicloVentaTab empresa={filtros.empresa} />
      ) : tabPlataforma === "tiktok" ? (
        <TikTokAdsTab
          metricas={metricasFiltradas}
          empresa={filtros.empresa}
          onSync={() => { cargarMetricas(filtros); if (filtros.empresa) cargarResumen(filtros.empresa); }}
        />
      ) : tabPlataforma === "organico" ? (
        <OrganicoTab empresa={filtros.empresa} />
      ) : tabPlataforma === "competidores" ? (
        <CompetidoresTab empresa={filtros.empresa} />
      ) : (
        <>
          {/* ── Resumen por plataforma (solo si hay empresa seleccionada) ── */}
          {filtros.empresa && resumenCalculado.length > 0 && (() => {
            const resumenFiltrado = tabsCompletas.has(tabPlataforma)
              ? resumenCalculado
              : resumenCalculado.filter((r) => r.plataforma === tabPlataforma);
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