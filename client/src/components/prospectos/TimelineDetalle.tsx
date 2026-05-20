/**client/src/components/prospectos/TimelineDetalle.tsx */

import { Phone, Calendar, FileText, ClipboardList, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Llamada } from "../../types/llamada.types";
import type { Reunion } from "../../types/reunion.types";
import type { Propuesta } from "../../types/propuesta.types";
import { LABEL_SERVICIO, LABEL_ESTADO as LABEL_ESTADO_PROP } from "../../types/propuesta.types";

interface Props {
  llamadas:  Llamada[];
  reuniones: Reunion[];
  brochures: any[];
  propuestas: Propuesta[];
}

type EventoTipo = "llamada" | "reunion" | "brochure" | "propuesta";

interface Evento {
  id:     string;
  tipo:   EventoTipo;
  fecha:  string;
  titulo: string;
  detalle?: string;
  meta?:   React.ReactNode;
  raw:    any;
}

function toEventos(llamadas: Llamada[], reuniones: Reunion[], brochures: any[], propuestas: Propuesta[]): Evento[] {
  const ev: Evento[] = [];

  for (const l of llamadas) {
    const horaInicio = new Date(l.fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    const rango      = l.hora_fin ? `${horaInicio} – ${l.hora_fin.slice(0, 5)}` : horaInicio;
    ev.push({
      id:     l.id,
      tipo:   "llamada",
      fecha:  l.fecha,
      titulo: l.contestada ? "Llamada contestada" : "Llamada no contestada",
      detalle: [l.canal && `Canal: ${l.canal}`, l.resultado, l.notas].filter(Boolean).join(" · "),
      meta:   <span className="text-[10px] text-zinc-400">{rango}</span>,
      raw:    l,
    });
  }

  for (const r of reuniones) {
    ev.push({
      id:     r.id,
      tipo:   "reunion",
      fecha:  r.fecha_hora,
      titulo: r.titulo,
      detalle: [r.modalidad?.replace(/_/g, " "), r.notas].filter(Boolean).join(" · "),
      meta:   <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
        r.estado === "realizada" ? "bg-green-100 text-green-700" :
        r.estado === "cancelada" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
      }`}>{r.estado}</span>,
      raw:    r,
    });
  }

  for (const b of brochures) {
    ev.push({
      id:     b.id,
      tipo:   "brochure",
      fecha:  b.fecha_envio,
      titulo: "Brochure enviado",
      detalle: [b.canal && `Por ${b.canal}`, b.notas].filter(Boolean).join(" · "),
      raw:    b,
    });
  }

  for (const p of propuestas) {
    const monto = p.moneda === "PEN"
      ? `S/ ${Number(p.monto_propuesto).toLocaleString("es-PE")}`
      : `$ ${Number(p.monto_propuesto).toLocaleString("en-US")}`;
    ev.push({
      id:     p.id,
      tipo:   "propuesta",
      fecha:  p.fecha_propuesta,
      titulo: `Propuesta: ${LABEL_SERVICIO[p.servicio] ?? p.servicio}`,
      detalle: p.descripcion,
      meta: (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-gray-700">{monto}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            p.estado === "cerrada_ganada" ? "bg-green-100 text-green-700" :
            p.estado === "cerrada_perdida" ? "bg-red-100 text-red-700" :
            p.estado === "en_negociacion" ? "bg-yellow-100 text-yellow-700" :
            "bg-blue-100 text-blue-700"
          }`}>{LABEL_ESTADO_PROP[p.estado]}</span>
        </div>
      ),
      raw:    p,
    });
  }

  return ev.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

const ICON: Record<EventoTipo, React.ReactNode> = {
  llamada:  <Phone size={13} />,
  reunion:  <Calendar size={13} />,
  brochure: <FileText size={13} />,
  propuesta: <ClipboardList size={13} />,
};

const COLOR_DOT: Record<EventoTipo, string> = {
  llamada:   "bg-blue-500",
  reunion:   "bg-purple-500",
  brochure:  "bg-amber-500",
  propuesta: "bg-green-500",
};

const COLOR_ICON: Record<EventoTipo, string> = {
  llamada:   "bg-blue-100 text-blue-600",
  reunion:   "bg-purple-100 text-purple-600",
  brochure:  "bg-amber-100 text-amber-600",
  propuesta: "bg-green-100 text-green-600",
};

function formatFecha(iso: string) {
  const d = new Date(iso);
  const hoy    = new Date().toDateString();
  const ayer   = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === hoy)  return "Hoy";
  if (d.toDateString() === ayer) return "Ayer";
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

export function TimelineDetalle({ llamadas, reuniones, brochures, propuestas }: Props) {
  const eventos = toEventos(llamadas, reuniones, brochures, propuestas);

  if (eventos.length === 0) {
    return (
      <div className="text-center py-10 text-xs text-zinc-400">
        <Clock size={28} className="mx-auto mb-2 opacity-40" />
        Sin actividad registrada
      </div>
    );
  }

  // Group by date label
  const grupos: { fecha: string; items: Evento[] }[] = [];
  for (const ev of eventos) {
    const label = formatFecha(ev.fecha);
    const last  = grupos[grupos.length - 1];
    if (last && last.fecha === label) last.items.push(ev);
    else grupos.push({ fecha: label, items: [ev] });
  }

  return (
    <div className="space-y-4">
      {grupos.map(g => (
        <div key={g.fecha}>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 sticky top-0 bg-white py-1">
            {g.fecha}
          </p>
          <div className="relative pl-6 space-y-3">
            {/* vertical line */}
            <div className="absolute left-2.5 top-0 bottom-0 w-px bg-gray-100" />
            {g.items.map(ev => (
              <div key={ev.id} className="relative flex items-start gap-3">
                {/* dot on line */}
                <div className={`absolute -left-4 top-1.5 w-2 h-2 rounded-full border-2 border-white ${COLOR_DOT[ev.tipo]}`} />
                {/* icon */}
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center -ml-1 ${COLOR_ICON[ev.tipo]}`}>
                  {ICON[ev.tipo]}
                </div>
                {/* content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {ev.tipo === "llamada" && (
                        ev.raw.contestada
                          ? <CheckCircle size={11} className="text-green-500 shrink-0" />
                          : <XCircle    size={11} className="text-red-400 shrink-0" />
                      )}
                      <p className="text-xs font-medium text-zinc-800">{ev.titulo}</p>
                    </div>
                    <div className="shrink-0">{ev.meta}</div>
                  </div>
                  {ev.detalle && (
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{ev.detalle}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Leyenda */}
      <div className="flex gap-3 flex-wrap pt-2 border-t border-gray-100">
        {(["llamada","reunion","brochure","propuesta"] as EventoTipo[]).map(t => (
          <div key={t} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${COLOR_DOT[t]}`} />
            <span className="text-[10px] text-zinc-400 capitalize">{t === "llamada" ? "Llamadas" : t === "reunion" ? "Reuniones" : t === "brochure" ? "Brochures" : "Propuestas"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
