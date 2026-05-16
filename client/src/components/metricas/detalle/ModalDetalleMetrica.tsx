/** src/components/metricas/detalle/ModalDetalleMetrica.tsx */

import { useState, useMemo } from "react";
import { X }                 from "lucide-react";
import { Metrica }           from "../../../types/metricas.types";
import { calcularMetricas }  from "../../../utils/metricas.calc";
import { TabsDetalle, Tab }  from "./TabsDetalle";
import { ResumenDetalle }    from "./ResumenDetalle";
import { FunnelDetalle }     from "./FunnelDetalle";
import { AnalisisDetalle } from "./AnalisisDetalle.tsx";
import { ProyeccionDetalle } from "./ProyeccionDetalle";

interface Props {
  metrica: Metrica;
  onCerrar: () => void;
}

const BADGE_PLATAFORMA: Record<string, string> = {
  meta:   "bg-blue-100 text-blue-700",
  google: "bg-red-100  text-red-700",
  tiktok: "bg-pink-100 text-pink-700",
};

const LABEL_PLATAFORMA: Record<string, string> = {
  meta:   "Meta Ads",
  google: "Google Ads",
  tiktok: "TikTok Ads",
};

const LABEL_SUB: Record<string, string> = {
  facebook:         "Facebook",
  instagram:        "Instagram",
  audience_network: "Audience Network",
};

export const ModalDetalleMetrica = ({ metrica, onCerrar }: Props) => {
  const [tab, setTab] = useState<Tab>("resumen");

  const calculado = useMemo(() => calcularMetricas(metrica), [metrica]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${BADGE_PLATAFORMA[metrica.plataforma]}`}>
                  {LABEL_PLATAFORMA[metrica.plataforma]}
                </span>
                {metrica.sub_plataforma && (
                  <span className="text-[11px] text-zinc-400 capitalize">
                    {LABEL_SUB[metrica.sub_plataforma] ?? metrica.sub_plataforma}
                  </span>
                )}
              </div>
              <h2 className="text-sm font-bold text-zinc-800">{metrica.campana_nombre}</h2>
              <p className="text-xs text-zinc-400">
                {metrica.empresa} · {new Date(metrica.periodo_inicio).toLocaleDateString("es-PE")} → {new Date(metrica.periodo_fin).toLocaleDateString("es-PE")}
              </p>
            </div>
            <button
              onClick={onCerrar}
              className="text-zinc-400 hover:text-zinc-600 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4">
            <TabsDetalle activa={tab} onChange={setTab} />
          </div>
        </div>

        {/* ── Contenido ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "resumen"    && <ResumenDetalle    metrica={metrica} calculado={calculado} />}
          {tab === "funnel"     && <FunnelDetalle     funnel={calculado.funnel} />}
          {tab === "analisis"   && <AnalisisDetalle   metrica={metrica} calculado={calculado} />}
          {tab === "proyeccion" && <ProyeccionDetalle metrica={metrica} proyeccion={calculado.proyeccion} />}
        </div>

      </div>
    </div>
  );
};