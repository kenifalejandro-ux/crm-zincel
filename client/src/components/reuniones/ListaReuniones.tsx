/** client/src/components/reuniones/ListaReuniones.tsx — REDISEÑO NEON
 * Antes: badges tema claro (bg-blue-100/text-blue-700…), divide-gray-50, bg-zinc-800/40,
 *        duración bg-emerald-50/text-emerald-700, enlace text-blue-500, border-white/8.
 * Ahora: tabla neon — badge de estado por color, duración chip esmeralda neon, enlace
 *        en acento, modalidad con ícono, check de acento, acciones al hover.
 * Props/lógica (cambiarEstado, editar, borrar, selección) INTACTOS.
 */
import { GLASS_BASE, INPUT_BASE } from "../../lib/tokens";
import { Video, MapPin, Pencil, Trash2 } from "lucide-react";
import { TableCheckbox } from "../ui/TableCheckbox";
import type { Reunion } from "../../types/reunion.types";

const ESTADOS = ["programada", "realizada", "cancelada", "reprogramada", "en_proceso"];

/** Color HEX por estado para el chip neon. */
const ESTADO_HEX: Record<string, string> = {
  programada: "#3b82f6", realizada: "#34d399", cancelada: "#f87171", reprogramada: "#fbbf24", en_proceso: "#a855f7",
};

interface Props {
  reuniones: Reunion[];
  onCambiarEstado: (id: string, estado: string) => void;
  onEditar: (r: Reunion) => void;
  onBorrar: (id: string) => void;
  seleccionados: string[];
  todosSeleccionados: boolean;
  onToggleUno: (id: string) => void;
  onToggleTodos: () => void;
}

export function ListaReuniones({
  reuniones, onCambiarEstado, onEditar, onBorrar,
  seleccionados, todosSeleccionados, onToggleUno, onToggleTodos,
}: Props) {
  if (reuniones.length === 0) {
    return <div className={`${GLASS_BASE} p-12 text-center text-xs text-zinc-500`}>No hay reuniones. ¡Agenda la primera!</div>;
  }

  const TH = "text-left px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider";

  return (
    <div className={`${GLASS_BASE} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="px-3 py-3 w-[40px]"><TableCheckbox checked={todosSeleccionados} onChange={onToggleTodos} /></th>
              <th className={TH}>Prospecto</th>
              <th className={TH}>Título</th>
              <th className={TH}>Fecha</th>
              <th className={TH}>Modalidad</th>
              <th className={TH}>Estado</th>
              <th className={TH}>Notas</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {reuniones.map((r) => {
              const hex = ESTADO_HEX[r.estado] ?? "#94a3b8";
              return (
                <tr key={r.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03] transition cursor-pointer group" onClick={() => onEditar(r)}>
                  <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <TableCheckbox checked={seleccionados.includes(r.id)} onChange={() => onToggleUno(r.id)} />
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-zinc-100 group-hover:text-accent transition-colors">{r.empresa || "-"}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{r.nombre_contacto || ""}</p>
                  </td>

                  <td className="px-5 py-3.5"><p className="font-medium text-zinc-200">{r.titulo}</p></td>

                  <td className="px-5 py-3.5">
                    <p className="font-medium text-zinc-200 tabular-nums">{new Date(r.fecha_hora).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-zinc-500 tabular-nums">
                        {new Date(r.fecha_hora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                        {r.hora_fin && <> – {r.hora_fin.slice(0, 5)}</>}
                      </span>
                      {r.duracion_minutos != null && r.duracion_minutos > 0 && (
                        <span className="text-[9.5px] font-semibold text-emerald-300 bg-emerald-500/12 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                          {r.duracion_minutos >= 60 ? `${Math.floor(r.duracion_minutos / 60)}h${r.duracion_minutos % 60 > 0 ? ` ${r.duracion_minutos % 60}m` : ""}` : `${r.duracion_minutos}m`}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="text-zinc-300 capitalize flex items-center gap-1.5">
                      {r.modalidad === "presencial" ? <MapPin size={12} className="text-zinc-500" /> : <Video size={12} className="text-zinc-500" />}
                      {r.modalidad.replace("_", " ")}
                    </span>
                    {r.enlace && (
                      <a href={r.enlace} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10.5px] text-accent hover:underline truncate block mt-0.5 max-w-[160px]">{r.enlace}</a>
                    )}
                  </td>

                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-2">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize" style={{ color: hex, background: `${hex}18`, border: `1px solid ${hex}38` }}>{r.estado}</span>
                      <select value={r.estado} onChange={(e) => onCambiarEstado(r.id, e.target.value)} className={`${INPUT_BASE} text-xs px-2 py-1 w-full`}>
                        {ESTADOS.map((e) => <option key={e} value={e} className="capitalize">{e}</option>)}
                      </select>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-zinc-400 max-w-[240px] truncate">{r.notas || "-"}</td>

                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEditar(r)} className="p-1.5 rounded-lg text-zinc-500 hover:text-accent hover:bg-white/5 transition" title="Editar reunión"><Pencil size={14} /></button>
                      <button onClick={() => onBorrar(r.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition" title="Eliminar reunión"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}