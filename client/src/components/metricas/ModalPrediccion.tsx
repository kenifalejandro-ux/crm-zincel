/** client/src/components/metricas/ModalPrediccion.tsx */

import { useState } from "react";
import { X, TrendingUp, AlertTriangle, Lightbulb, BarChart2, GitCompare, FlaskConical, Target } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { COLORS, MODAL_BASE, BADGE_BASE, INPUT_BASE, PANEL_BASE } from "../../lib/tokens";

const CPL_BENCHMARK = 80;
const C_REAL = COLORS.muted;
const C_PROY = COLORS.primary;

interface DatosReales {
  gasto:         number;
  clics:         number;
  impresiones:   number;
  alcance:       number;
  mensajes:      number;
  leads:         number;
  conversiones:  number;
  ventas:        number;
  ctr:           number;
  cpc:           number;
  cpm:           number;
  diasHistorial: number;
}

interface Props {
  datos:            DatosReales;
  presupuestoExtra: number;
  onCerrar:         () => void;
}

type TabModal = "embudo" | "simulador" | "comparativa";

const TABS_MODAL: { key: TabModal; label: string; icon: React.ReactNode }[] = [
  { key: "embudo",      label: "Embudo",     icon: <BarChart2   size={13} /> },
  { key: "simulador",   label: "Simulador",  icon: <FlaskConical size={13} /> },
  { key: "comparativa", label: "Datos",      icon: <GitCompare  size={13} /> },
];

