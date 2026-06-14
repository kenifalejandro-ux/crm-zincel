/** src/components/metricas/ResumenPlataforma.tsx — REDISEÑO NEON
 * Antes: badge TEMA CLARO (bg-zinc-100 text-zinc-700) para todas las plataformas.
 * Ahora: badge por color de plataforma (Meta azul / Google rojo / TikTok rosa) + valores
 * en display. Lógica/props INTACTOS.
 */
import { ResumenPlataforma as TResumen } from "../../types/metricas.types";

interface Props { resumen: TResumen[] }

const CONFIG: Record<string, { label: string; hex: string }> = {
  meta:   { label: "Meta Ads",   hex: "#3b82f6" },
  google: { label: "Google Ads", hex: "#ef4444" },
  tiktok: { label: "TikTok Ads", hex: "#ec4899" },
};

export const ResumenPlataforma = ({ resumen }: Props) => {
  if (!resumen.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {resumen.map((r) => {
        const cfg = CONFIG[r.plataforma] ?? CONFIG.meta;
        return (
          <div key={`${r.plataforma}-${r.sub_plataforma ?? "all"}`} className="neon-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: cfg.hex, background: `${cfg.hex}1a`, border: `1px solid ${cfg.hex}38` }}>
                {cfg.label}
              </span>
              <span className="text-xs text-zinc-500">{r.campanas} campaña{Number(r.campanas) !== 1 ? "s" : ""}</span>
            </div>
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
    <span className="text-xs text-zinc-400">{label}</span>
    <span className="text-xs font-display font-bold text-zinc-100 tabular-nums">{valor}</span>
  </div>
);