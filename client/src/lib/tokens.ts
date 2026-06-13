/** client/src/lib/tokens.ts
 *
 *  Tokens de diseño — versión premium.
 *  Las bases visuales viven en styles/neon.css (clases .neon-*) para que
 *  el glow sea AJUSTABLE globalmente vía variables CSS (--accent, --glow)
 *  sin tocar cientos de clases Tailwind arbitrarias.
 *
 *  Los nombres exportados se mantienen — el resto del CRM no necesita cambios.
 */

// ── Colores hex (recharts fill/stroke y valores inline) ──────────────────────
export const COLORS = {
  primary:      "#06b6d4",  // cyan-500 — debe coincidir con --accent de neon.css
  primaryHover: "#0891b2",  // cyan-600
  primaryLight: "#164e63",  // cyan-900
  dark:         "#e2e8f0",  // slate-200
  muted:        "#94a3b8",  // slate-400
  mutedDark:    "#64748b",  // slate-500
  mutedLight:   "#22d3ee",  // cyan-400
  danger:       "#f87171",  // red-400
  warning:      "#fbbf24",  // amber-400
  success:      "#34d399",  // emerald-400
  surface:      "#1e293b",  // slate-800
} as const;

// ── Paleta ordenada para gráficos multi-serie ────────────────────────────────
export const CHART_PALETTE: string[] = [
  COLORS.primary,
  "#a855f7",   // violeta
  "#ec4899",   // rosa
  COLORS.mutedLight,
  COLORS.muted,
  COLORS.mutedDark,
  COLORS.primaryLight,
];

// ── Etapas del pipeline (colores neon compartidos por todo el CRM) ──────────
export const ETAPA_COLOR: Record<string, string> = {
  nuevo:             "#06b6d4",
  contactado:        "#3b82f6",
  interesado:        "#22d3ee",
  propuesta_enviada: "#a855f7",
  negociacion:       "#ec4899",
};

// ═══════════════════════════════════════════════════════════════════════════
//  BASES POR TIPO DE ELEMENTO — definidas en styles/neon.css
//  Cambia --accent / --glow en :root para ajustar TODO el CRM de una vez.
// ═══════════════════════════════════════════════════════════════════════════

export const CARD_BASE   = "neon-card";
export const GLASS_BASE  = CARD_BASE;                 // alias retro-compatible
export const CARD_PURPLE = "neon-card neon-violet";
export const CARD_PINK   = "neon-card neon-pink";

export const PANEL_BASE  = "neon-panel";
export const PANEL_HOVER = "neon-panel neon-panel-hover";

export const BADGE_BASE  = "neon-badge";
export const INPUT_BASE  = "neon-input";
export const MODAL_BASE  = "neon-modal";

export const STICKY_BASE =
  "bg-slate-900/90 backdrop-blur-xl border-b border-white/[0.07]";

export const TOOLTIP_BASE = "neon-tooltip";

export const GLASS_HOVER = "neon-hover";

// ── Botones ──────────────────────────────────────────────────────────────────
export const BTN_PRIMARY = "btn-primary";
export const BTN_GHOST   = "btn-ghost";

// ── Texto / tipografía ───────────────────────────────────────────────────────
export const HEADING_TEXT = "text-zinc-100";

export const CARD_CLASS    = `${GLASS_BASE} ${GLASS_HOVER} p-6`;
export const SECTION_PANEL = `${GLASS_BASE} p-6`;

export const DATA_VALUE_CLASS =
  "font-display text-2xl font-bold tabular-nums leading-tight text-zinc-100";

export const LABEL_CLASS_SM =
  "text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500";

export const PAGE_TITLE =
  "font-display text-2xl font-bold text-zinc-100 tracking-tight";

export const SECTION_TITLE =
  "text-sm font-semibold text-zinc-200";

export const SECTION_KICKER =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-accent";

export const HEADER_CLASS =
  "text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-0";
