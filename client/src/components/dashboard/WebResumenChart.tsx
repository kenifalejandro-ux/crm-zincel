/** client/src/components/dashboard/WebResumenChart.tsx — PREMIUM NEON
 * Antes: barras planas; cobertura usaba color "#18181b" (casi negro = invisible).
 * Ahora: gauge de cobertura con glow, split Con/Sin web, barra de salud segmentada
 * multicolor y cards de estado con icono. Lógica/props (metricas) INTACTAS.
 */
import { CARD_CLASS, HEADER_CLASS, BADGE_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { Globe, X, Check, Clock, AlertTriangle, RefreshCw, FileText } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

const ESTADOS = [
  { key: "web_actualizada",      label: "Actualizada",      hex: "#34d399", Icon: Check },
  { key: "web_por_actualizar",   label: "Por actualizar",   hex: "#fbbf24", Icon: Clock },
  { key: "web_vencida",          label: "Vencida",          hex: "#f87171", Icon: AlertTriangle },
  { key: "web_en_mantenimiento", label: "En mantenimiento", hex: "#60a5fa", Icon: RefreshCw },
  { key: "web_sin_informacion",  label: "Sin información",   hex: "#a1a1aa", Icon: FileText },
] as const;

/** Gauge semicírculo de cobertura */
function CoberturaGauge({ pct }: { pct: number }) {
  const R = 56;
  const C = Math.PI * R; // longitud del semicírculo
  const dash = (pct / 100) * C;
  return (
    <div className="relative shrink-0" style={{ width: 150, height: 90 }}>
      <svg viewBox="0 0 150 90" className="w-full">
        <defs>
          <linearGradient id="web-cov-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgb(var(--accent))" stopOpacity="0.7" />
            <stop offset="100%" stopColor="rgb(var(--accent))" />
          </linearGradient>
        </defs>
        <path d="M 19 80 A 56 56 0 0 1 131 80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11" strokeLinecap="round" />
        <path
          d="M 19 80 A 56 56 0 0 1 131 80"
          fill="none" stroke="url(#web-cov-grad)" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          style={{ filter: "drop-shadow(0 0 5px rgb(var(--accent)))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <span className="font-display text-3xl font-bold text-zinc-50 leading-none" style={{ textShadow: "0 0 16px rgb(var(--accent) / calc(0.5*var(--glow)))" }}>{pct}%</span>
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">cobertura web</span>
      </div>
    </div>
  );
}

export function WebResumenChart({ metricas }: Props) {
  useChartColors(); // mantiene el hook por consistencia con el resto del dashboard
  const p       = metricas.prospectos as any;
  const conWeb  = metricas.prospectos.prospectos_con_web;
  const sinWeb  = metricas.prospectos.prospectos_sin_web;
  const total   = conWeb + sinWeb || 1;
  const pctCob  = Math.round((conWeb / total) * 100);
  const alertas = (p.web_por_actualizar ?? 0) + (p.web_vencida ?? 0) + (p.web_en_mantenimiento ?? 0);
  const saludOk = p.web_actualizada ?? 0;
  const saludPct = conWeb > 0 ? Math.round((saludOk / conWeb) * 100) : 0;

  return (
    <div className={CARD_CLASS}>
      <h2 className={`${HEADER_CLASS} mb-4`}>
        <Globe size={14} className="mr-2.5 text-cyan-400" strokeWidth={2} />
        Webs de prospectos
        {alertas > 0 && (
          <span className={`${BADGE_BASE} ml-auto px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal`}
            style={{ color: "#f87171", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)" }}>
            {alertas} requieren atención
          </span>
        )}
      </h2>

      {/* Hero: gauge + split con/sin web */}
      <div className="flex items-center gap-5 mb-5">
        <CoberturaGauge pct={pctCob} />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgb(var(--accent) / 0.12)", border: "1px solid rgb(var(--accent) / 0.3)", color: "rgb(var(--accent))" }}>
              <Globe size={16} />
            </div>
            <div className="flex-1 flex items-baseline justify-between">
              <span className="text-[11px] text-zinc-400">Con web</span>
              <span className="font-display text-lg font-bold text-zinc-100 tabular-nums">{conWeb}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(82,82,91,0.18)", border: "1px solid rgba(113,113,122,0.4)", color: "#a1a1aa" }}>
              <X size={16} />
            </div>
            <div className="flex-1 flex items-baseline justify-between">
              <span className="text-[11px] text-zinc-400">Sin web <span className="text-zinc-600">· oportunidad</span></span>
              <span className="font-display text-lg font-bold text-zinc-300 tabular-nums">{sinWeb}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de salud segmentada */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Estado de webs activas ({conWeb})</p>
          <span className="text-[10px] font-semibold" style={{ color: saludPct >= 50 ? "#34d399" : "#fbbf24" }}>{saludPct}% al día</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.05] gap-px">
          {ESTADOS.map(({ key, label, hex }) => {
            const v = p[key] ?? 0;
            const pct = conWeb > 0 ? (v / conWeb) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div key={key} className="h-full transition-all first:rounded-l-full last:rounded-r-full"
                style={{ width: `${pct}%`, background: hex, boxShadow: `0 0 8px ${hex}88` }}
                title={`${label}: ${v}`} />
            );
          })}
        </div>
      </div>

      {/* Cards de estado */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ESTADOS.map(({ key, label, hex, Icon }) => {
          const v = p[key] ?? 0;
          const pct = conWeb > 0 ? Math.round((v / conWeb) * 100) : 0;
          return (
            <div key={key} className="rounded-xl p-2.5 text-center" style={{ background: `${hex}10`, border: `1px solid ${hex}2e` }}>
              <Icon size={13} className="mx-auto mb-1" style={{ color: hex }} />
              <p className="font-display text-lg font-bold tabular-nums leading-none" style={{ color: hex, textShadow: `0 0 10px ${hex}55` }}>{v}</p>
              <p className="text-[8.5px] text-zinc-500 uppercase tracking-wide mt-1 leading-tight">{label}</p>
              <p className="text-[8.5px] text-zinc-600 mt-0.5">{pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}