/** client/src/components/metricas/AlertasMetricas.tsx — REDISEÑO NEON
 * Antes: badges TEMA CLARO (bg-red-50/bg-amber-50/bg-orange-50, border-white/30).
 * Ahora: chips neon por color de severidad. Lógica/servicio/props INTACTOS.
 */
import { useState, useEffect } from "react";
import { AlertTriangle, X, TrendingDown, Users, Target } from "lucide-react";
import { getAlertasMetricas, type AlertaMetrica } from "../../services/metricas.api";

interface Props { empresa?: string }

const TIPO_CONFIG: Record<AlertaMetrica["tipo"], { label: string; icon: React.ReactNode; hex: string }> = {
  cpl_alto:        { label: "CPL alto", icon: <TrendingDown size={11} />, hex: "#f87171" },
  frecuencia_alta: { label: "Fatiga",   icon: <Users size={11} />,        hex: "#fbbf24" },
  ctr_bajo:        { label: "CTR bajo", icon: <Target size={11} />,       hex: "#fb923c" },
};

const PLAT_LABEL: Record<string, string> = { meta: "Meta", google: "Google", tiktok: "TikTok" };

export const AlertasMetricas = ({ empresa }: Props) => {
  const [alertas, setAlertas]   = useState<AlertaMetrica[]>([]);
  const [cerrado, setCerrado]   = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setCerrado(false);
    getAlertasMetricas(empresa).then(setAlertas).catch(() => setAlertas([]));
  }, [empresa]);

  if (cerrado || alertas.length === 0) return null;
  const visibles = expanded ? alertas : alertas.slice(0, 3);

  return (
    <div className="neon-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.07]">
        <AlertTriangle size={14} className="text-amber-400" />
        <span className="text-xs font-semibold text-zinc-300">
          {alertas.length} alerta{alertas.length !== 1 ? "s" : ""} detectada{alertas.length !== 1 ? "s" : ""}
        </span>
        {alertas.length > 3 && (
          <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-zinc-500 hover:text-accent ml-1 underline underline-offset-2">
            {expanded ? "ver menos" : `+${alertas.length - 3} más`}
          </button>
        )}
        <button onClick={() => setCerrado(true)} className="ml-auto p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition">
          <X size={13} />
        </button>
      </div>

      <div>
        {visibles.map((a, i) => {
          const cfg = TIPO_CONFIG[a.tipo];
          return (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-white/[0.05] last:border-0">
              <span className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5" style={{ color: cfg.hex, background: `${cfg.hex}18`, border: `1px solid ${cfg.hex}38` }}>
                {cfg.icon}{cfg.label}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-200 truncate">
                  <span className="font-semibold">{a.campana_nombre}</span>
                  <span className="text-zinc-500 ml-1">· {PLAT_LABEL[a.plataforma] ?? a.plataforma}</span>
                  {a.empresa && empresa !== a.empresa && <span className="text-zinc-500 ml-1">· {a.empresa}</span>}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{a.mensaje}</p>
              </div>
              <span className="text-[10px] text-zinc-600 shrink-0 mt-0.5">{a.periodo_fin?.slice(0, 7)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};