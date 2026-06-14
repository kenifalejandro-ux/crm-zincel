/** src/components/metricas/detalle/FunnelDetalle.tsx */

import { BADGE_BASE, PANEL_BASE } from "../../../lib/tokens";
import { FunnelData } from "../../../utils/metricas.calc";

interface Props { funnel: FunnelData }

const COLOR_ETIQUETA: Record<string, string> = {
  TOFU:    "bg-blue-500/15   text-blue-300",
  MOFU:    "bg-purple-500/15 text-purple-300",
  DOFU:    "bg-amber-500/15  text-amber-300",
  BOFU:    "bg-orange-500/15 text-orange-300",
  REVENUE: "bg-emerald-500/15 text-emerald-300",
};

const COLOR_BARRA: Record<string, string> = {
  green:  "bg-emerald-500",
  yellow: "bg-amber-500",
  red:    "bg-red-500",
};

const COLOR_TEXTO: Record<string, string> = {
  green:  "text-emerald-400",
  yellow: "text-amber-400",
  red:    "text-red-400",
};

const DESCRIPCION_ETAPA: Record<string, string> = {
  Impresiones:  "Personas que vieron el anuncio",
  Alcance:      "Personas únicas impactadas",
  Clics:        "Personas que hicieron clic",
  Mensajes:     "Personas que escribieron",
  Leads:        "Personas que dejaron sus datos",
  Conversiones: "Personas que completaron la acción objetivo",
  Ventas:       "Ingresos generados por la campaña",
};

export const FunnelDetalle = ({ funnel }: Props) => (
  <div className="space-y-5">

    {/* Cuello de botella */}
    {funnel.cuello_botella && (
      <div className="flex items-start gap-3 bg-red-500/[0.08] border border-red-500/25 rounded-xl p-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="text-xs font-semibold text-red-300 mb-0.5">
            Cuello de botella detectado en: {funnel.cuello_botella}
          </p>
          <p className="text-xs text-red-400/80">
            Esta es la etapa donde más se pierde el potencial de tu campaña.
            Optimiza este punto para mejorar el rendimiento global.
          </p>
        </div>
      </div>
    )}

    {!funnel.cuello_botella && (
      <div className="flex items-start gap-3 bg-emerald-500/[0.08] border border-emerald-500/25 rounded-xl p-4">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-xs font-semibold text-emerald-300 mb-0.5">
            Pipeline saludable
          </p>
          <p className="text-xs text-emerald-400">
            No se detectaron cuellos de botella críticos en el funnel de esta campaña.
          </p>
        </div>
      </div>
    )}

    {/* Tasa global */}
    <div className={`${PANEL_BASE} text-center p-3`}>
      <p className="text-xs text-zinc-400">Tasa de conversión global</p>
      <p className="text-2xl font-black text-zinc-200">{funnel.tasa_global}%</p>
      <p className="text-[10px] text-zinc-400">Impresiones → Conversiones</p>
    </div>

    {/* Etapas del funnel */}
    <div className="space-y-3">
      {funnel.etapas.map((etapa, i) => (
        <div key={etapa.nombre} className="space-y-1">

          {/* Header etapa */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-300">{etapa.nombre}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${COLOR_ETIQUETA[etapa.etiqueta]}`}>
                {etapa.etiqueta}
              </span>
              {funnel.cuello_botella === etapa.nombre && (
                <span className={`${BADGE_BASE} text-[10px] px-1.5 py-0.5 font-medium text-red-300`}>
                  ⚠️ Cuello
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {i > 0 && (
                <span className={`text-xs font-semibold ${COLOR_TEXTO[etapa.estado]}`}>
                  {etapa.porcentaje}%
                </span>
              )}
              <span className="text-xs font-bold text-zinc-200">
                {etapa.nombre === "Ventas"
                  ? `S/ ${Number(etapa.valor).toLocaleString("es-PE")}`
                  : Number(etapa.valor).toLocaleString()
                }
              </span>
            </div>
          </div>

          {/* Barra */}
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${COLOR_BARRA[etapa.estado]}`}
              style={{ width: `${Math.min(etapa.porcentaje, 100)}%` }}
            />
          </div>

          {/* Descripción */}
          <p className="text-[10px] text-zinc-400">
            {DESCRIPCION_ETAPA[etapa.nombre]}
          </p>

        </div>
      ))}
    </div>

  </div>
);