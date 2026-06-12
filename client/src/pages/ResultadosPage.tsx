/** client/src/pages/ResultadosPage.tsx */

import { useEffect, useState } from "react";
import { Trophy, Plus, Trash2, Pencil, TrendingUp, DollarSign, ShoppingBag, Check, HelpCircle } from "lucide-react";
import { listarResultados, crearResultado, actualizarResultado, eliminarResultado } from "../services/resultados.api";
import { getMetricas } from "../services/metricas.api";
import type { Resultado, ResultadoInput, ConfianzaAtribucion } from "../types/resultado.types";
import type { Metrica } from "../types/metricas.types";
import { GLASS_BASE } from "../lib/tokens";

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
    color: "text-emerald-700",
    bg:    "bg-emerald-50 border-emerald-200",
    desc:  "Sabes exactamente qué campaña cerró la venta",
  },
  probable: {
    label: "Probable",
    color: "text-amber-700",
    bg:    "bg-amber-50 border-amber-200",
    desc:  "La campaña es la más probable pero no es seguro",
  },
  sin_datos: {
    label: "Sin datos",
    color: "text-zinc-500",
    bg:    "bg-zinc-50 border-zinc-200",
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
    // Si sin_datos, nombre de campaña por defecto
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="crm-section-accent h-8" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resultados de campaña</h1>
            <p className="text-xs text-slate-400 mt-0.5">Ventas atribuidas a campañas publicitarias</p>
          </div>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-hover transition"
        >
          <Plus size={15} /> Registrar venta
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${GLASS_BASE} px-5 py-5 space-y-1.5`}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><DollarSign size={11}/> Total ingresos atribuidos</p>
          <p className="text-3xl font-black text-green-600 tabular-nums leading-tight">{S(totalIngresos)}</p>
        </div>
        <div className={`${GLASS_BASE} px-5 py-5 space-y-1.5`}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ShoppingBag size={11}/> Total ventas registradas</p>
          <p className="text-3xl font-black text-blue-600 tabular-nums leading-tight">{totalVentas}</p>
        </div>
        <div className={`${GLASS_BASE} px-5 py-5 space-y-1.5`}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={11}/> Ticket promedio</p>
          <p className="text-3xl font-black text-violet-600 tabular-nums leading-tight">{S(ticketPromedio)}</p>
        </div>
      </div>

      {/* ── Resumen por empresa ── */}
      {Object.keys(porEmpresa).length > 0 && (
        <div className={`${GLASS_BASE} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800">Por empresa</p>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
              <tr>
                <th className="px-5 py-2.5 text-left font-semibold">Empresa</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ventas</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ingresos</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ticket promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.entries(porEmpresa).map(([emp, d]) => (
                <tr key={emp} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3 font-semibold text-slate-800">{emp}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">{d.ventas}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-bold">{S(d.ingresos)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{S(d.ingresos / d.ventas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm font-semibold text-zinc-800">Todas las ventas</p>
          <select
            value={filtroEmp}
            onChange={(e) => setFiltroEmp(e.target.value)}
            className="text-xs border border-zinc-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="">Todas las empresas</option>
            {empresas.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-zinc-400 text-sm">Cargando...</div>
          ) : errorCarga ? (
            <div className="p-6 text-center text-red-500 text-xs font-mono bg-red-50">{errorCarga}</div>
          ) : resultados.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Trophy size={32} className="text-zinc-200 mx-auto" />
              <p className="text-sm text-zinc-400">Sin ventas registradas aún</p>
              <button onClick={abrirNuevo} className="text-xs text-brand hover:underline">Registrar primera venta</button>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px]">
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
              <tbody className="divide-y divide-zinc-50">
                {resultados.map((r) => {
                  const monto    = Number(r.monto);
                  const costo    = Number(r.costo_venta ?? 0);
                  const margen   = monto > 0 ? ((monto - costo) / monto) * 100 : 0;
                  const conf     = r.confianza_atribucion ?? "confirmada";
                  const confCfg  = CONFIANZA_CFG[conf];
                  const numCamps = r.metrica_ids?.length ?? (r.metrica_id ? 1 : 0);
                  return (
                    <tr key={r.id} className="hover:bg-zinc-50 transition">
                      <td className="px-5 py-3 font-medium text-zinc-800">{r.empresa}</td>
                      <td className="px-4 py-3 text-zinc-600 max-w-[180px]">
                        {r.metrica_id || numCamps > 0 ? (
                          <>
                            <span className="truncate block">{r.campana_nombre}</span>
                            {numCamps > 1 && (
                              <span className="text-[10px] text-violet-500">+{numCamps - 1} adicional{numCamps - 1 > 1 ? "es" : ""}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-zinc-400 italic flex items-center gap-1">
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
                      <td className="px-4 py-3 text-right font-bold text-green-600">{S(monto)}</td>
                      <td className="px-4 py-3 text-right text-red-500">
                        {costo > 0 ? S(costo) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {costo > 0
                          ? <span className={margen >= 50 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{margen.toFixed(1)}%</span>
                          : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-500">
                        {new Date(r.fecha_venta).toLocaleDateString("es-PE")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => abrirEditar(r)} className="text-zinc-400 hover:text-brand transition"><Pencil size={13} /></button>
                          <button onClick={() => eliminar(r.id)} className="text-zinc-400 hover:text-red-500 transition"><Trash2 size={13} /></button>
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-bold text-zinc-900">
              {editando ? "Editar venta" : "Registrar venta"}
            </h2>

            {errorGuardar && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
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
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, confianza_atribucion: c, metrica_ids: c === "sin_datos" ? [] : f.metrica_ids }))}
                        className={`py-2 px-2 rounded-xl text-[11px] font-medium border transition text-center ${
                          form.confianza_atribucion === c
                            ? `${cfg.bg} ${cfg.color} border-current`
                            : "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300"
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
                      <span className="ml-1.5 text-violet-600 font-medium">
                        · {form.metrica_ids.length} seleccionada{form.metrica_ids.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </span>
                  {!form.empresa ? (
                    <p className="text-xs text-zinc-400 italic">Selecciona primero la empresa</p>
                  ) : (
                    <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {campanasDeLaEmpresa.map((m) => {
                        const sel       = form.metrica_ids.includes(m.id);
                        const esPrimaria = form.metrica_ids[0] === m.id;
                        return (
                          <label
                            key={m.id}
                            className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition border-b border-zinc-50 last:border-b-0 ${
                              sel ? "bg-violet-50" : "hover:bg-zinc-50"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition ${
                              sel ? "bg-violet-600" : "border-2 border-zinc-300"
                            }`}>
                              {sel && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                            <input type="checkbox" className="sr-only" checked={sel} onChange={() => toggleCampana(m.id)} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${sel ? "text-violet-800" : "text-zinc-700"}`}>
                                {m.campana_nombre}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                {m.plataforma.toUpperCase()} · {m.periodo_inicio?.slice(0, 7)}
                                {esPrimaria && sel && <span className="ml-1.5 text-violet-500 font-medium">· principal</span>}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {form.confianza_atribucion === "probable" && form.metrica_ids.length === 0 && (
                    <p className="text-[10px] text-amber-600">Selecciona la campaña más probable aunque no sea segura</p>
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
                    className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Costo de venta (S/)</span>
                  <input
                    type="number" min={0}
                    value={form.costo_venta || ""}
                    onChange={(e) => setForm((f) => ({ ...f, costo_venta: Number(e.target.value) }))}
                    placeholder="ej. 2500"
                    className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                    className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Fecha de venta *</span>
                  <input
                    type="date"
                    value={form.fecha_venta}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_venta: e.target.value }))}
                    className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
                />
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setModal(false)}
                className="flex-1 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando || !form.empresa || form.monto <= 0}
                className="flex-1 py-2 text-sm bg-brand text-white rounded-xl hover:bg-brand-hover disabled:opacity-40 transition font-medium"
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
