/** client/src/components/reuniones/KpisReuniones.tsx — REDISEÑO NEON
 * Antes: 4 cajas tema claro (bg-zinc-100 / bg-red-50 / text-zinc-700).
 * Ahora: 4 KPI cards neon con ícono+glow; "Realizadas" trae anillo de tasa de realización.
 * Props INTACTOS (total, programadas, realizadas, canceladas).
 */
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

interface Props {
  total: number;
  programadas: number;
  realizadas: number;
  canceladas: number;
}

export function KpisReuniones({ total, programadas, realizadas, canceladas }: Props) {
  const tasa = total > 0 ? Math.round((realizadas / total) * 100) : 0;

  const cards = [
    { label: "Total reuniones", value: total,       Icon: Calendar,    tone: "accent"  as const },
    { label: "Programadas",     value: programadas, Icon: Clock,       tone: "neutral" as const },
    { label: "Realizadas",      value: realizadas,  Icon: CheckCircle, tone: "good"    as const, sub: `${tasa}% de realización`, ring: tasa },
    { label: "Canceladas",      value: canceladas,  Icon: XCircle,     tone: "danger"  as const },
  ];
  const TONE = { accent: "rgb(var(--accent))", good: "#34d399", danger: "#f87171", neutral: "#f4f4f5" } as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((k) => {
        const col = TONE[k.tone];
        const isAccent = k.tone === "accent";
        return (
          <div key={k.label} className="neon-card neon-hover p-5">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: isAccent ? "rgb(var(--accent) / 0.12)" : `${col}1a`, border: `1px solid ${isAccent ? "rgb(var(--accent) / 0.3)" : col + "40"}`, color: col, boxShadow: `0 0 14px ${isAccent ? "rgb(var(--accent) / calc(0.25*var(--glow)))" : col + "30"}` }}>
                <k.Icon size={17} />
              </div>
              {"ring" in k && k.ring !== undefined && (
                <svg width="38" height="38" viewBox="0 0 38 38">
                  <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
                  <circle cx="19" cy="19" r="15" fill="none" stroke={col} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(k.ring / 100) * 94.2} 94.2`} transform="rotate(-90 19 19)" style={{ filter: `drop-shadow(0 0 3px ${col})` }} />
                </svg>
              )}
            </div>
            <p className="font-display text-[28px] font-bold leading-none tabular-nums mt-4"
               style={{ color: k.tone === "neutral" ? "#f4f4f5" : col, textShadow: `0 0 16px ${isAccent ? "rgb(var(--accent) / calc(0.4*var(--glow)))" : k.tone === "neutral" ? "transparent" : col + "55"}` }}>{k.value}</p>
            <p className="text-[11.5px] font-semibold text-zinc-300 mt-2">{k.label}</p>
            {"sub" in k && k.sub && <p className="text-[10px] text-zinc-500 mt-0.5">{k.sub}</p>}
          </div>
        );
      })}
    </div>
  );
}