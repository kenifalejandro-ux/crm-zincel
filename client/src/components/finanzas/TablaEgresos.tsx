/** client/src/components/finanzas/TablaEgresos.tsx — NEON
 * Antes: thead bg-zinc-800/40 + text-zinc-100, divide-gray-50, hover:bg-zinc-800/40,
 * text-red-600 (monto), chips frecuencia bg-blue-50/purple-50/gray-100. Ahora: neon.
 * Lógica/props INTACTAS.
 */

import { GLASS_BASE } from "../../lib/tokens";
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

// chips translúcidos neon por frecuencia
const FRECUENCIA_CHIP: Record<FrecuenciaEgreso, React.CSSProperties> = {
  mensual: { color: "#60a5fa", background: "rgba(96,165,250,0.12)",  border: "1px solid rgba(96,165,250,0.3)" },
  anual:   { color: "#a855f7", background: "rgba(168,85,247,0.12)",  border: "1px solid rgba(168,85,247,0.3)" },
  unico:   { color: "#a1a1aa", background: "rgba(161,161,170,0.12)", border: "1px solid rgba(161,161,170,0.28)" },
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
    <div className={`${GLASS_BASE} overflow-x-auto`}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.08]">
            <th className="px-3 py-2 w-[40px]">
              <TableCheckbox checked={todosSeleccionados} onChange={onToggleTodos} />
            </th>
            <th className={`text-left ${TH}`}>Categoría</th>
            <th className={`text-left ${TH}`}>Descripción</th>
            <th className={`text-left ${TH}`}>Proveedor</th>
            <th className={`text-right ${TH}`}>Monto</th>
            <th className={`text-left ${TH}`}>Frecuencia</th>
            <th className={`text-left ${TH}`}>Estado</th>
            <th className={`text-left ${TH}`}>Fecha</th>
            <th className={`text-left ${TH}`}>Vencimiento</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {egresos.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center py-12 text-xs text-zinc-500">
                Sin egresos registrados
              </td>
            </tr>
          ) : (
            egresos.map((eg) => (
              <tr key={eg.id} onClick={() => onEditar(eg)} className="hover:bg-white/[0.03] transition cursor-pointer group">
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <TableCheckbox
                    checked={seleccionados.includes(eg.id)}
                    onChange={() => onToggleUno(eg.id)}
                  />
                </td>
                <td className="px-4 py-3 text-zinc-300 font-medium">
                  {CATEGORIA_LABEL[eg.categoria] ?? eg.categoria}
                </td>
                <td className="px-4 py-3 text-zinc-500 max-w-[180px] truncate">{eg.descripcion}</td>
                <td className="px-4 py-3 text-zinc-400">{eg.proveedor || "—"}</td>
                <td className="px-4 py-3 text-right font-display font-semibold text-red-400 tabular-nums">
                  {fmt(eg.monto, eg.moneda)}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={FRECUENCIA_CHIP[eg.frecuencia]}>
                    {FRECUENCIA_LABEL[eg.frecuencia]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <BadgeEstadoEgreso estado={eg.estado} />
                </td>
                <td className="px-4 py-3 text-zinc-400 tabular-nums">{fmtFecha(eg.fecha)}</td>
                <td className="px-4 py-3 text-zinc-400 tabular-nums">
                  {eg.fecha_vencimiento ? fmtFecha(eg.fecha_vencimiento) : "—"}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditar(eg)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-accent hover:bg-white/5 transition" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onBorrar(eg.id)}
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