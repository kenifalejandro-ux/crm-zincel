/** client/src/components/ui/NeonDonut.tsx
 *
 *  Donut SVG con glow neon — sin Recharts.
 *  Dibuja arcos sobre un <circle> con strokeDasharray + hueco entre segmentos.
 *
 *  Uso:
 *    <NeonDonut
 *      data={[{ label: "Meta", value: 12, color: "#06b6d4" }, …]}
 *      centerValue={total}
 *      centerLabel="LEADS"
 *    />
 */
import { useId, type ReactNode } from "react";

export interface NeonDonutSegment {
  label?: string;
  value: number;
  color: string;
}

interface Props {
  data: NeonDonutSegment[];
  size?: number;        // px del SVG (default 168)
  thickness?: number;   // grosor del aro (default 15)
  gap?: number;         // hueco entre segmentos en unidades de circunferencia (default 6)
  centerValue?: ReactNode;
  centerLabel?: string;
  className?: string;
}

export function NeonDonut({
  data,
  size = 168,
  thickness = 15,
  gap = 6,
  centerValue,
  centerLabel,
  className,
}: Props) {
  const filterId = useId();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 56;
  const C = 2 * Math.PI * r;

  let acc = 0;
  const segs = data
    .filter((d) => d.value > 0)
    .map((d, i) => {
      const seg = { ...d, i, frac: d.value / total, start: acc };
      acc += d.value / total;
      return seg;
    });

  return (
    <svg width={size} height={size} viewBox="0 0 160 160" className={`shrink-0 ${className ?? ""}`}>
      <defs>
        <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Pista de fondo tenue */}
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />

      <g filter={`url(#${filterId})`}>
        {segs.map((s) => (
          <circle
            key={s.i}
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(s.frac * C - gap, 2)} ${C}`}
            strokeDashoffset={-(s.start * C)}
            transform="rotate(-90 80 80)"
          />
        ))}
      </g>

      {centerValue !== undefined && (
        <text x="80" y={centerLabel ? 78 : 86} textAnchor="middle" fill="#f4f4f5" fontSize="28" fontWeight="700" className="font-display">
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text x="80" y="97" textAnchor="middle" fill="#71717a" fontSize="9" letterSpacing="2.5">
          {centerLabel}
        </text>
      )}
    </svg>
  );
}
