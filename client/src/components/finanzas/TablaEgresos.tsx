/** client/src/components/finanzas/TablaEgresos.tsx */

import { Pencil, Trash2 } from "lucide-react";
import { TableCheckbox } from "../ui/TableCheckbox";
import { BadgeEstadoEgreso } from "./BadgeEstado";
import type { Egreso, CategoriaEgreso, FrecuenciaEgreso } from "../../types/finanzas.types";

const CATEGORIA_LABEL: Record<CategoriaEgreso, string> = {
  publicidad_digital:      "Publicidad digital",
  herramientas_saas:       "Herramientas & SaaS",
  herramientas_ia:         "Herramientas IA",
  infraestructura_digital: "Infraestructura digital",
  subcontratos:            "Subcontratos",
};

const FRECUENCIA_LABEL: Record<FrecuenciaEgreso, string> = {
  mensual: "Mensual",
  anual:   "Anual",
  unico:   "Único",
};

const FRECUENCIA_COLOR: Record<FrecuenciaEgreso, string> = {
  mensual: "bg-blue-50 text-blue-700",
  anual:   "bg-purple-50 text-purple-700",
  unico:   "bg-gray-100 text-gray-600",
};

function fmt(monto: number, moneda: string) {
  const sym = moneda === "USD" ? "$ " : "S/ ";
  return sym + Number(monto).toLocaleString("es-PE", { minimumFractionDigits: 2 });
}

function fmtFecha(fecha: string) {
  const clean = fecha.split("T")[0];
  return new Date(clean + "T12:00:00").toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

interface Props {
  egresos:            Egreso[];
  onEditar:           (eg: Egreso) => void;
  onBorrar:           (id: string) => void;
  seleccionados:      string[];
  todosSeleccionados: boolean;
  onToggleUno:        (id: string) => void;
  onToggleTodos:      () => void;
}

export function TablaEgresos({
  egresos, onEditar, onBorrar,
  seleccionados, todosSeleccionados, onToggleUno, onToggleTodos,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-3 py-2 w-[40px]">
              <TableCheckbox checked={todosSeleccionados} onChange={onToggleTodos} />
            </th>
            <th className="text-left px-4 py-3 font-medium text-zinc-700 uppercase">Categoría</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-700 uppercase">Descripción</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-700 uppercase">Proveedor</th>
            <th className="text-right px-4 py-3 font-medium text-zinc-700 uppercase">Monto</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-700 uppercase">Frecuencia</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-700 uppercase">Estado</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-700 uppercase">Fecha</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-700 uppercase">Vencimiento</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {egresos.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center py-12 text-xs text-zinc-600">
                Sin egresos registrados
              </td>
            </tr>
          ) : (
            egresos.map((eg) => (
              <tr key={eg.id} onClick={() => onEditar(eg)} className="hover:bg-gray-50 transition cursor-pointer">
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <TableCheckbox
                    checked={seleccionados.includes(eg.id)}
                    onChange={() => onToggleUno(eg.id)}
                  />
                </td>
                <td className="px-4 py-3 text-zinc-700 font-medium">
                  {CATEGORIA_LABEL[eg.categoria] ?? eg.categoria}
                </td>
                <td className="px-4 py-3 text-zinc-600 max-w-[180px] truncate">{eg.descripcion}</td>
                <td className="px-4 py-3 text-zinc-700">{eg.proveedor || "—"}</td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">
                  {fmt(eg.monto, eg.moneda)}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${FRECUENCIA_COLOR[eg.frecuencia]}`}>
                    {FRECUENCIA_LABEL[eg.frecuencia]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <BadgeEstadoEgreso estado={eg.estado} />
                </td>
                <td className="px-4 py-3 text-zinc-700">{fmtFecha(eg.fecha)}</td>
                <td className="px-4 py-3 text-zinc-700">
                  {eg.fecha_vencimiento ? fmtFecha(eg.fecha_vencimiento) : "—"}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEditar(eg)}
                      className="text-zinc-600 hover:text-brand transition" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onBorrar(eg.id)}
                      className="text-zinc-600 hover:text-red-500 transition" title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
