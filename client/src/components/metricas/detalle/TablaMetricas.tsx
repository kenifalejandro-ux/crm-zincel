/** src/components/metricas/detalle/TablaMetricas.tsx */

import { GLASS_BASE } from "../../../lib/tokens";
import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, TrendingUp, Plus, RefreshCw, Loader2 } from "lucide-react";
import { Metrica } from "@/types/metricas.types";
import { TableCheckbox } from "@/components/ui/TableCheckbox";
import { TableHeaderCheckbox } from "@/components/ui/TableHeaderCheckbox";
import { ModalDetalleMetrica } from "./ModalDetalleMetrica";
import { actualizarProyectosMetrica, refreshMetrica } from "@/services/metricas.api";

// ── Proyectos fijos con colores ───────────────────────────────────────────────
export const PROYECTOS_LISTA = ["Alborada", "Terrenos Villa", "San Fernando"];

const PROY_STYLE: Record<string, { chip: string; check: string }> = {
  "Alborada":      { chip: "bg-violet-100 text-violet-700 border-violet-200",  check: "accent-violet-600"  },
  "Terrenos Villa":{ chip: "bg-emerald-100 text-emerald-700 border-emerald-200", check: "accent-emerald-600" },
  "San Fernando":  { chip: "bg-sky-100 text-sky-700 border-sky-200",            check: "accent-sky-600"     },
};

const defaultStyle = { chip: "bg-zinc-100 text-zinc-600 border-zinc-200", check: "accent-zinc-500" };

const BADGE: Record<string, string> = {
  meta:   "bg-blue-100 text-blue-700",
  google: "bg-red-100  text-red-700",
  tiktok: "bg-pink-100 text-pink-700",
};

const LABEL: Record<string, string> = {
  meta:   "Meta Ads",
  google: "Google Ads",
  tiktok: "TikTok Ads",
};

const LABEL_SUB: Record<string, string> = {
  facebook:         "Facebook",
  instagram:        "Instagram",
  audience_network: "Audience Network",
};

interface Props {
  metricas:           Metrica[];
  seleccionados:      string[];
  todosSeleccionados: boolean;
  proyectos?:         string[];
  onToggleUno:        (id: string) => void;
  onToggleTodos:      () => void;
  onEditar:           (m: Metrica) => void;
  onBorrar:           (id: string) => void;
  onProyectoGuardado?: () => void;
  onSincronizado?:    () => void;
}

// ── Badge de ventas atribuidas ────────────────────────────────────────────────
function VentaBadge({ metrica }: { metrica: Metrica }) {
  const count = metrica.ventas_count ?? 0;
  if (count === 0) return null;

  const confianza = metrica.mejor_confianza;
  const monto     = Number(metrica.ingresos_atribuidos ?? 0);
  const montoStr  = monto >= 1000
    ? `S/ ${(monto / 1000).toFixed(0)}k`
    : `S/ ${monto.toLocaleString("es-PE")}`;

  const cls = confianza === "confirmada"
    ? "bg-green-100 text-green-700 border-green-200"
    : "bg-yellow-100 text-yellow-700 border-yellow-200";
  const dot = confianza === "confirmada" ? "bg-green-500" : "bg-yellow-400";

  return (
    <span className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <TrendingUp size={9} />
      {count === 1 ? "1 venta" : `${count} ventas`} · {montoStr}
    </span>
  );
}

