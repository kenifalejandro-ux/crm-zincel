/** client/src/components/finanzas/BadgeEstado.tsx — NEON
 * Antes: chips tema claro (bg-green-50/yellow-50/red-50/red-100). Ahora: translúcidos neon.
 */
import type { EstadoIngreso, EstadoEgreso } from "../../types/finanzas.types";

const INGRESO_CONFIG: Record<EstadoIngreso, { label: string; class: string; dot: string }> = {
  cobrado:         { label: "Cobrado",         class: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  cobrado_parcial: { label: "Cobrado parcial", class: "bg-amber-500/12 text-amber-300 border-amber-500/30",       dot: "bg-amber-400" },
  por_cobrar:      { label: "Por cobrar",      class: "bg-red-500/12 text-red-300 border-red-500/30",             dot: "bg-red-400" },
  vencido:         { label: "Vencido",         class: "bg-red-500/18 text-red-200 border-red-500/40",             dot: "bg-red-500 animate-pulse" },
};

export function BadgeEstadoIngreso({ estado }: { estado: EstadoIngreso }) {
  const cfg = INGRESO_CONFIG[estado] ?? INGRESO_CONFIG.por_cobrar;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.class}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const EGRESO_CONFIG: Record<EstadoEgreso, { label: string; class: string; dot: string }> = {
  pagado:    { label: "Pagado",    class: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  pendiente: { label: "Pendiente", class: "bg-red-500/12 text-red-300 border-red-500/30",             dot: "bg-red-400" },
};

export function BadgeEstadoEgreso({ estado }: { estado: EstadoEgreso }) {
  const cfg = EGRESO_CONFIG[estado] ?? EGRESO_CONFIG.pendiente;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.class}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}