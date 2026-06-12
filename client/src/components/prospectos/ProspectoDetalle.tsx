/**client/src/prospectos/ProspectoDetalle.tsx */

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, Phone, Calendar, FileText, Globe, Mail, MapPin, Building2, User, ClipboardList, GitBranch, CheckSquare, Plus, MessageSquare, BookOpen } from "lucide-react";
import { SpeechPanel } from "./SpeechPanel";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { LlamadaHistorial } from "../llamadas/LlamadaHistorial";
import { LlamadaForm } from "../llamadas/LlamadaForm";
import { ReunionForm } from "../reuniones/ReunionForm";
import { BrochureForm } from "../brochures/BrochureForm";
import { TablaPropuestas } from "./TablaPropuestas";
import { ModalPropuesta } from "./ModalPropuesta";
import { ModalEditarPropuesta } from "./ModalEditarPropuesta";
import { TimelineDetalle } from "./TimelineDetalle";
import { PlantillaSelector } from "../plantillas/PlantillaSelector";
import { TareaForm } from "../tareas/TareaForm";
import { TareasList } from "../tareas/TareasList";
import { getProspecto, getScoreHistory } from "../../services/prospectos.api";
import type { ScoreHistoryEntry } from "../../services/prospectos.api";
import { getReuniones, actualizarReunion, eliminarReunion } from "../../services/reuniones.api";
import { ModalEditarReunion } from "../reuniones/ModalEditarReunion";
import { getBrochures, actualizarBrochure, eliminarBrochure } from "../../services/brochures.api";
import { ModalEditarBrochure } from "../brochures/ModalEditarBrochure";
import { getTareas } from "../../services/tareas.api";
import { getLlamadas, actualizarLlamada, eliminarLlamada } from "../../services/llamadas.api";
import { ModalEditarLlamada } from "../llamadas/ModalEditarLlamada";
import { ProspectoForm } from "./ProspectoForm";
import { useEditar } from "../../hooks/useEditar";
import type { Llamada } from "../../types/llamada.types";
import { usePropuestas } from "../../hooks/usePropuestas";
import type { Prospecto } from "../../types/prospecto.types";
import type { Reunion } from "../../types/reunion.types";
import type { Propuesta, FormPropuesta } from "../../types/propuesta.types";
import type { Tarea } from "../../types/tarea.types";
import { fechaHoy, toLocalISOString } from "../../utils/date";
import { ModalWhatsApp } from "../whatsapp/ModalWhatsApp";


const COLOR_ESTADO: Record<string, string> = {
  interesado:         "green",
  no_interesado:      "red",
  no_contesta:        "gray",
  volver_a_llamar:    "yellow",
  buzon_de_voz:       "orange",
  fuera_de_servicio:  "red",
  numero_equivocado:  "pink",
  ya_tiene_proveedor: "purple",
  baja_de_oficio:       "gray",
  solicita_informacion: "blue",
};

const LABEL_ESTADO: Record<string, string> = {
  nuevo:               "Nuevo (última carga)",
  por_gestionar:       "Por gestionar",
  interesado:          "Interesado",
  solicita_informacion:"Solicita información",
  no_interesado:       "No interesado",
  no_contesta:         "No contesta",
  volver_a_llamar:     "Volver a llamar",
  ocupado_en_reunion:  "Ocupado / En reunión",
  prometio_llamar:     "Prometió llamar",
  buzon_de_voz:        "Buzón de voz",
  fuera_de_servicio:   "Fuera de servicio",
  numero_equivocado:   "Número equivocado",
  ya_tiene_proveedor:  "Empresa con página web",
  baja_de_oficio:      "Baja de oficio",
  suspension_temporal: "Suspensión temporal",
  no_habido:           "No habido",
};

const COLOR_PRIORIDAD: Record<string, "red" | "yellow" | "gray"> = {
  alta:  "red",
  media: "yellow",
  baja:  "gray",
};

type NivelScore = "caliente" | "activo" | "tibio" | "frio";

function calcularProbabilidad(score: number): number {
  if (score >= 75) return Math.min(85, Math.round(60 + (score - 75) * 1.0));
  if (score >= 50) return Math.round(35 + (score - 50) * 1.0);
  if (score >= 25) return Math.round(15 + (score - 25) * 0.8);
  return Math.max(3, Math.round(score * 0.6));
}

interface FactorScore { factor: string; valor: string; puntos: number }

function recomendarAccion(
  p: Prospecto, llams7: number, llams30: number,
  propEnviada: boolean, propAceptada: boolean
): string {
  if (p.etapa_pipeline === "cerrado_ganado") return "Solicita referidos o amplía el servicio";
  if (p.etapa_pipeline === "perdido")        return "Averigua por qué se perdió para aprender";

  if (p.estado_lead === "volver_a_llamar")
    return "Llama hoy — solicitó ser contactado";

  if (["interesado","negociacion"].includes(p.etapa_pipeline) && !propEnviada && !propAceptada)
    return "Envía la propuesta ahora — ya está listo para recibirla";

  if (p.etapa_pipeline === "negociacion" && llams7 === 0)
    return "Reagenda una llamada hoy — la negociación se está enfriando";

  if (p.etapa_pipeline === "negociacion" && propEnviada)
    return "Propón condiciones de cierre — fecha de inicio o forma de pago";

  if (p.etapa_pipeline === "propuesta_enviada" && llams7 === 0)
    return "Haz seguimiento a la propuesta — el silencio no es rechazo";

  if (p.etapa_pipeline === "nuevo" && llams30 === 0)
    return "Haz el primer contacto — aún no ha sido llamado";

  if (p.estado_lead === "no_contesta" && llams7 === 0)
    return "Prueba llamar entre 10am–12pm o envía un WhatsApp previo";

  if (llams30 === 0)
    return "Reactiva el contacto — sin actividad hace más de 30 días";

  if (llams7 === 0)
    return "Agenda una llamada de seguimiento esta semana";

  return "Mantén el ritmo — estás trabajando bien este lead";
}

