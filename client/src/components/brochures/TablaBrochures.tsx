/** client/src/components/brochures/TablaBrochures.tsx */

import { GLASS_BASE } from "../../lib/tokens";
import { Pencil } from "lucide-react";
import { COLOR_CANAL } from "./ResumenCanales";
import { TableCheckbox } from "../ui/TableCheckbox";

interface Props {
  brochures: any[];
  seleccionados: string[];
  todosSeleccionados: boolean;
  onToggleUno: (id: string) => void;
  onToggleTodos: () => void;
  onEditar: (b: any) => void;
}

export function TablaBrochures({
  brochures, seleccionados, todosSeleccionados, onToggleUno, onToggleTodos, onEditar,
}: Props) {
  return (
    <div className={`${GLASS_BASE} overflow-x-auto max-h-[700px] overflow-y-auto scrollbar-thin`}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/8 bg-zinc-800/40">
            <th className="px-3 py-2 w-[40px]">
              <TableCheckbox checked={todosSeleccionados} onChange={onToggleTodos} />
            </th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-100 uppercase">Empresa</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-100 uppercase">Contacto</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-100 uppercase">Canal</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-100 uppercase">Fecha</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-100 uppercase">Notas</th>
            <th className="px-3 py-3 w-[50px]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {brochures.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-10 text-xs text-zinc-400">
                Sin envíos registrados
              </td>
            </tr>
          ) : brochures.map((b: any) => (
            <tr key={b.id} className="hover:bg-zinc-800/40 cursor-pointer" onClick={() => onEditar(b)}>
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <TableCheckbox checked={seleccionados.includes(b.id)} onChange={() => onToggleUno(b.id)} />
              </td>
              <td className="px-5 py-3.5 font-medium text-zinc-200">{b.empresa || "-"}</td>
              <td className="px-5 py-3.5 text-gray-300">{b.nombre_contacto || "-"}</td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${COLOR_CANAL[b.canal]}`}>
                  {b.canal}
                </span>
              </td>
              <td className="px-5 py-3.5 text-zinc-300">
                {new Date(b.fecha_envio).toLocaleDateString("es-PE")}
              </td>
              <td className="px-5 py-3.5 text-zinc-300">{b.notas || "-"}</td>
              <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onEditar(b)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-brand hover:bg-brand/5 transition"
                >
                  <Pencil size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}