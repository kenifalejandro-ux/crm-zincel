/** client/src/components/prospectos/TimelineDetalle.tsx */

import { STICKY_BASE } from "../../lib/tokens";
import { useEffect, useState } from "react";
import {
  Phone, Calendar, FileText, ClipboardList, CheckSquare,
  GitBranch, Zap, StickyNote, Clock, Loader2
} from "lucide-react";
import { getTimeline } from "../../services/activityLogs.api";
import type { ActivityLog, TipoActividad } from "../../services/activityLogs.api";

// Fallback: tipos para datos históricos pre-activity_logs
import type { Llamada }   from "../../types/llamada.types";
import type { Reunion }   from "../../types/reunion.types";
import type { Propuesta } from "../../types/propuesta.types";

interface Props {
  prospectoId: string;
  // Props legacy — usados solo cuando activity_logs está vacío
  llamadas:   Llamada[];
  reuniones:  Reunion[];
  brochures:  any[];
  propuestas: Propuesta[];
}

// ── Configuración visual por tipo ─────────────────────────────────────────────

const TIPO_CONFIG: Record<TipoActividad, { icon: React.ReactNode; dot: string; bg: string; color: string }> = {
  llamada:       { icon: <Phone size={13} />,        dot: "bg-blue-500",   bg: "bg-blue-100",   color: "text-blue-600"   },
  reunion:       { icon: <Calendar size={13} />,     dot: "bg-purple-500", bg: "bg-purple-100", color: "text-purple-600" },
  propuesta:     { icon: <ClipboardList size={13} />,dot: "bg-green-500",  bg: "bg-green-100",  color: "text-green-600"  },
  brochure:      { icon: <FileText size={13} />,     dot: "bg-amber-500",  bg: "bg-amber-100",  color: "text-amber-600"  },
  tarea:         { icon: <CheckSquare size={13} />,  dot: "bg-teal-500",   bg: "bg-teal-100",   color: "text-teal-600"   },
  pipeline:      { icon: <GitBranch size={13} />,    dot: "bg-amber-500", bg: "bg-amber-100", color: "text-amber-600" },
  score:         { icon: <Zap size={13} />,          dot: "bg-yellow-500", bg: "bg-yellow-100", color: "text-yellow-600" },
  automatizacion:{ icon: <Zap size={13} />,          dot: "bg-rose-500",   bg: "bg-rose-100",   color: "text-rose-600"   },
  nota:          { icon: <StickyNote size={13} />,   dot: "bg-zinc-400",   bg: "bg-zinc-100",   color: "text-zinc-700"   },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso: string) {
  const d    = new Date(iso);
  const hoy  = new Date().toDateString();
  const ayer = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === hoy)  return "Hoy";
  if (d.toDateString() === ayer) return "Ayer";
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

// ── Convertir datos legacy a ActivityLog ──────────────────────────────────────

