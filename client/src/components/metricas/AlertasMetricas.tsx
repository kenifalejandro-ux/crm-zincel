/** client/src/components/metricas/AlertasMetricas.tsx
 *
 * Brecha 3: detección de anomalías — CPL disparado, frecuencia alta, CTR bajo
 * Se muestra en la parte superior de MetricasPage si hay alertas activas.
 */

import { GLASS_BASE } from "../../lib/tokens";
import { useState, useEffect } from "react";
import { AlertTriangle, X, TrendingDown, Users, Target } from "lucide-react";
import { getAlertasMetricas, type AlertaMetrica } from "../../services/metricas.api";

interface Props { empresa?: string }

const TIPO_CONFIG: Record<AlertaMetrica["tipo"], {
  label: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
}> = {
  cpl_alto: {
    label: "CPL alto",
    icon: <TrendingDown size={13} />,
    bg: "bg-red-50", border: "border-red-200", text: "text-red-700",
  },
  frecuencia_alta: {
    label: "Fatiga",
    icon: <Users size={13} />,
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700",
  },
  ctr_bajo: {
    label: "CTR bajo",
    icon: <Target size={13} />,
    bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700",
  },
};

const PLAT_LABEL: Record<string, string> = {
  meta: "Meta", google: "Google", tiktok: "TikTok",
};

export const AlertasMetricas = ({ empresa }: Props) => {
  const [alertas,   setAlertas]   = useState<AlertaMetrica[]>([]);
  const [cerrado,   setCerrado]   = useState(false);
  const [expanded,  setExpanded]  = useState(false);

  useEffect(() => {
    setCerrado(false);
    getAlertasMetricas(empresa).then(setAlertas).catch(() => setAlertas([]));
  }, [empresa]);

  if (cerrado || alertas.length === 0) return null;

  const visibles = expanded ? alertas : alertas.slice(0, 3);

  return (
    <div className={`${GLASS_BASE} overflow-hidden`}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/30">
        <AlertTriangle size={14} className="text-amber-500" />
        <span className="text-xs font-semibold text-zinc-300">
          {alertas.length} alerta{alertas.length !== 1 ? "s" : ""} detectada{alertas.length !== 1 ? "s" : ""}
        </span>
        {alertas.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-zinc-400 hover:text-zinc-400 ml-1 underline underline-offset-2"
          >
            {expanded ? "ver menos" : `+${alertas.length - 3} más`}
          </button>
        )}
        <button
          onClick={() => setCerrado(true)}
          className="ml-auto p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-400 transition"
        >
          <X size={13} />
        </button>
      </div>

      <div className="divide-y divide-white/5">
        {visibles.map((a, i) => {
          const cfg = TIPO_CONFIG[a.tipo];
          return (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5">
              <span className={`flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5 ${cfg.bg} ${cfg.border} border ${cfg.text}`}>
                {cfg.icon}
                {cfg.label}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-zinc-200 truncate">
                  <span className="font-medium">{a.campana_nombre}</span>
                  <span className="text-zinc-400 ml-1">· {PLAT_LABEL[a.plataforma] ?? a.plataforma}</span>
                  {a.empresa && empresa !== a.empresa && (
                    <span className="text-zinc-400 ml-1">· {a.empresa}</span>
                  )}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{a.mensaje}</p>
              </div>
              <span className="text-[10px] text-zinc-300 shrink-0 mt-0.5">
                {a.periodo_fin?.slice(0, 7)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
