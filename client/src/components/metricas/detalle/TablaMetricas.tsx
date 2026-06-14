/** src/components/metricas/detalle/TablaMetricas.tsx — REDISEÑO NEON
 * Antes: tema claro por todos lados — chips de proyecto bg-violet-100, badges de plataforma
 * bg-blue-100, VentaBadge bg-green-100/yellow-100, filas con tinte bg-green-50/60, thead
 * bg-zinc-800/40, dropdown bg-slate-800/60, checkboxes accent claros.
 * Ahora: tabla neon — chips/badges por color hex, filas con tinte sutil, dropdown neon.
 * TODA la lógica (ProyectosCell, VentaBadge, refresh API, modal detalle, selección) INTACTA.
 */
import { GLASS_BASE } from "../../../lib/tokens";
import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, TrendingUp, Plus, RefreshCw, Loader2 } from "lucide-react";
import { Metrica } from "@/types/metricas.types";
import { TableCheckbox } from "@/components/ui/TableCheckbox";
import { TableHeaderCheckbox } from "@/components/ui/TableHeaderCheckbox";
import { ModalDetalleMetrica } from "./ModalDetalleMetrica";
import { actualizarProyectosMetrica, refreshMetrica } from "@/services/metricas.api";

export const PROYECTOS_LISTA = ["Alborada", "Terrenos Villa", "San Fernando"];

/** Color HEX por proyecto (chip neon). */
const PROY_HEX: Record<string, string> = {
  "Alborada": "#a855f7", "Terrenos Villa": "#34d399", "San Fernando": "#0ea5e9",
};
const proyHex = (p: string) => PROY_HEX[p] ?? "#94a3b8";

/** Color HEX por plataforma. */
const PLAT_HEX: Record<string, string> = { meta: "#3b82f6", google: "#ef4444", tiktok: "#ec4899" };
const LABEL: Record<string, string> = { meta: "Meta Ads", google: "Google Ads", tiktok: "TikTok Ads" };
const LABEL_SUB: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", audience_network: "Audience Network" };

function chipStyle(hex: string): React.CSSProperties {
  return { color: hex, background: `${hex}1a`, border: `1px solid ${hex}38` };
}

interface Props {
  metricas: Metrica[];
  seleccionados: string[];
  todosSeleccionados: boolean;
  proyectos?: string[];
  onToggleUno: (id: string) => void;
  onToggleTodos: () => void;
  onEditar: (m: Metrica) => void;
  onBorrar: (id: string) => void;
  onProyectoGuardado?: () => void;
  onSincronizado?: () => void;
}

function VentaBadge({ metrica }: { metrica: Metrica }) {
  const count = metrica.ventas_count ?? 0;
  if (count === 0) return null;
  const confianza = metrica.mejor_confianza;
  const monto = Number(metrica.ingresos_atribuidos ?? 0);
  const montoStr = monto >= 1000 ? `S/ ${(monto / 1000).toFixed(0)}k` : `S/ ${monto.toLocaleString("es-PE")}`;
  const hex = confianza === "confirmada" ? "#34d399" : "#fbbf24";
  return (
    <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium" style={chipStyle(hex)}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: hex, boxShadow: `0 0 5px ${hex}` }} />
      <TrendingUp size={9} />
      {count === 1 ? "1 venta" : `${count} ventas`} · {montoStr}
    </span>
  );
}

