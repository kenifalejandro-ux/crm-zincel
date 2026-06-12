/** client/src/components/metricas/BudgetOptimizerTab.tsx
 *
 * Brecha 4: Budget Optimizer multi-plataforma
 * Dado un presupuesto total, calcula la distribución óptima entre
 * Meta, Google y TikTok para maximizar leads al menor CPL posible.
 *
 * Algoritmo: asignación proporcional inversa al CPL histórico.
 * Plataformas sin historial permiten CPL estimado manual.
 */

import { useState, useEffect, useMemo } from "react";
import { Zap, RotateCcw, Info, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { getHistoricoPlataforma, type HistoricoPlataforma } from "../../services/metricas.api";
import { GLASS_BASE } from "../../lib/tokens";

interface Props { empresa?: string }

// ── Configuración de plataformas ─────────────────────────────────────────────
const PLATAFORMAS = ["meta", "google", "tiktok"] as const;
type Plataforma = typeof PLATAFORMAS[number];

const PLAT_CONFIG: Record<Plataforma, { label: string; color: string; bg: string; border: string; ring: string }> = {
  meta:   { label: "Meta Ads",   color: "text-blue-700",  bg: "bg-blue-50",   border: "border-blue-200",   ring: "focus:ring-blue-400"   },
  google: { label: "Google Ads", color: "text-red-700",   bg: "bg-red-50",    border: "border-red-200",    ring: "focus:ring-red-400"    },
  tiktok: { label: "TikTok Ads", color: "text-pink-700",  bg: "bg-pink-50",   border: "border-pink-200",   ring: "focus:ring-pink-400"   },
};

// CPL de referencia de sector cuando no hay historial (WordStream/SuperAds 2025 inmobiliaria LatAm)
const CPL_REFERENCIA: Record<Plataforma, number> = {
  meta:   462,
  google: 320,
  tiktok: 280,
};

interface EstadoPlataforma {
  activa:     boolean;   // ¿incluida en el cálculo?
  pct:        number;    // % del presupuesto asignado
  cplManual:  string;    // CPL estimado si no hay historial (string para el input)
}

const FMT_SOL = (v: number) =>
  `S/ ${v.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const FMT_PCT = (v: number) => `${v.toFixed(1)}%`;

// ── Algoritmo de optimización ────────────────────────────────────────────────
// Asignación proporcional inversa al CPL: menor CPL → más presupuesto
function calcOptimo(plats: { id: Plataforma; cpl: number; activa: boolean }[]): Record<Plataforma, number> {
  const activas = plats.filter((p) => p.activa && p.cpl > 0);
  if (activas.length === 0) return { meta: 0, google: 0, tiktok: 0 };
  const eficiencias = activas.map((p) => ({ id: p.id, ef: 1 / p.cpl }));
  const totalEf = eficiencias.reduce((s, e) => s + e.ef, 0);
  const result: Record<Plataforma, number> = { meta: 0, google: 0, tiktok: 0 };
  eficiencias.forEach((e) => {
    result[e.id] = Math.round((e.ef / totalEf) * 100);
  });
  // Ajuste de redondeo: asegura que la suma sea 100
  const suma = Object.values(result).reduce((s, v) => s + v, 0);
  if (suma !== 100 && activas.length > 0) {
    const primero = activas[0].id;
    result[primero] += 100 - suma;
  }
  return result;
}

// ── Componente principal ─────────────────────────────────────────────────────
export const BudgetOptimizerTab = ({ empresa }: Props) => {
  const [historico,   setHistorico]   = useState<HistoricoPlataforma[]>([]);
  const [cargando,    setCargando]    = useState(false);
  const [presupuesto, setPresupuesto] = useState("5000");
  const [tasaCierre,  setTasaCierre]  = useState("15"); // % leads → ventas
  const [mostrarDatos,setMostrarDatos]= useState(false);

  const [estado, setEstado] = useState<Record<Plataforma, EstadoPlataforma>>({
    meta:   { activa: true,  pct: 70, cplManual: "" },
    google: { activa: false, pct: 20, cplManual: "" },
    tiktok: { activa: false, pct: 10, cplManual: "" },
  });

  // Carga datos históricos
  useEffect(() => {
    setCargando(true);
    getHistoricoPlataforma(empresa)
      .then((data) => {
        setHistorico(data);
        // Activa solo las plataformas con historial real
        setEstado((prev) => {
          const next = { ...prev };
          PLATAFORMAS.forEach((p) => {
            const h = data.find((d) => d.plataforma === p);
            next[p] = { ...next[p], activa: !!h };
          });
          return next;
        });
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [empresa]);

  // CPL efectivo por plataforma: histórico real > manual ingresado > 0 (sin fallback a referencia)
  const cplEfectivo = useMemo<Record<Plataforma, number>>(() => {
    const result = {} as Record<Plataforma, number>;
    PLATAFORMAS.forEach((p) => {
      const h = historico.find((d) => d.plataforma === p);
      const manual = parseFloat(estado[p].cplManual);
      if (h && Number(h.cpl_promedio) > 0) {
        result[p] = Number(h.cpl_promedio);
      } else if (manual > 0) {
        result[p] = manual;
      } else {
        result[p] = 0; // sin datos reales ni CPL ingresado
      }
    });
    return result;
  }, [historico, estado]);

  // Presupuesto total numérico
  const budgetTotal = parseFloat(presupuesto) || 0;
  const tasa = parseFloat(tasaCierre) || 0;

  // Suma de porcentajes activos
  const sumaActivos = PLATAFORMAS.filter((p) => estado[p].activa)
    .reduce((s, p) => s + estado[p].pct, 0);
  const sumaValida = sumaActivos === 100 || PLATAFORMAS.filter(p => estado[p].activa).length === 0;

  // Proyección por plataforma con la distribución actual
  const proyeccion = useMemo(() => {
    return PLATAFORMAS.map((p) => {
      const e = estado[p];
      const budget = budgetTotal * (e.pct / 100);
      const leads = cplEfectivo[p] > 0 ? budget / cplEfectivo[p] : 0;
      const ventas = leads * (tasa / 100);
      return { plataforma: p, budget, leads, ventas, cpl: cplEfectivo[p] };
    });
  }, [estado, budgetTotal, cplEfectivo, tasa]);

  const totalLeadsActual = proyeccion
    .filter((p) => estado[p.plataforma].activa)
    .reduce((s, p) => s + p.leads, 0);
  const totalVentasActual = proyeccion
    .filter((p) => estado[p.plataforma].activa)
    .reduce((s, p) => s + p.ventas, 0);
  const cplPromedioActual = totalLeadsActual > 0 ? budgetTotal / totalLeadsActual : 0;

  // Distribución óptima calculada
  const optimoDistribucion = useMemo(() => {
    return calcOptimo(
      PLATAFORMAS.map((p) => ({ id: p, cpl: cplEfectivo[p], activa: estado[p].activa }))
    );
  }, [cplEfectivo, estado]);

  // Proyección con distribución óptima
  const proyeccionOptima = useMemo(() => {
    return PLATAFORMAS.map((p) => {
      const pct = optimoDistribucion[p];
      const budget = budgetTotal * (pct / 100);
      const leads = cplEfectivo[p] > 0 ? budget / cplEfectivo[p] : 0;
      const ventas = leads * (tasa / 100);
      return { plataforma: p, budget, leads, ventas };
    });
  }, [optimoDistribucion, budgetTotal, cplEfectivo, tasa]);

  const totalLeadsOptimo = proyeccionOptima
    .filter((p) => estado[p.plataforma].activa)
    .reduce((s, p) => s + p.leads, 0);
  const gananciaLeads = totalLeadsOptimo - totalLeadsActual;

  // Acción: aplicar distribución óptima
  const aplicarOptimo = () => {
    setEstado((prev) => {
      const next = { ...prev };
      PLATAFORMAS.forEach((p) => {
        next[p] = { ...next[p], pct: optimoDistribucion[p] };
      });
      return next;
    });
  };

  // Acción: cambiar % de una plataforma (ajusta las otras proporcionalmente)
  const cambiarPct = (plat: Plataforma, valor: number) => {
    const v = Math.max(0, Math.min(100, Math.round(valor)));
    setEstado((prev) => {
      const next = { ...prev };
      next[plat] = { ...next[plat], pct: v };
      // Ajusta el resto de activas proporcionalmente
      const otras = PLATAFORMAS.filter((p) => p !== plat && next[p].activa);
      const restante = 100 - v;
      const totalOtras = otras.reduce((s, p) => s + next[p].pct, 0);
      if (otras.length > 0 && totalOtras > 0) {
        otras.forEach((p) => {
          next[p] = { ...next[p], pct: Math.round((next[p].pct / totalOtras) * restante) };
        });
        // Corrección de redondeo
        const suma = PLATAFORMAS.filter(p => next[p].activa).reduce((s, p) => s + next[p].pct, 0);
        if (suma !== 100) {
          const primera = otras[0];
          next[primera] = { ...next[primera], pct: next[primera].pct + (100 - suma) };
        }
      } else if (otras.length > 0) {
        const porCada = Math.floor(restante / otras.length);
        otras.forEach((p) => next[p] = { ...next[p], pct: porCada });
        next[otras[0]].pct += restante - porCada * otras.length;
      }
      return next;
    });
  };

  // Acción: toggle de plataforma activa
  const togglePlataforma = (plat: Plataforma) => {
    setEstado((prev) => {
      const next = { ...prev };
      const nuevaActiva = !next[plat].activa;
      next[plat] = { ...next[plat], activa: nuevaActiva };
      // Si se activa, da el 0% y redistribuye el 100 entre activas
      if (nuevaActiva) next[plat].pct = 0;
      // Recalcula porcentajes equitativos entre activas
      const activas = PLATAFORMAS.filter((p) => next[p].activa);
      if (activas.length > 0) {
        const base = Math.floor(100 / activas.length);
        activas.forEach((p) => next[p].pct = base);
        next[activas[0]].pct += 100 - base * activas.length;
      }
      return next;
    });
  };

  if (!empresa && historico.length === 0 && !cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 bg-white rounded-2xl border border-dashed border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <Zap size={20} className="text-slate-300" />
        <p className="text-sm text-slate-400">Selecciona una empresa para cargar datos históricos de CPL</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="crm-section-accent h-8" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Budget Optimizer</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribuye tu presupuesto para maximizar leads al menor CPL posible
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-medium">Tasa de cierre</span>
            <input
              type="number" min={0} max={100}
              value={tasaCierre}
              onChange={(e) => setTasaCierre(e.target.value)}
              className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white shadow-sm"
            />
            <span className="text-slate-400">%</span>
          </label>
        </div>
      </div>

      {/* ── Presupuesto total + botones ── */}
      <div className={`${GLASS_BASE} p-5 flex flex-wrap items-center gap-4`}>
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Presupuesto mensual</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-slate-500 font-medium">S/</span>
              <input
                type="number" min={0}
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
                className="w-32 border border-slate-200 rounded-xl px-3 py-2 text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white text-center"
                placeholder="5000"
              />
            </div>
          </div>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={aplicarOptimo}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl transition shadow-sm"
          >
            <Zap size={12} /> Optimizar automáticamente
          </button>
          <button
            onClick={() => setEstado((prev) => {
              const next = { ...prev };
              const activas = PLATAFORMAS.filter(p => next[p].activa);
              const base = activas.length > 0 ? Math.floor(100 / activas.length) : 0;
              activas.forEach((p) => next[p].pct = base);
              if (activas.length > 0) next[activas[0]].pct += 100 - base * activas.length;
              return next;
            })}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition"
          >
            <RotateCcw size={12} /> Distribuir igual
          </button>
        </div>
      </div>

      {/* ── Tarjetas de plataforma ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLATAFORMAS.map((plat) => {
          const cfg    = PLAT_CONFIG[plat];
          const e      = estado[plat];
          const h      = historico.find((d) => d.plataforma === plat);
          const cpl    = cplEfectivo[plat];
          const proy   = proyeccion.find((p) => p.plataforma === plat)!;
          const tieneHistorial = h && Number(h.cpl_promedio) > 0;
          const esOptima = optimoDistribucion[plat] > estado[plat].pct && e.activa;

          return (
            <div
              key={plat}
              className={`rounded-2xl border p-5 space-y-4 transition shadow-[0_1px_3px_rgba(0,0,0,0.08),_0_8px_24px_rgba(0,0,0,0.05)] ${
                e.activa ? `${cfg.bg} ${cfg.border}` : "bg-slate-50 border-slate-200 opacity-50"
              }`}
            >
              {/* Header plataforma */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePlataforma(plat)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                      e.activa ? `${cfg.border} bg-white` : "border-zinc-300 bg-zinc-100"
                    }`}
                  >
                    {e.activa && <div className={`w-2 h-2 rounded-sm ${cfg.color.replace("text-", "bg-")}`} />}
                  </button>
                  <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>
                {esOptima && (
                  <span className="text-[9px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">
                    Óptima ↑
                  </span>
                )}
              </div>

              {/* CPL */}
              <div>
                <p className="text-[10px] text-zinc-500 mb-1">
                  CPL {tieneHistorial ? "histórico" : "estimado"}
                  {!tieneHistorial && (
                    <span className="ml-1 text-zinc-400">— sin historial real</span>
                  )}
                </p>
                {tieneHistorial ? (
                  <p className={`text-xl font-bold ${cfg.color}`}>S/ {Number(h!.cpl_promedio).toFixed(0)}</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-zinc-400">S/</span>
                      <input
                        type="number" min={1}
                        value={e.cplManual}
                        onChange={(ev) => setEstado((prev) => ({
                          ...prev,
                          [plat]: { ...prev[plat], cplManual: ev.target.value }
                        }))}
                        placeholder={CPL_REFERENCIA[plat].toString()}
                        className={`w-20 border rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 ${cfg.ring} ${cfg.border} bg-white`}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Ingresa un CPL para activar proyección
                    </p>
                  </div>
                )}
                {tieneHistorial && h && (
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {h.campanas} campañas · {h.meses_con_datos} meses · {h.leads_total} leads totales
                  </p>
                )}
              </div>

              {/* Slider % */}
              <div className={`${!e.activa ? "pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-500">Asignación</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => cambiarPct(plat, e.pct - 5)} className="text-zinc-400 hover:text-zinc-700 text-xs px-1">−</button>
                    <span className={`text-sm font-bold ${cfg.color}`}>{e.pct}%</span>
                    <button onClick={() => cambiarPct(plat, e.pct + 5)} className="text-zinc-400 hover:text-zinc-700 text-xs px-1">+</button>
                  </div>
                </div>
                <input
                  type="range" min={0} max={100} step={5}
                  value={e.pct}
                  onChange={(ev) => cambiarPct(plat, Number(ev.target.value))}
                  disabled={!e.activa}
                  className="w-full h-1.5 rounded-full accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Resultado proyectado */}
              <div className={`rounded-xl p-3.5 space-y-2 border ${e.activa ? "bg-white/80 border-white/50" : "bg-slate-100 border-transparent"}`}>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Presupuesto</span>
                  <span className="font-semibold text-zinc-800">
                    {e.activa ? FMT_SOL(proy.budget) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Leads proyectados</span>
                  <span className={`font-bold ${e.activa && proy.leads > 0 ? cfg.color : "text-zinc-400"}`}>
                    {e.activa && proy.leads > 0 ? `~${Math.round(proy.leads)}` : "—"}
                  </span>
                </div>
                {tasa > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Ventas est. ({tasa}%)</span>
                    <span className="font-medium text-emerald-600">
                      {e.activa && proy.ventas > 0 ? `~${proy.ventas.toFixed(1)}` : "—"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Validación ── */}
      {!sumaValida && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <Info size={13} />
          La suma de asignaciones activas es {sumaActivos}% — debe ser exactamente 100%.
          Ajusta los sliders o usa "Optimizar" o "Distribuir igual".
        </div>
      )}

      {/* ── Resultado consolidado ── */}
      {sumaValida && budgetTotal > 0 && (
        <div className={`${GLASS_BASE} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <TrendingUp size={15} className="text-brand" />
            <span className="text-sm font-bold text-slate-800">Resultado proyectado</span>
          </div>

          <div className="p-5 space-y-4">
            {/* KPIs principales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ResultKpi
                label="Total leads/mes"
                value={`~${Math.round(totalLeadsActual)}`}
                sub={`CPL promedio ${FMT_SOL(cplPromedioActual)}`}
                color="violet"
              />
              <ResultKpi
                label="Ventas estimadas"
                value={tasa > 0 ? `~${totalVentasActual.toFixed(1)}` : "—"}
                sub={tasa > 0 ? `al ${tasa}% de cierre` : "Configura tasa de cierre"}
                color="emerald"
              />
              <ResultKpi
                label="CPL óptimo alcanzable"
                value={totalLeadsOptimo > 0 ? FMT_SOL(budgetTotal / totalLeadsOptimo) : "—"}
                sub="con distribución óptima"
                color={totalLeadsOptimo > totalLeadsActual ? "green" : "zinc"}
              />
              <ResultKpi
                label="Ganancia distribución óptima"
                value={gananciaLeads > 0.5
                  ? `+${Math.round(gananciaLeads)} leads`
                  : gananciaLeads < -0.5
                    ? `${Math.round(gananciaLeads)} leads`
                    : "Distribución óptima"}
                sub={gananciaLeads > 0.5
                  ? "vs. distribución actual"
                  : gananciaLeads < -0.5
                    ? "bajo la óptima"
                    : "ya optimizada"}
                color={gananciaLeads > 0.5 ? "green" : gananciaLeads < -0.5 ? "red" : "violet"}
              />
            </div>

            {/* Comparativa visual actual vs óptima */}
            {gananciaLeads > 0.5 && (
              <div className="rounded-xl border border-brand/20 bg-brand/5 p-5 space-y-4">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                  Distribución actual vs óptima
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Actual */}
                  <div className="bg-white rounded-xl p-4 space-y-2.5 border border-slate-200 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Distribución actual</p>
                    {PLATAFORMAS.filter(p => estado[p].activa).map((p) => (
                      <div key={p} className="flex items-center gap-2 text-xs">
                        <span className={`w-14 shrink-0 ${PLAT_CONFIG[p].color} font-semibold`}>{PLAT_CONFIG[p].label.replace(" Ads","")}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div className={`h-full rounded-full ${PLAT_CONFIG[p].color.replace("text-","bg-").replace("700","400")}`}
                            style={{ width: `${estado[p].pct}%` }} />
                        </div>
                        <span className="text-slate-500 w-8 text-right">{estado[p].pct}%</span>
                      </div>
                    ))}
                    <p className="text-sm font-black text-slate-800 pt-1 tabular-nums">~{Math.round(totalLeadsActual)} leads</p>
                  </div>
                  {/* Óptima */}
                  <div className="bg-white rounded-xl p-4 space-y-2.5 border border-brand/30 shadow-sm">
                    <p className="text-[10px] text-brand font-bold uppercase tracking-widest">Distribución óptima</p>
                    {PLATAFORMAS.filter(p => estado[p].activa).map((p) => (
                      <div key={p} className="flex items-center gap-2 text-xs">
                        <span className={`w-14 shrink-0 ${PLAT_CONFIG[p].color} font-semibold`}>{PLAT_CONFIG[p].label.replace(" Ads","")}</span>
                        <div className="flex-1 bg-brand/15 rounded-full h-1.5">
                          <div className="h-full rounded-full bg-brand"
                            style={{ width: `${optimoDistribucion[p]}%` }} />
                        </div>
                        <span className="text-brand w-8 text-right font-semibold">{optimoDistribucion[p]}%</span>
                      </div>
                    ))}
                    <p className="text-sm font-black text-brand pt-1 tabular-nums">
                      ~{Math.round(totalLeadsOptimo)} leads <span className="text-xs font-semibold">(+{Math.round(gananciaLeads)})</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={aplicarOptimo}
                  className="w-full text-xs font-semibold py-2.5 bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Zap size={12} /> Aplicar distribución óptima
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Datos históricos (collapsible) ── */}
      {historico.length > 0 && (
        <div className={`${GLASS_BASE} overflow-hidden`}>
          <button
            onClick={() => setMostrarDatos(!mostrarDatos)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition"
          >
            <span className="text-sm font-bold text-slate-800">Historial por plataforma</span>
            {mostrarDatos ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
          </button>
          {mostrarDatos && (
            <div className="border-t border-slate-100 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                    <th className="px-3 py-2.5 text-left font-medium">Plataforma</th>
                    <th className="px-3 py-2.5 text-right font-medium">Campañas</th>
                    <th className="px-3 py-2.5 text-right font-medium">Gasto total</th>
                    <th className="px-3 py-2.5 text-right font-medium">Leads</th>
                    <th className="px-3 py-2.5 text-right font-medium">CPL prom.</th>
                    <th className="px-3 py-2.5 text-right font-medium">CTR prom.</th>
                    <th className="px-3 py-2.5 text-right font-medium">Meses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historico.map((h) => (
                    <tr key={h.plataforma} className="hover:bg-slate-50/60 transition">
                      <td className="px-3 py-2.5">
                        <span className={`font-semibold ${PLAT_CONFIG[h.plataforma as Plataforma]?.color ?? "text-zinc-700"}`}>
                          {PLAT_CONFIG[h.plataforma as Plataforma]?.label ?? h.plataforma}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-zinc-600">{h.campanas}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-700 font-medium">{FMT_SOL(Number(h.gasto_total))}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-600">{Number(h.leads_total).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`font-bold ${Number(h.cpl_promedio) > 200 ? "text-red-600" : Number(h.cpl_promedio) > 100 ? "text-amber-600" : "text-green-600"}`}>
                          {Number(h.cpl_promedio) > 0 ? FMT_SOL(Number(h.cpl_promedio)) : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-zinc-600">{FMT_PCT(Number(h.ctr_promedio))}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-400">{h.meses_con_datos}</td>
                    </tr>
                  ))}
                  {PLATAFORMAS.filter(p => !historico.find(h => h.plataforma === p)).map((p) => (
                    <tr key={p} className="opacity-50">
                      <td className="px-3 py-2.5">
                        <span className={`font-semibold ${PLAT_CONFIG[p].color}`}>{PLAT_CONFIG[p].label}</span>
                      </td>
                      <td colSpan={6} className="px-3 py-2.5 text-zinc-400 italic text-[11px]">Sin historial — usa CPL estimado en la tarjeta</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

// ── Sub-componentes ──────────────────────────────────────────────────────────
function ResultKpi({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    violet: "text-violet-700", emerald: "text-emerald-700",
    green: "text-green-600", red: "text-red-600", zinc: "text-slate-700",
  };
  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 space-y-1">
      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{label}</p>
      <p className={`text-xl font-black tabular-nums leading-tight ${colors[color] ?? colors.zinc}`}>{value}</p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </div>
  );
}
