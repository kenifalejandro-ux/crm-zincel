/** client/src/lib/estadoColors.ts
 *
 *  FUENTE ÚNICA de color para estados, prioridades y score (versión neon).
 *  Antes estaban dispersos como clases de tema CLARO (bg-green-100 text-green-700)
 *  en mappers.ts y en mapas locales de cada componente — parches claros sobre el dark.
 *
 *  Cada clase es auto-contenida (incluye `border`), pensada para fondo oscuro.
 */

/** Estado del lead → chip neon (fondo translúcido + texto claro + borde sutil). */
export const ESTADO_CHIP: Record<string, string> = {
  nuevo:                "bg-blue-500/15 text-blue-300 border border-blue-500/30",
  por_gestionar:        "bg-white/[0.06] text-zinc-300 border border-white/15",
  interesado:           "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",
  solicita_informacion: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
  no_interesado:        "bg-red-500/12 text-red-300 border border-red-500/30",
  no_contesta:          "bg-white/[0.05] text-zinc-400 border border-white/10",
  volver_a_llamar:      "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  ocupado_en_reunion:   "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  prometio_llamar:      "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  buzon_de_voz:         "bg-orange-500/15 text-orange-300 border border-orange-500/30",
  fuera_de_servicio:    "bg-red-500/12 text-red-300 border border-red-500/25",
  numero_equivocado:    "bg-pink-500/15 text-pink-300 border border-pink-500/30",
  ya_tiene_proveedor:   "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  baja_de_oficio:       "bg-slate-500/15 text-slate-300 border border-slate-500/25",
  suspension_temporal:  "bg-amber-500/15 text-amber-300 border border-amber-500/25",
  no_habido:            "bg-slate-500/12 text-slate-400 border border-slate-500/20",
  perdida:              "bg-red-500/12 text-red-300 border border-red-500/30",
  venta_ganada:         "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
};

/** Prioridad → chip neon. */
export const PRIORIDAD_CHIP: Record<string, string> = {
  alta:  "bg-red-500/15 text-red-300 border border-red-500/30",
  media: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  baja:  "bg-white/[0.06] text-zinc-400 border border-white/15",
};

/** Dot de prioridad (para kanban cards). */
export const PRIORIDAD_DOT: Record<string, string> = {
  alta:  "bg-red-400",
  media: "bg-amber-400",
  baja:  "bg-zinc-500",
};

/** Color HEX por etapa del pipeline (para dots con glow inline). */
export const ETAPA_HEX: Record<string, string> = {
  volver_a_llamar:      "#fbbf24",
  solicita_informacion: "#3b82f6",
  interesado:           "#22d3ee",
  propuesta_enviada:    "#a855f7",
  negociacion:          "#ec4899",
  cerrado_ganado:       "#34d399",
  perdido:              "#f87171",
};

/** Nivel de score → color + ícono (texto claro sobre dark). */
export const SCORE_NEON: Record<string, { hex: string; text: string; icon: string }> = {
  caliente: { hex: "#f87171", text: "text-red-300",    icon: "🔥" },
  activo:   { hex: "#fbbf24", text: "text-amber-300",  icon: "⬆"  },
  tibio:    { hex: "#facc15", text: "text-yellow-300", icon: "→"  },
  frio:     { hex: "#60a5fa", text: "text-blue-300",   icon: "❄"  },
};

/** Estado de propuesta → chip neon. */
export const PROPUESTA_CHIP: Record<string, { label: string; cls: string }> = {
  enviada:         { label: "Enviada",     cls: "bg-amber-500/15 text-amber-300 border border-amber-500/30" },
  en_negociacion:  { label: "Negociación", cls: "bg-blue-500/15 text-blue-300 border border-blue-500/30"   },
  cerrada_ganada:  { label: "Ganada",      cls: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" },
  cerrada_perdida: { label: "Perdida",     cls: "bg-red-500/12 text-red-300 border border-red-500/30"       },
  vencida:         { label: "Vencida",     cls: "bg-white/[0.06] text-zinc-400 border border-white/15"      },
};