function legacyToLogs(
  llamadas: Llamada[], reuniones: Reunion[], brochures: any[], propuestas: Propuesta[]
): ActivityLog[] {
  const logs: ActivityLog[] = [];

  for (const l of llamadas) {
    logs.push({
      id:          l.id,
      tipo:        "llamada",
      titulo:      l.contestada ? "Llamada contestada" : "Llamada no contestada",
      descripcion: [l.canal && `Canal: ${l.canal}`, l.resultado, l.notas].filter(Boolean).join(" · ") || null,
      metadata:    { contestada: l.contestada, canal: l.canal },
      usuario_id:  null,
      creado_en:   l.fecha,
    });
  }
  for (const r of reuniones) {
    logs.push({
      id:          r.id,
      tipo:        "reunion",
      titulo:      r.titulo,
      descripcion: [r.modalidad?.replace(/_/g, " "), r.estado, r.notas].filter(Boolean).join(" · ") || null,
      metadata:    { estado: r.estado, modalidad: r.modalidad },
      usuario_id:  null,
      creado_en:   r.fecha_hora,
    });
  }
  for (const b of brochures) {
    logs.push({
      id:          b.id,
      tipo:        "brochure",
      titulo:      `Brochure enviado por ${b.canal}`,
      descripcion: b.notas ?? null,
      metadata:    { canal: b.canal },
      usuario_id:  null,
      creado_en:   b.fecha_envio,
    });
  }
  for (const p of propuestas) {
    logs.push({
      id:          p.id,
      tipo:        "propuesta",
      titulo:      `Propuesta: ${p.servicio}`,
      descripcion: p.descripcion ?? null,
      metadata:    { monto: p.monto_propuesto, moneda: p.moneda, estado: p.estado },
      usuario_id:  null,
      creado_en:   p.fecha_propuesta,
    });
  }

  return logs;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function TimelineDetalle({ prospectoId, llamadas, reuniones, brochures, propuestas }: Props) {
  const [logs,     setLogs]     = useState<ActivityLog[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getTimeline(prospectoId)
      .then(data => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setCargando(false));
  }, [prospectoId]);

  if (cargando) return (
    <div className="flex justify-center py-10">
      <Loader2 size={20} className="text-blue-500 animate-spin" />
    </div>
  );

  // Si no hay activity_logs, mostrar datos legacy
  const items: ActivityLog[] = logs.length > 0
    ? logs
    : legacyToLogs(llamadas, reuniones, brochures, propuestas);

  const esFallback = logs.length === 0 && items.length > 0;

  const sorted = [...items].sort((a, b) =>
    new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
  );

  if (sorted.length === 0) return (
    <div className="text-center py-10 text-xs text-zinc-400">
      <Clock size={28} className="mx-auto mb-2 opacity-40" />
      Sin actividad registrada
    </div>
  );

  // Agrupar por fecha
  const grupos: { fecha: string; items: ActivityLog[] }[] = [];
  for (const log of sorted) {
    const label = formatFecha(log.creado_en);
    const last  = grupos[grupos.length - 1];
    if (last && last.fecha === label) last.items.push(log);
    else grupos.push({ fecha: label, items: [log] });
  }

  return (
    <div className="space-y-4">
      {esFallback && (
        <p className="text-[10px] text-zinc-400 italic text-center">
          Mostrando historial anterior al sistema de timeline
        </p>
      )}

      {grupos.map(g => (
        <div key={g.fecha}>
          <p className={`${STICKY_BASE} text-[10px] font-semibold text-zinc-100 uppercase tracking-wider mb-2 sticky top-0 py-1`}>
            {g.fecha}
          </p>
          <div className="relative pl-6 space-y-3">
            <div className="absolute left-2.5 top-0 bottom-0 w-px bg-zinc-800" />
            {g.items.map(log => {
              const cfg = TIPO_CONFIG[log.tipo] ?? TIPO_CONFIG.nota;
              return (
                <div key={log.id} className="relative flex items-start gap-3">
                  <div className={`absolute -left-4 top-1.5 w-2 h-2 rounded-full border-2 border-white/10 ${cfg.dot}`} />
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center -ml-1 ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-zinc-200 leading-snug">{log.titulo}</p>
                      <span className="text-[10px] text-zinc-400 shrink-0">{formatHora(log.creado_en)}</span>
                    </div>
                    {log.descripcion && (
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{log.descripcion}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Leyenda */}
      <div className="flex gap-3 flex-wrap pt-2 border-t border-white/8">
        {(["llamada","reunion","propuesta","brochure","pipeline","tarea"] as TipoActividad[]).map(t => {
          const cfg = TIPO_CONFIG[t];
          const label: Record<string, string> = {
            llamada: "Llamadas", reunion: "Reuniones", propuesta: "Propuestas",
            brochure: "Brochures", pipeline: "Pipeline", tarea: "Tareas",
          };
          return (
            <div key={t} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-[10px] text-zinc-400">{label[t]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
