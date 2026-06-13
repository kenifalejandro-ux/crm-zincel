/** client/src/hooks/useChartColors.ts
 *
 *  Hook que entrega los colores de gráfico VIVOS y se re-renderiza cuando
 *  el panel de Tweaks dispara el evento "crm:tweaks-change".
 *
 *  Uso en cualquier chart:
 *    const c = useChartColors();
 *    <Area stroke={c.accent} fill="url(#grad)" />
 *    <Line stroke={c.palette[1]} />
 */
import { useEffect, useMemo, useState } from "react";
import { buildChartColors, type ChartColors } from "../lib/chartTheme";

export const TWEAKS_EVENT = "crm:tweaks-change";

export function useChartColors(): ChartColors {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    window.addEventListener(TWEAKS_EVENT, onChange);
    return () => window.removeEventListener(TWEAKS_EVENT, onChange);
  }, []);

  // Recalcula leyendo las variables CSS cada vez que cambia el tema.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => buildChartColors(), [version]);
}
