/** client/src/components/inteligencia/RechazosDuales.tsx — PREMIUM NEON
 * Antes: KPIs bg-orange-50/bg-red-50/bg-emerald-50/bg-zinc-800/40, motivos bg-zinc-800,
 * badge sin-motivo bg-amber-50, desglose bg-red-100/bg-zinc-100, iconos bg-orange-50/bg-red-50.
 * Ahora: todo neon con glow. Lógica/datos INTACTOS.
 */

import { useEffect, useState } from "react";
import { PhoneMissed, FileX } from "lucide-react";
import { CARD_CLASS, HEADER_CLASS, PANEL_BASE } from "../../lib/tokens";
import { getRechazosDuales, type RechazosDuales } from "../../services/inteligencia.api";

function fmt(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}k`;
  return `S/ ${n.toLocaleString("es-PE")}`;
}

function MotivosBarra({ motivos, total, color }: {
  motivos: { motivo: string; total: number }[];
  total:   number;
  color:   string;
}) {
  if (motivos.length === 0) return null;
  return (
    <div className="space-y-1.5 mt-3">
      {motivos.map((m) => {
        const pct = total > 0 ? Math.round((m.total / total) * 100) : 0;
        return (
          <div key={m.motivo} className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 flex-1 truncate">{m.motivo}</span>
            <div className="w-20 bg-white/[0.06] rounded-full h-1.5 shrink-0">
              <div className="h-1.5 rounded-full" style={{ width: `${Math.max(pct, 3)}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
            </div>
            <span className="text-[10px] font-semibold text-zinc-400 w-6 text-right tabular-nums">{m.total}</span>
          </div>
        );
      })}
    </div>
  );
}

function SinMotivoBadge({ sinMotivo, total, accion }: { sinMotivo: number; total: number; accion: string }) {
  if (sinMotivo === 0 || total === 0) return null;
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
      <span className="text-amber-400 text-xs mt-0.5">⚠</span>
      <p className="text-[10px] text-amber-300 leading-relaxed">
        <span className="font-semibold">{sinMotivo} de {total}</span> sin motivo registrado. {accion}
      </p>
    </div>
  );
}

// KPI tile neon
function Kpi({ value, label, hex, big }: { value: React.ReactNode; label: string; hex: string; big?: boolean }) {
  return (
    <div className="rounded-lg p-2.5 text-center" style={{ background: `${hex}12`, border: `1px solid ${hex}30` }}>
      <p className={`font-display font-bold tabular-nums ${big ? "text-sm" : "text-xl"}`} style={{ color: hex, textShadow: `0 0 10px ${hex}55` }}>{value}</p>
      <p className="text-[9px] text-zinc-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

export function RechazosDualesChart() {
  const [data, setData] = useState<RechazosDuales | null>(null);

  useEffect(() => { getRechazosDuales().then(setData).catch(() => {}); }, []);

  if (!data) return null;

  const { primer_contacto: pc, propuestas_perdidas: pp } = data;
  const hayDatos = pc.total_no_interesado > 0 || pp.total > 0;
  if (!hayDatos) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* Panel 1 — Primer contacto rechazado */}
      {pc.total_no_interesado > 0 && (
        <div className={CARD_CLASS}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)" }}>
              <PhoneMissed size={14} className="text-orange-400" />
            </div>
            <div>
              <h3 className={HEADER_CLASS}>Rechazos en primer contacto</h3>
              <p className="text-[11px] text-zinc-500">Llamadas con resultado "No interesado"</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-1">
            <Kpi value={pc.total_no_interesado} label="rechazos totales" hex="#fb923c" />
            <Kpi value={`${pc.pct_rechazo}%`} label="de todas las llamadas" hex="#a1a1aa" />
            <Kpi value={pc.con_motivo} label="con motivo registrado" hex="#34d399" />
          </div>

          <MotivosBarra motivos={pc.motivos} total={pc.con_motivo} color="#f97316" />

          <SinMotivoBadge
            sinMotivo={pc.sin_motivo}
            total={pc.total_no_interesado}
            accion='Al registrar una llamada con "No interesado", selecciona el motivo para obtener este análisis.'
          />
        </div>
      )}

      {/* Panel 2 — Propuestas caídas / vencidas */}
      {pp.total > 0 ? (
        <div className={CARD_CLASS}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)" }}>
              <FileX size={14} className="text-red-400" />
            </div>
            <div>
              <h3 className={HEADER_CLASS}>Propuestas caídas / vencidas</h3>
              <p className="text-[11px] text-zinc-500">Ventas perdidas en etapa de propuesta</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-1">
            <Kpi value={pp.total} label="propuestas perdidas" hex="#f87171" />
            <Kpi value={fmt(pp.monto_perdido)} label="valor perdido" hex="#a1a1aa" big />
            <Kpi value={pp.vencidas} label="vencidas sin respuesta" hex="#a1a1aa" />
          </div>

          {/* Desglose cerrada_perdida vs vencida */}
          <div className="flex gap-3 mt-2 mb-1">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: "#f87171", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)" }}>
              Cerradas perdidas: {pp.cerradas_perdidas}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">
              Vencidas: {pp.vencidas}
            </span>
          </div>

          <MotivosBarra motivos={pp.motivos} total={pp.con_motivo} color="#ef4444" />

          <SinMotivoBadge
            sinMotivo={pp.sin_motivo}
            total={pp.total}
            accion='Al marcar una propuesta como "Cerrada perdida" o "Vencida", selecciona el motivo.'
          />
        </div>
      ) : pc.total_no_interesado > 0 ? (
        <div className={`${PANEL_BASE} border-dashed p-5 flex flex-col items-center justify-center text-center gap-2`}>
          <FileX size={24} className="text-zinc-500" />
          <p className="text-xs font-medium text-zinc-400">Sin propuestas caídas aún</p>
          <p className="text-[10px] text-zinc-500 max-w-[180px]">
            Cuando una propuesta se marque como "Cerrada perdida" o "Vencida", aparecerá aquí con su motivo.
          </p>
        </div>
      ) : null}

    </div>
  );
}