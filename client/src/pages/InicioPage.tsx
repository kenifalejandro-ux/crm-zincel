/** client/src/pages/InicioPage.tsx */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone, CalendarDays, AlertTriangle, Users,
  TrendingUp, CheckCircle, Zap, ChevronRight,
  Clock, Loader2, Plus, FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getResumenInicio } from "../services/inicio.api";
import type { ResumenInicio } from "../services/inicio.api";
import { ProspectoForm } from "../components/prospectos/ProspectoForm";
import { ProspectoDetalle } from "../components/prospectos/ProspectoDetalle";
import { getProspecto } from "../services/prospectos.api";
import type { Prospecto } from "../types/prospecto.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function saludo() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { texto: "Buenos días",   emoji: "☀️" };
  if (h >= 12 && h < 19) return { texto: "Buenas tardes", emoji: "🌤️" };
  return                         { texto: "Buenas noches", emoji: "🌙" };
}

const ETAPA_LABEL: Record<string, string> = {
  nuevo:             "Nuevo",
  contactado:        "Contactado",
  interesado:        "Interesado",
  propuesta_enviada: "Propuesta enviada",
  negociacion:       "Negociación",
};

// ─── Tipos de ítem del checklist ─────────────────────────────────────────────

interface CheckItem {
  id:       string;
  icon:     React.ReactNode;
  label:    string;
  sub:      string;
  badge?:   number;
  urgente?: boolean;
  action:   () => void;
  detail: {
    titulo:      string;
    descripcion: string;
    cta:         string;
    onCta:       () => void;
    extra?:      React.ReactNode;
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InicioPage() {
  const navigate    = useNavigate();
  const { usuario } = useAuth() as any;
  const nombre      = usuario?.nombre?.split(" ")[0] ?? "Kenif";

  const [data,           setData]           = useState<ResumenInicio | null>(null);
  const [cargando,       setCargando]       = useState(true);
  const [seleccionado,   setSeleccionado]   = useState<string>("leads");
  const [modalProspecto, setModalProspecto] = useState(false);
  const [detalleProspecto, setDetalleProspecto] = useState<Prospecto | null>(null);

  async function abrirDetalle(id: string) {
    try {
      const p = await getProspecto(id);
      setDetalleProspecto(p);
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    getResumenInicio()
      .then(d => {
        setData(d);
        // Auto-seleccionar reuniones si hay alguna hoy con estado programada o en proceso
        const proxima = d.reuniones_hoy.find((r: any) => r.estado === "programada" || r.estado === "en_proceso");
        if (proxima) setSeleccionado("reuniones");
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const hoy     = new Date();
  const { texto: saludoTexto, emoji } = saludo();
  const fechaStr = `${DIAS[hoy.getDay()]} ${hoy.getDate()} de ${MESES[hoy.getMonth()]}`;

  const totalAlertas = data
    ? data.alertas.criticos + data.alertas.urgentes + data.alertas.estancados
    : 0;

  // ── Ítems del checklist ──
  const items: CheckItem[] = [
    {
      id:    "leads",
      icon:  <Zap size={16} />,
      label: "Leads prioritarios",
      sub:   data ? `${data.leads_calientes.length} leads calientes para contactar` : "Cargando...",
      badge: data?.leads_calientes.length,
      action: () => setSeleccionado("leads"),
      detail: {
        titulo:      "Leads calientes",
        descripcion: "Los leads con mayor prioridad según etapa del pipeline y valor estimado.",
        cta:         "Ver todos los prospectos",
        onCta:       () => navigate("/prospectos"),
        extra: data?.leads_calientes.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">Sin leads activos</p>
        ) : (
          <div className="space-y-2 mt-3">
            {data?.leads_calientes.map(lead => (
              <div
                key={lead.id}
                onClick={() => abrirDetalle(lead.id)}
                className="flex items-center justify-between p-3 rounded-xl bg-white/60 hover:bg-white border border-white/80 cursor-pointer transition group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 truncate group-hover:text-brand">{lead.empresa}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {ETAPA_LABEL[lead.etapa_pipeline] ?? lead.etapa_pipeline}
                    {lead.valor_pipeline > 0 && ` · S/ ${lead.valor_pipeline.toLocaleString("es-PE", { maximumFractionDigits: 0 })}`}
                  </p>
                </div>
                {lead.telefono && (
                  <a
                    href={`tel:${lead.telefono}`}
                    onClick={e => e.stopPropagation()}
                    className="shrink-0 ml-2 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition"
                  >
                    <Phone size={11} /> Llamar
                  </a>
                )}
              </div>
            ))}
          </div>
        ),
      },
    },
    {
      id:    "reuniones",
      icon:  <CalendarDays size={16} />,
      label: "Reuniones de hoy",
      sub: (() => {
        if (!data) return "Cargando...";
        if (data.reuniones_hoy.length === 0) return "Sin reuniones programadas hoy";
        const proxima = (data.reuniones_hoy as any[]).find((r: any) => r.estado === "programada" || r.estado === "en_proceso");
        if (proxima) {
          const hora = new Date(proxima.fecha_hora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
          return `Próxima: ${proxima.empresa} a las ${hora}`;
        }
        return `${data.reuniones_hoy.length} reunión${data.reuniones_hoy.length > 1 ? "es" : ""} hoy`;
      })(),
      badge: data?.reuniones_hoy.length || undefined,
      action: () => setSeleccionado("reuniones"),
      detail: {
        titulo:      "Reuniones de hoy",
        descripcion: "Reuniones programadas para hoy con tus prospectos.",
        cta:         "Ir a Reuniones",
        onCta:       () => navigate("/reuniones"),
        extra: data?.reuniones_hoy.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <CalendarDays size={32} className="text-zinc-200" />
            <p className="text-sm text-zinc-400">No hay reuniones programadas hoy</p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {data?.reuniones_hoy.map((r: any) => {
              const hora    = new Date(r.fecha_hora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
              const horaFin = r.hora_fin ? r.hora_fin.slice(0, 5) : null;
              const ahora   = new Date();
              const inicioMs = new Date(r.fecha_hora).getTime();
              const diffMin  = Math.round((inicioMs - ahora.getTime()) / 60000);
              const esPronto = diffMin > 0 && diffMin <= 30;
              const enCurso  = r.estado === "en_proceso" || (diffMin <= 0 && r.estado !== "realizada");
              const MODAL_ICON: Record<string, string> = {
                zoom: "Zoom", google_meet: "Meet", teams: "Teams",
                presencial: "Presencial", llamada: "Llamada", whatsapp_video: "WhatsApp",
              };
              return (
                <div
                  key={r.id}
                  onClick={() => navigate("/reuniones")}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition group
                    ${enCurso  ? "bg-blue-50 border-blue-200 hover:bg-blue-100" :
                      esPronto ? "bg-amber-50 border-amber-200 hover:bg-amber-100" :
                                 "bg-white/70 border-white/80 hover:bg-white"}`}
                >
                  <div className={`shrink-0 w-14 rounded-xl flex flex-col items-center justify-center py-2 border
                    ${enCurso  ? "bg-blue-600 border-blue-700 text-white" :
                      esPronto ? "bg-amber-500 border-amber-600 text-white" :
                                 "bg-zinc-100 border-zinc-200 text-zinc-700"}`}>
                    <span className="text-[11px] font-bold leading-none">{hora}</span>
                    {horaFin && <span className="text-[9px] mt-0.5 opacity-75">– {horaFin}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-zinc-800 truncate group-hover:text-brand transition">
                        {r.empresa}
                      </p>
                      {enCurso && (
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">EN CURSO</span>
                      )}
                      {esPronto && !enCurso && (
                        <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">EN {diffMin}min</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5 truncate">{r.titulo}</p>
                    {r.nombre_contacto && (
                      <p className="text-[11px] text-zinc-400 truncate">{r.nombre_contacto}</p>
                    )}
                    <span className="inline-block mt-1 text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                      {MODAL_ICON[r.modalidad] ?? r.modalidad}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-300 group-hover:text-brand mt-1 shrink-0 transition" />
                </div>
              );
            })}
          </div>
        ),
      },
    },
    {
      id:      "alertas",
      icon:    <AlertTriangle size={16} />,
      label:   "Alertas activas",
      sub:     data
        ? totalAlertas > 0
          ? `${totalAlertas} alerta${totalAlertas > 1 ? "s" : ""} requieren atención`
          : "Todo al día — sin alertas"
        : "Cargando...",
      badge:   totalAlertas || undefined,
      urgente: (data?.alertas.criticos ?? 0) > 0,
      action:  () => setSeleccionado("alertas"),
      detail: {
        titulo:      "Alertas",
        descripcion: "Leads que necesitan atención inmediata por tiempo en pipeline o inactividad.",
        cta:         "Ver en Inteligencia",
        onCta:       () => navigate("/inteligencia"),
        extra: (
          <div className="space-y-2 mt-3">
            {(data?.alertas.criticos ?? 0) > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-sm font-medium text-red-700">Críticos (+90 días)</span>
                </div>
                <span className="text-sm font-bold text-red-600">{data?.alertas.criticos}</span>
              </div>
            )}
            {(data?.alertas.urgentes ?? 0) > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">Urgentes (+45 días)</span>
                </div>
                <span className="text-sm font-bold text-amber-600">{data?.alertas.urgentes}</span>
              </div>
            )}
            {(data?.alertas.estancados ?? 0) > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-700">Sin actividad (+14 días)</span>
                </div>
                <span className="text-sm font-bold text-zinc-600">{data?.alertas.estancados}</span>
              </div>
            )}
            {totalAlertas === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-sm text-emerald-700">Sin alertas activas — buen trabajo</span>
              </div>
            )}
          </div>
        ),
      },
    },
    {
      id:    "acciones",
      icon:  <Plus size={16} />,
      label: "Acciones rápidas",
      sub:   "Registrar llamada, prospecto o reunión",
      action: () => setSeleccionado("acciones"),
      detail: {
        titulo:      "Acciones rápidas",
        descripcion: "Registra actividad o crea nuevos registros directamente desde aquí.",
        cta:         "Ir al Pipeline",
        onCta:       () => navigate("/pipeline"),
        extra: (
          <div className="space-y-2 mt-3">
            {[
              { icon: <Plus size={14} />,         label: "Nuevo prospecto",   sub: "Agregar lead a tu base",         action: () => setModalProspecto(true) },
              { icon: <Phone size={14} />,         label: "Registrar llamada", sub: "Añadir llamada a un lead",       action: () => navigate("/llamadas") },
              { icon: <CalendarDays size={14} />,  label: "Agendar reunión",   sub: "Programar reunión con un lead",  action: () => navigate("/reuniones") },
              { icon: <FileText size={14} />,      label: "Nueva propuesta",   sub: "Crear propuesta en el pipeline", action: () => navigate("/pipeline") },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/60 hover:bg-white border border-white/80 hover:border-brand/30 transition group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-100 group-hover:bg-brand/10 flex items-center justify-center text-zinc-500 group-hover:text-brand transition shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 group-hover:text-brand transition">{item.label}</p>
                  <p className="text-[11px] text-zinc-500">{item.sub}</p>
                </div>
                <ChevronRight size={14} className="text-zinc-300 group-hover:text-brand ml-auto shrink-0 transition" />
              </button>
            ))}
          </div>
        ),
      },
    },
    {
      id:    "pipeline",
      icon:  <TrendingUp size={16} />,
      label: "Estado del pipeline",
      sub:   "Ver propuestas activas y oportunidades",
      action: () => setSeleccionado("pipeline"),
      detail: {
        titulo:      "Pipeline de ventas",
        descripcion: "Vista rápida de tus propuestas activas, en negociación y cerradas.",
        cta:         "Abrir Pipeline",
        onCta:       () => navigate("/pipeline"),
        extra: (
          <div className="space-y-2 mt-3">
            {[
              { label: "Ver propuestas activas",    icon: <FileText size={13} />,   action: () => navigate("/pipeline") },
              { label: "Análisis de inteligencia",  icon: <TrendingUp size={13} />, action: () => navigate("/inteligencia") },
              { label: "Historial de llamadas",     icon: <Phone size={13} />,      action: () => navigate("/llamadas") },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/60 hover:bg-white border border-white/80 hover:border-brand/30 transition group text-left"
              >
                <span className="text-zinc-400 group-hover:text-brand transition">{item.icon}</span>
                <span className="text-sm text-zinc-700 group-hover:text-brand transition">{item.label}</span>
                <ChevronRight size={13} className="ml-auto text-zinc-300 group-hover:text-brand transition" />
              </button>
            ))}
          </div>
        ),
      },
    },
  ];

  const itemActivo = items.find(i => i.id === seleccionado) ?? items[0];

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Inicio</h1>
        <p className="text-sm text-zinc-500 mt-0.5 capitalize">{fechaStr}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

        {/* ── Panel izquierdo — bienvenida ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Welcome card */}
          <div className="relative overflow-hidden rounded-2xl p-6"
            style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fdf6ff 50%, #fff7ed 100%)" }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-brand/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-blue-400/10 blur-2xl" />
            <div className="relative">
              <p className="text-2xl font-bold text-zinc-900 leading-tight">
                {saludoTexto},<br />
                {nombre} {emoji}
              </p>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                Aquí tienes el resumen de tu jornada comercial.
              </p>

              {cargando ? (
                <div className="flex items-center gap-2 mt-4">
                  <Loader2 size={14} className="animate-spin text-zinc-400" />
                  <span className="text-xs text-zinc-400">Cargando datos...</span>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Leads",    value: data?.leads_calientes.length ?? 0, color: "text-brand" },
                    { label: "Alertas",  value: totalAlertas, color: totalAlertas > 0 ? "text-red-500" : "text-emerald-500" },
                    { label: "Reuniones", value: data?.reuniones_hoy.length ?? 0, color: "text-blue-500" },
                  ].map(s => (
                    <div key={s.label} className="bg-white/70 rounded-xl p-2.5 text-center border border-white">
                      <p className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wide">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-zinc-50">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tu jornada</p>
            </div>
            {items.map(item => {
              const activo = seleccionado === item.id;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-zinc-50 last:border-0 text-left transition-all
                    ${activo
                      ? "bg-gradient-to-r from-brand/5 to-brand/10 border-l-2 border-l-brand"
                      : "hover:bg-zinc-50"
                    }`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                    ${activo ? "bg-brand text-white" : "bg-zinc-100 text-zinc-500"}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${activo ? "text-brand" : "text-zinc-800"}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.sub}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                        ${item.urgente ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-600"}`}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight size={14} className={activo ? "text-brand" : "text-zinc-300"} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Panel derecho — detalle del ítem seleccionado ── */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl overflow-hidden border border-zinc-100 shadow-sm"
            style={{ background: "linear-gradient(160deg, #fafafa 0%, #f5f7ff 100%)" }}>

            {/* Header del detalle */}
            <div className="px-6 py-5 border-b border-zinc-100/80">
              <p className="text-lg font-bold text-zinc-900">{itemActivo.detail.titulo}</p>
              <p className="text-sm text-zinc-500 mt-1">{itemActivo.detail.descripcion}</p>
            </div>

            {/* Contenido */}
            <div className="px-6 py-4 min-h-[320px]">
              {cargando ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={20} className="animate-spin text-zinc-300" />
                </div>
              ) : (
                itemActivo.detail.extra
              )}
            </div>

            {/* CTA */}
            <div className="px-6 py-4 border-t border-zinc-100/80">
              <button
                onClick={itemActivo.detail.onCta}
                className="flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand/80 transition group"
              >
                {itemActivo.detail.cta}
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Modal nuevo prospecto ── */}
      {modalProspecto && (
        <ProspectoForm
          onCerrar={() => setModalProspecto(false)}
          onGuardado={() => {
            setModalProspecto(false);
            getResumenInicio().then(setData).catch(console.error);
          }}
        />
      )}

      {/* ── Modal ficha prospecto ── */}
      {detalleProspecto && (
        <ProspectoDetalle
          prospecto={detalleProspecto}
          onCerrar={() => setDetalleProspecto(null)}
          onActualizado={async (id) => {
            const p = await getProspecto(id);
            setDetalleProspecto(p);
            getResumenInicio().then(setData).catch(console.error);
          }}
        />
      )}
    </div>
  );
}