export function ModalPrediccion({ datos, presupuestoExtra, onCerrar }: Props) {
  const [tab,          setTab]          = useState<TabModal>("embudo");
  const [cplObjetivo,  setCplObjetivo]  = useState(CPL_BENCHMARK);
  const [tasaSim,      setTasaSim]      = useState(30);
  const [budgetSim,    setBudgetSim]    = useState(presupuestoExtra || 3000);
  const [tipoSim,      setTipoSim]      = useState<"if" | "mensajes">("if");
  const [costoMsgSim,  setCostoMsgSim]  = useState(4.5); // costo/mensaje esperado

  const totalNuevo = datos.gasto + presupuestoExtra;
  const factor     = totalNuevo / datos.gasto;

  const p = {
    impresiones:  Math.round(datos.impresiones  * factor),
    alcance:      Math.round(datos.alcance      * factor),
    clics:        Math.round(datos.clics        * factor),
    mensajes:     Math.round(datos.mensajes     * factor),
    leads:        Math.round(datos.leads        * factor),
    conversiones: Math.round(datos.conversiones * factor),
    ventas:       Math.round(datos.ventas       * factor),
    ctr:          datos.ctr,
    cpc:          datos.cpc,
    cpm:          datos.cpm,
  };

  const cplReal      = datos.leads > 0 ? datos.gasto / datos.leads : 0;
  const frecuencia   = datos.impresiones > 0 && datos.alcance > 0 ? datos.impresiones / datos.alcance : 0;

  // ── Score de campaña ─────────────────────────────────────────────────────────
  const score = Math.min(
    50 + (datos.ctr >= 3 ? 20 : 0) + (datos.ctr >= 5 ? 10 : 0) + (frecuencia < 2 ? 10 : 0) + (datos.mensajes > 0 ? 10 : 0),
    100
  );
  const scoreLabel = score >= 80 ? "Excelente" : score >= 60 ? "Buena" : "Regular";
  const scoreColor = score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-500" : "text-red-500";
  const scoreBg    = score >= 80 ? "bg-green-50 border-green-200" : score >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  // ── Cálculos simulador ───────────────────────────────────────────────────────
  const leadsSimIF       = cplObjetivo > 0 ? Math.round(budgetSim / cplObjetivo) : 0;
  const ventasSimIF      = Math.round(leadsSimIF * tasaSim / 100);
  const mensajesSimMsg   = costoMsgSim > 0 ? Math.round(budgetSim / costoMsgSim) : 0;
  const ventasSimMsg     = Math.round(mensajesSimMsg * (tasaSim / 100) * 0.3); // tasa mensajes→venta ~30% de tasa IF

  // Caminos predefinidos con el budget del simulador
  const caminos = [
    { id: "A", label: "Optimización básica",      reduccion: 0.30, color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
    { id: "B", label: "Lead Generation activo",   reduccion: 0.60, color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
    { id: "C", label: "Benchmark S/" + CPL_BENCHMARK, reduccion: cplReal > 0 ? 1 - CPL_BENCHMARK / cplReal : 0, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  ];

  // ── Datos para charts ────────────────────────────────────────────────────────
  const barData = [
    { name: "Impresiones", real: datos.impresiones, proyectado: p.impresiones },
    { name: "Alcance",     real: datos.alcance,     proyectado: p.alcance     },
    { name: "Clics",       real: datos.clics,       proyectado: p.clics       },
    { name: "Mensajes",    real: datos.mensajes,    proyectado: p.mensajes    },
  ];

  const radarData = [
    { metric: "CTR",       real: Math.min(datos.ctr * 10, 100),                              proyectado: Math.min(p.ctr * 10, 100) },
    { metric: "Alcance",   real: Math.min((datos.alcance / Math.max(p.alcance, 1)) * 100, 100), proyectado: 100 },
    { metric: "Clics",     real: Math.min((datos.clics / Math.max(p.clics, 1)) * 100, 100),     proyectado: 100 },
    { metric: "Eficiencia",real: Math.min(100 - datos.cpc * 5, 100),                         proyectado: Math.min(100 - p.cpc * 5, 100) },
    { metric: "Frecuencia",real: Math.min((2 / Math.max(frecuencia, 0.1)) * 100, 100),        proyectado: Math.min((2 / Math.max(frecuencia, 0.1)) * 100, 100) },
  ];

  const funnelStages = [
    { label: "Impresiones", tag: "TOFU",    tagColor: "bg-blue-100 text-blue-700",     real: datos.impresiones, proy: p.impresiones,  color: COLORS.primaryLight, extra: null },
    { label: "Alcance",     tag: "TOFU",    tagColor: "bg-blue-100 text-blue-700",     real: datos.alcance,     proy: p.alcance,      color: COLORS.muted,        extra: null },
    { label: "Clics",       tag: "MOFU",    tagColor: "bg-purple-100 text-purple-700", real: datos.clics,       proy: p.clics,        color: COLORS.primary,      extra: datos.ctr > 0 ? `CTR ${datos.ctr.toFixed(2)}%` : null },
    { label: "Mensajes",    tag: "MOFU",    tagColor: "bg-purple-100 text-purple-700", real: datos.mensajes,    proy: p.mensajes,     color: COLORS.primaryHover, extra: datos.mensajes > 0 && datos.clics > 0 ? `${((datos.mensajes / datos.clics) * 100).toFixed(1)}% de clics` : null },
    { label: "Leads",       tag: "DOFU",    tagColor: "bg-amber-100 text-amber-700",   real: datos.leads,       proy: p.leads,        color: "#f59e0b",           extra: cplReal > 0 ? `CPL S/ ${cplReal.toFixed(0)}` : "Sin Instant Form" },
    { label: "Conversiones",tag: "BOFU",    tagColor: "bg-orange-100 text-orange-700", real: datos.conversiones,proy: p.conversiones, color: "#ea580c",           extra: null },
    { label: "Ventas",      tag: "REVENUE", tagColor: "bg-green-100 text-green-700",   real: datos.ventas,      proy: p.ventas,       color: "#16a34a",           extra: null },
  ];
  const maxVal = Math.max(p.impresiones, 1);

  const cuellos = datos.clics === 0
    ? "Impresiones → Clics (nadie hace clic)"
    : datos.mensajes === 0 && datos.leads === 0
    ? "Clics → Mensajes (nadie escribe ni deja datos)"
    : datos.leads === 0
    ? "Mensajes → Leads (mensajes pero sin formulario)"
    : "Leads → Ventas (leads sin seguimiento)";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className={`${MODAL_BASE} w-full sm:max-w-xl sm:rounded-2xl flex flex-col max-h-[92vh]`}>

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`${BADGE_BASE} text-[11px] font-semibold text-zinc-300 px-2 py-0.5`}>Simulador de campaña</span>
                <span className="text-[11px] text-zinc-400">{datos.diasHistorial} días de historial</span>
              </div>
              <h2 className="text-sm font-bold text-zinc-100">¿Qué pasaría con S/ {presupuestoExtra} más?</h2>
              <div className="flex items-center gap-1.5 mt-1 text-xs flex-wrap">
                <span className="text-zinc-500">S/ {datos.gasto.toFixed(2)}</span>
                <span className="text-zinc-300">+</span>
                <span className="text-[#ceab11] font-semibold">S/ {presupuestoExtra}</span>
                <span className="text-zinc-300">=</span>
                <span className="font-bold text-zinc-100">S/ {totalNuevo.toFixed(2)}</span>
                <span className={`${BADGE_BASE} text-zinc-500 px-1.5 py-0.5 text-[10px]`}>×{factor.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-zinc-800 transition shrink-0">
              <X size={15} className="text-zinc-500" />
            </button>
          </div>

          <div className="flex gap-1 mt-4 bg-zinc-800 rounded-xl p-1">
            {TABS_MODAL.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  tab === t.key ? "bg-slate-800/60 shadow-sm text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contenido ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ══ EMBUDO ══ */}
          {tab === "embudo" && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-400 inline-block"/> Real</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: C_PROY }}/> Proyectado</span>
              </div>

              <div className="space-y-4">
                {funnelStages.map((s) => {
                  const pctReal = (s.real / maxVal) * 100;
                  const pctProy = (s.proy / maxVal) * 100;
                  return (
                    <div key={s.label} className="space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-300">{s.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.tagColor}`}>{s.tag}</span>
                          {s.extra && (
                            <span className={`${BADGE_BASE} text-[10px] px-1.5 py-0.5 font-medium ${ s.label === "Leads" && cplReal > CPL_BENCHMARK ? "bg-red-100 text-red-600" : s.label === "Leads" && cplReal > 0 ? "bg-green-100 text-green-600" : "bg-zinc-800 text-zinc-500" }`}>{s.extra}</span>
                          )}
                        </div>
                        <div className="text-xs flex items-center gap-2">
                          <span className="text-zinc-400">{s.real.toLocaleString()}</span>
                          <span className="text-zinc-300">→</span>
                          <span className="font-bold text-[#ceab11]">~{s.proy.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="absolute inset-0 rounded-full opacity-30" style={{ width: `${pctProy}%`, backgroundColor: s.color }} />
                        <div className="absolute inset-0 rounded-full" style={{ width: `${pctReal}%`, backgroundColor: s.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-700">Cuello de botella</p>
                  <p className="text-xs text-red-600 mt-0.5">{cuellos}</p>
                </div>
              </div>

              <div className={`rounded-xl border px-4 py-3 flex items-center gap-4 ${scoreBg}`}>
                <div className="text-center shrink-0">
                  <p className={`text-2xl font-black ${scoreColor}`}>{score}</p>
                  <p className="text-[10px] text-zinc-500">/100</p>
                </div>
                <div>
                  <p className={`text-sm font-bold ${scoreColor}`}>Campaña {scoreLabel}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {score >= 80 ? "Excelente base para escalar." : score >= 60 ? "Buena con margen de mejora. Aplica las recomendaciones antes de escalar." : "Necesita optimización antes de escalar presupuesto."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══ SIMULADOR ══ */}
          {tab === "simulador" && (
            <div className="space-y-5">
              <p className="text-xs text-zinc-500">Simula la próxima campaña ajustando el presupuesto, tipo y CPL objetivo. Los caminos A/B/C te muestran qué esperar según la estrategia.</p>

              {/* Inputs */}
              <div className={`${PANEL_BASE} p-4 space-y-3`}>
                <p className="text-xs font-semibold text-zinc-300">Parámetros de la próxima campaña</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-[10px] text-zinc-500">Presupuesto (S/)</span>
                    <input type="number" value={budgetSim} onChange={(e) => setBudgetSim(Number(e.target.value))}
                      className={`${INPUT_BASE} w-full text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/30`} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] text-zinc-500">Tasa de cierre (%)</span>
                    <input type="number" min={0} max={100} value={tasaSim} onChange={(e) => setTasaSim(Number(e.target.value))}
                      className={`${INPUT_BASE} w-full text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/30`} />
                  </label>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-1.5">Tipo de campaña</span>
                  <div className="flex gap-2">
                    {[{ k: "if" as const, l: "Instant Form" }, { k: "mensajes" as const, l: "Mensajes / Tráfico" }].map((t) => (
                      <button key={t.k} onClick={() => setTipoSim(t.k)}
                        className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition ${tipoSim === t.k ? "bg-zinc-900 text-white border-zinc-900" : "bg-slate-800/60 text-zinc-400 border-white/10 hover:border-zinc-400"}`}>
                        {t.l}
                      </button>
                    ))}
                  </div>
                </div>
                {tipoSim === "if" && (
                  <label className="space-y-1">
                    <span className="text-[10px] text-zinc-500">CPL objetivo (S/) — benchmark S/ {CPL_BENCHMARK}</span>
                    <input type="number" min={1} value={cplObjetivo} onChange={(e) => setCplObjetivo(Number(e.target.value))}
                      className={`${INPUT_BASE} w-full text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/30`} />
                    {cplReal > 0 && (
                      <p className="text-[10px] text-zinc-400">CPL actual histórico: S/ {cplReal.toFixed(0)} — benchmark: S/ {CPL_BENCHMARK}</p>
                    )}
                  </label>
                )}
                {tipoSim === "mensajes" && (
                  <label className="space-y-1">
                    <span className="text-[10px] text-zinc-500">Costo objetivo por mensaje (S/)</span>
                    <input type="number" min={0.1} step={0.1} value={costoMsgSim} onChange={(e) => setCostoMsgSim(Number(e.target.value))}
                      className={`${INPUT_BASE} w-full text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/30`} />
                  </label>
                )}
              </div>

              {/* Resultado de simulación */}
              {tipoSim === "if" && (
                <div className={`rounded-xl border p-4 space-y-3 ${cplObjetivo <= CPL_BENCHMARK ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                  <div className="flex items-center gap-2">
                    <Target size={14} className={cplObjetivo <= CPL_BENCHMARK ? "text-green-600" : "text-amber-500"} />
                    <p className="text-xs font-bold text-zinc-200">Proyección — Instant Form con CPL S/ {cplObjetivo}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-[10px] text-zinc-400">Presupuesto</p><p className="text-base font-bold text-zinc-200">S/ {budgetSim.toLocaleString("es-PE")}</p></div>
                    <div><p className="text-[10px] text-zinc-400">Leads</p><p className={`text-base font-bold ${cplObjetivo <= CPL_BENCHMARK ? "text-green-600" : "text-amber-600"}`}>~{leadsSimIF}</p></div>
                    <div><p className="text-[10px] text-zinc-400">Ventas est.</p><p className="text-base font-bold text-zinc-200">~{ventasSimIF}</p></div>
                  </div>
                  {cplReal > 0 && (
                    <p className="text-[10px] text-zinc-500 border-t border-white/10 pt-2">
                      vs historial con S/ {budgetSim.toLocaleString("es-PE")}: ~{Math.round(budgetSim / cplReal)} leads al CPL actual (S/ {cplReal.toFixed(0)})
                    </p>
                  )}
                </div>
              )}

              {tipoSim === "mensajes" && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-blue-600" />
                    <p className="text-xs font-bold text-zinc-200">Proyección — Tráfico/Mensajes con S/ {costoMsgSim}/mensaje</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-[10px] text-zinc-400">Presupuesto</p><p className="text-base font-bold text-zinc-200">S/ {budgetSim.toLocaleString("es-PE")}</p></div>
                    <div><p className="text-[10px] text-zinc-400">Mensajes</p><p className="text-base font-bold text-blue-600">~{mensajesSimMsg.toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-zinc-400">Ventas est.</p><p className="text-base font-bold text-zinc-200">~{ventasSimMsg}</p></div>
                  </div>
                  <p className="text-[10px] text-zinc-400 border-t border-blue-200 pt-2">
                    Tasa de cierre mensajes estimada: {(tasaSim * 0.3).toFixed(1)}% (mensajes no filtrados tienen menor calidad que Instant Form)
                  </p>
                </div>
              )}

              {/* Caminos A / B / C aplicados al budget del simulador */}
              {tipoSim === "if" && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-400">Caminos según estrategia — con S/ {budgetSim.toLocaleString("es-PE")}</p>
                  {caminos.map((c) => {
                    const cplC = cplReal > 0 ? Math.round(cplReal * (1 - c.reduccion)) : cplObjetivo;
                    const leadsC = cplC > 0 ? Math.round(budgetSim / cplC) : 0;
                    const ventasC = Math.round(leadsC * tasaSim / 100);
                    return (
                      <div key={c.id} className={`rounded-xl border ${c.bg} px-4 py-3 flex items-center justify-between gap-2 flex-wrap`}>
                        <div>
                          <p className="text-xs font-semibold text-zinc-200">Camino {c.id} — {c.label}</p>
                          <p className="text-[10px] text-zinc-500">CPL objetivo: S/ {cplC}</p>
                        </div>
                        <div className="flex gap-4 text-center">
                          <div><p className="text-[10px] text-zinc-400">Leads</p><p className={`text-sm font-bold ${c.color}`}>~{leadsC}</p></div>
                          <div><p className="text-[10px] text-zinc-400">Ventas</p><p className="text-sm font-bold text-zinc-200">~{ventasC}</p></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-[11px] text-zinc-400 text-center">
                Proyección estimada · {datos.diasHistorial} días de historial · margen ±10–15%
              </p>
            </div>
          )}

          {/* ══ DATOS ══ */}
          {tab === "comparativa" && (
            <div className="space-y-5">
              <p className="text-xs text-zinc-500">Comparación visual entre métricas reales y proyectadas con S/ {presupuestoExtra} adicionales.</p>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-400">Volumen: Real vs Proyectado</p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block"/> Real</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: C_PROY }}/> Proyectado</span>
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} barCategoryGap="30%" margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }} formatter={(val) => [Number(val).toLocaleString(), ""]} />
                      <Bar filter="url(#neon-glow)" dataKey="real"       name="Real"       fill={C_REAL} radius={[4,4,0,0]} />
                      <Bar filter="url(#neon-glow)" dataKey="proyectado" name="Proyectado" fill={C_PROY} radius={[4,4,0,0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e4e4e7" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#71717a" }} />
                    <Radar filter="url(#neon-glow)" name="Real"       dataKey="real"       fill={C_REAL} fillOpacity={0.3} stroke={C_REAL} strokeWidth={1.5} />
                    <Radar filter="url(#neon-glow)" name="Proyectado" dataKey="proyectado" fill={C_PROY} fillOpacity={0.2} stroke={C_PROY} strokeWidth={2} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }} formatter={(val, name) => [`${Number(val).toFixed(1)}`, name as string]} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-800/40">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-zinc-100 font-medium">Métrica</th>
                      <th className="text-right px-3 py-2.5 text-zinc-100 font-medium">Real</th>
                      <th className="text-right px-3 py-2.5 text-[#ceab11] font-medium">Proyectado</th>
                      <th className="text-right px-3 py-2.5 text-green-600 font-medium">Δ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { l: "Inversión",    r: `S/${datos.gasto.toFixed(2)}`,             pr: `S/${totalNuevo.toFixed(2)}`,          delta: `+S/${presupuestoExtra}`,             esc: true  },
                      { l: "Impresiones",  r: datos.impresiones.toLocaleString(),         pr: `~${p.impresiones.toLocaleString()}`,  delta: `+${((factor-1)*100).toFixed(0)}%`,  esc: true  },
                      { l: "Alcance",      r: datos.alcance.toLocaleString(),             pr: `~${p.alcance.toLocaleString()}`,      delta: `+${((factor-1)*100).toFixed(0)}%`,  esc: true  },
                      { l: "Clics",        r: datos.clics.toLocaleString(),               pr: `~${p.clics.toLocaleString()}`,        delta: `+${(p.clics-datos.clics).toLocaleString()}`, esc: true },
                      { l: "Mensajes",     r: datos.mensajes.toLocaleString(),            pr: `~${p.mensajes.toLocaleString()}`,     delta: `+${(p.mensajes-datos.mensajes).toLocaleString()}`, esc: true },
                      { l: "Leads (IF)",   r: datos.leads.toLocaleString(),               pr: `~${p.leads.toLocaleString()}`,        delta: `+${(p.leads-datos.leads).toLocaleString()}`, esc: true },
                      { l: "CPL",          r: cplReal > 0 ? `S/${cplReal.toFixed(0)}` : "—", pr: cplReal > 0 ? `S/${cplReal.toFixed(0)}` : "—", delta: "=", esc: false },
                      { l: "CTR",          r: `${datos.ctr.toFixed(2)}%`,                pr: `${p.ctr.toFixed(2)}%`,               delta: "=",                                  esc: false },
                      { l: "CPC",          r: `S/${datos.cpc.toFixed(2)}`,               pr: `S/${p.cpc.toFixed(2)}`,              delta: "=",                                  esc: false },
                    ].map((row) => (
                      <tr key={row.l} className="hover:bg-zinc-800/40">
                        <td className="px-3 py-2 text-zinc-300 font-medium">{row.l}</td>
                        <td className="px-3 py-2 text-right text-zinc-500">{row.r}</td>
                        <td className="px-3 py-2 text-right text-[#b08d47] font-semibold">{row.pr}</td>
                        <td className={`px-3 py-2 text-right font-medium ${row.esc ? "text-green-600" : "text-zinc-400"}`}>{row.delta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`${PANEL_BASE} p-4 space-y-2`}>
                <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Lightbulb size={12} className="text-amber-500" /> Próximos pasos recomendados
                </p>
                <ol className="space-y-1.5 text-xs text-zinc-400 list-decimal list-inside">
                  <li>Activar Instant Form para capturar leads directamente y medir CPL real.</li>
                  <li>Preguntas filtro en el formulario: ¿busca para vivir o invertir? ¿tiene presupuesto?</li>
                  <li>Conectar webhook para que los leads lleguen al CRM automáticamente.</li>
                  <li>Notificar al vendedor en &lt;5 min desde que llega el lead.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        <div className="px-5 pb-5 pt-3 border-t border-white/8">
          <button onClick={onCerrar} className="w-full py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