function generarInsight(
  p: Prospecto, nivel: NivelScore,
  llams7: number, llams30: number,
  propEnviada: boolean, propAceptada: boolean
): string {
  if (nivel === "caliente" && llams7 > 0 && propEnviada)
    return "Lead caliente con propuesta activa y contacto reciente — el momento de cerrar es ahora.";
  if (nivel === "caliente" && llams7 === 0)
    return "Lead de alto potencial pero sin contacto esta semana — actúa antes de que se enfríe.";
  if (nivel === "caliente")
    return "Lead con muy alta probabilidad de cierre. Propón condiciones concretas y fecha de inicio.";

  if (["interesado","negociacion"].includes(p.etapa_pipeline) && llams30 === 0)
    return "Lead con interés detectado pero riesgo de enfriamiento por falta de actividad reciente.";
  if (["interesado","negociacion"].includes(p.etapa_pipeline) && !propEnviada)
    return "Lead con alto potencial si recibe seguimiento esta semana — aún no tiene propuesta enviada.";

  if (p.etapa_pipeline === "propuesta_enviada" && llams7 === 0)
    return "Propuesta enviada sin seguimiento reciente — el silencio no es rechazo; un contacto puede definir el cierre.";
  if (p.etapa_pipeline === "propuesta_enviada")
    return "Lead en etapa de decisión. El seguimiento activo ahora tiene el mayor impacto en el cierre.";

  if (nivel === "activo" && llams7 > 0)
    return "Lead activo con buena trayectoria. Empuja hacia la siguiente etapa con una propuesta concreta.";
  if (nivel === "activo")
    return "Lead con buen potencial pero sin actividad esta semana. Un contacto ahora puede mantener el impulso.";

  if (nivel === "tibio" && p.estado_lead === "volver_a_llamar")
    return "Lead que solicitó ser contactado — tiene intención. El seguimiento oportuno puede convertirlo.";
  if (nivel === "tibio" && llams30 === 0)
    return "Lead con potencial moderado sin actividad reciente. Necesita reactivación para no perderse.";
  if (nivel === "tibio")
    return "Hay señales de interés pero aún no hay suficiente engagement. Incrementa la frecuencia de contacto.";

  if (p.estado_lead === "no_interesado")
    return "Lead marcado como no interesado. Evalúa si tiene sentido mantenerlo activo o moverlo a Perdido.";
  if (p.etapa_pipeline === "nuevo" && llams30 === 0)
    return "Lead nuevo sin ningún contacto aún. El primer contacto definirá su potencial real.";
  if (llams30 === 0)
    return "Lead frío sin actividad reciente. Requiere reactivación inmediata o debería marcarse como perdido.";

  return "Lead con señales mixtas. Revisa si los datos de etapa y estado están actualizados.";
}

// ── Gauge semicircular ───────────────────────────────────────────────────────
const GAUGE_COLOR: Record<NivelScore, string> = {
  caliente: "#ef4444",
  activo:   "#6366f1",
  tibio:    "#eab308",
  frio:     "#9ca3af",
};

function ScoreGauge({ score, nivel, prob }: { score: number; nivel: NivelScore; prob: number }) {
  const color = GAUGE_COLOR[nivel];
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 115" className="w-44">
        {/* Markers: 0 25 50 75 100 */}
        {[0,25,50,75,100].map(v => {
          const a = Math.PI - (v / 100) * Math.PI;
          const r2 = 90;
          const x = 100 + r2 * Math.cos(a);
          const y = 105 - r2 * Math.sin(a);
          return <circle key={v} cx={x} cy={y} r="2" fill={v === score ? color : "#e5e7eb"} />;
        })}
        {/* Track gris */}
        <path d="M 22,105 A 78,78 0 0,1 178,105"
          fill="none" stroke="#f3f4f6" strokeWidth="14" strokeLinecap="round"
        />
        {/* Progreso coloreado */}
        <path d="M 22,105 A 78,78 0 0,1 178,105"
          fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - score}
          style={{ transition: "stroke-dashoffset 0.6s ease-out", filter: `drop-shadow(0 0 4px ${color}66)` }}
        />
        {/* Score grande */}
        <text x="100" y="85" textAnchor="middle"
          style={{ fontSize: "34px", fontWeight: 900, fill: color, fontFamily: "inherit" }}>
          {score}
        </text>
        <text x="100" y="101" textAnchor="middle"
          style={{ fontSize: "10px", fill: "#9ca3af", fontFamily: "inherit" }}>
          de 100
        </text>
      </svg>
      {/* Probabilidad debajo del gauge */}
      <div className="flex items-center justify-between w-full px-1 -mt-1">
        <span className="text-[10px] text-zinc-600">0%</span>
        <div className="text-center">
          <p className="text-[10px] text-zinc-600">Prob. de cierre</p>
          <p className="text-base font-black" style={{ color }}>{prob}%</p>
        </div>
        <span className="text-[10px] text-zinc-600">100%</span>
      </div>
    </div>
  );
}

