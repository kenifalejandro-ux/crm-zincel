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
  primaryLight: "#b8cbe8",  // gold muy claro (barras de fondo, fills suaves)
  dark:         "#27272a",  // zinc-800 (negro suave, contraste fuerte)
  muted:        "#a1a1aa",  // zinc-400 (gris medio)
  mutedDark:    "#71717a",  // zinc-600 (gris oscuro)
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
  "bg-white/85 backdrop-blur-xl rounded-xl border border-zinc-200/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6";

export const HEADER_CLASS =
  "text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center";
