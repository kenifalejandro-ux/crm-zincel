/** client/src/components/reuniones/ListaReuniones.tsx */

import { GLASS_BASE, INPUT_BASE } from "../../lib/tokens";
import { Video, MapPin, Pencil, Trash2 } from "lucide-react";
import { TableCheckbox } from "../ui/TableCheckbox";
import type { Reunion } from "../../types/reunion.types";

const ESTADOS = [
  "programada",
  "realizada",
  "cancelada",
  "reprogramada",
  "en_proceso",
];

const COLOR_ESTADO: Record<string, string> = {
  programada: "bg-blue-100 text-blue-700",
  realizada: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
  reprogramada: "bg-yellow-100 text-yellow-700",
  en_proceso: "bg-purple-100 text-purple-700",
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
  reuniones,
  onCambiarEstado,
  onEditar,
  onBorrar,
  seleccionados,
  todosSeleccionados,
  onToggleUno,
  onToggleTodos,
}: Props) {
  if (reuniones.length === 0) {
    return (
      <div className={`${GLASS_BASE} p-12 text-center text-xs text-zinc-400`}>
        No hay reuniones. ¡Agenda la primera!
      </div>
    );
  }

  return (
    <div className={`${GLASS_BASE} overflow-hidden`}>
      <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[860px]">
        <thead>
          <tr className="border-b border-white/8 bg-zinc-800/40">
            <th className="px-3 py-2 w-[40px]">
              <TableCheckbox checked={todosSeleccionados} onChange={onToggleTodos}
              />
            </th>
            <th className="text-left px-5 py-3 font-medium text-zinc-100 uppercase">Prospecto</th>
            <th className="text-left px-5 py-3 font-medium text-zinc-100 uppercase"> Título</th>
            <th className="text-left px-5 py-3 font-medium text-zinc-100 uppercase">Fecha</th>
            <th className="text-left px-5 py-3 font-medium text-zinc-100 uppercase">Modalidad</th>
            <th className="text-left px-5 py-3 font-medium text-zinc-100 uppercase">Enlace</th>
            <th className="text-left px-5 py-3 font-medium text-zinc-100 uppercase">Estado</th>
            <th className="text-left px-5 py-3 font-medium text-zinc-100 uppercase">Notas</th>
            <th className="px-5 py-3" /></tr></thead>

        <tbody className="divide-y divide-gray-50">
          {reuniones.map((r) => (
            <tr key={r.id} className="hover:bg-zinc-800/40 cursor-pointer" onClick={() => onEditar(r)}>
              {/* Checkbox */}
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <TableCheckbox
                  checked={seleccionados.includes(r.id)}
                  onChange={() => onToggleUno(r.id)}
                />
              </td>

              {/* Prospecto */}
              <td className="px-5 py-3.5 text-zinc-300">
               {/* ✅ Cámbialo por */}
  <p className="font-medium text-zinc-200">{r.empresa || "-"}</p>
  <p className="text-xs text-zinc-400">{r.nombre_contacto || ""}</p>
</td>

              {/* Título */}
              <td className="px-5 py-3.5">
                <div className="space-y-1">
                  <p className="font-medium text-zinc-200">
                    {r.titulo}
                  </p>

                  <p className="text-xs text-zinc-400">
                    {r.empresa} · {r.nombre_contacto}
                  </p>
                </div>
              </td>

              {/* Fecha */}
              <td className="px-5 py-3.5">
                <div className="space-y-1">
                  <p className="font-medium text-zinc-200">
                    {new Date(r.fecha_hora).toLocaleDateString("es-PE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(r.fecha_hora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                    {r.hora_fin && <> – {r.hora_fin.slice(0, 5)}</>}
                  </p>
                  {r.duracion_minutos != null && r.duracion_minutos > 0 && (
                    <span className="inline-block text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {r.duracion_minutos >= 60
                        ? `${Math.floor(r.duracion_minutos / 60)}h${r.duracion_minutos % 60 > 0 ? ` ${r.duracion_minutos % 60}m` : ""}`
                        : `${r.duracion_minutos}m`}
                    </span>
                  )}
                </div>
              </td>

              {/* Modalidad */}
              <td className="px-5 py-3.5">
                <span className="text-zinc-300 capitalize flex items-center gap-1">
                  {r.modalidad === "presencial" ? (
                    <MapPin size={12} />
                  ) : (
                    <Video size={12} />
                  )}

                  {r.modalidad.replace("_", " ")}
                </span>
              </td>

              {/* Enlace */}
              <td className="px-5 py-3.5 max-w-[220px]">
                {r.enlace ? (
                  <a
                    href={r.enlace}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline truncate block"
                  >
                    {r.enlace}
                  </a>
                ) : (
                  <span className="text-zinc-300">-</span>
                )}
              </td>

              {/* Estado */}
              <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${COLOR_ESTADO[r.estado]}`}
                  >
                    {r.estado}
                  </span>

                  <select
                    value={r.estado}
                    onChange={(e) =>
                      onCambiarEstado(r.id, e.target.value)
                    }
                    className={`${INPUT_BASE} text-xs px-2 py-1 focus:outline-none w-full`}
                  >
                    {ESTADOS.map((e) => (
                      <option
                        key={e}
                        value={e}
                        className="capitalize"
                      >
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
              </td>

              {/* Notas */}
              <td className="px-5 py-3.5 text-zinc-300 max-w-[240px]">
                {r.notas || "-"}
              </td>

              {/* Acciones */}
              <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditar(r)}
                    className="text-zinc-400 hover:text-brand transition"
                    title="Editar reunión"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onBorrar(r.id)}
                    className="text-red-400 hover:text-red-600 transition"
                    title="Eliminar reunión"
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
  );
}