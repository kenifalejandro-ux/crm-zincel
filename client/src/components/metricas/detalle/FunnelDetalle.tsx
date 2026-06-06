/** src/components/metricas/detalle/FunnelDetalle.tsx */

import { FunnelData } from "../../../utils/metricas.calc";

interface Props { funnel: FunnelData }

const COLOR_ETIQUETA: Record<string, string> = {
  TOFU:    "bg-blue-100   text-blue-700",
  MOFU:    "bg-purple-100 text-purple-700",
  DOFU:    "bg-amber-100  text-amber-700",
  BOFU:    "bg-orange-100 text-orange-700",
  REVENUE: "bg-green-100  text-green-700",
};

const COLOR_BARRA: Record<string, string> = {
  green:  "bg-green-500",
  yellow: "bg-yellow-500",
  red:    "bg-red-500",
};

const COLOR_TEXTO: Record<string, string> = {
  green:  "text-green-600",
  yellow: "text-yellow-600",
  red:    "text-red-600",
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
      <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="text-xs font-semibold text-red-700 mb-0.5">
            Cuello de botella detectado en: {funnel.cuello_botella}
          </p>
          <p className="text-xs text-red-500">
            Esta es la etapa donde más se pierde el potencial de tu campaña.
            Optimiza este punto para mejorar el rendimiento global.
          </p>
        </div>
      </div>
    )}

    {!funnel.cuello_botella && (
      <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-xs font-semibold text-green-700 mb-0.5">
            Pipeline saludable
          </p>
          <p className="text-xs text-green-600">
            No se detectaron cuellos de botella críticos en el funnel de esta campaña.
          </p>
        </div>
      </div>
    )}

    {/* Tasa global */}
    <div className="text-center bg-zinc-50 rounded-xl p-3">
      <p className="text-xs text-zinc-600">Tasa de conversión global</p>
      <p className="text-2xl font-black text-zinc-800">{funnel.tasa_global}%</p>
      <p className="text-[10px] text-zinc-600">Impresiones → Conversiones</p>
    </div>

    {/* Etapas del funnel */}
    <div className="space-y-3">
      {funnel.etapas.map((etapa, i) => (
        <div key={etapa.nombre} className="space-y-1">

          {/* Header etapa */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-700">{etapa.nombre}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${COLOR_ETIQUETA[etapa.etiqueta]}`}>
                {etapa.etiqueta}
              </span>
              {funnel.cuello_botella === etapa.nombre && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
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
              <span className="text-xs font-bold text-zinc-800">
                {etapa.nombre === "Ventas"
                  ? `S/ ${Number(etapa.valor).toLocaleString("es-PE")}`
                  : Number(etapa.valor).toLocaleString()
                }
              </span>
            </div>
          </div>

          {/* Barra */}
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${COLOR_BARRA[etapa.estado]}`}
              style={{ width: `${Math.min(etapa.porcentaje, 100)}%` }}
            />
          </div>

          {/* Descripción */}
          <p className="text-[10px] text-zinc-600">
            {DESCRIPCION_ETAPA[etapa.nombre]}
          </p>

        </div>
      ))}
    </div>

  </div>
);