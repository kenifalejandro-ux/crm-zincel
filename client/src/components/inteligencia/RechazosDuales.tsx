/** client/src/components/inteligencia/RechazosDuales.tsx */

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
            <span className="text-[10px] text-zinc-300 flex-1 truncate">{m.motivo}</span>
            <div className="w-20 bg-zinc-800 rounded-full h-1.5 shrink-0">
              <div className="h-1.5 rounded-full" style={{ width: `${Math.max(pct, 3)}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
            </div>
            <span className="text-[10px] font-semibold text-zinc-400 w-6 text-right">{m.total}</span>
          </div>
        );
      })}
    </div>
  );
}

function SinMotivoBadge({ sinMotivo, total, accion }: { sinMotivo: number; total: number; accion: string }) {
  if (sinMotivo === 0 || total === 0) return null;
  return (
    <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
      <span className="text-amber-500 text-xs mt-0.5">⚠</span>
      <p className="text-[10px] text-amber-700 leading-relaxed">
        <span className="font-semibold">{sinMotivo} de {total}</span> sin motivo registrado.
        {" "}{accion}
      </p>
    </div>
  );
}

export function RechazosDualesChart() {
  const [data, setData] = useState<RechazosDuales | null>(null);

  useEffect(() => {
    getRechazosDuales().then(setData).catch(() => {});
  }, []);

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
            <div className="p-1.5 rounded-lg bg-orange-50 shrink-0">
              <PhoneMissed size={14} className="text-orange-500" />
            </div>
            <div>
              <h3 className={HEADER_CLASS}>Rechazos en primer contacto</h3>
              <p className="text-[11px] text-zinc-400">Llamadas con resultado "No interesado"</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2 mb-1">
            <div className="bg-orange-50 rounded-lg p-2.5 text-center">
              <p className="text-xl font-bold text-orange-600">{pc.total_no_interesado}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">rechazos<br/>totales</p>
            </div>
            <div className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
              <p className="text-xl font-bold text-zinc-300">{pc.pct_rechazo}%</p>
              <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">de todas<br/>las llamadas</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
              <p className="text-xl font-bold text-emerald-600">{pc.con_motivo}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">con motivo<br/>registrado</p>
            </div>
          </div>

          <MotivosBarra
            motivos={pc.motivos}
            total={pc.con_motivo}
            color="#f97316"
          />

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
            <div className="p-1.5 rounded-lg bg-red-50 shrink-0">
              <FileX size={14} className="text-red-500" />
            </div>
            <div>
              <h3 className={HEADER_CLASS}>Propuestas caídas / vencidas</h3>
              <p className="text-[11px] text-zinc-400">Ventas perdidas en etapa de propuesta</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-1">
            <div className="bg-red-50 rounded-lg p-2.5 text-center">
              <p className="text-xl font-bold text-red-600">{pp.total}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">propuestas<br/>perdidas</p>
            </div>
            <div className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
              <p className="text-sm font-bold text-zinc-300">{fmt(pp.monto_perdido)}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">valor<br/>perdido</p>
            </div>
            <div className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
              <p className="text-xl font-bold text-zinc-300">{pp.vencidas}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">vencidas sin<br/>respuesta</p>
            </div>
          </div>

          {/* Desglose cerrada_perdida vs vencida */}
          <div className="flex gap-3 mt-2 mb-1">
            {[
              { label: "Cerradas perdidas", value: pp.cerradas_perdidas, color: "bg-red-100 text-red-700" },
              { label: "Vencidas",          value: pp.vencidas,          color: "bg-zinc-100 text-zinc-600" },
            ].map((s) => (
              <span key={s.label} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                {s.label}: {s.value}
              </span>
            ))}
          </div>

          <MotivosBarra
            motivos={pp.motivos}
            total={pp.con_motivo}
            color="#ef4444"
          />

          <SinMotivoBadge
            sinMotivo={pp.sin_motivo}
            total={pp.total}
            accion='Al marcar una propuesta como "Cerrada perdida" o "Vencida", selecciona el motivo.'
          />
        </div>
      ) : pc.total_no_interesado > 0 ? (
        /* Placeholder cuando no hay propuestas caídas aún */
        <div className={`${PANEL_BASE} border-dashed p-5 flex flex-col items-center justify-center text-center gap-2`}>
          <FileX size={24} className="text-zinc-300" />
          <p className="text-xs font-medium text-zinc-400">Sin propuestas caídas aún</p>
          <p className="text-[10px] text-zinc-300 max-w-[180px]">
            Cuando una propuesta se marque como "Cerrada perdida" o "Vencida", aparecerá aquí con su motivo.
          </p>
        </div>
      ) : null}

    </div>
  );
}
