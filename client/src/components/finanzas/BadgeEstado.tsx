/** client/src/components/finanzas/BadgeEstado.tsx */

import type { EstadoIngreso, EstadoEgreso } from "../../types/finanzas.types";

// ── Ingresos ──────────────────────────────────────────────────

const INGRESO_CONFIG: Record<EstadoIngreso, { label: string; class: string; dot: string }> = {
  cobrado:         { label: "Cobrado",         class: "bg-green-50 text-green-700 border-green-200",    dot: "bg-green-500" },
  cobrado_parcial: { label: "Cobrado parcial", class: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  por_cobrar:      { label: "Por cobrar",      class: "bg-red-50 text-red-600 border-red-200",          dot: "bg-red-500" },
  vencido:         { label: "Vencido",         class: "bg-red-100 text-red-800 border-red-300",         dot: "bg-red-700 animate-pulse" },
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

// ── Egresos ───────────────────────────────────────────────────

const EGRESO_CONFIG: Record<EstadoEgreso, { label: string; class: string; dot: string }> = {
  pagado:   { label: "Pagado",   class: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  pendiente: { label: "Pendiente", class: "bg-red-50 text-red-600 border-red-200",      dot: "bg-red-500" },
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
