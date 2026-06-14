/** client/src/components/llamadas/KpisLlamadas.tsx — REDISEÑO NEON
 * Antes: 3 cajas tema claro (bg-zinc-100 / bg-red-50 / text-zinc-700).
 * Ahora: 4 KPI cards neon con glow + ícono en círculo + número display + sub-métrica,
 *        y se agrega "Tasa de contacto" con anillo de progreso.
 * Props INTACTOS (total, contestadas, noContestadas) — el 4º KPI es derivado.
 */
import { Phone, PhoneCall, PhoneMissed, Percent } from "lucide-react";

interface Props {
  total: number;
  contestadas: number;
  noContestadas: number;
}

export function KpisLlamadas({ total, contestadas, noContestadas }: Props) {
  const tasa = total > 0 ? Math.round((contestadas / total) * 100) : 0;

  const cards = [
    { label: "Total llamadas",   value: total,             Icon: Phone,        tone: "accent" as const, sub: "en el período" },
    { label: "Contestadas",      value: contestadas,       Icon: PhoneCall,    tone: "good"   as const, sub: `${tasa}% de contacto` },
    { label: "No contestadas",   value: noContestadas,     Icon: PhoneMissed,  tone: "danger" as const, sub: `${100 - tasa}% sin respuesta` },
    { label: "Tasa de contacto", value: `${tasa}%`,        Icon: Percent,      tone: "accent" as const, sub: "objetivo 50%", ring: tasa },
  ];

  const TONE: Record<string, string> = { accent: "rgb(var(--accent))", good: "#34d399", danger: "#f87171" };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((k) => {
        const col = TONE[k.tone];
        const isAccent = k.tone === "accent";
        return (
          <div key={k.label} className="neon-card neon-hover p-5 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{
                     background: isAccent ? "rgb(var(--accent) / 0.12)" : `${col}1a`,
                     border: `1px solid ${isAccent ? "rgb(var(--accent) / 0.3)" : col + "40"}`,
                     color: col,
                     boxShadow: `0 0 14px ${isAccent ? "rgb(var(--accent) / calc(0.25*var(--glow)))" : col + "33"}`,
                   }}>
                <k.Icon size={18} />
              </div>
              {"ring" in k && k.ring !== undefined && (
                <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke={col} strokeWidth="3.5" strokeLinecap="round"
                          strokeDasharray={`${(k.ring / 100) * 100.5} 100.5`} transform="rotate(-90 20 20)"
                          style={{ filter: `drop-shadow(0 0 3px ${col})` }} />
                </svg>
              )}
            </div>
            <p className="font-display text-[30px] font-bold leading-none tabular-nums mt-4"
               style={{ color: isAccent ? "rgb(var(--accent))" : col, textShadow: `0 0 18px ${isAccent ? "rgb(var(--accent) / calc(0.45*var(--glow)))" : col + "66"}` }}>
              {k.value}
            </p>
            <p className="text-[12px] font-semibold text-zinc-300 mt-2">{k.label}</p>
            <p className="text-[10.5px] text-zinc-500 mt-0.5">{k.sub}</p>
          </div>
        );
      })}
    </div>
  );
}