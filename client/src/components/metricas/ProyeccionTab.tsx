/** client/src/components/metricas/ProyeccionTab.tsx */

import { GLASS_BASE, BADGE_BASE, INPUT_BASE, PANEL_BASE } from "../../lib/tokens";
import { useEffect, useState } from "react";
import { TrendingUp, AlertTriangle, Save, ChevronDown, FlaskConical, Sparkles, ArrowDown, Target, CheckCircle2, Lightbulb } from "lucide-react";
import { Metrica } from "../../types/metricas.types";
import { getProyeccionConfig, saveProyeccionConfig, ProyeccionConfig } from "../../services/metaProyeccion.api";
import { getLeadsPorCampana, LeadsPorCampana } from "../../services/prospectos.api";
import { ModalPrediccion } from "./ModalPrediccion";

// Benchmark sector inmobiliario LatAm — WordStream/SuperAds 2025, ajustado -20% Tier 3
const CPL_BENCHMARK = 80;

const FASES = [
  { value: "aprendizaje", label: "Aprendizaje", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "calibracion", label: "Calibración",  color: "bg-blue-100  text-blue-700  border-blue-200"  },
  { value: "escalado",    label: "Escalado",     color: "bg-green-100 text-green-700 border-green-200" },
] as const;

interface Props {
  metricas: Metrica[];
  empresa:  string | undefined;
}

