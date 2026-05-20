/** client/src/components/prospectos/TablaProspectos.tsx */

import { ESTADOS_LEAD, COLOR_ESTADO, COLOR_PRIORIDAD } from "../../utils/prospectos.mappers";
import { TableCheckbox } from "../ui/TableCheckbox";
import type { ScoreLead } from "../../services/prospectos.api";

const SCORE_BADGE: Record<string, string> = {
  caliente: "bg-red-50 text-red-600",
  activo:   "bg-indigo-50 text-indigo-600",
  tibio:    "bg-yellow-50 text-yellow-600",
  frio:     "bg-gray-50 text-gray-400",
};
const SCORE_ICON: Record<string, string> = {
  caliente: "🔥", activo: "⬆", tibio: "→", frio: "❄",
};
const ROW_TINT: Record<string, string> = {
  caliente: "bg-red-50/40 hover:bg-red-50/60",
  activo:   "bg-indigo-50/20 hover:bg-indigo-50/40",
};

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
  // Selección masiva
  seleccionados: string[];
  onToggleSeleccion: (id: string) => void;
  onToggleTodos: () => void;
  todosSeleccionados: boolean;
  // Scores
  scores?: Record<string, ScoreLead>;
}

export function TablaProspectos({
  prospectos, total, cargando, pagina, limite,
  onVerDetalle, onEditar, onEliminar,
  onPaginaAnterior, onPaginaSiguiente,
  seleccionados, onToggleSeleccion, onToggleTodos, todosSeleccionados,
  scores,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto max-h-[700px] overflow-y-auto scrollbar-thin">
      {cargando ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
        </div>
      ) : prospectos.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-xs">
          No hay prospectos. ¡Agrega el primero o importa tu Excel!
        </div>
      ) : (
        <table className="min-w-[1600px] text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-3 py-2 w-[40px]">
                <TableCheckbox checked={todosSeleccionados} onChange={onToggleTodos} />
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Empresa</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Contacto</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Teléfono</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Estado</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Prioridad</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Score</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Ciudad</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Llamada</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {prospectos.map((p) => {
              const sc = scores?.[p.id];
              const rowTint = sc ? (ROW_TINT[sc.nivel] ?? "hover:bg-gray-50") : "hover:bg-gray-50";
              return (
              <tr key={p.id} className={`transition-colors cursor-pointer ${rowTint}`} onClick={() => onVerDetalle(p)}>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <TableCheckbox checked={seleccionados.includes(p.id)} onChange={() => onToggleSeleccion(p.id)} />
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-zinc-800">{p.empresa}</p>
                  {p.rubro && <p className="text-xs text-zinc-400">{p.rubro}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-gray-700">{p.nombre_contacto || "-"}</p>
                  {p.cargo && <p className="text-xs text-zinc-400">{p.cargo}</p>}
                </td>
                <td className="px-3 py-2 text-gray-500 max-w-[300px] truncate">{p.email_contacto || "-"}</td>
                <td className="px-5 py-3.5 text-gray-500">{p.telefono || "-"}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${COLOR_ESTADO[p.estado_lead] || "bg-gray-100 text-gray-500"}`}>
                    {ESTADOS_LEAD.find((e) => e.value === p.estado_lead)?.label || p.estado_lead}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${COLOR_PRIORIDAD[p.prioridad]}`}>
                    {p.prioridad}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {sc ? (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${SCORE_BADGE[sc.nivel]}`}>
                      {SCORE_ICON[sc.nivel]} {sc.score}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-zinc-500">{p.ciudad || "-"}</td>
                <td className="px-3 py-2 text-zinc-500">
                  {p.llamadas && p.llamadas.length > 0 ? (
                    <div className="text-xs">
                      {p.llamadas.length} llamada{p.llamadas.length > 1 ? "s" : ""}
                      {p.llamadas.length <= 2 && (
                        <div className="text-zinc-400 mt-0.5">
                          {p.llamadas.map((ll: any, idx: number) => (
                            <div key={idx}>
                              {new Date(ll.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : "-"}
                </td>
                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => onVerDetalle(p)} className="text-lg opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition" title="Ver">🔍</button>
                    <button onClick={() => onEditar(p)} className="text-lg opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition" title="Editar">📝</button>
                    <button onClick={() => onEliminar(p.id)} className="text-lg opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {total > limite && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white">
          <p className="text-xs text-zinc-500">
            Mostrando {(pagina - 1) * limite + 1}–{Math.min(pagina * limite, total)} de {total} registros
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onPaginaAnterior} disabled={pagina === 1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">← Anterior</button>
            <span className="text-xs text-gray-500">Página {pagina}</span>
            <button onClick={onPaginaSiguiente} disabled={prospectos.length < limite} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Siguiente →</button>
          </div>
        </div>
      )}
    </div>
  );
}