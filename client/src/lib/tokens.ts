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


// ── Clases Tailwind reutilizables ─────────────────────────────────────────────
export const CARD_CLASS =
  "bg-white rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_6px_20px_rgba(0,0,0,0.06)] p-6"

export const HEADER_CLASS =
  "text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-0";