export function ProyeccionTab({ metricas, empresa }: Props) {

  const [config,          setConfig]          = useState<ProyeccionConfig | null>(null);
  const [editando,        setEditando]        = useState(false);
  const [guardando,       setGuardando]       = useState(false);
  const [form,            setForm]            = useState({ fase_campana: "aprendizaje" as ProyeccionConfig["fase_campana"], vendedor_email: "", vendedor_whatsapp: "" });
  const [cplSimulado,     setCplSimulado]     = useState("45");
  const [leadsCampana,    setLeadsCampana]    = useState<LeadsPorCampana[]>([]);
  const [prediccionOpen,  setPrediccionOpen]  = useState(false);
  const [presupuestoExtra,setPresupuestoExtra]= useState("100");
  const [tasaCierre,      setTasaCierre]      = useState(30);   // % histórico leads→ventas
  const [budgetRef,       setBudgetRef]       = useState(3000); // presupuesto mensual de referencia para proyecciones
  const [ventasIF,        setVentasIF]        = useState(0);    // ventas atribuidas a Instant Form
  const [ventasMensajes,  setVentasMensajes]  = useState(3);    // ventas atribuidas a campañas de mensajes

  useEffect(() => {
    getLeadsPorCampana("facebook").then(setLeadsCampana).catch(() => {});
  }, []);

  useEffect(() => {
    if (!empresa) return;
    getProyeccionConfig(empresa).then((cfg) => {
      if (cfg) {
        setConfig(cfg);
        setForm({
          fase_campana:      cfg.fase_campana,
          vendedor_email:    cfg.vendedor_email ?? "",
          vendedor_whatsapp: cfg.vendedor_whatsapp ?? "",
        });
      } else {
        setConfig({ empresa: empresa!, cpl_umbral: null, fase_campana: "aprendizaje", vendedor_email: null, vendedor_whatsapp: null });
      }
    });
  }, [empresa]);

  // ── Cálculos base — solo Meta Ads ───────────────────────────────────────────
  const metaMeta         = metricas.filter((m) => m.plataforma === "meta");
  const hayOtras         = metricas.some((m) => m.plataforma !== "meta");
  const totalGasto       = metaMeta.reduce((a, m) => a + Number(m.gasto       || 0), 0);
  const totalLeads       = metaMeta.reduce((a, m) => a + Number(m.leads       || 0), 0);
  const totalClics       = metaMeta.reduce((a, m) => a + Number(m.clics       || 0), 0);
  const totalImpresiones = metaMeta.reduce((a, m) => a + Number(m.impresiones || 0), 0);
  const totalAlcance     = metaMeta.reduce((a, m) => a + Number(m.alcance     || 0), 0);
  const totalMensajes    = metaMeta.reduce((a, m) => a + Number(m.mensajes    || 0), 0);
  const totalConversiones= metaMeta.reduce((a, m) => a + Number(m.conversiones|| 0), 0);
  const totalVentas      = metaMeta.reduce((a, m) => a + Number(m.ingresos    || 0), 0);
  const ctrPromedio      = totalImpresiones > 0 ? (totalClics / totalImpresiones * 100) : 0;
  const cpcPromedio      = totalClics > 0 ? totalGasto / totalClics : 0;
  const cpmPromedio      = totalImpresiones > 0 ? (totalGasto / totalImpresiones * 1000) : 0;

  const modoSimulacion = totalLeads === 0;
  const gastoConLeads  = metaMeta.filter((m) => Number(m.leads) > 0).reduce((a, m) => a + Number(m.gasto || 0), 0);
  const cplReal        = totalLeads > 0 ? gastoConLeads / totalLeads : 0;
  const cplEfectivo    = modoSimulacion ? (Number(cplSimulado) || 0) : cplReal;

  const diasTotales = (() => {
    if (!metaMeta.length) return 30;
    const fechas = metaMeta.flatMap((m) => [new Date(m.periodo_inicio), new Date(m.periodo_fin)]);
    const min = Math.min(...fechas.map((f) => f.getTime()));
    const max = Math.max(...fechas.map((f) => f.getTime()));
    return Math.max(1, Math.round((max - min) / 86400000));
  })();

  // ── Comparativa por tipo de campaña ─────────────────────────────────────────
  const campanasIF      = metaMeta.filter((m) => Number(m.leads) > 0);
  const campanasMensaje = metaMeta.filter((m) => Number(m.leads) === 0 && Number(m.mensajes) > 0);

  const gastoIF          = campanasIF.reduce((a, m) => a + Number(m.gasto || 0), 0);
  const leadsIF          = campanasIF.reduce((a, m) => a + Number(m.leads || 0), 0);
  const cplIF            = leadsIF > 0 ? gastoIF / leadsIF : 0;

  const gastoMsg         = campanasMensaje.reduce((a, m) => a + Number(m.gasto    || 0), 0);
  const mensajesTotal    = campanasMensaje.reduce((a, m) => a + Number(m.mensajes || 0), 0);
  const costoMensaje     = mensajesTotal > 0 ? gastoMsg / mensajesTotal : 0;

  const cpvIF       = ventasIF > 0 && gastoIF > 0 ? gastoIF / ventasIF : null;
  const cpvMensajes = ventasMensajes > 0 && gastoMsg > 0 ? gastoMsg / ventasMensajes : null;
  const masRentable = cpvIF && cpvMensajes
    ? cpvIF <= cpvMensajes ? "if" : "mensajes"
    : cpvIF ? "if" : cpvMensajes ? "mensajes" : null;

  // ── Brecha CPL ──────────────────────────────────────────────────────────────
  const brechaPct     = cplEfectivo > 0 ? Math.round((cplEfectivo - CPL_BENCHMARK) / CPL_BENCHMARK * 100) : 0;
  const reduccionNeed = cplEfectivo > 0 ? Math.round((1 - CPL_BENCHMARK / cplEfectivo) * 100) : 0;

  // ── Caminos de mejora (mismo presupuesto de referencia, CPL progresivamente menor)
  const cplCaminoA  = Math.round(cplEfectivo * 0.70); // -30%
  const cplCaminoB  = Math.round(cplEfectivo * 0.40); // -60%
  const cplCaminoC  = CPL_BENCHMARK;                  // benchmark sector

  const leadsA = cplCaminoA > 0 ? Math.round(budgetRef / cplCaminoA) : 0;
  const leadsB = cplCaminoB > 0 ? Math.round(budgetRef / cplCaminoB) : 0;
  const leadsC = Math.round(budgetRef / cplCaminoC);
  const leadsActual = cplEfectivo > 0 ? Math.round(budgetRef / cplEfectivo) : 0;

  const ventasA      = Math.round(leadsA * tasaCierre / 100);
  const ventasB      = Math.round(leadsB * tasaCierre / 100);
  const ventasC      = Math.round(leadsC * tasaCierre / 100);
  const ventasActual = Math.round(leadsActual * tasaCierre / 100);

  const faseActual = FASES.find((f) => f.value === (config?.fase_campana ?? "aprendizaje"))!;

  const handleGuardar = async () => {
    if (!empresa) return;
    setGuardando(true);
    try {
      const saved = await saveProyeccionConfig({
        empresa,
        cpl_umbral:        null,
        fase_campana:      form.fase_campana,
        vendedor_email:    form.vendedor_email || null,
        vendedor_whatsapp: form.vendedor_whatsapp || null,
      });
      setConfig(saved);
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  };

  if (!empresa) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
        Selecciona una empresa en los filtros para ver la proyección
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Encabezado: fase + avisos ── */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${faseActual.color}`}>
          Fase: {faseActual.label}
        </span>
        {modoSimulacion && (
          <span className={`${BADGE_BASE} inline-flex items-center gap-1 text-xs text-violet-600 font-medium border-violet-200 px-2.5 py-0.5`}>
            <FlaskConical size={12}/> Modo simulación — sin leads reales aún
          </span>
        )}
        {hayOtras && (
          <span className={`${BADGE_BASE} inline-flex items-center gap-1 text-xs text-amber-600 font-medium border-amber-200 px-2.5 py-0.5`}>
            <AlertTriangle size={12}/> Solo Meta Ads — {metricas.filter(m => m.plataforma !== "meta").length} campañas excluidas
          </span>
        )}
      </div>

      {/* ── KPIs base ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Total invertido"  valor={`S/ ${totalGasto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`} sub={`${diasTotales} días`}     color="text-amber-600" />
        <Kpi label="Total leads"      valor={totalLeads.toLocaleString()}                                               sub="Instant Form activo"       color="text-blue-600"  />
        <Kpi label="CTR promedio"     valor={`${ctrPromedio.toFixed(2)}%`}                                              sub="Benchmark ≥ 3.5%"          color={ctrPromedio >= 3.5 ? "text-green-600" : "text-red-500"} />
        <Kpi label="CPL actual"       valor={cplEfectivo > 0 ? `S/ ${cplEfectivo.toFixed(0)}` : "—"}                   sub={`Benchmark S/ ${CPL_BENCHMARK}`} color={cplEfectivo > CPL_BENCHMARK ? "text-red-500" : "text-green-600"} />
      </div>

      {/* ── Brecha de diagnóstico ── */}
      {cplEfectivo > CPL_BENCHMARK && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                CPL S/ {cplEfectivo.toFixed(0)} — excede el benchmark en <strong>+{brechaPct}%</strong>
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Necesitas reducir el CPL en <strong>{reduccionNeed}%</strong> para llegar al óptimo del sector (S/ {CPL_BENCHMARK}).
                Con el mismo presupuesto podrías obtener <strong>{leadsC - leadsActual} leads más por mes</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-100/60 rounded-lg px-3 py-2">
            <ArrowDown size={13} className="shrink-0" />
            Objetivo: bajar de <span className="font-bold mx-1">S/ {cplEfectivo.toFixed(0)}</span>
            <span className="text-red-400">→</span>
            <span className="font-bold text-green-700 mx-1">S/ {CPL_BENCHMARK}</span>
            (reducción de S/ {(cplEfectivo - CPL_BENCHMARK).toFixed(0)} por lead)
          </div>
        </div>
      )}
      {cplEfectivo > 0 && cplEfectivo <= CPL_BENCHMARK && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2 text-sm text-green-700 font-medium">
          <CheckCircle2 size={16}/> CPL S/ {cplEfectivo.toFixed(0)} está dentro del benchmark del sector. Puedes escalar.
        </div>
      )}

      {/* ── Simulación cuando no hay leads reales ── */}
      {modoSimulacion && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-violet-700">Simula el CPL esperado para proyectar escenarios</p>
          <p className="text-xs text-violet-600">Sin campañas con Instant Form aún. Ingresa el CPL estimado para proyectar.</p>
          <label className="flex items-center gap-2 text-sm text-violet-800">
            <span className="font-medium">CPL estimado S/</span>
            <input
              type="number"
              value={cplSimulado}
              onChange={(e) => setCplSimulado(e.target.value)}
              className={`${INPUT_BASE} w-24 border-violet-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400`}
              placeholder="ej. 45"
            />
          </label>
        </div>
      )}

      {/* ── Predictor de campaña ── */}
      {totalGasto > 0 && (
        <div className={`${GLASS_BASE} p-4 flex flex-wrap items-center gap-3`}>
          <Sparkles size={16} className="text-violet-500 shrink-0" />
          <span className="text-sm font-medium text-zinc-200">Predice tu próxima campaña</span>
          <span className="text-xs text-zinc-400">¿Cuánto invertirás adicional?</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-sm text-zinc-400">S/</span>
            <input
              type="number"
              value={presupuestoExtra}
              onChange={(e) => setPresupuestoExtra(e.target.value)}
              className={`${INPUT_BASE} w-24 text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400`}
              placeholder="100"
            />
            <button
              onClick={() => setPrediccionOpen(true)}
              disabled={!presupuestoExtra || Number(presupuestoExtra) <= 0}
              className="px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-40 transition"
            >
              Ver predicción
            </button>
          </div>
        </div>
      )}

      {/* ── Comparativa: Instant Form vs Mensajes ── */}
      {(campanasIF.length > 0 || campanasMensaje.length > 0) && (
        <div className={`${GLASS_BASE} p-5 space-y-4`}>
          <div>
            <p className="text-sm font-semibold text-zinc-200">¿Qué tipo de campaña fue más rentable?</p>
            <p className="text-xs text-zinc-400 mt-0.5">Ingresa las ventas que atribuyes a cada tipo para calcular el costo real por venta</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Instant Form */}
            <div className={`rounded-xl border p-4 space-y-3 ${masRentable === "if" ? "border-green-300 bg-green-50" : "border-white/10 bg-zinc-800/40"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-200">Instant Form</p>
                  <p className="text-[10px] text-zinc-400">{campanasIF.length} campaña{campanasIF.length !== 1 ? "s" : ""}</p>
                </div>
                {masRentable === "if" && (
                  <span className={`${BADGE_BASE} text-[9px] text-white px-1.5 py-0.5 font-bold uppercase`}>Más rentable</span>
                )}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Gasto total</span><span className="font-medium text-zinc-200">S/ {gastoIF.toLocaleString("es-PE", { maximumFractionDigits: 0 })}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Leads generados</span><span className="font-medium text-zinc-200">{leadsIF}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">CPL</span><span className={`font-bold ${cplIF > CPL_BENCHMARK ? "text-red-500" : "text-green-600"}`}>{cplIF > 0 ? `S/ ${cplIF.toFixed(0)}` : "—"}</span></div>
              </div>
              <div className="border-t border-white/10 pt-3">
                <label className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-zinc-400 font-medium">Ventas atribuidas</span>
                  <input
                    type="number" min={0}
                    value={ventasIF}
                    onChange={(e) => setVentasIF(Number(e.target.value))}
                    className={`${INPUT_BASE} w-16 px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-brand/30`}
                  />
                </label>
                {cpvIF && (
                  <p className="text-xs mt-2">
                    <span className="text-zinc-500">Costo por venta: </span>
                    <span className={`font-bold ${masRentable === "if" ? "text-green-600" : "text-zinc-300"}`}>S/ {cpvIF.toFixed(0)}</span>
                  </p>
                )}
                {leadsIF > 0 && ventasIF === 0 && (
                  <p className="text-[10px] text-zinc-400 mt-2">Con {leadsIF} leads y 0 ventas atribuidas, la tasa de cierre es 0%</p>
                )}
              </div>
            </div>

            {/* Mensajes / Traffic */}
            <div className={`rounded-xl border p-4 space-y-3 ${masRentable === "mensajes" ? "border-green-300 bg-green-50" : "border-white/10 bg-zinc-800/40"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-200">Tráfico / Mensajes</p>
                  <p className="text-[10px] text-zinc-400">{campanasMensaje.length} campaña{campanasMensaje.length !== 1 ? "s" : ""} sin Instant Form</p>
                </div>
                {masRentable === "mensajes" && (
                  <span className={`${BADGE_BASE} text-[9px] text-white px-1.5 py-0.5 font-bold uppercase`}>Más rentable</span>
                )}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Gasto total</span><span className="font-medium text-zinc-200">S/ {gastoMsg.toLocaleString("es-PE", { maximumFractionDigits: 0 })}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Mensajes recibidos</span><span className="font-medium text-zinc-200">{mensajesTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Costo / mensaje</span><span className="font-medium text-zinc-200">{costoMensaje > 0 ? `S/ ${costoMensaje.toFixed(2)}` : "—"}</span></div>
              </div>
              <div className="border-t border-white/10 pt-3">
                <label className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-zinc-400 font-medium">Ventas atribuidas</span>
                  <input
                    type="number" min={0}
                    value={ventasMensajes}
                    onChange={(e) => setVentasMensajes(Number(e.target.value))}
                    className={`${INPUT_BASE} w-16 px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-brand/30`}
                  />
                </label>
                {cpvMensajes && (
                  <p className="text-xs mt-2">
                    <span className="text-zinc-500">Costo por venta: </span>
                    <span className={`font-bold ${masRentable === "mensajes" ? "text-green-600" : "text-zinc-300"}`}>S/ {cpvMensajes.toFixed(0)}</span>
                  </p>
                )}
                {mensajesTotal > 0 && ventasMensajes > 0 && (
                  <p className="text-[10px] text-zinc-400 mt-1">Tasa de cierre: {((ventasMensajes / mensajesTotal) * 100).toFixed(1)}% (mensajes → ventas)</p>
                )}
              </div>
            </div>
          </div>

          {/* Conclusión */}
          {(cpvIF || cpvMensajes) && (
            <div className={`rounded-xl px-4 py-3 text-xs border ${masRentable ? "bg-green-50 border-green-200 text-green-800" : "bg-zinc-800/40 border-white/10 text-zinc-400"}`}>
              {masRentable === "if" && cpvIF && cpvMensajes && (
                <p><strong>Instant Form fue más rentable:</strong> S/ {cpvIF.toFixed(0)} por venta vs S/ {cpvMensajes.toFixed(0)} de mensajes. {cpvIF < cpvMensajes ? `Ahorraste S/ ${(cpvMensajes - cpvIF).toFixed(0)} por venta.` : ""}</p>
              )}
              {masRentable === "mensajes" && cpvIF && cpvMensajes && (
                <p><strong>Mensajes fue más rentable:</strong> S/ {cpvMensajes.toFixed(0)} por venta vs S/ {cpvIF.toFixed(0)} de Instant Form. Considera combinar ambos tipos en la próxima campaña.</p>
              )}
              {masRentable === "mensajes" && !cpvIF && (
                <p><strong>Mensajes generó las ventas:</strong> S/ {cpvMensajes?.toFixed(0)} por venta con {ventasMensajes} ventas atribuidas.</p>
              )}
              {masRentable === "if" && !cpvMensajes && (
                <p><strong>Instant Form generó las ventas:</strong> S/ {cpvIF?.toFixed(0)} por venta con {ventasIF} ventas atribuidas.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Escenarios de mejora CPL ── */}
      {cplEfectivo > 0 && (
        <div className="space-y-4">

          {/* Encabezado + parámetros */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Escenarios si mejoras el CPL</p>
              <p className="text-xs text-zinc-400 mt-0.5">Mismo presupuesto de referencia, menor CPL = más leads</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Presupuesto ref. S/</span>
                <input
                  type="number"
                  value={budgetRef}
                  onChange={(e) => setBudgetRef(Number(e.target.value))}
                  className={`${INPUT_BASE} w-20 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 text-center`}
                />
                <span className="text-zinc-400">/mes</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Tasa de cierre</span>
                <input
                  type="number"
                  min={0} max={100}
                  value={tasaCierre}
                  onChange={(e) => setTasaCierre(Number(e.target.value))}
                  className={`${INPUT_BASE} w-14 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 text-center`}
                />
                <span className="text-zinc-400">%</span>
              </label>
            </div>
          </div>

          {/* Situación actual (referencia) */}
          <div className={`${PANEL_BASE} p-4`}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wide">Situación actual — referencia</span>
              <span className={`${BADGE_BASE} text-[10px] text-red-600 border-red-200 px-2 py-0.5 font-medium`}>
                CPL S/ {cplEfectivo.toFixed(0)} — {brechaPct > 0 ? `+${brechaPct}% sobre benchmark` : "en benchmark"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-zinc-400 mb-1">CPL</p>
                <p className="text-lg font-bold text-red-500">S/ {cplEfectivo.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 mb-1">Leads/mes</p>
                <p className="text-lg font-bold text-zinc-300">~{leadsActual}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 mb-1">Ventas est. ({tasaCierre}%)</p>
                <p className="text-lg font-bold text-zinc-300">~{ventasActual}</p>
              </div>
            </div>
          </div>

          {/* Caminos A / B / C */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Camino A */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-blue-500" />
                  <span className="text-xs font-bold text-zinc-200">Camino A</span>
                </div>
                <span className={`${BADGE_BASE} text-[10px] text-blue-700 border-blue-200 px-2 py-0.5 font-medium`}>−30% CPL</span>
              </div>
              <p className="text-[11px] text-blue-700 font-medium">Optimización básica de anuncios</p>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-[10px] text-zinc-400">CPL</p>
                  <p className="text-sm font-bold text-blue-600">S/ {cplCaminoA}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400">Leads</p>
                  <p className="text-sm font-bold text-zinc-200">~{leadsA}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400">Ventas</p>
                  <p className="text-sm font-bold text-zinc-200">~{ventasA}</p>
                </div>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-blue-200">
                <p className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1"><Lightbulb size={10}/> Estrategias:</p>
                {["A/B test de creatividades (copy + imagen)", "Audiencias lookalike 1–3%", "Excluir audiencias ya convertidas", "Optimizar horarios de mayor CTR"].map((e) => (
                  <p key={e} className="text-[10px] text-zinc-400 flex items-start gap-1"><span className="text-blue-400 mt-0.5">•</span>{e}</p>
                ))}
              </div>
              <p className="text-[10px] text-blue-600 font-medium">+{leadsA - leadsActual} leads más que ahora</p>
            </div>

            {/* Camino B */}
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-violet-500" />
                  <span className="text-xs font-bold text-zinc-200">Camino B</span>
                </div>
                <span className={`${BADGE_BASE} text-[10px] text-violet-700 border-violet-200 px-2 py-0.5 font-medium`}>−60% CPL</span>
              </div>
              <p className="text-[11px] text-violet-700 font-medium">Lead Generation activado</p>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-[10px] text-zinc-400">CPL</p>
                  <p className="text-sm font-bold text-violet-600">S/ {cplCaminoB}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400">Leads</p>
                  <p className="text-sm font-bold text-zinc-200">~{leadsB}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400">Ventas</p>
                  <p className="text-sm font-bold text-zinc-200">~{ventasB}</p>
                </div>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-violet-200">
                <p className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1"><Lightbulb size={10}/> Estrategias:</p>
                {["Cambiar objetivo: Tráfico → Lead Generation", "Activar Instant Form nativo de Meta", "Pre-llenar campos con datos de Facebook", "Formulario corto: nombre, teléfono, proyecto"].map((e) => (
                  <p key={e} className="text-[10px] text-zinc-400 flex items-start gap-1"><span className="text-violet-400 mt-0.5">•</span>{e}</p>
                ))}
              </div>
              <p className="text-[10px] text-violet-600 font-medium">+{leadsB - leadsActual} leads más que ahora</p>
            </div>

            {/* Camino C — benchmark */}
            <div className="rounded-xl border border-green-300 bg-green-50 p-4 space-y-3 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <span className={`${BADGE_BASE} text-[9px] text-white px-1.5 py-0.5 font-bold uppercase tracking-wide`}>Objetivo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target size={15} className="text-green-600" />
                <span className="text-xs font-bold text-zinc-200">Camino C</span>
              </div>
              <p className="text-[11px] text-green-700 font-medium">Benchmark sector — S/ {CPL_BENCHMARK}</p>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-[10px] text-zinc-400">CPL</p>
                  <p className="text-sm font-bold text-green-600">S/ {CPL_BENCHMARK}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400">Leads</p>
                  <p className="text-sm font-bold text-zinc-200">~{leadsC}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400">Ventas</p>
                  <p className="text-sm font-bold text-zinc-200">~{ventasC}</p>
                </div>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-green-200">
                <p className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1"><Lightbulb size={10}/> Estrategias:</p>
                {["Instant Form + segmentación precisa por intereses", "Retargeting visitantes web (pixel Meta)", "Conversions API (CAPI) para mejor atribución", "Creatividades con casos de éxito reales"].map((e) => (
                  <p key={e} className="text-[10px] text-zinc-400 flex items-start gap-1"><span className="text-green-500 mt-0.5">•</span>{e}</p>
                ))}
              </div>
              <p className="text-[10px] text-green-700 font-bold">+{leadsC - leadsActual} leads más que ahora</p>
            </div>
          </div>
        </div>
      )}

      {!cplEfectivo && (
        <div className={`${PANEL_BASE} p-6 text-center text-sm text-zinc-400`}>
          Sin datos de leads suficientes para proyectar. Sincroniza las métricas de Meta Ads primero.
        </div>
      )}

      {/* ── Configuración de campaña ── */}
      <div className={`${GLASS_BASE} p-5 space-y-4`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-200">Configuración de campaña</span>
          {!editando && (
            <button onClick={() => setEditando(true)} className="text-xs text-brand hover:underline">Editar</button>
          )}
        </div>
        {editando ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-zinc-500">Fase de campaña</span>
                <div className="relative">
                  <select
                    value={form.fase_campana}
                    onChange={(e) => setForm((f) => ({ ...f, fase_campana: e.target.value as any }))}
                    className={`${INPUT_BASE} w-full text-sm px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-brand/30`}
                  >
                    {FASES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-zinc-500">Email del vendedor (notificaciones)</span>
                <input type="email" value={form.vendedor_email} onChange={(e) => setForm((f) => ({ ...f, vendedor_email: e.target.value }))} placeholder="ventas@empresa.com" className={`${INPUT_BASE} w-full text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30`} />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-zinc-500">WhatsApp del vendedor</span>
                <input type="text" value={form.vendedor_whatsapp} onChange={(e) => setForm((f) => ({ ...f, vendedor_whatsapp: e.target.value }))} placeholder="+51987654321" className={`${INPUT_BASE} w-full text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30`} />
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setEditando(false)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:bg-zinc-800/40">Cancelar</button>
              <button onClick={handleGuardar} disabled={guardando} className="text-xs px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-hover flex items-center gap-1.5 disabled:opacity-50">
                <Save size={12} /> {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 text-xs text-zinc-400">
            <div><span className="block text-zinc-400 mb-0.5">Fase</span>{faseActual.label}</div>
            <div><span className="block text-zinc-400 mb-0.5">Email vendedor</span>{config?.vendedor_email ?? "—"}</div>
            <div><span className="block text-zinc-400 mb-0.5">WhatsApp</span>{config?.vendedor_whatsapp ?? "—"}</div>
          </div>
        )}
      </div>

      {/* ── Leads por campaña ── */}
      {leadsCampana.length > 0 && (
        <div className={`${GLASS_BASE} overflow-hidden`}>
          <div className="px-5 py-3 border-b border-white/8">
            <span className="text-sm font-semibold text-zinc-200">Calidad de leads por campaña</span>
            <span className="ml-2 text-xs text-zinc-400">Feedback del equipo de ventas</span>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-zinc-800/40 text-zinc-100 uppercase text-[10px]">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Campaña</th>
                <th className="px-4 py-2.5 text-center font-medium">Total</th>
                <th className="px-4 py-2.5 text-center font-medium text-green-600">Calificados</th>
                <th className="px-4 py-2.5 text-center font-medium text-red-500">No calif.</th>
                <th className="px-4 py-2.5 text-center font-medium">% Calidad</th>
                <th className="px-4 py-2.5 text-center font-medium text-blue-600">≤5 min</th>
                <th className="px-4 py-2.5 text-center font-medium">T. respuesta</th>
                <th className="px-4 py-2.5 text-center font-medium text-zinc-100">Sin contactar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {leadsCampana.map((row) => {
                const total   = Number(row.total);
                const cal     = Number(row.calificados);
                const pct     = total > 0 ? Math.round((cal / total) * 100) : 0;
                const min5    = Number(row.contactados_5min);
                const sinCont = Number(row.sin_contactar);
                const minProm = row.min_promedio_respuesta != null ? Number(row.min_promedio_respuesta) : null;
                return (
                  <tr key={row.campana_origen} className="hover:bg-zinc-800/40 transition">
                    <td className="px-5 py-3 text-zinc-300 max-w-xs truncate">{row.campana_origen}</td>
                    <td className="px-4 py-3 text-center font-medium text-zinc-200">{total}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{cal}</td>
                    <td className="px-4 py-3 text-center text-red-500">{row.no_calificados}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${pct >= 50 ? "text-green-600" : pct > 0 ? "text-amber-500" : "text-zinc-400"}`}>{pct}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${min5 > 0 ? "text-blue-600" : "text-zinc-300"}`}>{min5}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {minProm != null
                        ? <span className={`font-medium ${minProm <= 5 ? "text-green-600" : minProm <= 30 ? "text-amber-500" : "text-red-500"}`}>{minProm} min</span>
                        : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`${sinCont > 0 ? "text-red-500 font-medium" : "text-zinc-300"}`}>{sinCont}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal predicción ── */}
      {prediccionOpen && totalGasto > 0 && (
        <ModalPrediccion
          datos={{
            gasto:         totalGasto,
            clics:         totalClics,
            impresiones:   totalImpresiones,
            alcance:       totalAlcance,
            mensajes:      totalMensajes,
            leads:         totalLeads,
            conversiones:  totalConversiones,
            ventas:        totalVentas,
            ctr:           ctrPromedio,
            cpc:           cpcPromedio,
            cpm:           cpmPromedio,
            diasHistorial: diasTotales,
          }}
          presupuestoExtra={Number(presupuestoExtra)}
          onCerrar={() => setPrediccionOpen(false)}
        />
      )}

    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────
function Kpi({ label, valor, sub, color }: { label: string; valor: string; sub: string; color: string }) {
  return (
    <div className={`${GLASS_BASE} px-4 py-3 space-y-0.5`}>
      <p className="text-[11px] text-zinc-400">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{valor}</p>
      <p className="text-[11px] text-zinc-400">{sub}</p>
    </div>
  );
}
