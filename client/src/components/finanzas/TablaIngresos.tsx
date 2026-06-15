/** client/src/components/finanzas/TablaIngresos.tsx — NEON
 * Antes: thead bg-zinc-800/40 + text-zinc-100 lavado, divide-gray-50, hover:bg-zinc-800/40,
 * text-brand (cobrado), text-orange-600 (saldo), badge propuesta bg-purple-100. Ahora: neon.
 * Lógica/props INTACTAS.
 */

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

const TH = "px-4 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider";

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
          <tr className="border-b border-white/[0.08]">
            <th className="px-3 py-2 w-[40px]">
              <TableCheckbox checked={todosSeleccionados} onChange={onToggleTodos} />
            </th>
            <th className={`text-left ${TH}`}>Empresa</th>
            <th className={`text-left ${TH}`}>Servicio</th>
            <th className={`text-left ${TH}`}>Descripción</th>
            <th className={`text-right ${TH}`}>Total</th>
            <th className={`text-right ${TH}`}>Cobrado</th>
            <th className={`text-right ${TH}`}>Saldo</th>
            <th className={`text-left ${TH}`}>Estado</th>
            <th className={`text-left ${TH}`}>Fecha</th>
            <th className={`text-left ${TH}`}>Vence</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {ingresos.length === 0 ? (
            <tr>
              <td colSpan={11} className="text-center py-12 text-xs text-zinc-500">
                Sin ingresos registrados
              </td>
            </tr>
          ) : (
            ingresos.map((ing) => (
              <tr key={ing.id} onClick={() => onEditar(ing)} className="hover:bg-white/[0.03] transition cursor-pointer group">
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <TableCheckbox
                    checked={seleccionados.includes(ing.id)}
                    onChange={() => onToggleUno(ing.id)}
                  />
                </td>
                <td className="px-4 py-3 text-zinc-200 font-medium">
                  <div className="flex items-center gap-1.5">
                    {ing.empresa || "—"}
                    {ing.propuesta_id && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                        style={{ color: "#a855f7", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
                        Propuesta
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{TIPO_LABEL[ing.tipo_servicio] ?? ing.tipo_servicio}</td>
                <td className="px-4 py-3 text-zinc-500 max-w-[180px] truncate">{ing.descripcion}</td>
                <td className="px-4 py-3 text-right font-display font-bold text-zinc-200 tabular-nums">
                  {fmt(ing.monto_total, ing.moneda)}
                </td>
                <td className="px-4 py-3 text-right text-emerald-400 font-medium tabular-nums">
                  {fmt(ing.adelanto, ing.moneda)}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: Number(ing.saldo_pendiente) > 0 ? "#fbbf24" : "#71717a" }}>
                  {fmt(ing.saldo_pendiente, ing.moneda)}
                </td>
                <td className="px-4 py-3">
                  <BadgeEstadoIngreso estado={ing.estado} />
                </td>
                <td className="px-4 py-3 text-zinc-400 tabular-nums">{fmtFecha(ing.fecha)}</td>
                <td className="px-4 py-3 text-zinc-400 tabular-nums">
                  {ing.fecha_vencimiento ? fmtFecha(ing.fecha_vencimiento) : "—"}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditar(ing)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-accent hover:bg-white/5 transition" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onBorrar(ing.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition" title="Eliminar">
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