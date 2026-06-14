/** client/src/components/dashboard/WebResumenChart.tsx */
import { CARD_CLASS, HEADER_CLASS, BADGE_BASE } from "../../lib/tokens";
import { Globe } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

const ESTADOS = [
  { key: "web_actualizada",      label: "Actualizada",        color: "#4ade80" },
  { key: "web_por_actualizar",   label: "Por actualizar",     color: "#fbbf24" },
  { key: "web_vencida",          label: "Vencida",            color: "#f87171" },
  { key: "web_en_mantenimiento", label: "En mantenimiento",   color: "#60a5fa" },
  { key: "web_sin_informacion",  label: "Sin información",    color: "#a1a1aa" },
];

export function WebResumenChart({ metricas }: Props) {
  const conWeb = metricas.prospectos.prospectos_con_web;
  const sinWeb = metricas.prospectos.prospectos_sin_web;
  const total  = conWeb + sinWeb || 1;

  const p       = metricas.prospectos as any;
  const alertas = (p.web_por_actualizar ?? 0) + (p.web_vencida ?? 0) + (p.web_en_mantenimiento ?? 0);

  const cobertura = [
    { label: "Con web", valor: conWeb, pct: Math.round((conWeb / total) * 100), color: "#22d3ee" },
    { label: "Sin web", valor: sinWeb, pct: Math.round((sinWeb / total) * 100), color: "#52525b" },
  ];

  return (
    <div className={CARD_CLASS}>
      <h2 className={`${HEADER_CLASS} mb-4`}>
        <Globe size={14} className="mr-2.5 text-cyan-500" strokeWidth={2} />
        Webs de prospectos
        {alertas > 0 && (
          <span className={`${BADGE_BASE} ml-auto px-2 py-0.5 text-[10px] font-semibold text-red-400 normal-case tracking-normal`}>
            {alertas} requieren atención
          </span>
        )}
      </h2>

      {/* Cobertura */}
      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Cobertura</p>
      <div className="space-y-2.5 mb-4">
        {cobertura.map(item => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-zinc-300">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-200">{item.valor}</span>
                <span className="text-[10px] text-zinc-400 w-7 text-right">{item.pct}%</span>
              </div>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.pct}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Estado de webs activas */}
      <div className="border-t border-white/5 pt-3">
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
          Estado de webs activas ({conWeb})
        </p>
        <div className="space-y-2">
          {ESTADOS.map(({ key, label, color }) => {
            const valor = p[key] ?? 0;
            const pct   = conWeb > 0 ? Math.round((valor / conWeb) * 100) : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[11px] text-zinc-400">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-zinc-200">{valor}</span>
                    <span className="text-[10px] text-zinc-400 w-7 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(pct, valor > 0 ? 2 : 0)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
