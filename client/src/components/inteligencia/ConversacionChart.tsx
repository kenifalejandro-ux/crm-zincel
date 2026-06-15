/** client/src/components/inteligencia/ConversacionChart.tsx — NEON
 * Antes: tracks de barras bg-zinc-800, headers de sección text-zinc-100 lavados,
 * hover bg-zinc-800/40, separadores border-white/8, "Acción más frecuente" text-zinc-100.
 * Ahora: barras con glow, headers muted, hover/separadores neon. Las barras y duración ya
 * usaban useChartColors / PANEL_BASE. Lógica (drill-down) INTACTA.
 */

import { useEffect, useState } from "react";
import { CARD_CLASS, HEADER_CLASS, PANEL_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { MessageSquare, ArrowRight, Clock } from "lucide-react";
import { getInteligenciaConversacion, getLeadsPorEstado, type InteligenciaConversacion } from "../../services/inteligencia.api";
import { DrilldownModal } from "./DrilldownModal";
import type { LeadDrilldown } from "./DrilldownModal";

const ACCION_LABEL: Record<string, string> = {
  enviar_brochure: "Enviar brochure", agendar_reunion: "Agendar reunión",
  cotizar: "Cotización", volver_llamar: "Volver a llamar", ninguna: "Sin acción",
};

const RESULTADO_LABEL: Record<string, string> = {
  interesado: "Interesado", solicita_informacion: "Solicita info", no_interesado: "No interesado",
  volver_a_llamar: "Volver a llamar", ocupado_en_reunion: "Ocupado / En reunión",
  prometio_llamar: "Prometió llamar", buzon_de_voz: "Buzón de voz", fuera_de_servicio: "Fuera de servicio",
  numero_equivocado: "N° equivocado", ya_tiene_proveedor: "Ya tiene proveedor",
  baja_de_oficio: "Baja de oficio", suspension_temporal: "Suspensión", perdida: "Venta perdida",
};

const ACCION_TONO: Record<string, string> = {
  agendar_reunion: "accent", cotizar: "p1", enviar_brochure: "muted", volver_llamar: "axis", ninguna: "muted",
};

function resultadoTono(resultado: string): string {
  if (resultado === "interesado")           return "accent";
  if (resultado === "solicita_informacion") return "p1";
  if (resultado === "no_interesado")        return "danger";
  return "axis";
}

interface Props {
  filtros?: { fecha_inicio?: string; fecha_fin?: string };
  periodoLabel?: string;
}

export function ConversacionChart({ filtros, periodoLabel }: Props) {
  const clr = useChartColors();
  const tono: Record<string, string> = { accent: clr.accent, p1: clr.palette[1], muted: clr.muted, axis: clr.axis, danger: clr.danger };
  const [data, setData] = useState<InteligenciaConversacion | null>(null);

  const [drilldownEstado,  setDrilldownEstado]  = useState<string | null>(null);
  const [drilldownLabel,   setDrilldownLabel]   = useState("");
  const [drilldownLeads,   setDrilldownLeads]   = useState<LeadDrilldown[]>([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  useEffect(() => {
    getInteligenciaConversacion(filtros).then(setData).catch(() => {});
  }, [filtros?.fecha_inicio, filtros?.fecha_fin]);

  async function abrirDrilldown(estado: string, label: string) {
    setDrilldownEstado(estado);
    setDrilldownLabel(label);
    setDrilldownLoading(true);
    setDrilldownLeads([]);
    try {
      const rows = await getLeadsPorEstado(estado);
      setDrilldownLeads(rows.map(r => ({
        id: r.id, empresa: r.empresa, nombre_contacto: r.nombre_contacto,
        telefono: r.telefono, ciudad: r.ciudad, etapa_pipeline: r.etapa_pipeline,
      })));
    } catch { /* silencioso */ }
    finally { setDrilldownLoading(false); }
  }

  if (!data) return null;
  if (!data.acciones_acordadas.length && !data.resultados_contestadas.length) return null;

  const totalAcciones = data.acciones_acordadas.reduce((s, a) => s + a.total, 0);
  const totalResultados = data.resultados_contestadas.reduce((s, r) => s + r.total, 0);
  const maxResult = Math.max(...data.resultados_contestadas.map(r => r.total), 1);
  const mejorAccion = data.acciones_acordadas[0];

  return (
    <div className={`${CARD_CLASS} space-y-6`}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-zinc-500 shrink-0" strokeWidth={2} />
          <div>
            <h3 className={HEADER_CLASS}>Inteligencia de conversación</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Patrones en llamadas contestadas · {periodoLabel ?? "período seleccionado"}</p>
          </div>
        </div>
        {mejorAccion && (
          <div className="shrink-0 text-right">
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Acción más frecuente</p>
            <p className="text-[12px] font-bold text-accent mt-0.5">{ACCION_LABEL[mejorAccion.accion_acordada] ?? mejorAccion.accion_acordada}</p>
            <p className="text-[10px] text-zinc-500">{mejorAccion.total} veces</p>
          </div>
        )}
      </div>

      {/* Acciones acordadas */}
      {data.acciones_acordadas.length > 0 && (
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
            <ArrowRight size={10} />Acción acordada al colgar
          </p>
          <div className="space-y-2.5">
            {data.acciones_acordadas.map(item => {
              const pct = Math.round((item.total / totalAcciones) * 100);
              const color = tono[ACCION_TONO[item.accion_acordada]] ?? clr.axis;
              return (
                <div key={item.accion_acordada} className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-400 w-32 shrink-0 truncate">{ACCION_LABEL[item.accion_acordada] ?? item.accion_acordada}</span>
                  <div className="flex-1 h-6 bg-white/[0.06] rounded-md overflow-hidden">
                    <div className="h-full rounded-md transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}66` }} />
                  </div>
                  <div className="w-20 shrink-0 flex items-center justify-end gap-1.5">
                    <span className="text-[11px] font-bold text-zinc-300">{pct}%</span>
                    <span className="text-[10px] text-zinc-500">({item.total})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resultados de llamadas contestadas */}
      {data.resultados_contestadas.length > 0 && (
        <div className="pt-2 border-t border-white/[0.08]">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
            <MessageSquare size={10} />Estado de prospectos contactados
          </p>
          <div className="space-y-2">
            {data.resultados_contestadas.map(item => {
              const pct = Math.round((item.total / maxResult) * 100);
              const color = tono[resultadoTono(item.resultado)];
              const label = RESULTADO_LABEL[item.resultado] ?? item.resultado;
              return (
                <button key={item.resultado} onClick={() => abrirDrilldown(item.resultado, label)}
                  className="w-full flex items-center gap-3 hover:bg-white/[0.03] rounded-lg px-1 py-0.5 transition group">
                  <span className="text-[11px] text-zinc-400 w-32 shrink-0 truncate text-left group-hover:text-zinc-100">{label}</span>
                  <div className="flex-1 h-5 bg-white/[0.06] rounded-md overflow-hidden">
                    <div className="h-full rounded-md transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}66` }} />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-400 w-8 shrink-0 text-right">{item.total}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-zinc-500 mt-3">Prospectos únicos contactados en el período: {totalResultados}</p>
        </div>
      )}

      {/* Duración por resultado */}
      {data.duracion_por_resultado.length > 0 && (
        <div className="pt-2 border-t border-white/[0.08]">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
            <Clock size={10} />Duración promedio por resultado
          </p>
          <div className="grid grid-cols-2 gap-2">
            {data.duracion_por_resultado.slice(0, 4).map(item => (
              <div key={item.resultado} className={`${PANEL_BASE} px-3 py-2.5`}>
                <p className="text-[10px] text-zinc-400 truncate">{RESULTADO_LABEL[item.resultado] ?? item.resultado}</p>
                <p className="font-display text-[16px] font-bold text-zinc-100 leading-tight">{item.duracion_prom} <span className="text-[10px] font-normal text-zinc-500">min</span></p>
                <p className="text-[9px] text-zinc-500">{item.total} llamadas</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {drilldownEstado && (
        <DrilldownModal titulo={drilldownLabel} leads={drilldownLeads} cargando={drilldownLoading} onCerrar={() => setDrilldownEstado(null)} />
      )}
    </div>
  );
}