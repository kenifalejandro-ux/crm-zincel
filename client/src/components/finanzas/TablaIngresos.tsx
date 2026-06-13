/** client/src/components/finanzas/TablaIngresos.tsx */

import { GLASS_BASE } from "../../lib/tokens";
import { Pencil, Trash2 } from "lucide-react";
import { TableCheckbox } from "../ui/TableCheckbox";
import { BadgeEstadoIngreso } from "./BadgeEstado";
import type { Ingreso, TipoServicio } from "../../types/finanzas.types";

const TIPO_LABEL: Record<TipoServicio, string> = {
  desarrollo_web:    "Desarrollo web",
  wordpress:         "WordPress",
  diseño_marketing:  "Diseño & Marketing",
  redes_sociales:    "Redes sociales",
  publicidad_digital:"Publicidad digital",
  erp:               "ERP",
  crm:               "CRM",
  otro:              "Otro",
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
  ingresos:           Ingreso[];
  onEditar:           (ing: Ingreso) => void;
  onBorrar:           (id: string) => void;
  seleccionados:      string[];
  todosSeleccionados: boolean;
  onToggleUno:        (id: string) => void;
  onToggleTodos:      () => void;
}

export function TablaIngresos({
  ingresos, onEditar, onBorrar,
  seleccionados, todosSeleccionados, onToggleUno, onToggleTodos,
}: Props) {
  return (
    <div className={`${GLASS_BASE} overflow-x-auto`}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/8 bg-zinc-800/40">
            <th className="px-3 py-2 w-[40px]">
              <TableCheckbox checked={todosSeleccionados} onChange={onToggleTodos} />
            </th>
            <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Empresa</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Servicio</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Descripción</th>
            <th className="text-right px-4 py-3 font-medium text-zinc-100 uppercase">Total</th>
            <th className="text-right px-4 py-3 font-medium text-zinc-100 uppercase">Cobrado</th>
            <th className="text-right px-4 py-3 font-medium text-zinc-100 uppercase">Saldo</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Estado</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Fecha</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Vence</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {ingresos.length === 0 ? (
            <tr>
              <td colSpan={11} className="text-center py-12 text-xs text-zinc-400">
                Sin ingresos registrados
              </td>
            </tr>
          ) : (
            ingresos.map((ing) => (
              <tr key={ing.id} onClick={() => onEditar(ing)} className="hover:bg-zinc-800/40 transition cursor-pointer">
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <TableCheckbox
                    checked={seleccionados.includes(ing.id)}
                    onChange={() => onToggleUno(ing.id)}
                  />
                </td>
                <td className="px-4 py-3 text-zinc-300 font-medium">
                  <div className="flex items-center gap-1.5">
                    {ing.empresa || "—"}
                    {ing.propuesta_id && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 shrink-0">
                        Propuesta
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-300">{TIPO_LABEL[ing.tipo_servicio] ?? ing.tipo_servicio}</td>
                <td className="px-4 py-3 text-zinc-400 max-w-[180px] truncate">{ing.descripcion}</td>
                <td className="px-4 py-3 text-right font-medium text-zinc-200">
                  {fmt(ing.monto_total, ing.moneda)}
                </td>
                <td className="px-4 py-3 text-right text-brand font-medium">
                  {fmt(ing.adelanto, ing.moneda)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-orange-600">
                  {fmt(ing.saldo_pendiente, ing.moneda)}
                </td>
                <td className="px-4 py-3">
                  <BadgeEstadoIngreso estado={ing.estado} />
                </td>
                <td className="px-4 py-3 text-zinc-300">{fmtFecha(ing.fecha)}</td>
                <td className="px-4 py-3 text-zinc-300">
                  {ing.fecha_vencimiento ? fmtFecha(ing.fecha_vencimiento) : "—"}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEditar(ing)}
                      className="text-zinc-400 hover:text-brand transition" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onBorrar(ing.id)}
                      className="text-zinc-400 hover:text-red-500 transition" title="Eliminar">
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
