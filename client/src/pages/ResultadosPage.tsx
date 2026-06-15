/** client/src/pages/ResultadosPage.tsx — REDISEÑO NEON
 * Cambios SOLO de presentación. Lógica (carga, filtros, alta/edición/borrado,
 * atribución multi-campaña, KPIs) INTACTA.
 *
 * Migrado de tema claro → neon:
 *  - KPIs: ahora con chip de icono + número con glow (antes labels text-zinc-100 lavados).
 *  - CONFIANZA_CFG: bg-emerald-50/amber-50/zinc-50 → chips translúcidos neon.
 *  - Tablas "por empresa" y principal: thead/divide/hover de tema claro → neon.
 *  - Modal: error bg-red-50, lista de campañas bg-violet-50, botones bg-brand → neon.
 *  - Fix typo del build: hover:bg-white/8/5/60 → hover:bg-white/[0.03].
 */

import { useEffect, useState } from "react";
import { Trophy, Plus, Trash2, Pencil, TrendingUp, DollarSign, ShoppingBag, Check, HelpCircle } from "lucide-react";
import { listarResultados, crearResultado, actualizarResultado, eliminarResultado } from "../services/resultados.api";
import { getMetricas } from "../services/metricas.api";
import type { Resultado, ResultadoInput, ConfianzaAtribucion } from "../types/resultado.types";
import type { Metrica } from "../types/metricas.types";
import { GLASS_BASE, MODAL_BASE, INPUT_BASE } from "../lib/tokens";

const EMPTY_FORM: ResultadoInput = {
  empresa:              "",
  metrica_ids:          [],
  campana_nombre:       "",
  proyecto:             "",
  monto:                0,
  costo_venta:          0,
  fecha_venta:          new Date().toISOString().slice(0, 10),
  confianza_atribucion: "confirmada",
  notas:                "",
};

