/** client/src/lib/chartTheme.ts
 *
 *  FUENTE ÚNICA de color para todos los gráficos (Recharts y charts a medida).
 *  Lee variables CSS vivas en runtime — cuando el panel de Tweaks cambia
 *  --accent o --chart-N, los charts se repintan (vía useChartColors()).
 *
 *  Antes: cada chart importaba COLORS (hex fijo en JS) → no respondía al Tweaks.
 *  Ahora: cada chart llama useChartColors() y recibe colores vivos.
 */

/** Lee una variable CSS de :root; si está vacía, usa el fallback. */
export function readCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** --accent se guarda como triplete "6 182 212" → lo envolvemos en rgb(). */
export function accentRgb(alpha = 1): string {
  const triplet = readCssVar("--accent", "6 182 212");
  return alpha === 1 ? `rgb(${triplet})` : `rgb(${triplet} / ${alpha})`;
}

/** Paleta multi-serie por defecto (fallbacks si no hay --chart-N definidos). */
export const CHART_FALLBACK = [
  "#06b6d4", // cyan  (acento)
  "#a855f7", // violeta
  "#ec4899", // rosa
  "#22d3ee", // cyan claro
  "#34d399", // esmeralda
  "#f59e0b", // ámbar
];

export const CHART_SEMANTIC = {
  danger:  "#f87171",
  warning: "#fbbf24",
  success: "#34d399",
  muted:   "#94a3b8",
  grid:    "rgba(255,255,255,0.06)",
  axis:    "#64748b",
} as const;

export interface ChartColors {
  accent: string;
  palette: string[];
  danger: string;
  warning: string;
  success: string;
  muted: string;
  grid: string;
  axis: string;
  /** rgb(var(--accent) / a) — útil para áreas/gradientes */
  accentAlpha: (a: number) => string;
}

/** Construye el objeto de colores leyendo las variables CSS vivas. */
export function buildChartColors(): ChartColors {
  return {
    accent:  accentRgb(),
    palette: CHART_FALLBACK.map((fb, i) => readCssVar(`--chart-${i + 1}`, fb)),
    danger:  readCssVar("--chart-danger",  CHART_SEMANTIC.danger),
    warning: readCssVar("--chart-warning", CHART_SEMANTIC.warning),
    success: readCssVar("--chart-success", CHART_SEMANTIC.success),
    muted:   CHART_SEMANTIC.muted,
    grid:    CHART_SEMANTIC.grid,
    axis:    CHART_SEMANTIC.axis,
    accentAlpha: (a: number) => accentRgb(a),
  };
}
