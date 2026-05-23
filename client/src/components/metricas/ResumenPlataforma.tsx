/** src/components/metricas/ResumenPlataforma.tsx */

import { ResumenPlataforma as TResumen } from "../../types/metricas.types";

interface Props { resumen: TResumen[] }

const CONFIG: Record<string, { label: string; badge: string; bg: string }> = {
  meta:   { label: "Meta Ads",   badge: "bg-zinc-100 text-zinc-700", bg: "bg-white/85 backdrop-blur-xl border-zinc-200/50" },
  google: { label: "Google Ads", badge: "bg-zinc-100 text-zinc-700", bg: "bg-white/85 backdrop-blur-xl border-zinc-200/50" },
  tiktok: { label: "TikTok Ads", badge: "bg-zinc-100 text-zinc-700", bg: "bg-white/85 backdrop-blur-xl border-zinc-200/50" },
};

export const ResumenPlataforma = ({ resumen }: Props) => {
  if (!resumen.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {resumen.map((r) => {
        const cfg = CONFIG[r.plataforma] ?? CONFIG.meta;
        return (
          <div key={`${r.plataforma}-${r.sub_plataforma ?? "all"}`} className={`rounded-xl border shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 space-y-3 ${cfg.bg}`}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.label}
              </span>
              <span className="text-xs text-zinc-600">{r.campanas} campaña{Number(r.campanas) !== 1 ? "s" : ""}</span>
            </div>

            {/* Métricas */}
            <div className="space-y-1.5">
              <Fila label="Total invertido" valor={`S/ ${Number(r.total_gasto).toLocaleString("es-PE")}`} />
              <Fila label="Total leads"     valor={Number(r.total_leads).toLocaleString()} />
              <Fila label="Conversiones"    valor={Number(r.total_conversiones).toLocaleString()} />
              <Fila label="ROAS promedio"   valor={`${r.roas_promedio}x`} />
              <Fila label="CPA promedio"    valor={`S/ ${Number(r.cpa_promedio).toLocaleString("es-PE")}`} />
            </div>

          </div>
        );
      })}
    </div>
  );
};

const Fila = ({ label, valor }: { label: string; valor: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-zinc-700">{label}</span>
    <span className="text-xs font-semibold text-zinc-800">{valor}</span>
  </div>
);