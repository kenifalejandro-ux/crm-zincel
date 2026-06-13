/** client/src/components/prospectos/TablaProspectos.tsx — REDISEÑO NEON
 * Cambios: badges de score/estado/prioridad y tint de fila migrados a neon
 * (antes bg-red-50, bg-amber-50, bg-green-100, divide-gray-50, hover:bg-gray-50),
 * teléfono pill neon, acciones con iconos lucide (antes emojis), header sticky,
 * spinner con color de acento, borde válido. Props/lógica intactos.
 */
import { Phone, Eye, Pencil, Trash2 } from "lucide-react";
import { ESTADOS_LEAD } from "../../utils/prospectos.mappers";
import { ESTADO_CHIP, PRIORIDAD_CHIP, SCORE_NEON } from "../../lib/estadoColors";
import { TableCheckbox } from "../ui/TableCheckbox";
import type { ScoreLead } from "../../services/prospectos.api";

const ROW_TINT: Record<string, string> = {
  caliente: "bg-red-500/[0.05] hover:bg-red-500/[0.09]",
  activo:   "bg-amber-500/[0.04] hover:bg-amber-500/[0.08]",
};

function estadoEfectivo(p: any): string {
  if (p.estado_lead === "no_contesta" && (!p.llamadas || p.llamadas.length === 0)) {
    return "por_gestionar";
  }
  return p.estado_lead;
}

interface Props {
  prospectos: any[];
  total: number;
  cargando: boolean;
  pagina: number;
  limite: number;
  onVerDetalle: (p: any) => void;
  onEditar: (p: any) => void;
  onEliminar: (id: string) => void;
  onPaginaAnterior: () => void;
  onPaginaSiguiente: () => void;
  seleccionados: string[];
  onToggleSeleccion: (id: string) => void;
  onToggleTodos: () => void;
  todosSeleccionados: boolean;
  scores?: Record<string, ScoreLead>;
}

export function TablaProspectos({
  prospectos, total, cargando, pagina, limite,
  onVerDetalle, onEditar, onEliminar,
  onPaginaAnterior, onPaginaSiguiente,
  seleccionados, onToggleSeleccion, onToggleTodos, todosSeleccionados,
  scores,
}: Props) {
  const TH = "text-left px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.14em]";

  return (
    <div className="neon-card overflow-x-auto max-h-[700px] overflow-y-auto">
      {cargando ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-white/10" style={{ borderBottomColor: "rgb(var(--accent))" }} />
        </div>
      ) : prospectos.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-xs">
          No hay prospectos. ¡Agrega el primero o importa tu Excel!
        </div>
      ) : (
        <table className="min-w-[1600px] text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-white/[0.08] bg-[#0a101f]/95 backdrop-blur">
              <th className="px-3 py-2 w-[40px]"><TableCheckbox checked={todosSeleccionados} onChange={onToggleTodos} /></th>
              <th className={TH}>Empresa</th>
              <th className={TH}>Contacto</th>
              <th className={TH}>Email</th>
              <th className={TH}>Teléfono</th>
              <th className={TH}>Estado</th>
              <th className={TH}>Prioridad</th>
              <th className={TH}>Score</th>
              <th className={TH}>Ciudad</th>
              <th className={TH}>Llamada</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {prospectos.map((p) => {
              const sc = scores?.[p.id];
              const tint = sc ? (ROW_TINT[sc.nivel] ?? "hover:bg-white/[0.03]") : "hover:bg-white/[0.03]";
              return (
              <tr key={p.id} className={`border-b border-white/[0.05] transition-colors cursor-pointer group ${tint}`} onClick={() => onVerDetalle(p)}>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <TableCheckbox checked={seleccionados.includes(p.id)} onChange={() => onToggleSeleccion(p.id)} />
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-zinc-100 group-hover:text-accent transition-colors">{p.empresa}</p>
                  {(p.sector || p.actividad_economica) && <p className="text-[11px] text-zinc-500 mt-0.5">{p.sector || p.actividad_economica}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-zinc-300">{p.nombre_contacto || "-"}</p>
                  {p.cargo && <p className="text-[11px] text-zinc-500 mt-0.5">{p.cargo}</p>}
                </td>
                <td className="px-3 py-2 text-zinc-400 max-w-[300px] truncate">{p.email_contacto || "-"}</td>
                <td className="px-5 py-3.5">
                  {p.telefono
                    ? <a href={`tel:${p.telefono}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors text-xs font-medium whitespace-nowrap"
                        onClick={e => e.stopPropagation()} title="Llamar">
                        <Phone size={11} /> {p.telefono}
                      </a>
                    : <span className="text-zinc-600">-</span>}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${ESTADO_CHIP[estadoEfectivo(p)] || "bg-white/[0.05] text-zinc-400 border border-white/10"}`}>
                    {ESTADOS_LEAD.find((e) => e.value === estadoEfectivo(p))?.label || estadoEfectivo(p)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${PRIORIDAD_CHIP[p.prioridad] || "bg-white/[0.06] text-zinc-400 border border-white/15"}`}>
                    {p.prioridad}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {sc != null ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums"
                          style={{ color: SCORE_NEON[sc.nivel]?.hex, background: `${SCORE_NEON[sc.nivel]?.hex}1a`, border: `1px solid ${SCORE_NEON[sc.nivel]?.hex}40` }}>
                      {SCORE_NEON[sc.nivel]?.icon} {sc.score}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-zinc-400">{p.ciudad || "-"}</td>
                <td className="px-3 py-2 text-zinc-400">
                  {p.llamadas && p.llamadas.length > 0 ? (
                    <div className="text-xs">
                      {p.llamadas.length} llamada{p.llamadas.length > 1 ? "s" : ""}
                      {p.llamadas.length <= 2 && (
                        <div className="text-zinc-600 mt-0.5">
                          {p.llamadas.map((ll: any, idx: number) => (
                            <div key={idx}>{new Date(ll.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : "-"}
                </td>
                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onVerDetalle(p)} className="p-1.5 rounded-lg text-zinc-500 hover:text-accent hover:bg-white/5 transition" title="Ver"><Eye size={14} /></button>
                    <button onClick={() => onEditar(p)} className="p-1.5 rounded-lg text-zinc-500 hover:text-accent hover:bg-white/5 transition" title="Editar"><Pencil size={14} /></button>
                    <button onClick={() => onEliminar(p.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition" title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {total > limite && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.07] bg-white/[0.02] sticky bottom-0 backdrop-blur">
          <p className="text-xs text-zinc-400">
            Mostrando {(pagina - 1) * limite + 1}–{Math.min(pagina * limite, total)} de {total} registros
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onPaginaAnterior} disabled={pagina === 1} className="btn-ghost px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40">← Anterior</button>
            <span className="text-xs text-zinc-500">Página {pagina}</span>
            <button onClick={onPaginaSiguiente} disabled={prospectos.length < limite} className="btn-ghost px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40">Siguiente →</button>
          </div>
        </div>
      )}
    </div>
  );
}