// ── helpers ──────────────────────────────────────────────────────────────────
const S = (v: number) => `S/ ${v.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;

const CONFIANZA_CFG: Record<ConfianzaAtribucion, { label: string; color: string; bg: string; desc: string }> = {
  confirmada: {
    label: "Confirmada",
    color: "text-emerald-300",
    bg:    "bg-emerald-500/12 border-emerald-500/30",
    desc:  "Sabes exactamente qué campaña cerró la venta",
  },
  probable: {
    label: "Probable",
    color: "text-amber-300",
    bg:    "bg-amber-500/12 border-amber-500/30",
    desc:  "La campaña es la más probable pero no es seguro",
  },
  sin_datos: {
    label: "Sin datos",
    color: "text-zinc-400",
    bg:    "bg-white/[0.05] border-white/10",
    desc:  "No se puede identificar la campaña de origen",
  },
};

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [metricas,   setMetricas]   = useState<Metrica[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [editando,   setEditando]   = useState<Resultado | null>(null);
  const [form,       setForm]       = useState<ResultadoInput>(EMPTY_FORM);
  const [guardando,  setGuardando]  = useState(false);
  const [filtroEmp,  setFiltroEmp]  = useState("");
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [errorCarga,   setErrorCarga]   = useState<string | null>(null);

  useEffect(() => {
    getMetricas({}).then(setMetricas).catch(() => {});
  }, []);

  const cargar = async (emp: string) => {
    setLoading(true);
    try {
      const r = await listarResultados(emp ? { empresa: emp } : {});
      setResultados(Array.isArray(r) ? r : []);
    } catch (e: any) {
      setErrorCarga(e?.response?.data?.message ?? e?.message ?? "Error al cargar");
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(filtroEmp); }, [filtroEmp]);

  const empresas            = [...new Set(metricas.map((m) => m.empresa))].sort();
  const campanasDeLaEmpresa = metricas
    .filter((m) => !form.empresa || m.empresa === form.empresa)
    .sort((a, b) => b.periodo_inicio.localeCompare(a.periodo_inicio)); // más recientes primero

  // ── Toggle campaña ───────────────────────────────────────────────────────
  const toggleCampana = (metricaId: string) => {
    setForm((f) => {
      const ya       = f.metrica_ids.includes(metricaId);
      const nuevosIds = ya
        ? f.metrica_ids.filter((id) => id !== metricaId)
        : [...f.metrica_ids, metricaId];
      const primero  = metricas.find((x) => x.id === nuevosIds[0]);
      return {
        ...f,
        metrica_ids:    nuevosIds,
        campana_nombre: primero?.campana_nombre ?? f.campana_nombre,
      };
    });
  };

  // ── Modales ──────────────────────────────────────────────────────────────
  const abrirNuevo = () => {
    setEditando(null);
    setForm({ ...EMPTY_FORM, fecha_venta: new Date().toISOString().slice(0, 10) });
    setErrorGuardar(null);
    setModal(true);
  };

  const abrirEditar = (r: Resultado) => {
    setErrorGuardar(null);
    setEditando(r);
    const ids     = r.metrica_ids?.length ? r.metrica_ids : r.metrica_id ? [r.metrica_id] : [];
    const primero = metricas.find((x) => x.id === ids[0]);
    setForm({
      empresa:              r.empresa,
      metrica_ids:          ids,
      campana_nombre:       r.campana_nombre,
      proyecto:             r.proyecto ?? "",
      monto:                Number(r.monto),
      costo_venta:          Number(r.costo_venta ?? 0),
      fecha_venta:          r.fecha_venta.slice(0, 10),
      confianza_atribucion: r.confianza_atribucion ?? "confirmada",
      notas:                r.notas ?? "",
    });
    void primero;
    setModal(true);
  };

  // ── Guardar ──────────────────────────────────────────────────────────────
  const guardar = async () => {
    if (!form.empresa || form.monto <= 0 || !form.fecha_venta) return;
    const payload: ResultadoInput = {
      ...form,
      campana_nombre: form.metrica_ids.length > 0
        ? form.campana_nombre
        : form.campana_nombre || "Sin campaña identificada",
    };
    setGuardando(true);
    setErrorGuardar(null);
    try {
      if (editando) {
        await actualizarResultado(editando.id, payload);
      } else {
        await crearResultado(payload);
      }
      setModal(false);
      await cargar(filtroEmp);
    } catch (e: any) {
      setErrorGuardar(
        e?.response?.data?.errors?.[0]?.message ??
        e?.response?.data?.message ??
        "Error al guardar."
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este resultado?")) return;
    await eliminarResultado(id);
    await cargar(filtroEmp);
  };

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalIngresos  = resultados.reduce((a, r) => a + Number(r.monto), 0);
  const totalVentas    = resultados.length;
  const ticketPromedio = totalVentas > 0 ? totalIngresos / totalVentas : 0;

  const porEmpresa = resultados.reduce<Record<string, { ventas: number; ingresos: number }>>((acc, r) => {
    if (!acc[r.empresa]) acc[r.empresa] = { ventas: 0, ingresos: 0 };
    acc[r.empresa].ventas++;
    acc[r.empresa].ingresos += Number(r.monto);
    return acc;
  }, {});

  const KPIS = [
    { label: "Total ingresos atribuidos", value: S(totalIngresos), Icon: DollarSign, hex: "#34d399" },
    { label: "Total ventas registradas",  value: String(totalVentas), Icon: ShoppingBag, hex: "accent" },
    { label: "Ticket promedio",           value: S(ticketPromedio), Icon: TrendingUp, hex: "#a855f7" },
  ];
  const solid = (h: string) => h === "accent" ? "rgb(var(--accent))" : h;
  const glow  = (h: string) => h === "accent" ? "rgb(var(--accent) / calc(0.45*var(--glow)))" : `${h}55`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="crm-section-accent h-8" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Comercial</p>
            <h1 className="font-display text-2xl font-bold text-zinc-50 tracking-tight">Resultados de campaña</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Ventas atribuidas a campañas publicitarias</p>
          </div>
        </div>
        <button onClick={abrirNuevo} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl">
          <Plus size={15} /> Registrar venta
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {KPIS.map((k) => (
          <div key={k.label} className={`${GLASS_BASE} px-5 py-5`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: k.hex === "accent" ? "rgb(var(--accent) / 0.12)" : `${k.hex}1a`, border: `1px solid ${k.hex === "accent" ? "rgb(var(--accent) / 0.3)" : k.hex + "40"}`, color: solid(k.hex) }}>
                <k.Icon size={16} />
              </div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest leading-tight">{k.label}</p>
            </div>
            <p className="font-display text-3xl font-bold tabular-nums leading-tight" style={{ color: solid(k.hex), textShadow: `0 0 16px ${glow(k.hex)}` }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Resumen por empresa ── */}
      {Object.keys(porEmpresa).length > 0 && (
        <div className={`${GLASS_BASE} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-white/[0.08]">
            <p className="text-sm font-bold text-zinc-200">Por empresa</p>
          </div>
          <table className="w-full text-xs">
            <thead className="border-b border-white/[0.08] text-zinc-500 uppercase text-[10px]">
              <tr>
                <th className="px-5 py-2.5 text-left font-semibold">Empresa</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ventas</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ingresos</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ticket promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {Object.entries(porEmpresa).map(([emp, d]) => (
                <tr key={emp} className="hover:bg-white/[0.03] transition">
                  <td className="px-5 py-3 font-semibold text-zinc-200">{emp}</td>
                  <td className="px-4 py-3 text-right text-accent font-medium">{d.ventas}</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-bold">{S(d.ingresos)}</td>
                  <td className="px-4 py-3 text-right text-zinc-400">{S(d.ingresos / d.ventas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm font-semibold text-zinc-200">Todas las ventas</p>
          <select
            value={filtroEmp}
            onChange={(e) => setFiltroEmp(e.target.value)}
            className={`${INPUT_BASE} text-xs px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30`}
          >
            <option value="">Todas las empresas</option>
            {empresas.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className={`${GLASS_BASE} overflow-hidden`}>
          {loading ? (
            <div className="p-10 text-center text-zinc-500 text-sm">Cargando...</div>
          ) : errorCarga ? (
            <div className="p-6 text-center text-red-300 text-xs font-mono bg-red-500/[0.08]">{errorCarga}</div>
          ) : resultados.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Trophy size={32} className="text-accent mx-auto" />
              <p className="text-sm text-zinc-400">Sin ventas registradas aún</p>
              <button onClick={abrirNuevo} className="text-xs text-accent hover:underline">Registrar primera venta</button>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="border-b border-white/[0.08] text-zinc-500 uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Empresa</th>
                  <th className="px-4 py-2.5 text-left font-medium">Campaña(s)</th>
                  <th className="px-4 py-2.5 text-left font-medium">Atribución</th>
                  <th className="px-4 py-2.5 text-left font-medium">Proyecto</th>
                  <th className="px-4 py-2.5 text-right font-medium">Monto</th>
                  <th className="px-4 py-2.5 text-right font-medium">Costo</th>
                  <th className="px-4 py-2.5 text-right font-medium">Margen</th>
                  <th className="px-4 py-2.5 text-center font-medium">Fecha</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {resultados.map((r) => {
                  const monto    = Number(r.monto);
                  const costo    = Number(r.costo_venta ?? 0);
                  const margen   = monto > 0 ? ((monto - costo) / monto) * 100 : 0;
                  const conf     = r.confianza_atribucion ?? "confirmada";
                  const confCfg  = CONFIANZA_CFG[conf];
                  const numCamps = r.metrica_ids?.length ?? (r.metrica_id ? 1 : 0);
                  return (
                    <tr key={r.id} className="hover:bg-white/[0.03] transition">
                      <td className="px-5 py-3 font-medium text-zinc-200">{r.empresa}</td>
                      <td className="px-4 py-3 text-zinc-400 max-w-[180px]">
                        {r.metrica_id || numCamps > 0 ? (
                          <>
                            <span className="truncate block">{r.campana_nombre}</span>
                            {numCamps > 1 && (
                              <span className="text-[10px] text-violet-400">+{numCamps - 1} adicional{numCamps - 1 > 1 ? "es" : ""}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-zinc-500 italic flex items-center gap-1">
                            <HelpCircle size={10} /> Sin identificar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${confCfg.bg} ${confCfg.color}`}>
                          {confCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{r.proyecto ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">{S(monto)}</td>
                      <td className="px-4 py-3 text-right text-red-400">
                        {costo > 0 ? S(costo) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {costo > 0
                          ? <span className={margen >= 50 ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>{margen.toFixed(1)}%</span>
                          : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-500">
                        {new Date(r.fecha_venta).toLocaleDateString("es-PE")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => abrirEditar(r)} className="text-zinc-500 hover:text-accent transition"><Pencil size={13} /></button>
                          <button onClick={() => eliminar(r.id)} className="text-zinc-500 hover:text-red-400 transition"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`${MODAL_BASE} w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto`}>
            <h2 className="text-sm font-bold text-zinc-100">
              {editando ? "Editar venta" : "Registrar venta"}
            </h2>

            {errorGuardar && (
              <div className="rounded-lg bg-red-500/[0.08] border border-red-500/30 px-3 py-2 text-xs text-red-300">
                {errorGuardar}
              </div>
            )}

            <div className="space-y-4">
              {/* Empresa */}
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Empresa *</span>
                <select
                  value={form.empresa}
                  onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value, metrica_ids: [], campana_nombre: "" }))}
                  className={`${INPUT_BASE} w-full text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30`}
                >
                  <option value="">Selecciona empresa</option>
                  {empresas.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </label>

              {/* Confianza de atribución */}
              <div className="space-y-1.5">
                <span className="text-xs text-zinc-500">¿Qué tan seguro es el origen de esta venta?</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["confirmada", "probable", "sin_datos"] as ConfianzaAtribucion[]).map((c) => {
                    const cfg = CONFIANZA_CFG[c];
                    const sel = form.confianza_atribucion === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, confianza_atribucion: c, metrica_ids: c === "sin_datos" ? [] : f.metrica_ids }))}
                        className={`py-2 px-2 rounded-xl text-[11px] font-medium border transition text-center ${
                          sel
                            ? `${cfg.bg} ${cfg.color} border-current`
                            : "bg-white/[0.03] border-white/10 text-zinc-400 hover:border-white/20"
                        }`}
                      >
                        {cfg.label}
                        <span className="block text-[9px] font-normal opacity-70 mt-0.5 leading-tight">{cfg.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campaña(s) — oculto si sin_datos */}
              {form.confianza_atribucion !== "sin_datos" && (
                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-500">
                    Campaña(s) que generaron la venta
                    {form.metrica_ids.length > 0 && (
                      <span className="ml-1.5 text-violet-300 font-medium">
                        · {form.metrica_ids.length} seleccionada{form.metrica_ids.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </span>
                  {!form.empresa ? (
                    <p className="text-xs text-zinc-500 italic">Selecciona primero la empresa</p>
                  ) : (
                    <div className="border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {campanasDeLaEmpresa.map((m) => {
                        const sel       = form.metrica_ids.includes(m.id);
                        const esPrimaria = form.metrica_ids[0] === m.id;
                        return (
                          <label
                            key={m.id}
                            className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition border-b border-white/[0.06] last:border-b-0 ${
                              sel ? "bg-violet-500/12" : "hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition ${
                              sel ? "bg-violet-500" : "border-2 border-white/15"
                            }`}>
                              {sel && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                            <input type="checkbox" className="sr-only" checked={sel} onChange={() => toggleCampana(m.id)} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${sel ? "text-violet-200" : "text-zinc-300"}`}>
                                {m.campana_nombre}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {m.plataforma.toUpperCase()} · {m.periodo_inicio?.slice(0, 7)}
                                {esPrimaria && sel && <span className="ml-1.5 text-violet-400 font-medium">· principal</span>}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {form.confianza_atribucion === "probable" && form.metrica_ids.length === 0 && (
                    <p className="text-[10px] text-amber-400">Selecciona la campaña más probable aunque no sea segura</p>
                  )}
                </div>
              )}

              {/* Monto + Costo */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Monto venta (S/) *</span>
                  <input
                    type="number" min={0}
                    value={form.monto || ""}
                    onChange={(e) => setForm((f) => ({ ...f, monto: Number(e.target.value) }))}
                    placeholder="ej. 300000"
                    className={`${INPUT_BASE} w-full text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30`}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Costo de venta (S/)</span>
                  <input
                    type="number" min={0}
                    value={form.costo_venta || ""}
                    onChange={(e) => setForm((f) => ({ ...f, costo_venta: Number(e.target.value) }))}
                    placeholder="ej. 2500"
                    className={`${INPUT_BASE} w-full text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30`}
                  />
                </label>
              </div>

              {/* Proyecto + Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Proyecto vendido</span>
                  <input
                    type="text"
                    value={form.proyecto ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, proyecto: e.target.value }))}
                    placeholder="ej. Casa Villa del Sol"
                    className={`${INPUT_BASE} w-full text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30`}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Fecha de venta *</span>
                  <input
                    type="date"
                    value={form.fecha_venta}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_venta: e.target.value }))}
                    className={`${INPUT_BASE} w-full text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30`}
                  />
                </label>
              </div>

              {/* Notas */}
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Notas</span>
                <textarea
                  value={form.notas ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                  rows={2}
                  placeholder="Ej: Lead de campaña anterior que cerró tras ver nueva campaña..."
                  className={`${INPUT_BASE} w-full text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none`}
                />
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setModal(false)}
                className="flex-1 py-2 text-sm border border-white/10 rounded-xl text-zinc-300 hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando || !form.empresa || form.monto <= 0}
                className="btn-primary flex-1 py-2 text-sm rounded-xl disabled:opacity-40 font-medium"
              >
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Registrar venta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}