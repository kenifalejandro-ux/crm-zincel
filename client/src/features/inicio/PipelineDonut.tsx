/** client/src/features/inicio/PipelineDonut.tsx
 *  Donut SVG con glow neon — sin dependencias (no usa Recharts).
 */
import { ETAPA_COLOR } from "./inicio.constants";

export interface DonutDatum {
  etapa: string;
  count: number;
}

export function PipelineDonut({ data, size = 168 }: { data: DonutDatum[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const r = 56;
  const C = 2 * Math.PI * r;
  const gap = 6;
  let acc = 0;
  const segs = data.map((d) => {
    const seg = { ...d, frac: d.count / total, start: acc };
    acc += d.count / total;
    return seg;
  });

  return (
    <svg width={size} height={size} viewBox="0 0 160 160" className="shrink-0">
      <defs>
        <filter id="donut-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#donut-glow)">
        {segs.map((s) => (
          <circle
            key={s.etapa}
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={ETAPA_COLOR[s.etapa] ?? "#06b6d4"}
            strokeWidth={15}
            strokeDasharray={`${Math.max(s.frac * C - gap, 2)} ${C}`}
            strokeDashoffset={-(s.start * C)}
            transform="rotate(-90 80 80)"
          />
        ))}
      </g>
      <text x="80" y="78" textAnchor="middle" fill="#f4f4f5" fontSize="28" fontWeight="700" className="font-display">{total}</text>
      <text x="80" y="97" textAnchor="middle" fill="#71717a" fontSize="9" letterSpacing="2.5">LEADS</text>
    </svg>
  );
}
