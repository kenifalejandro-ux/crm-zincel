/** client/src/lib/tokens.ts
 *
 *  Tokens de diseño — colores para recharts (fill/stroke).
 *  Para botones y clases Tailwind, cambia --color-brand en globals.css.
 *  COLORS.primary debe coincidir con --color-brand.
 */


// ── Colores hex (usados en recharts fill/stroke y valores inline) ─────────────
export const COLORS = {
  primary:      "#ceab11",  // debe coincidir con --color-brand en globals.css
  primaryHover: "#b08d47",  // gold oscuro para hover
  ejemplo:      "#fcf8ec",  // gold oscuro para hover
  primaryLight: "#b8cbe8",  // gold muy claro (barras de fondo, fills suaves)
  dark:         "#27272a",  // zinc-800 (negro suave, contraste fuerte)
  muted:        "#52525b",  // zinc-600 (gris legible)
  mutedDark:    "#3f3f46",  // zinc-700 (gris oscuro legible)
  mutedLight:   "#ceab11",  // debe coincidir con --color-brand en globals.css
  danger:       "#f87171",  // red-400 (errores, cancelaciones)
  success:      "#22c55e",  // green-500 (propuestas, logros, confirmaciones)
  surface:      "#f4f4f5",  // zinc-100 (grids, fondos de gráfico)
} as const;


// ── Paleta ordenada para gráficos multi-serie ─────────────────────────────────
export const CHART_PALETTE: string[] = [
  COLORS.dark,
  COLORS.primary,
  COLORS.muted,
  COLORS.mutedLight,
  COLORS.mutedDark,
  COLORS.primaryLight,
  "#52525b",  // zinc-700
];


// ── Glass · ÚNICA fuente de verdad del efecto glassmorphism ───────────────────
// Cambia SOLO esta constante para ajustar el glass en todo el CRM.
// La consumen: <GlassCard>, CARD_CLASS, SECTION_PANEL y las clases .crm-card/.crm-section-panel.
export const GLASS_BASE =
  "bg-amber-400/10 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.03]"

export const GLASS_HOVER =
  "transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)]"

// ── Clases Tailwind reutilizables (derivadas del glass) ───────────────────────
export const CARD_CLASS =
  `${GLASS_BASE} ${GLASS_HOVER} p-6`

export const SECTION_PANEL =
  `${GLASS_BASE} p-6`

export const DATA_VALUE_CLASS =
  "text-2xl font-bold tabular-nums leading-tight"

export const LABEL_CLASS_SM =
  "text-[10px] font-semibold uppercase tracking-widest text-slate-400"

export const PAGE_TITLE =
  "text-2xl font-bold text-slate-900 tracking-tight"

export const SECTION_TITLE =
  "text-sm font-semibold text-slate-800"

export const HEADER_CLASS =
  "text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-0";
