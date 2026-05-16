/** src/components/metricas/detalle/AnalisisDetalle.tsx */

import { MetricasCalculadas } from "../../../utils/metricas.calc";
import { Metrica }            from "../../../types/metricas.types";

interface Props {
  metrica:   Metrica;
  calculado: MetricasCalculadas;
}

const COLOR_CARD: Record<string, string> = {
  green:  "border-green-200  bg-green-50",
  yellow: "border-yellow-200 bg-yellow-50",
  red:    "border-red-200    bg-red-50",
};

const COLOR_TITULO: Record<string, string> = {
  green:  "text-green-700",
  yellow: "text-yellow-700",
  red:    "text-red-700",
};

const ICONO: Record<string, string> = {
  green:  "🟢",
  yellow: "🟡",
  red:    "🔴",
};

const RECOMENDACIONES: Record<string, Record<string, string>> = {
  ctr: {
    green:  "Mantén la creatividad actual. Prueba variaciones del mismo concepto para encontrar el punto óptimo.",
    yellow: "Haz A/B testing con diferentes imágenes o videos. Mejora el copy del anuncio con una propuesta de valor más clara.",
    red:    "El anuncio no está captando atención. Cambia completamente la creatividad, prueba con video en lugar de imagen y ajusta la segmentación.",
  },
  cpc: {
    green:  "Excelente eficiencia. Puedes incrementar el presupuesto para escalar manteniendo este costo.",
    yellow: "Revisa la segmentación para reducir la competencia en la subasta. Prueba audiencias similares (Lookalike).",
    red:    "CPC muy alto. Amplía la audiencia, reduce la superposición y considera cambiar el tipo de puja.",
  },
  cpm: {
    green:  "La audiencia tiene buena salud. El costo de mostrar tu anuncio es eficiente.",
    yellow: "Considera rotar las creatividades para evitar fatiga publicitaria.",
    red:    "Audiencia saturada o competencia alta. Amplía el público objetivo o prueba en horarios de menor competencia.",
  },
  cpa: {
    green:  "Costo por conversión óptimo. Si tu margen lo permite, escala el presupuesto.",
    yellow: "Optimiza la landing page o el proceso de conversión para reducir la fricción del usuario.",
    red:    "El costo de adquirir un cliente es muy alto. Revisa el proceso completo desde el clic hasta la conversión.",
  },
  roas: {
    green:  "La campaña es altamente rentable. Escala el presupuesto y mantén la estrategia.",
    yellow: "Trabaja en aumentar el ticket promedio o el precio de venta para mejorar el retorno.",
    red:    "La campaña no es rentable. Pausa, analiza el funnel completo y restructura antes de seguir invirtiendo.",
  },
  frecuencia: {
    green:  "Frecuencia saludable. Los usuarios ven el anuncio las veces necesarias para recordarlo.",
    yellow: "Empieza a rotar las creatividades para evitar que la audiencia se canse del anuncio.",
    red:    "Audiencia saturada. Amplía el público, excluye a quienes ya convirtieron y rota las creatividades urgentemente.",
  },
};

export const AnalisisDetalle = ({ metrica: m, calculado: c }: Props) => (
  <div className="space-y-4">

    <p className="text-xs text-zinc-400">
      Análisis detallado de cada métrica con lectura en lenguaje simple y recomendaciones accionables.
    </p>

    {/* Análisis por métrica */}
    {Object.entries(c.semaforos).map(([key, s]) => (
      <div
        key={key}
        className={`border rounded-xl p-4 space-y-2 ${COLOR_CARD[s.estado]}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{ICONO[s.estado]}</span>
            <span className={`text-xs font-bold uppercase tracking-wide ${COLOR_TITULO[s.estado]}`}>
              {key.toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-black text-zinc-800">
            {key === "roas"      ? `${s.valor}x`   :
             key === "frecuencia"? `${s.valor}x`   :
             key === "ctr"       ? `${s.valor}%`   :
             `S/ ${s.valor}`}
          </span>
        </div>

        {/* Lectura */}
        <p className="text-xs text-zinc-700 leading-relaxed">{s.lectura}</p>

        {/* Separador */}
        <div className="border-t border-zinc-200 pt-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase mb-1">
            💡 Recomendación
          </p>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {RECOMENDACIONES[key]?.[s.estado] ?? "Sin recomendación disponible."}
          </p>
        </div>

      </div>
    ))}

    {/* Análisis de ingresos si hay datos */}
    {m.ingresos > 0 && (
      <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span>💰</span>
          <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
            Rentabilidad
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-blue-500">Ingresos generados</p>
            <p className="text-sm font-bold text-blue-800">
              S/ {Number(m.ingresos).toLocaleString("es-PE")}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-blue-500">Margen neto</p>
            <p className={`text-sm font-bold ${c.margen_neto >= 0 ? "text-green-700" : "text-red-700"}`}>
              S/ {c.margen_neto.toLocaleString("es-PE")}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-blue-500">ROAS</p>
            <p className="text-sm font-bold text-blue-800">{c.roas}x</p>
          </div>
          <div>
            <p className="text-[10px] text-blue-500">ROI</p>
            <p className={`text-sm font-bold ${c.roi >= 0 ? "text-green-700" : "text-red-700"}`}>
              {c.roi}%
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Aviso si faltan ingresos */}
    {m.ingresos === 0 && (
      <div className="border border-zinc-200 bg-zinc-50 rounded-xl p-4 text-center">
        <p className="text-xs text-zinc-400">
          💡 Agrega los ingresos generados por esta campaña para calcular ROAS, ROI y margen neto.
        </p>
      </div>
    )}

  </div>
);