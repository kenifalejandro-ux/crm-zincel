/** client/src/components/finanzas/TablaPrestamos.tsx — NEON
 * Antes: resumen bg-red-50/border-red-100, thead bg-zinc-800/40 + text-zinc-100, divide-gray-50,
 * hover:bg-zinc-800/40, fila vencida bg-red-50/40, monto text-red-600, chips de categoría
 * bg-cyan-50/amber-50/blue-50/violet-50/emerald-50/pink-50/gray-100, badge estado tema claro.
 * Ahora: todo neon. Lógica/props INTACTAS.
 */

import { GLASS_BASE } from "../../lib/tokens";
import { Pencil, Trash2 } from "lucide-react";
import { TableCheckbox } from "../ui/TableCheckbox";
import type { Prestamo, EstadoPrestamo, CategoriaPrestamo } from "../../types/finanzas.types";

const ESTADO_CFG: Record<EstadoPrestamo, { label: string; class: string; dot: string }> = {
  por_pagar: { label: "Por pagar", class: "bg-red-500/12 text-red-300 border-red-500/30",          dot: "bg-red-400" },
  pagado:    { label: "Pagado",    class: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  vencido:   { label: "Vencido",   class: "bg-red-500/18 text-red-200 border-red-500/40",           dot: "bg-red-500 animate-pulse" },
};

const CATEGORIA_LABEL: Record<CategoriaPrestamo, string> = {
  herramientas_ia:         "Herramientas IA",
  infraestructura_digital: "Infraestructura digital",
  publicidad_digital:      "Publicidad digital",
  herramientas_saas:       "Herramientas & SaaS",
  subcontratos:            "Subcontratos",
  personal:                "Personal",
  otro:                    "Otro",
};

// chips translúcidos neon por categoría
const CATEGORIA_HEX: Record<CategoriaPrestamo, string> = {
  herramientas_ia:         "#22d3ee",
  infraestructura_digital: "#fbbf24",
  publicidad_digital:      "#60a5fa",
  herramientas_saas:       "#a855f7",
  subcontratos:            "#34d399",
  personal:                "#ec4899",
  otro:                    "#a1a1aa",
};

function chipStyle(hex: string): React.CSSProperties {
  return { color: hex, background: `${hex}1a`, border: `1px solid ${hex}38` };
}

function BadgePrestamo({ estado }: { estado: EstadoPrestamo }) {
  const cfg = ESTADO_CFG[estado] ?? ESTADO_CFG.por_pagar;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.class}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function fmtFecha(fecha: string) {
  const clean = fecha.split("T")[0];
  return new Date(clean + "T12:00:00").toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmt(monto: number, moneda: string) {
  return (moneda === "USD" ? "$ " : "S/ ") +
    Number(monto).toLocaleString("es-PE", { minimumFractionDigits: 2 });
}

const TH = "px-4 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider";

interface Props {
  prestamos:          Prestamo[];
  onEditar:           (p: Prestamo) => void;
  onBorrar:           (id: string) => void;
  seleccionados:      string[];
  todosSeleccionados: boolean;
  onToggleUno:        (id: string) => void;
  onToggleTodos:      () => void;
}

export function TablaPrestamos({
  prestamos, onEditar, onBorrar,
  seleccionados, todosSeleccionados, onToggleUno, onToggleTodos,
}: Props) {
  const pendientes = prestamos.filter((p) => p.estado !== "pagado");
  const totalPorPagar = pendientes.reduce((sum, p) => sum + Number(p.monto), 0);
  const vencidos = prestamos.filter((p) => p.estado === "vencido").length;

  return (
    <div className="space-y-3">

      {/* Resumen rápido */}
      {prestamos.length > 0 && (
        <div className="flex flex-wrap gap-4 px-4 py-3 rounded-xl text-xs" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
          <span className="text-red-300 font-medium">
            Total por pagar: <strong className="text-red-200">S/ {totalPorPagar.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong>
          </span>
          <span className="text-zinc-400">
            {pendientes.length} préstamo(s) pendiente(s)
          </span>
          {vencidos > 0 && (
            <span className="text-red-300 font-semibold animate-pulse">
              ⚠ {vencidos} vencido(s)
            </span>
          )}
        </div>
      )}

      <div className={`${GLASS_BASE} overflow-x-auto`}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="px-3 py-2 w-[40px]">
                <TableCheckbox checked={todosSeleccionados} onChange={onToggleTodos} />
              </th>
              <th className={`text-left ${TH}`}>Categoría</th>
              <th className={`text-left ${TH}`}>Descripción</th>
              <th className={`text-left ${TH}`}>Prestamista</th>
              <th className={`text-right ${TH}`}>Monto</th>
              <th className={`text-left ${TH}`}>Estado</th>
              <th className={`text-left ${TH}`}>Fecha préstamo</th>
              <th className={`text-left ${TH}`}>Vencimiento</th>
              <th className={`text-left ${TH}`}>Fecha pago</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {prestamos.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-xs text-zinc-500">
                  Sin préstamos registrados
                </td>
              </tr>
            ) : (
              prestamos.map((p) => (
                <tr key={p.id} onClick={() => onEditar(p)} className="hover:bg-white/[0.03] transition cursor-pointer group" style={p.estado === "vencido" ? { background: "rgba(248,113,113,0.05)" } : undefined}>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <TableCheckbox
                      checked={seleccionados.includes(p.id)}
                      onChange={() => onToggleUno(p.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={chipStyle(CATEGORIA_HEX[p.categoria])}>
                      {CATEGORIA_LABEL[p.categoria]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 font-medium max-w-[180px] truncate">
                    {p.descripcion}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{p.prestamista || "—"}</td>
                  <td className="px-4 py-3 text-right font-display font-semibold text-red-400 tabular-nums">
                    {fmt(p.monto, p.moneda)}
                  </td>
                  <td className="px-4 py-3">
                    <BadgePrestamo estado={p.estado} />
                  </td>
                  <td className="px-4 py-3 text-zinc-400 tabular-nums">{fmtFecha(p.fecha)}</td>
                  <td className="px-4 py-3 text-zinc-400 tabular-nums">
                    {p.fecha_vencimiento
                      ? <span className={p.estado === "vencido" ? "text-red-300 font-medium" : ""}>
                          {fmtFecha(p.fecha_vencimiento)}
                        </span>
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 tabular-nums">
                    {p.fecha_pago ? fmtFecha(p.fecha_pago) : "—"}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEditar(p)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-accent hover:bg-white/5 transition" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onBorrar(p.id)}
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
    </div>
  );
}