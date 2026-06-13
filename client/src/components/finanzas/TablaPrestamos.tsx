/** client/src/components/finanzas/TablaPrestamos.tsx */

import { GLASS_BASE } from "../../lib/tokens";
import { Pencil, Trash2 } from "lucide-react";
import { TableCheckbox } from "../ui/TableCheckbox";
import type { Prestamo, EstadoPrestamo, CategoriaPrestamo } from "../../types/finanzas.types";

const ESTADO_CFG: Record<EstadoPrestamo, { label: string; class: string; dot: string }> = {
  por_pagar: { label: "Por pagar", class: "bg-red-50 text-red-600 border-red-200",         dot: "bg-red-500" },
  pagado:    { label: "Pagado",    class: "bg-green-50 text-green-700 border-green-200",    dot: "bg-green-500" },
  vencido:   { label: "Vencido",   class: "bg-red-100 text-red-800 border-red-300",         dot: "bg-red-700 animate-pulse" },
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

const CATEGORIA_COLOR: Record<CategoriaPrestamo, string> = {
  herramientas_ia:         "bg-cyan-50 text-cyan-700",
  infraestructura_digital: "bg-amber-50 text-amber-700",
  publicidad_digital:      "bg-blue-50 text-blue-700",
  herramientas_saas:       "bg-violet-50 text-violet-700",
  subcontratos:            "bg-emerald-50 text-emerald-700",
  personal:                "bg-pink-50 text-pink-700",
  otro:                    "bg-gray-100 text-gray-600",
};

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
        <div className="flex flex-wrap gap-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs">
          <span className="text-red-700 font-medium">
            Total por pagar: <strong>S/ {totalPorPagar.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong>
          </span>
          <span className="text-zinc-300">
            {pendientes.length} préstamo(s) pendiente(s)
          </span>
          {vencidos > 0 && (
            <span className="text-red-800 font-semibold animate-pulse">
              ⚠ {vencidos} vencido(s)
            </span>
          )}
        </div>
      )}

      <div className={`${GLASS_BASE} overflow-x-auto`}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/8 bg-zinc-800/40">
              <th className="px-3 py-2 w-[40px]">
                <TableCheckbox checked={todosSeleccionados} onChange={onToggleTodos} />
              </th>
              <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Categoría</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Descripción</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Prestamista</th>
              <th className="text-right px-4 py-3 font-medium text-zinc-100 uppercase">Monto</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Fecha préstamo</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Vencimiento</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-100 uppercase">Fecha pago</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {prestamos.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-xs text-zinc-400">
                  Sin préstamos registrados
                </td>
              </tr>
            ) : (
              prestamos.map((p) => (
                <tr key={p.id} onClick={() => onEditar(p)} className={`hover:bg-zinc-800/40 transition cursor-pointer ${p.estado === "vencido" ? "bg-red-50/40" : ""}`}>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <TableCheckbox
                      checked={seleccionados.includes(p.id)}
                      onChange={() => onToggleUno(p.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${CATEGORIA_COLOR[p.categoria]}`}>
                      {CATEGORIA_LABEL[p.categoria]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 font-medium max-w-[180px] truncate">
                    {p.descripcion}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{p.prestamista || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">
                    {fmt(p.monto, p.moneda)}
                  </td>
                  <td className="px-4 py-3">
                    <BadgePrestamo estado={p.estado} />
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{fmtFecha(p.fecha)}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {p.fecha_vencimiento
                      ? <span className={p.estado === "vencido" ? "text-red-600 font-medium" : ""}>
                          {fmtFecha(p.fecha_vencimiento)}
                        </span>
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {p.fecha_pago ? fmtFecha(p.fecha_pago) : "—"}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEditar(p)}
                        className="text-zinc-400 hover:text-brand transition" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onBorrar(p.id)}
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
    </div>
  );
}