// ── Celda de proyectos con checkboxes ─────────────────────────────────────────
function ProyectosCell({ metrica, listaProyectos, onGuardado }: {
  metrica:        Metrica;
  listaProyectos: string[];
  onGuardado:     () => void;
}) {
  const [abierto,    setAbierto]    = useState(false);
  const [seleccion,  setSeleccion]  = useState<string[]>(metrica.proyectos ?? []);
  const [guardando,  setGuardando]  = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!abierto) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        guardar(seleccion);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [abierto, seleccion]);

  // Sync cuando cambia la metrica desde afuera
  useEffect(() => { setSeleccion(metrica.proyectos ?? []); }, [metrica.proyectos]);

  const guardar = async (lista: string[]) => {
    setAbierto(false);
    if (JSON.stringify(lista.sort()) !== JSON.stringify((metrica.proyectos ?? []).slice().sort())) {
      setGuardando(true);
      await actualizarProyectosMetrica(metrica.id, lista);
      setGuardando(false);
      onGuardado();
    }
  };

  const toggle = (p: string) => {
    setSeleccion(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const todosProyectos = Array.from(new Set([...PROYECTOS_LISTA, ...listaProyectos]));

  return (
    <div className="relative" ref={panelRef} onClick={(e) => e.stopPropagation()}>
      {/* Chips + botón añadir */}
      <div
        className="flex flex-wrap gap-1 cursor-pointer min-w-[80px]"
        onClick={() => setAbierto(v => !v)}
      >
        {seleccion.length === 0 ? (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-300 hover:text-zinc-500 border border-dashed border-white/10 hover:border-zinc-400 rounded px-1.5 py-0.5 transition">
            <Plus size={9} /> Asignar
          </span>
        ) : (
          seleccion.map(p => {
            const s = PROY_STYLE[p] ?? defaultStyle;
            return (
              <span key={p} className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${s.chip}`}>
                {p}
              </span>
            );
          })
        )}
        {guardando && <span className="text-[10px] text-zinc-400 ml-1">...</span>}
      </div>

      {/* Dropdown con checkboxes */}
      {abierto && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-slate-800/60 border border-white/10 rounded-xl shadow-lg p-3 min-w-[180px]">
          <p className="text-[10px] text-zinc-100 font-medium uppercase tracking-wide mb-2">Proyectos</p>
          <div className="flex flex-col gap-2">
            {todosProyectos.map(p => {
              const s = PROY_STYLE[p] ?? defaultStyle;
              return (
                <label key={p} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={seleccion.includes(p)}
                    onChange={() => toggle(p)}
                    className={`w-3.5 h-3.5 rounded ${s.check}`}
                  />
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${s.chip}`}>{p}</span>
                </label>
              );
            })}
          </div>
          <button
            onClick={() => guardar(seleccion)}
            className="mt-3 w-full text-xs bg-zinc-800 text-white rounded-lg py-1.5 hover:bg-zinc-700 transition"
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

export const TablaMetricas = ({
  metricas, seleccionados, todosSeleccionados,
  proyectos = [],
  onToggleUno, onToggleTodos, onEditar, onBorrar, onProyectoGuardado, onSincronizado,
}: Props) => {


  const [detalle,      setDetalle]      = useState<Metrica | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshMsg,   setRefreshMsg]   = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const handleRefresh = async (m: Metrica, e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshingId(m.id);
    setRefreshMsg(null);
    try {
      await refreshMetrica(m.id);
      setRefreshMsg({ id: m.id, ok: true, msg: "Actualizado" });
      onSincronizado?.();
      setTimeout(() => setRefreshMsg(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error al actualizar";
      setRefreshMsg({ id: m.id, ok: false, msg });
      setTimeout(() => setRefreshMsg(null), 5000);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <>
      <div className={`${GLASS_BASE} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-800/40 text-zinc-100 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">
                  <TableHeaderCheckbox
                    checked={todosSeleccionados}
                    onChange={onToggleTodos}
                  />
                </th>
                <th className="px-4 py-3 text-left">Empresa</th>
                <th className="px-4 py-3 text-left">Proyecto</th>
                <th className="px-4 py-3 text-left">Campaña</th>
                <th className="px-4 py-3 text-left">Plataforma</th>
                <th className="px-4 py-3 text-right">Gasto</th>
                <th className="px-4 py-3 text-right">Leads</th>
                <th className="px-4 py-3 text-right">Clics</th>
                <th className="px-4 py-3 text-right">CTR%</th>
                <th className="px-4 py-3 text-right">ROAS</th>
                <th className="px-4 py-3 text-right">ROI%</th>
                <th className="px-4 py-3 text-right">CPL</th>
                <th className="px-4 py-3 text-right">CPA</th>
                <th className="px-4 py-3 text-left">Período</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {metricas.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-zinc-400">
                    No hay métricas registradas
                  </td>
                </tr>
              ) : metricas.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setDetalle(m)}
                  className={`transition cursor-pointer ${
                    (m.ventas_count ?? 0) > 0
                      ? m.mejor_confianza === "confirmada"
                        ? "bg-green-50/60 hover:bg-green-50"
                        : "bg-yellow-50/60 hover:bg-yellow-50"
                      : "hover:bg-zinc-800/40"
                  }`}
                >
                  {/* Checkbox — detiene propagación para no abrir el modal */}
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TableCheckbox
                      checked={seleccionados.includes(m.id)}
                      onChange={() => onToggleUno(m.id)}
                    />
                  </td>

                  <td className="px-4 py-3 font-medium text-zinc-200">
                    {m.empresa}
                  </td>

                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <ProyectosCell
                      metrica={m}
                      listaProyectos={proyectos}
                      onGuardado={onProyectoGuardado ?? (() => {})}
                    />
                  </td>

                  <td className="px-4 py-3 text-zinc-400">
                    <div className="flex flex-col">
                      <span>{m.campana_nombre}</span>
                      <VentaBadge metrica={m} />
                    </div>
                  </td>

                  {/* Plataforma + sub */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium w-fit ${BADGE[m.plataforma]}`}>
                        {LABEL[m.plataforma]}
                      </span>
                      {m.sub_plataforma && (
                        <span className="text-[10px] text-zinc-400 pl-1">
                          {LABEL_SUB[m.sub_plataforma] ?? m.sub_plataforma}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    S/ {Number(m.gasto).toLocaleString("es-PE")}
                  </td>

                  <td className="px-4 py-3 text-right">{m.leads}</td>

                  <td className="px-4 py-3 text-right">
                    {Number(m.clics).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-right">{m.ctr}%</td>

                  <td className="px-4 py-3 text-right">{m.roas}x</td>

                 <td className="px-4 py-3 text-right">{m.roi === null || m.roi === undefined ? "—" : `${Number(m.roi).toFixed(0)}%`}</td>

                  <td className="px-4 py-3 text-right">
                    S/ {Number(m.cpa).toLocaleString("es-PE")}
                  </td>

                  <td className="px-4 py-3 text-right text-zinc-400">
                    {Number(m.conversiones) > 0
                      ? `S/ ${(Number(m.gasto) / Number(m.conversiones)).toLocaleString("es-PE", { maximumFractionDigits: 0 })}`
                      : "—"}
                  </td>

                  <td className="px-4 py-3 text-zinc-300">
                    {new Date(m.periodo_inicio).toLocaleDateString("es-PE")} →{" "}
                    {new Date(m.periodo_fin).toLocaleDateString("es-PE")}
                  </td>

                  {/* Acciones — detienen propagación para no abrir el modal */}
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      {/* Refresh desde API — solo si tiene platform_campaign_id */}
                      {(m as any).platform_campaign_id && (
                        <div className="relative group">
                          <button
                            onClick={(e) => handleRefresh(m, e)}
                            disabled={refreshingId === m.id}
                            className="text-violet-500 hover:text-violet-700 transition disabled:opacity-40"
                            title="Actualizar desde la plataforma"
                          >
                            {refreshingId === m.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <RefreshCw size={14} />
                            }
                          </button>
                          {refreshMsg?.id === m.id && (
                            <span className={`absolute bottom-full mb-1 right-0 whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded-lg shadow-lg z-50 ${
                              refreshMsg.ok
                                ? "bg-emerald-600 text-white"
                                : "bg-red-600 text-white"
                            }`}>
                              {refreshMsg.msg}
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => onEditar(m)}
                        className="text-zinc-400 hover:text-brand transition"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onBorrar(m.id)}
                        className="text-zinc-400 hover:text-red-500 transition"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalle */}
      {detalle && (
        <ModalDetalleMetrica
          metrica={detalle}
          onCerrar={() => setDetalle(null)}
          onSincronizado={onSincronizado}
        />
      )}
    </>
  );
};