function ProyectosCell({ metrica, listaProyectos, onGuardado }: {
  metrica: Metrica; listaProyectos: string[]; onGuardado: () => void;
}) {
  const [abierto, setAbierto]   = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>(metrica.proyectos ?? []);
  const [guardando, setGuardando] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) guardar(seleccion);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [abierto, seleccion]);

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

  const toggle = (p: string) => setSeleccion(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const todosProyectos = Array.from(new Set([...PROYECTOS_LISTA, ...listaProyectos]));

  return (
    <div className="relative" ref={panelRef} onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-1 cursor-pointer min-w-[80px]" onClick={() => setAbierto(v => !v)}>
        {seleccion.length === 0 ? (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-500 hover:text-zinc-300 border border-dashed border-white/15 hover:border-accent-30 rounded px-1.5 py-0.5 transition">
            <Plus size={9} /> Asignar
          </span>
        ) : (
          seleccion.map(p => (
            <span key={p} className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded" style={chipStyle(proyHex(p))}>{p}</span>
          ))
        )}
        {guardando && <span className="text-[10px] text-zinc-500 ml-1">…</span>}
      </div>

      {abierto && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-[#0a101f]/97 backdrop-blur border border-white/10 rounded-xl shadow-xl p-3 min-w-[180px]"
             style={{ boxShadow: "0 0 24px rgb(var(--accent) / calc(0.15*var(--glow))), 0 12px 30px rgba(0,0,0,0.6)" }}>
          <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-2">Proyectos</p>
          <div className="flex flex-col gap-2">
            {todosProyectos.map(p => {
              const hex = proyHex(p);
              const checked = seleccion.includes(p);
              return (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <button type="button" onClick={() => toggle(p)} className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${checked ? "border-transparent" : "border-white/20"}`} style={checked ? { background: hex } : undefined}>
                    {checked && <span className="text-[#04101a] text-[9px] font-bold">✓</span>}
                  </button>
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={chipStyle(hex)}>{p}</span>
                </label>
              );
            })}
          </div>
          <button onClick={() => guardar(seleccion)} className="btn-primary mt-3 w-full text-xs py-1.5">Guardar</button>
        </div>
      )}
    </div>
  );
}

export const TablaMetricas = ({
  metricas, seleccionados, todosSeleccionados, proyectos = [],
  onToggleUno, onToggleTodos, onEditar, onBorrar, onProyectoGuardado, onSincronizado,
}: Props) => {
  const [detalle, setDetalle] = useState<Metrica | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshMsg, setRefreshMsg] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

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
      setRefreshMsg({ id: m.id, ok: false, msg: err.response?.data?.message || "Error al actualizar" });
      setTimeout(() => setRefreshMsg(null), 5000);
    } finally {
      setRefreshingId(null);
    }
  };

  const TH = "px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider";

  return (
    <>
      <div className={`${GLASS_BASE} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-4 py-3"><TableHeaderCheckbox checked={todosSeleccionados} onChange={onToggleTodos} /></th>
                <th className={`${TH} text-left`}>Empresa</th>
                <th className={`${TH} text-left`}>Proyecto</th>
                <th className={`${TH} text-left`}>Campaña</th>
                <th className={`${TH} text-left`}>Plataforma</th>
                <th className={`${TH} text-right`}>Gasto</th>
                <th className={`${TH} text-right`}>Leads</th>
                <th className={`${TH} text-right`}>Clics</th>
                <th className={`${TH} text-right`}>CTR%</th>
                <th className={`${TH} text-right`}>ROAS</th>
                <th className={`${TH} text-right`}>ROI%</th>
                <th className={`${TH} text-right`}>CPL</th>
                <th className={`${TH} text-right`}>CPA</th>
                <th className={`${TH} text-left`}>Período</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {metricas.length === 0 ? (
                <tr><td colSpan={15} className="text-center py-10 text-zinc-500">No hay métricas registradas</td></tr>
              ) : metricas.map((m) => {
                const ventas = (m.ventas_count ?? 0) > 0;
                const tint = ventas
                  ? (m.mejor_confianza === "confirmada" ? "bg-emerald-500/[0.05] hover:bg-emerald-500/[0.09]" : "bg-amber-500/[0.04] hover:bg-amber-500/[0.08]")
                  : "hover:bg-white/[0.03]";
                const roasNum = Number(m.roas);
                return (
                  <tr key={m.id} onClick={() => setDetalle(m)} className={`border-b border-white/[0.05] last:border-0 transition cursor-pointer group ${tint}`}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <TableCheckbox checked={seleccionados.includes(m.id)} onChange={() => onToggleUno(m.id)} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-200 group-hover:text-accent transition-colors">{m.empresa}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <ProyectosCell metrica={m} listaProyectos={proyectos} onGuardado={onProyectoGuardado ?? (() => {})} />
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <div className="flex flex-col"><span>{m.campana_nombre}</span><VentaBadge metrica={m} /></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium w-fit" style={chipStyle(PLAT_HEX[m.plataforma] ?? "#94a3b8")}>{LABEL[m.plataforma]}</span>
                        {m.sub_plataforma && <span className="text-[10px] text-zinc-500 pl-1">{LABEL_SUB[m.sub_plataforma] ?? m.sub_plataforma}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-display font-bold text-zinc-200 tabular-nums">S/ {Number(m.gasto).toLocaleString("es-PE")}</td>
                    <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{m.leads}</td>
                    <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">{Number(m.clics).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">{m.ctr}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-display font-bold tabular-nums" style={{ color: roasNum >= 4 ? "#34d399" : roasNum >= 2 ? "#fbbf24" : roasNum > 0 ? "#f87171" : "#71717a" }}>{m.roas}x</span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{m.roi === null || m.roi === undefined ? "—" : `${Number(m.roi).toFixed(0)}%`}</td>
                    <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">S/ {Number(m.cpa).toLocaleString("es-PE")}</td>
                    <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">
                      {Number(m.conversiones) > 0 ? `S/ ${(Number(m.gasto) / Number(m.conversiones)).toLocaleString("es-PE", { maximumFractionDigits: 0 })}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums">
                      {new Date(m.periodo_inicio).toLocaleDateString("es-PE")} → {new Date(m.periodo_fin).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(m as any).platform_campaign_id && (
                          <div className="relative">
                            <button onClick={(e) => handleRefresh(m, e)} disabled={refreshingId === m.id}
                              className="p-1.5 rounded-lg text-violet-400 hover:text-violet-300 hover:bg-white/5 transition disabled:opacity-40" title="Actualizar desde la plataforma">
                              {refreshingId === m.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            </button>
                            {refreshMsg?.id === m.id && (
                              <span className="absolute bottom-full mb-1 right-0 whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded-lg z-50 text-white"
                                    style={{ background: refreshMsg.ok ? "#059669" : "#dc2626" }}>{refreshMsg.msg}</span>
                            )}
                          </div>
                        )}
                        <button onClick={() => onEditar(m)} className="p-1.5 rounded-lg text-zinc-500 hover:text-accent hover:bg-white/5 transition" title="Editar"><Pencil size={14} /></button>
                        <button onClick={() => onBorrar(m.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition" title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detalle && (
        <ModalDetalleMetrica metrica={detalle} onCerrar={() => setDetalle(null)} onSincronizado={onSincronizado} />
      )}
    </>
  );
};