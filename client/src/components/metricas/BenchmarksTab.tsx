/** client/src/components/metricas/BenchmarksTab.tsx */

import { useEffect, useState } from "react";
import { Settings, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import type { BenchmarkSector, BenchmarkInput } from "../../types/benchmark.types";
import type { MetaCuenta } from "../../types/metaCuentas.types";
import { SECTORES, sectorLabel } from "../../utils/sectores";
import { BENCHMARK_DEFAULTS } from "../../utils/benchmarkDefaults";
import {
  listarBenchmarks,
  crearBenchmark,
  actualizarBenchmark,
  eliminarBenchmark,
  updateEmpresaSector,
} from "../../services/benchmarks.api";
import { getMetaCuentas } from "../../services/metaCuentas.api";

const METRICS = [
  { key: "ctr",  label: "CTR",  unidad: "%",   mayor: true  },
  { key: "cpc",  label: "CPC",  unidad: "sol", mayor: false },
  { key: "cpm",  label: "CPM",  unidad: "sol", mayor: false },
  { key: "cpl",  label: "CPL",  unidad: "sol", mayor: false },
  { key: "cpa",  label: "CPA",  unidad: "sol", mayor: false },
  { key: "roas", label: "ROAS", unidad: "x",   mayor: true  },
  { key: "roi",  label: "ROI",  unidad: "%",   mayor: true  },
] as const;

type MetricKey = typeof METRICS[number]["key"];

const EMPTY: BenchmarkInput = {
  sector: "",
  ctr_excelente:  null, ctr_aceptable:  null,
  cpc_excelente:  null, cpc_aceptable:  null,
  cpm_excelente:  null, cpm_aceptable:  null,
  cpl_excelente:  null, cpl_aceptable:  null,
  cpa_excelente:  null, cpa_aceptable:  null,
  roas_excelente: null, roas_aceptable: null,
  roi_excelente:  null, roi_aceptable:  null,
  fuente: null,
};

function fmtVal(val: number | null, unidad: string, mayor: boolean): string {
  if (val === null || val === undefined) return "—";
  const s = unidad === "sol" ? `S/ ${val}` : unidad === "%" ? `${val}%` : `${val}x`;
  return `${mayor ? "≥" : "≤"} ${s}`;
}

function bVal(b: BenchmarkSector, key: MetricKey, suffix: "excelente" | "aceptable"): number | null {
  return (b as any)[`${key}_${suffix}`] as number | null;
}

export function BenchmarksTab() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkSector[]>([]);
  const [cuentas,    setCuentas]    = useState<MetaCuenta[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [editando,   setEditando]   = useState<BenchmarkSector | null>(null);
  const [form,       setForm]       = useState<BenchmarkInput>(EMPTY);
  const [guardando,  setGuardando]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [asignando,  setAsignando]  = useState<string | null>(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const [bs, mc] = await Promise.all([listarBenchmarks(), getMetaCuentas()]);
      setBenchmarks(bs);
      // Deduplicate cuentas by empresa (keep first occurrence per empresa)
      const seen = new Set<string>();
      const unique: MetaCuenta[] = [];
      for (const c of mc) {
        if (!seen.has(c.empresa)) { seen.add(c.empresa); unique.push(c); }
      }
      setCuentas(unique);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function abrirCrear() {
    setEditando(null);
    setForm(EMPTY);
    setError(null);
    setModal(true);
  }

  function abrirEditar(b: BenchmarkSector) {
    setEditando(b);
    setForm({
      sector:         b.sector,
      ctr_excelente:  b.ctr_excelente,  ctr_aceptable:  b.ctr_aceptable,
      cpc_excelente:  b.cpc_excelente,  cpc_aceptable:  b.cpc_aceptable,
      cpm_excelente:  b.cpm_excelente,  cpm_aceptable:  b.cpm_aceptable,
      cpl_excelente:  b.cpl_excelente,  cpl_aceptable:  b.cpl_aceptable,
      cpa_excelente:  b.cpa_excelente,  cpa_aceptable:  b.cpa_aceptable,
      roas_excelente: b.roas_excelente, roas_aceptable: b.roas_aceptable,
      roi_excelente:  b.roi_excelente,  roi_aceptable:  b.roi_aceptable,
      fuente:         b.fuente,
    });
    setError(null);
    setModal(true);
  }

  async function guardar() {
    if (!form.sector.trim()) { setError("El nombre del sector es requerido"); return; }
    setGuardando(true);
    setError(null);
    try {
      if (editando) {
        await actualizarBenchmark(editando.id, form);
      } else {
        await crearBenchmark(form);
      }
      setModal(false);
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: string, sector: string) {
    if (!confirm(`¿Eliminar benchmarks del sector "${sector}"?`)) return;
    await eliminarBenchmark(id);
    await cargar();
  }

  async function asignarSector(empresa: string, sector: string) {
    setAsignando(empresa);
    try {
      await updateEmpresaSector(empresa, sector);
      await cargar();
    } finally {
      setAsignando(null);
    }
  }

  function setField(key: keyof BenchmarkInput, raw: string) {
    const num = raw === "" ? null : Number(raw);
    setForm((prev) => ({ ...prev, [key]: num }));
  }

  return (
    <div className="space-y-8">

      {/* ── Benchmarks por sector ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-violet-500" />
            <span className="text-sm font-semibold text-zinc-800">Benchmarks por sector</span>
          </div>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand hover:bg-brand-hover text-white rounded-lg transition"
          >
            <Plus size={12} /> Agregar sector
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-zinc-400 text-center py-10">Cargando...</p>
        ) : benchmarks.length === 0 ? (
          <div className="text-center py-14 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            <Settings size={24} className="mx-auto mb-2 text-zinc-300" />
            <p className="text-xs text-zinc-400">No hay benchmarks configurados.</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Agrega un sector para comenzar.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Sector</th>
                  {METRICS.map((m) => (
                    <th key={m.key} className="px-3 py-2.5 text-center font-medium">{m.label}</th>
                  ))}
                  <th className="px-4 py-2.5 text-left font-medium">Fuente</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {benchmarks.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50 transition">
                    <td className="px-4 py-3 font-semibold text-zinc-800 whitespace-nowrap">{sectorLabel(b.sector)}</td>
                    {METRICS.map((m) => (
                      <td key={m.key} className="px-3 py-3 text-center whitespace-nowrap">
                        <div className="text-zinc-700 font-medium">
                          {fmtVal(bVal(b, m.key, "excelente"), m.unidad, m.mayor)}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {fmtVal(bVal(b, m.key, "aceptable"), m.unidad, m.mayor)}
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-zinc-400 text-[10px] max-w-[140px] truncate">
                      {b.fuente ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => abrirEditar(b)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => borrar(b.id, b.sector)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Sector por empresa ── */}
      {cuentas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Building2 size={15} className="text-blue-500" />
            <span className="text-sm font-semibold text-zinc-800">Sector por empresa</span>
            <span className="text-[10px] bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full">
              Vincula empresa → sector para usar benchmarks dinámicos en la tab Comparativa
            </span>
          </div>

          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Empresa</th>
                  <th className="px-4 py-2.5 text-left font-medium">Sector asignado</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[10px] normal-case text-zinc-400">
                    Selecciona el sector que aplica a esta empresa
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {cuentas.map((c) => {
                  const sectorActual = c.sector ?? "";
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50 transition">
                      <td className="px-4 py-3 font-medium text-zinc-800">{c.empresa}</td>
                      <td className="px-4 py-3">
                        {sectorActual ? (
                          <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-[11px] font-medium">
                            {sectorLabel(sectorActual)}
                          </span>
                        ) : (
                          <span className="text-zinc-400">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={sectorActual}
                            onChange={(e) => asignarSector(c.empresa, e.target.value)}
                            disabled={asignando === c.empresa || benchmarks.length === 0}
                            className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50 min-w-[160px]"
                          >
                            <option value="">Sin sector</option>
                            {benchmarks.map((b) => (
                              <option key={b.id} value={b.sector}>{sectorLabel(b.sector)}</option>
                            ))}
                          </select>
                          {asignando === c.empresa && (
                            <span className="text-[10px] text-zinc-400">Guardando...</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal crear/editar sector ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
              <h3 className="text-sm font-bold text-zinc-900">
                {editando ? `Editar — ${editando.sector}` : "Nuevo sector"}
              </h3>
              <button onClick={() => setModal(false)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none">×</button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-5">
              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Sector *</label>
                <select
                  value={form.sector}
                  onChange={(e) => {
                    const sector = e.target.value;
                    const def = BENCHMARK_DEFAULTS[sector];
                    setForm((p) => ({ ...p, sector, ...(def ?? {}) }));
                  }}
                  disabled={!!editando}
                  className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-60 disabled:bg-zinc-50"
                >
                  <option value="">Selecciona un sector…</option>
                  {SECTORES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {editando && (
                  <p className="text-[10px] text-zinc-400 mt-1">El sector no se puede cambiar al editar.</p>
                )}
              </div>

              {/* Metric fields */}
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 text-[10px] text-zinc-400 font-medium uppercase px-1 pb-1">
                  <span>Métrica</span>
                  <span>Umbral excelente</span>
                  <span>Umbral aceptable</span>
                </div>
                {METRICS.map((m) => (
                  <div key={m.key} className="grid grid-cols-[1fr_1fr_1fr] gap-3 items-center bg-zinc-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-zinc-700">{m.label}</p>
                      <p className="text-[10px] text-zinc-400">{m.mayor ? "≥ mayor mejor" : "≤ menor mejor"}</p>
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={(form as any)[`${m.key}_excelente`] ?? ""}
                      onChange={(e) => setField(`${m.key}_excelente` as keyof BenchmarkInput, e.target.value)}
                      placeholder="—"
                      className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-full"
                    />
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={(form as any)[`${m.key}_aceptable`] ?? ""}
                      onChange={(e) => setField(`${m.key}_aceptable` as keyof BenchmarkInput, e.target.value)}
                      placeholder="—"
                      className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-full"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Fuente / referencia</label>
                <input
                  type="text"
                  value={form.fuente ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, fuente: e.target.value || null }))}
                  placeholder="ej. WordStream 2025, AdAmigo…"
                  className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setModal(false)}
                className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="px-4 py-2 text-xs bg-brand hover:bg-brand-hover text-white rounded-lg transition disabled:opacity-50"
              >
                {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear sector"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
