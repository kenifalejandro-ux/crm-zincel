/** client/src/components/propuestas/TablaPropuestas.tsx */

import { Pencil, Trash2 } from "lucide-react";
import type { Propuesta } from "../../types/propuesta.types";
import {
  LABEL_SERVICIO,
  LABEL_ESTADO,
  COLOR_ESTADO,
} from "../../types/propuesta.types";

interface Props {
  propuestas: Propuesta[];
  onEditar:   (p: Propuesta) => void;
  onEliminar: (id: string) => void;
}

const fmt = (n: number, moneda: string) =>
  `${moneda === "USD" ? "$ " : "S/ "}${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

export function TablaPropuestas({ propuestas, onEditar, onEliminar }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Servicio</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Descripción</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Propuesto</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Cerrado</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Estado</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Fecha</th>
            <th className="px-3 py-3 w-[70px]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {propuestas.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-10 text-xs text-zinc-400">
                Sin propuestas registradas
              </td>
            </tr>
          ) : propuestas.map((p) => {
            const diferencia = p.monto_cerrado != null
              ? p.monto_cerrado - p.monto_propuesto
              : null;

            return (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5 font-medium text-zinc-800">
                  {LABEL_SERVICIO[p.servicio as keyof typeof LABEL_SERVICIO] ?? p.servicio}
                </td>
                <td className="px-5 py-3.5 text-zinc-500 max-w-[180px] truncate">
                  {p.descripcion}
                </td>
                <td className="px-5 py-3.5 font-semibold text-zinc-800">
                  {fmt(p.monto_propuesto, p.moneda)}
                </td>
                <td className="px-5 py-3.5">
                  {p.monto_cerrado != null ? (
                    <span className={diferencia! < 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                      {fmt(p.monto_cerrado, p.moneda)}
                      {diferencia !== 0 && (
                        <span className="ml-1 text-[10px] font-normal">
                          ({diferencia! > 0 ? "+" : ""}{fmt(diferencia!, p.moneda)})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${COLOR_ESTADO[p.estado as keyof typeof COLOR_ESTADO]}`}>
                    {LABEL_ESTADO[p.estado as keyof typeof LABEL_ESTADO] ?? p.estado}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-zinc-500">
                  {new Date(p.fecha_propuesta).toLocaleDateString("es-PE")}
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditar(p)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => onEliminar(p.id)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