function calcularScore(p: Prospecto, llamadas: Llamada[], props: { estado?: string }[]): {
  score: number; nivel: NivelScore; breakdown: FactorScore[]; accion: string; insight: string;
} {
  const ahora = Date.now();
  const hace7  = ahora - 7  * 86400000;
  const hace30 = ahora - 30 * 86400000;
  const llams7  = llamadas.filter(l => new Date(l.fecha).getTime() >= hace7).length;
  const llams30 = llamadas.filter(l => new Date(l.fecha).getTime() >= hace30).length;
  const propAceptada = props.some(pr => pr.estado === "aceptada");
  const propEnviada  = props.some(pr => pr.estado === "enviada");

  const ETAPA_LABEL: Record<string, string> = { nuevo:"Nuevo", contactado:"Contactado", interesado:"Interesado", propuesta_enviada:"Propuesta enviada", negociacion:"Negociación", cerrado_ganado:"Cerrado ganado", perdido:"Perdido" };
  const ESTADO_LABEL: Record<string, string> = { nuevo:"Nuevo", por_gestionar:"Por gestionar", interesado:"Interesado", solicita_informacion:"Solicita información", no_interesado:"No interesado", no_contesta:"No contesta", volver_a_llamar:"Volver a llamar", ocupado_en_reunion:"Ocupado / En reunión", prometio_llamar:"Prometió llamar", buzon_de_voz:"Buzón de voz", fuera_de_servicio:"Fuera de servicio", numero_equivocado:"Número equivocado", ya_tiene_proveedor:"Empresa con página web", baja_de_oficio:"Baja de oficio", suspension_temporal:"Suspensión temporal", no_habido:"No habido", perdida:"Venta perdida" };
  const base:   Record<string, number> = { nuevo:5, contactado:15, interesado:40, propuesta_enviada:60, negociacion:75, cerrado_ganado:100, perdido:0 };
  const estMod: Record<string, number> = { interesado:10, volver_a_llamar:5, no_contesta:-10, no_interesado:-20 };
  const priMod: Record<string, number> = { alta:10, media:5, baja:0 };

  const pBase    = base[p.etapa_pipeline] ?? 5;
  const pEst     = estMod[p.estado_lead] ?? 0;
  const pPri     = priMod[p.prioridad] ?? 0;
  const pAct     = Math.min(10, llams7 * 3);
  const pInact   = llams30 === 0 ? -15 : 0;
  const pProp    = propAceptada ? 15 : propEnviada ? 5 : 0;

  const score = Math.min(100, Math.max(0, pBase + pEst + pPri + pAct + pInact + pProp));
  const nivel: NivelScore = score >= 75 ? "caliente" : score >= 50 ? "activo" : score >= 25 ? "tibio" : "frio";

  const breakdown: FactorScore[] = [
    { factor: "Etapa pipeline",          valor: ETAPA_LABEL[p.etapa_pipeline] ?? p.etapa_pipeline, puntos: pBase  },
    { factor: "Estado lead",             valor: ESTADO_LABEL[p.estado_lead] ?? p.estado_lead,       puntos: pEst   },
    { factor: "Prioridad",               valor: p.prioridad,                                         puntos: pPri   },
    { factor: "Llamadas últimos 7 días", valor: llams7 > 0 ? `${llams7} llamada${llams7 > 1 ? "s" : ""}` : "Ninguna", puntos: pAct },
    { factor: "Inactividad +30 días",    valor: llams30 === 0 ? "Sin llamadas" : "Con actividad",    puntos: pInact },
    { factor: "Propuesta",               valor: propAceptada ? "Aceptada" : propEnviada ? "Enviada" : "Ninguna", puntos: pProp },
  ];

  const accion  = recomendarAccion(p, llams7, llams30, propEnviada, propAceptada);
  const insight = generarInsight(p, nivel, llams7, llams30, propEnviada, propAceptada);
  return { score, nivel, breakdown, accion, insight };
}

const SCORE_CONFIG = {
  caliente: { label: "🔥 Caliente", cls: "bg-red-100 text-red-700",      border: "border-red-200",
    urgencia: "Alta probabilidad de cierre",     plazo: "Actuar esta semana — no dejar enfriar" },
  activo:   { label: "⬆ Activo",   cls: "bg-amber-100 text-amber-700", border: "border-amber-200",
    urgencia: "Lead en progreso",                plazo: "Mantener ritmo de contacto" },
  tibio:    { label: "→ Tibio",    cls: "bg-yellow-100 text-yellow-700", border: "border-yellow-200",
    urgencia: "Requiere seguimiento antes de 72h", plazo: "Riesgo de enfriamiento si no se actúa" },
  frio:     { label: "❄ Frío",     cls: "bg-gray-100 text-gray-700",     border: "border-gray-200",
    urgencia: "Lead inactivo",                   plazo: "Evaluar si vale la pena reactivar" },
};

function interpretarHistorial(h: ScoreHistoryEntry[]): string {
  if (h.length < 2) return "Primera medición — el historial se irá construyendo con la actividad.";
  const delta = h[0].score - h[1].score;
  const dias  = Math.round((new Date().getTime() - new Date(h[1].registrado_en).getTime()) / 86_400_000);
  if (delta > 15) return `Mejora fuerte detectada (+${delta} pts en ${dias} día${dias !== 1 ? "s" : ""}) — lead activándose rápidamente.`;
  if (delta > 5)  return `El lead mejoró interés esta semana (+${delta} pts) — buen momento para avanzar.`;
  if (delta < -15) return `Caída crítica de score (${delta} pts) — intervenir urgente antes de perder el lead.`;
  if (delta < -5)  return `El lead está perdiendo temperatura (${delta} pts) — actuar pronto.`;
  return "Score estable — mantener el ritmo de seguimiento actual.";
}

