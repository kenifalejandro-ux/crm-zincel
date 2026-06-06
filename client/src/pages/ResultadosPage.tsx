/** client/src/pages/ResultadosPage.tsx */

import { useEffect, useState } from "react";
import { Trophy, Plus, Trash2, Pencil, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { listarResultados, crearResultado, actualizarResultado, eliminarResultado } from "../services/resultados.api";
import { getMetricas } from "../services/metricas.api";
import type { Resultado, ResultadoInput } from "../types/resultado.types";
import type { Metrica } from "../types/metricas.types";

const EMPTY_FORM: ResultadoInput = {
  empresa:        "",
  metrica_id:     "",
  campana_nombre: "",
  proyecto:       "",
  monto:          0,
  costo_venta:    0,
  fecha_venta:    new Date().toISOString().slice(0, 10),
  notas:          "",
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
    getMetricas({})
      .then((m) => { setMetricas(m); })
      .catch(() => {});
  }, []);

  const cargar = async (emp: string) => {
    setLoading(true);
    try {
      const r = await listarResultados(emp ? { empresa: emp } : {});
      setResultados(Array.isArray(r) ? r : []);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? JSON.stringify(e?.response?.data);
      setErrorCarga(msg);
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(filtroEmp); }, [filtroEmp]);

  const empresas = [...new Set(metricas.map((m) => m.empresa))].sort();

  const campanasDeLaEmpresa = metricas.filter((m) => !form.empresa || m.empresa === form.empresa);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ ...EMPTY_FORM, fecha_venta: new Date().toISOString().slice(0, 10) });
    setErrorGuardar(null);
    setModal(true);
  };

  const abrirEditar = (r: Resultado) => {
    setErrorGuardar(null);
    setEditando(r);
    setForm({
      empresa:        r.empresa,
      metrica_id:     r.metrica_id,
      campana_nombre: r.campana_nombre,
      proyecto:       r.proyecto ?? "",
      monto:          Number(r.monto),
      costo_venta:    Number(r.costo_venta ?? 0),
      fecha_venta:    r.fecha_venta.slice(0, 10),
      notas:          r.notas ?? "",
    });
    setModal(true);
  };

  const handleCampana = (metrica_id: string) => {
    const m = metricas.find((x) => x.id === metrica_id);
    setForm((f) => ({ ...f, metrica_id, campana_nombre: m?.campana_nombre ?? "" }));
  };

  const guardar = async () => {
    if (!form.empresa || !form.metrica_id || form.monto <= 0 || !form.fecha_venta) return;
    setGuardando(true);
    setErrorGuardar(null);
    try {
      if (editando) {
        await actualizarResultado(editando.id, form);
      } else {
        await crearResultado(form);
      }
      setModal(false);
      await cargar(filtroEmp);
    } catch (e: any) {
      const msg = e?.response?.data?.errors?.[0]?.message
        ?? e?.response?.data?.message
        ?? "Error al guardar. Intenta de nuevo.";
      setErrorGuardar(msg);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este resultado?")) return;
    await eliminarResultado(id);
    await cargar(filtroEmp);
  };

  // ── KPIs agregados ────────────────────────────────────────────────────────────
  const totalIngresos  = resultados.reduce((a, r) => a + Number(r.monto), 0);
  const totalVentas    = resultados.length;
  const ticketPromedio = totalVentas > 0 ? totalIngresos / totalVentas : 0;

  // Agrupado por empresa
  const porEmpresa = resultados.reduce<Record<string, { ventas: number; ingresos: number }>>((acc, r) => {
    if (!acc[r.empresa]) acc[r.empresa] = { ventas: 0, ingresos: 0 };
    acc[r.empresa].ventas++;
    acc[r.empresa].ingresos += Number(r.monto);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Trophy size={18} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Resultados de campaña</h1>
            <p className="text-xs text-zinc-400">Ventas atribuidas a campañas publicitarias</p>
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
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 space-y-1">
          <p className="text-xs text-zinc-400 flex items-center gap-1.5"><DollarSign size={12}/> Total ingresos atribuidos</p>
          <p className="text-2xl font-bold text-green-600">S/ {totalIngresos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 space-y-1">
          <p className="text-xs text-zinc-400 flex items-center gap-1.5"><ShoppingBag size={12}/> Total ventas registradas</p>
          <p className="text-2xl font-bold text-blue-600">{totalVentas}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 space-y-1">
          <p className="text-xs text-zinc-400 flex items-center gap-1.5"><TrendingUp size={12}/> Ticket promedio</p>
          <p className="text-2xl font-bold text-violet-600">S/ {ticketPromedio.toLocaleString("es-PE", { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* ── Resumen por empresa ── */}
      {Object.keys(porEmpresa).length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-800">Por empresa</p>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px]">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Empresa</th>
                <th className="px-4 py-2.5 text-right font-medium">Ventas</th>
                <th className="px-4 py-2.5 text-right font-medium">Ingresos totales</th>
                <th className="px-4 py-2.5 text-right font-medium">Ticket promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {Object.entries(porEmpresa).map(([emp, d]) => (
                <tr key={emp} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-zinc-800">{emp}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">{d.ventas}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-bold">S/ {d.ingresos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">S/ {(d.ingresos / d.ventas).toLocaleString("es-PE", { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Filtro + Tabla ── */}
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
                  <th className="px-4 py-2.5 text-left font-medium">Campaña</th>
                  <th className="px-4 py-2.5 text-left font-medium">Proyecto</th>
                  <th className="px-4 py-2.5 text-right font-medium">Monto venta</th>
                  <th className="px-4 py-2.5 text-right font-medium">Costo venta</th>
                  <th className="px-4 py-2.5 text-right font-medium">Margen</th>
                  <th className="px-4 py-2.5 text-center font-medium">Fecha</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {resultados.map((r) => {
                  const monto = Number(r.monto);
                  const costo = Number(r.costo_venta ?? 0);
                  const margen = monto > 0 ? ((monto - costo) / monto) * 100 : 0;
                  return (
                  <tr key={r.id} className="hover:bg-zinc-50 transition">
                    <td className="px-5 py-3 font-medium text-zinc-800">{r.empresa}</td>
                    <td className="px-4 py-3 text-zinc-600 max-w-[180px] truncate">{r.campana_nombre}</td>
                    <td className="px-4 py-3 text-zinc-500">{r.proyecto ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      S/ {monto.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500">
                      {costo > 0 ? `S/ ${costo.toLocaleString("es-PE", { minimumFractionDigits: 0 })}` : "—"}
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
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5">
            <h2 className="text-sm font-bold text-zinc-900">
              {editando ? "Editar venta" : "Registrar venta"}
            </h2>

            {errorGuardar && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                {errorGuardar}
              </div>
            )}

            <div className="space-y-3">
              {/* Empresa */}
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Empresa *</span>
                <select
                  value={form.empresa}
                  onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value, metrica_id: "", campana_nombre: "" }))}
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="">Selecciona empresa</option>
                  {empresas.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </label>

              {/* Campaña */}
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Campaña *</span>
                <select
                  value={form.metrica_id}
                  onChange={(e) => handleCampana(e.target.value)}
                  disabled={!form.empresa}
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
                >
                  <option value="">Selecciona campaña</option>
                  {campanasDeLaEmpresa.map((m) => (
                    <option key={m.id} value={m.id}>{m.campana_nombre}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Monto */}
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Monto venta (S/) *</span>
                  <input
                    type="number"
                    min={0}
                    value={form.monto || ""}
                    onChange={(e) => setForm((f) => ({ ...f, monto: Number(e.target.value) }))}
                    placeholder="ej. 240000"
                    className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </label>
                {/* Costo de venta */}
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Costo de venta (S/)</span>
                  <input
                    type="number"
                    min={0}
                    value={form.costo_venta || ""}
                    onChange={(e) => setForm((f) => ({ ...f, costo_venta: Number(e.target.value) }))}
                    placeholder="ej. 2500"
                    className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Proyecto */}
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Proyecto vendido</span>
                  <input
                    type="text"
                    value={form.proyecto ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, proyecto: e.target.value }))}
                    placeholder="ej. Terrenos Villa"
                    className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </label>
                {/* Fecha */}
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
                  placeholder="Detalles adicionales..."
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
                disabled={guardando || !form.empresa || !form.metrica_id || form.monto <= 0}
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