function ScoreBadge({ score, nivel, breakdown, accion, insight, delta, historial }: {
  score: number; nivel: NivelScore; breakdown: FactorScore[];
  accion: string; insight: string; delta: number | null;
  historial: ScoreHistoryEntry[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = SCORE_CONFIG[nivel];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      <button
        onClick={() => setOpen(v => !v)}
        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer select-none transition-all ${cfg.cls} ${cfg.border}`}
        title="Ver desglose del score"
      >
        {cfg.label} · {score}
      </button>
      {delta !== null && (
        <span
          className={`text-[11px] font-black animate-bounce ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}
          style={{ animation: "fadeUp 0.4s ease-out" }}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72">

          {/* Gauge + nivel label */}
          <div className="mb-3">
            <ScoreGauge score={score} nivel={nivel} prob={calcularProbabilidad(score)} />
            <p className={`text-center text-sm font-bold mt-1 ${cfg.cls.split(" ")[1]}`}>{cfg.label}</p>
          </div>

          {/* Prioridad operacional — bloque dedicado y visible */}
          {(() => {
            const blockCls =
              nivel === "caliente" ? "bg-red-50 border-red-200 text-red-800"
              : nivel === "activo" ? "bg-amber-50 border-amber-200 text-amber-800"
              : nivel === "tibio"  ? "bg-amber-50 border-amber-300 text-amber-800"
              :                      "bg-gray-50 border-gray-200 text-gray-600";
            return (
              <div className={`border rounded-lg px-3 py-2.5 mb-3 ${blockCls}`}>
                <p className="text-[10px] font-bold uppercase tracking-wide opacity-60 mb-1">Prioridad operacional</p>
                <p className="text-xs font-bold leading-snug">{cfg.urgencia}</p>
                <p className="text-[11px] opacity-70 leading-snug mt-0.5">{cfg.plazo}</p>
              </div>
            );
          })()}

          {/* Acción recomendada */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2">
            <span className="text-base shrink-0 mt-0.5">⚡</span>
            <div>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-0.5">Acción sugerida</p>
              <p className="text-xs font-semibold text-amber-800 leading-snug">{accion}</p>
            </div>
          </div>

          {/* Tabla de factores */}
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wide mb-2">Por qué tiene este score</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-1.5 text-zinc-600 font-medium">Factor</th>
                <th className="text-left pb-1.5 text-zinc-600 font-medium">Valor</th>
                <th className="text-right pb-1.5 text-zinc-600 font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map(f => (
                <tr key={f.factor} className="border-b border-gray-50">
                  <td className="py-1.5 text-zinc-600 pr-2">{f.factor}</td>
                  <td className="py-1.5 text-zinc-700 pr-2 truncate max-w-[90px]">{f.valor}</td>
                  <td className={`py-1.5 text-right font-semibold ${f.puntos > 0 ? "text-emerald-600" : f.puntos < 0 ? "text-red-500" : "text-zinc-600"}`}>
                    {f.puntos > 0 ? `+${f.puntos}` : f.puntos === 0 ? "—" : f.puntos}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={2} className="pt-2 font-bold text-zinc-800">Total</td>
                <td className={`pt-2 text-right text-base font-bold ${cfg.cls.split(" ")[1]}`}>{score}</td>
              </tr>
            </tfoot>
          </table>

          {/* Insight automático */}
          <div className="mt-3 flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2.5">
            <span className="text-sm shrink-0 mt-0.5">💡</span>
            <div>
              <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wide mb-0.5">Diagnóstico</p>
              <p className="text-[11px] text-violet-800 leading-snug">{insight}</p>
            </div>
          </div>

          {/* Historial de score */}
          {historial.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wide mb-2">Historial de score</p>
              <table className="w-full text-[11px] mb-2">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-1 text-zinc-600 font-medium">Fecha</th>
                    <th className="text-right pb-1 text-zinc-600 font-medium">Score</th>
                    <th className="text-right pb-1 text-zinc-600 font-medium">Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.slice(0, 7).map((h, i) => {
                    const prev  = historial[i + 1]?.score;
                    const dif   = prev !== undefined ? h.score - prev : null;
                    return (
                      <tr key={h.registrado_en} className="border-b border-gray-50">
                        <td className="py-1 text-zinc-700">
                          {new Date(h.registrado_en).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                        </td>
                        <td className="py-1 text-right font-semibold text-zinc-700">
                          {h.score}
                          {dif !== null && dif !== 0 && (
                            <span className={`ml-1 text-[9px] ${dif > 0 ? "text-emerald-500" : "text-red-400"}`}>
                              {dif > 0 ? `+${dif}` : dif}
                            </span>
                          )}
                        </td>
                        <td className="py-1 text-right text-zinc-600">
                          {h.nivel === "caliente" ? "🔥" : h.nivel === "activo" ? "⬆" : h.nivel === "tibio" ? "→" : "❄"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-start gap-2">
                <span className="text-sm shrink-0">📈</span>
                <p className="text-[11px] text-emerald-800 leading-snug">{interpretarHistorial(historial)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


const COLOR_VENTA: Record<string, "green" | "blue" | "gray"> = {
  si:         "green",
  en_proceso: "blue",
  no:         "gray",
};

interface ProspectoDetalleProps {
  prospecto:      Prospecto;
  onCerrar:       () => void;
  onEditar?:      () => void;
  onActualizado?: (id: string) => void;
}

type Tab = "info" | "llamadas" | "reuniones" | "brochures" | "propuestas" | "tareas" | "timeline" | "plantillas";

const FORM_PROPUESTA_VACIO: FormPropuesta = {
  servicio:              "desarrollo_web",
  descripcion:           "",
  subcategoria:          "",
  monto_propuesto:       "",
  monto_cerrado:         "",
  moneda:                "PEN",
  tipo_cambio:           "1",
  estado:                "enviada",
  fecha_propuesta:       fechaHoy(),
  fecha_negociacion:     "",
  fecha_cierre:          "",
  notas:                 "",
  notas_negociacion:     "",
  notas_cierre:          "",
  motivo_cierre_perdido: "",
};

export function ProspectoDetalle({ prospecto, onCerrar, onEditar, onActualizado }: ProspectoDetalleProps) {
  const [tab, setTab]               = useState<Tab>("info");
  const [editando, setEditando]     = useState(false);
  const [detalle, setDetalle]       = useState<Prospecto>(prospecto);
  const [llamadasDet, setLlamadasDet] = useState<Llamada[]>([]);
  const [reuniones, setReuniones]   = useState<Reunion[]>([]);
  const [brochures, setBrochures]   = useState<any[]>([]);
  const [tareas,    setTareas]      = useState<Tarea[]>([]);
  const [mostrarFormTarea, setMostrarFormTarea] = useState(false);
  const [, setCargando]     = useState(false);
  const [historialScore, setHistorialScore] = useState<ScoreHistoryEntry[]>([]);

  const [speechAbierto, setSpeechAbierto] = useState(false);

  const [modalLlamada,   setModalLlamada]   = useState(false);
  const [modalReunion,   setModalReunion]   = useState(false);
  const [modalBrochure,  setModalBrochure]  = useState(false);
  const [modalWhatsApp,  setModalWhatsApp]  = useState(false);
  const [refetchLlamadas, setRefetchLlamadas] = useState(0);

  const editarLlamada  = useEditar<any>();
  const editarReunion  = useEditar<any>();
  const editarBrochure = useEditar<any>();

  const handleGuardarEdicionReunion = async (form: any) => {
    await editarReunion.guardar(async () => {
      await actualizarReunion(editarReunion.editando!.id, {
        titulo:     form.titulo,
        fecha_hora: form.fecha && form.hora_inicio ? `${form.fecha}T${form.hora_inicio}` : undefined,
        hora_fin:   form.hora_fin || undefined,
        modalidad:  form.modalidad as any,
        enlace:     form.enlace || undefined,
        estado:     form.estado as any,
        notas:      form.notas || undefined,
      });
      cargarDetalle();
    });
  };

  const handleEliminarReunion = async (id: string) => {
    if (!confirm("¿Eliminar esta reunión?")) return;
    await eliminarReunion(id);
    cargarDetalle();
  };

  const handleGuardarEdicionBrochure = async (form: { canal: string; fecha_envio: string; notas: string }) => {
    await editarBrochure.guardar(async () => {
      await actualizarBrochure(editarBrochure.editando!.id, {
        canal:       form.canal       || undefined,
        fecha_envio: form.fecha_envio || undefined,
        notas:       form.notas       || undefined,
      });
      cargarDetalle();
    });
  };

  const handleEliminarBrochure = async (id: string) => {
    if (!confirm("¿Eliminar este envío?")) return;
    await eliminarBrochure(id);
    cargarDetalle();
  };

  const handleGuardarEdicionLlamada = async (formEdit: any) => {
    await editarLlamada.guardar(async () => {
      const { hora_inicio, fecha, hora_fin, resultado, motivo_no_interes, accion_acordada, ...resto } = formEdit;
      const payload: any = {
        ...resto,
        hora_fin:          hora_fin          || null,
        resultado:         resultado         || null,
        motivo_no_interes: motivo_no_interes || null,
        accion_acordada:   accion_acordada   || null,
      };
      const fechaBase = fecha || editarLlamada.editando?.fecha?.split("T")[0];
      if (fechaBase && hora_inicio) payload.fecha = toLocalISOString(fechaBase, hora_inicio);
      await actualizarLlamada(editarLlamada.editando!.id, payload);
      setRefetchLlamadas(n => n + 1);
    });
  };

  const handleEliminarLlamada = async (id: string) => {
    if (!confirm("¿Eliminar esta llamada?")) return;
    await eliminarLlamada(id);
    setRefetchLlamadas(n => n + 1);
  };

  // ── Propuestas ───────────────────────────────────────────────
  const { propuestas, cargarPropuestas, agregarPropuesta, editarPropuesta, borrarPropuesta } =
    usePropuestas(prospecto.id);

  const [modalNuevaPropuesta,  setModalNuevaPropuesta]  = useState(false);
  const [propuestaEditando,    setPropuestaEditando]    = useState<Propuesta | null>(null);
  const [formPropuesta,        setFormPropuesta]        = useState<FormPropuesta>(FORM_PROPUESTA_VACIO);
  const [guardandoPropuesta,   setGuardandoPropuesta]   = useState(false);
  const [errorPropuesta,       setErrorPropuesta]       = useState<string | null>(null);

  useEffect(() => {
    cargarDetalle();
    cargarPropuestas();
  }, [prospecto.id]);

  async function cargarDetalle() {
    setCargando(true);
    // Historial independiente — no bloquea si la tabla aún no existe
    getScoreHistory(prospecto.id).then(setHistorialScore).catch(() => {});
    try {
      const [det, reuns, broch, tar, llams] = await Promise.all([
        getProspecto(prospecto.id),
        getReuniones({ prospecto_id: prospecto.id }),
        getBrochures({ prospecto_id: prospecto.id }),
        getTareas({ prospecto_id: prospecto.id }),
        getLlamadas(prospecto.id),
      ]);
      setDetalle(det);
      setReuniones(reuns);
      setBrochures(broch);
      setTareas(tar);
      setLlamadasDet(llams);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  async function handleGuardarPropuesta() {
    setGuardandoPropuesta(true);
    try {
      await agregarPropuesta({
        prospecto_id:    prospecto.id,
        servicio:        formPropuesta.servicio as any,
        descripcion:     formPropuesta.descripcion,
        subcategoria:    formPropuesta.subcategoria,
        monto_propuesto: parseFloat(formPropuesta.monto_propuesto) || 0,
        monto_cerrado:   formPropuesta.monto_cerrado ? parseFloat(formPropuesta.monto_cerrado) : null,
        moneda:          formPropuesta.moneda,
        tipo_cambio:     parseFloat(formPropuesta.tipo_cambio) || 1,
        estado:                formPropuesta.estado as any,
        fecha_propuesta:       formPropuesta.fecha_propuesta,
        fecha_negociacion:     (formPropuesta.fecha_negociacion || null) as any,
        fecha_cierre:          (formPropuesta.fecha_cierre || null) as any,
        notas:                 formPropuesta.notas || "",
        notas_negociacion:     formPropuesta.notas_negociacion,
        notas_cierre:          formPropuesta.notas_cierre,
        motivo_cierre_perdido: formPropuesta.motivo_cierre_perdido || null,
      });
      setModalNuevaPropuesta(false);
      setFormPropuesta(FORM_PROPUESTA_VACIO);
      onActualizado?.(prospecto.id);
      cargarDetalle();
    } catch (err) {
      console.error(err);
    } finally {
      setGuardandoPropuesta(false);
    }
  }

  async function handleEditarPropuesta() {
    if (!propuestaEditando) return;
    setGuardandoPropuesta(true);
    setErrorPropuesta(null);
    try {
      await editarPropuesta(propuestaEditando.id, {
        servicio:        formPropuesta.servicio as any,
        descripcion:     formPropuesta.descripcion,
        subcategoria:    formPropuesta.subcategoria || null,
        monto_propuesto: parseFloat(formPropuesta.monto_propuesto) || 0,
        monto_cerrado:   formPropuesta.monto_cerrado ? parseFloat(formPropuesta.monto_cerrado) : null,
        moneda:          formPropuesta.moneda,
        tipo_cambio:     parseFloat(formPropuesta.tipo_cambio) || 1,
        estado:                formPropuesta.estado as any,
        fecha_propuesta:       formPropuesta.fecha_propuesta,
        fecha_negociacion:     (formPropuesta.fecha_negociacion || null) as any,
        fecha_cierre:          (formPropuesta.fecha_cierre || null) as any,
        notas:                 formPropuesta.notas || "",
        notas_negociacion:     formPropuesta.notas_negociacion || null,
        notas_cierre:          formPropuesta.notas_cierre || null,
        motivo_cierre_perdido: formPropuesta.motivo_cierre_perdido || null,
      });
      setPropuestaEditando(null);
      onActualizado?.(prospecto.id);
      // Recargar detalle del prospecto para reflejar cambios de estado_venta/clasificacion
      cargarDetalle();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Error al guardar";
      setErrorPropuesta(msg);
    } finally {
      setGuardandoPropuesta(false);
    }
  }

  function abrirEditarPropuesta(p: Propuesta) {
    setPropuestaEditando(p);
    setFormPropuesta({
      servicio:              p.servicio as any,
      descripcion:           p.descripcion,
      monto_propuesto:       String(p.monto_propuesto),
      monto_cerrado:         p.monto_cerrado != null ? String(p.monto_cerrado) : "",
      moneda:                p.moneda as any,
      tipo_cambio:           String(p.tipo_cambio),
      estado:                p.estado as any,
      fecha_propuesta:       (p.fecha_propuesta   ?? "").slice(0, 10),
      fecha_negociacion:     (p.fecha_negociacion ?? "").slice(0, 10),
      fecha_cierre:          (p.fecha_cierre      ?? "").slice(0, 10),
      subcategoria:          p.subcategoria ?? "",
      notas:                 p.notas ?? "",
      notas_negociacion:     p.notas_negociacion ?? "",
      notas_cierre:          p.notas_cierre ?? "",
      motivo_cierre_perdido: p.motivo_cierre_perdido ?? "",
    });
  }

  const tareasPendientes = tareas.filter(t => !t.completada).length;
  const { score, nivel, breakdown, accion, insight } = calcularScore(detalle, llamadasDet, propuestas);

  // Delta visual cuando el score cambia
  const scoreAnterior = useRef<number | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const deltaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (scoreAnterior.current !== null && scoreAnterior.current !== score) {
      const d = score - scoreAnterior.current;
      setDelta(d);
      if (deltaTimer.current) clearTimeout(deltaTimer.current);
      deltaTimer.current = setTimeout(() => setDelta(null), 3000);
    }
    scoreAnterior.current = score;
  }, [score]);

  const TABS: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "info",       label: "Información",  icon: <Building2 size={14} /> },
    { key: "llamadas",   label: "Llamadas",     icon: <Phone size={14} /> },
    { key: "reuniones",  label: "Reuniones",    icon: <Calendar size={14} /> },
    { key: "brochures",  label: "Brochures",    icon: <FileText size={14} /> },
    { key: "propuestas", label: "Propuestas",   icon: <ClipboardList size={14} /> },
    { key: "tareas",      label: "Tareas",      icon: <CheckSquare size={14} />, badge: tareasPendientes || undefined },
    { key: "plantillas",  label: "Plantillas",  icon: <MessageSquare size={14} /> },
    { key: "timeline",    label: "Timeline",    icon: <GitBranch size={14} /> },
  ];

  return (
    <>
      <Modal abierto onCerrar={onCerrar} titulo={detalle.empresa} size="xl" draggable>
        {/* Badges superiores */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <Badge color={COLOR_ESTADO[detalle.estado_lead] as any}>
            {LABEL_ESTADO[detalle.estado_lead] ?? detalle.estado_lead}
          </Badge>
          <Badge color={COLOR_PRIORIDAD[detalle.prioridad]}>
            Prioridad {detalle.prioridad}
          </Badge>
          <Badge color={COLOR_VENTA[detalle.estado_venta]}>
            Venta: {detalle.estado_venta === "si" ? "Cerrada" : detalle.estado_venta === "en_proceso" ? "En proceso" : "No"}
          </Badge>
          {detalle.clasificacion && (
            <Badge color="blue">
              Clasificación: {detalle.clasificacion}
            </Badge>
          )}
          {detalle.fuente && (
            <Badge color="gray">
              Fuente: {detalle.fuente}
            </Badge>
          )}
          {detalle.campana_origen && (
            <Badge color="gray">
              📢 {detalle.campana_origen}
            </Badge>
          )}
          <ScoreBadge score={score} nivel={nivel} breakdown={breakdown} accion={accion} insight={insight} delta={delta} historial={historialScore} />
          {detalle.etapa_pipeline === "cerrado_ganado" && detalle.fecha_primer_contacto && detalle.fecha_cierre && (() => {
            const parseD = (s: string) => new Date(s.slice(0, 10) + "T12:00:00");
            const diffD  = (a: string | null | undefined, b: string | null | undefined) => {
              if (!a || !b) return null;
              return Math.round((parseD(b).getTime() - parseD(a).getTime()) / 86_400_000);
            };
            const primeraPropuesta = propuestas.length > 0
              ? propuestas.reduce((min, p) => p.fecha_propuesta < min ? p.fecha_propuesta : min, propuestas[0].fecha_propuesta)
              : null;
            const diasTotal    = diffD(detalle.fecha_primer_contacto, detalle.fecha_cierre);
            const diasF1       = diffD(detalle.fecha_primer_contacto, primeraPropuesta);
            const diasF2       = diffD(primeraPropuesta, detalle.fecha_cierre);
            return (
              <div className="flex items-center gap-1.5 flex-wrap">
                {diasF1 != null && diasF1 >= 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700">
                    📋 Contacto→Propuesta: {diasF1}d
                  </span>
                )}
                {diasF2 != null && diasF2 >= 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">
                    ⚖️ Propuesta→Cierre: {diasF2}d
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Total: {diasTotal}d
                </span>
              </div>
            );
          })()}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSpeechAbierto(v => !v)}
              className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all select-none cursor-pointer
                ${speechAbierto
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"}`}
              title="Ver speech de llamada"
            >
              <BookOpen size={11} /> Speech
            </button>
            <Button size="sm" variant="secondary" onClick={() => setEditando(true)}>
              <Pencil size={13} /> Editar
            </Button>
          </div>
        </div>


        {/* Tabs informacion-llamadas-reuniones etc*/}
        <div className="overflow-x-auto mb-5 -mx-1 px-1">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg min-w-max">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition shrink-0 whitespace-nowrap
                  ${tab === t.key ? "bg-white shadow-sm text-zinc-800 font-medium" : "text-zinc-800 hover:text-gray-700"}`}
              >
                {t.icon} {t.label}
                {t.badge && t.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-orange-500 text-white font-medium leading-none">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* TAB: Información */}
        {tab === "info" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Empresa */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide">Empresa</p>
                {(detalle.actividad_economica || detalle.sector) && (
                  <div className="flex items-start gap-2">
                    <Building2 size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-700">{detalle.actividad_economica || detalle.sector}</span>
                  </div>
                )}
                {detalle.pagina_web && detalle.pagina_web.toLowerCase() !== "no" && (
                  <div className="flex items-start gap-2">
                    <Globe size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <a href={detalle.pagina_web.startsWith("http") ? detalle.pagina_web : `https://${detalle.pagina_web}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline truncate">
                      {detalle.pagina_web}
                    </a>
                  </div>
                )}
                {detalle.web_activa !== undefined && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-zinc-800 mt-0.5 shrink-0">Web activa:</span>
                    <span className="text-xs text-gray-700">{detalle.web_activa ? "Sí" : "No"}</span>
                  </div>
                )}
                {detalle.web_activa && detalle.estado_web && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-zinc-800 mt-0.5 shrink-0">Estado web:</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      detalle.estado_web === "actualizada"       ? "bg-green-100 text-green-700"  :
                      detalle.estado_web === "por_actualizar"    ? "bg-yellow-100 text-yellow-700" :
                      detalle.estado_web === "vencida"           ? "bg-red-100 text-red-700"      :
                      detalle.estado_web === "en_mantenimiento"  ? "bg-blue-100 text-blue-700"    :
                      "bg-zinc-100 text-zinc-600"
                    }`}>
                      {{
                        actualizada:      "Actualizada",
                        por_actualizar:   "Por actualizar",
                        vencida:          "Vencida",
                        en_mantenimiento: "En mantenimiento",
                        sin_informacion:  "Sin información",
                      }[detalle.estado_web] ?? detalle.estado_web}
                    </span>
                  </div>
                )}
                {detalle.proveedor_web && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-zinc-800 mt-0.5 shrink-0">Proveedor:</span>
                    <span className="text-xs text-gray-700">{detalle.proveedor_web}</span>
                  </div>
                )}
                {detalle.ciudad && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-700">
                      {detalle.ciudad}{detalle.region ? `, ${detalle.region}` : ""}{detalle.pais ? `, ${detalle.pais}` : ""}
                    </span>
                  </div>
                )}
                {detalle.tamano_empresa && (
                  <div className="flex items-start gap-2">
                    <User size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-700">{detalle.tamano_empresa.replace(/_/g, " ")} empleados</span>
                  </div>
                )}
              </div>

              {/* Contacto */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide">Contacto</p>
                {detalle.nombre_contacto && (
                  <div className="flex items-start gap-2">
                    <User size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-700">{detalle.nombre_contacto}</p>
                      {detalle.cargo && <p className="text-xs text-zinc-800">{detalle.cargo}</p>}
                    </div>
                  </div>
                )}
                {detalle.telefono && (
                  <div className="flex items-start gap-2 flex-wrap">
                    <a href={`tel:${detalle.telefono}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-xs font-semibold"
                      title="Llamar">
                      <Phone size={13} /> {detalle.telefono}
                    </a>
                    <button
                      onClick={() => setModalWhatsApp(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-xs font-semibold"
                      title="Enviar WhatsApp"
                    >
                      <MessageSquare size={13} /> WhatsApp
                    </button>
                  </div>
                )}
                {detalle.email_contacto && (
                  <div className="flex items-start gap-2">
                    <Mail size={14} className="text-zinc-800 mt-0.5 shrink-0" />
                    <a href={`mailto:${detalle.email_contacto}`} className="text-xs text-gray-700 hover:text-brand transition truncate">
                      {detalle.email_contacto}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            {detalle.notas && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-zinc-800 uppercase tracking-wide mb-2">Notas</p>
                <p className="text-xs gray-100 whitespace-pre-wrap">{detalle.notas}</p>
              </div>
            )}

            {/* Fechas */}
            <div className="flex gap-4 text-xs text-zinc-800 pt-1 border-t border-gray-100">
              <span>Creado: {new Date(detalle.creado_en).toLocaleDateString("es-PE")}</span>
              <span>Actualizado: {new Date(detalle.actualizado_en).toLocaleDateString("es-PE")}</span>
            </div>
          </div>
        )}

        {/* TAB: Llamadas */}
        {tab === "llamadas" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setModalLlamada(true)}>
                <Phone size={13} /> Registrar llamada
              </Button>
            </div>
            <LlamadaHistorial
              prospectoId={prospecto.id}
              onEditar={editarLlamada.abrir}
              onEliminar={handleEliminarLlamada}
              refetch={refetchLlamadas}
            />
          </div>
        )}

        {/* TAB: Reuniones */}
        {tab === "reuniones" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setModalReunion(true)}>
                <Calendar size={13} /> Nueva reunión
              </Button>
            </div>
            {reuniones.length === 0 ? (
              <p className="text-xs text-zinc-800 text-center py-6">Sin reuniones registradas</p>
            ) : (
              <div className="space-y-2">
                {reuniones.map(r => (
                  <div key={r.id} className="p-3 rounded-lg border border-gray-100 flex items-start justify-between hover:bg-gray-50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-800">{r.titulo}</p>
                      <p className="text-xs text-zinc-800 mt-0.5 capitalize">{r.modalidad.replace(/_/g, " ")}</p>
                      {r.notas && <p className="text-xs text-zinc-800 mt-1 truncate">{r.notas}</p>}
                    </div>
                    <div className="flex items-start gap-1 shrink-0 ml-4">
                      <div className="text-right mr-1">
                        <p className="text-xs font-medium text-gray-700">
                          {new Date(r.fecha_hora).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                        </p>
                        <p className="text-xs text-zinc-800">
                          {new Date(r.fecha_hora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <Badge color={r.estado === "realizada" ? "green" : r.estado === "cancelada" ? "red" : "blue"}>
                          {r.estado}
                        </Badge>
                      </div>
                      <button onClick={() => editarReunion.abrir(r)}
                        className="text-zinc-400 hover:text-brand transition p-1 mt-0.5" title="Editar">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleEliminarReunion(r.id)}
                        className="text-zinc-400 hover:text-red-500 transition p-1 mt-0.5" title="Eliminar">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Brochures */}
        {tab === "brochures" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setModalBrochure(true)}>
                <FileText size={13} /> Registrar envío
              </Button>
            </div>
            {brochures.length === 0 ? (
              <p className="text-xs text-zinc-800 text-center py-6">Sin brochures enviados</p>
            ) : (
              <div className="space-y-2">
                {brochures.map(b => (
                  <div key={b.id} className="p-3 rounded-lg border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition">
                    <div>
                      <span className="text-xs font-medium text-gray-700 capitalize">{b.canal}</span>
                      {b.notas && <p className="text-xs text-zinc-800 mt-0.5">{b.notas}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-zinc-800 mr-1">
                        {new Date(b.fecha_envio).toLocaleDateString("es-PE")}
                      </span>
                      <button onClick={() => editarBrochure.abrir({ ...b, empresa: detalle.empresa })}
                        className="text-zinc-400 hover:text-brand transition p-1" title="Editar">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleEliminarBrochure(b.id)}
                        className="text-zinc-400 hover:text-red-500 transition p-1" title="Eliminar">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Tareas */}
        {tab === "tareas" && (
          <div className="space-y-4">
            {mostrarFormTarea ? (
              <TareaForm
                prospectoId={prospecto.id}
                onGuardado={() => { setMostrarFormTarea(false); cargarDetalle(); }}
                onCancelar={() => setMostrarFormTarea(false)}
              />
            ) : (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setMostrarFormTarea(true)}>
                  <Plus size={13} /> Nueva tarea
                </Button>
              </div>
            )}
            <TareasList tareas={tareas} onActualizar={cargarDetalle} />
          </div>
        )}

        {/* TAB: Plantillas */}
        {tab === "plantillas" && (
          <PlantillaSelector
            empresa={detalle.empresa}
            nombre={detalle.nombre_contacto}
            telefono={detalle.telefono}
          />
        )}

        {/* TAB: Timeline */}
        {tab === "timeline" && (
          <TimelineDetalle
            prospectoId={detalle.id}
            llamadas={llamadasDet}
            reuniones={reuniones}
            brochures={brochures}
            propuestas={propuestas}
          />
        )}

        {/* TAB: Propuestas */}
        {tab === "propuestas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-700">
                {propuestas.length} propuesta{propuestas.length !== 1 ? "s" : ""} registrada{propuestas.length !== 1 ? "s" : ""}
              </p>
              <Button size="sm" onClick={() => { setFormPropuesta(FORM_PROPUESTA_VACIO); setModalNuevaPropuesta(true); }}>
                <ClipboardList size={13} /> Nueva propuesta
              </Button>
            </div>
            <TablaPropuestas
              propuestas={propuestas}
              onEditar={abrirEditarPropuesta}
              onEliminar={borrarPropuesta}
            />
          </div>
        )}
      </Modal>

      {/* Sub-modales */}
      <LlamadaForm
        abierto={modalLlamada}
        onCerrar={() => setModalLlamada(false)}
        prospectoId={prospecto.id}
        onGuardado={() => setRefetchLlamadas(n => n + 1)}
      />

      {editarLlamada.editando && (
        <ModalEditarLlamada
          llamada={editarLlamada.editando}
          guardando={editarLlamada.guardando}
          error={editarLlamada.error}
          onGuardar={handleGuardarEdicionLlamada}
          onCerrar={editarLlamada.cerrar}
        />
      )}
      <ReunionForm
        abierto={modalReunion}
        onCerrar={() => setModalReunion(false)}
        prospectoId={prospecto.id}
        onGuardado={cargarDetalle}
      />
      {editarReunion.editando && (
        <ModalEditarReunion
          reunion={editarReunion.editando}
          guardando={editarReunion.guardando}
          error={editarReunion.error}
          onGuardar={handleGuardarEdicionReunion}
          onCerrar={editarReunion.cerrar}
        />
      )}
      <BrochureForm
        abierto={modalBrochure}
        onCerrar={() => setModalBrochure(false)}
        prospectoId={prospecto.id}
        onGuardado={cargarDetalle}
      />
      {editarBrochure.editando && (
        <ModalEditarBrochure
          brochure={editarBrochure.editando}
          guardando={editarBrochure.guardando}
          error={editarBrochure.error}
          onGuardar={handleGuardarEdicionBrochure}
          onCerrar={editarBrochure.cerrar}
        />
      )}

      {/* Modal nueva propuesta */}
      {modalNuevaPropuesta && (
        <ModalPropuesta
          form={formPropuesta}
          cargando={guardandoPropuesta}
          onFormChange={setFormPropuesta}
          onGuardar={handleGuardarPropuesta}
          onCerrar={() => setModalNuevaPropuesta(false)}
        />
      )}

      {/* Modal editar propuesta */}
      {propuestaEditando && (
        <ModalEditarPropuesta
          propuesta={propuestaEditando}
          form={formPropuesta}
          cargando={guardandoPropuesta}
          error={errorPropuesta}
          onFormChange={setFormPropuesta}
          onGuardar={handleEditarPropuesta}
          onCerrar={() => { setPropuestaEditando(null); setErrorPropuesta(null); }}
        />
      )}

      {/* Modal editar prospecto */}
      {editando && (
        <ProspectoForm
          prospecto={detalle}
          onCerrar={() => setEditando(false)}
          onGuardado={() => {
            setEditando(false);
            cargarDetalle();
            onActualizado?.(detalle.id);
          }}
        />
      )}

      {/* Modal WhatsApp */}
      {detalle && (
        <ModalWhatsApp
          open={modalWhatsApp}
          onClose={() => setModalWhatsApp(false)}
          nombre={detalle.nombre_contacto || detalle.empresa}
          telefono={detalle.telefono || ""}
          prospectoId={prospecto.id}
          empresa={detalle.empresa}
        />
      )}

      {/* Panel lateral de speech */}
      {speechAbierto && (
        <SpeechPanel
          prospecto={detalle}
          onCerrar={() => setSpeechAbierto(false)}
        />
      )}
    </>
  );
}

