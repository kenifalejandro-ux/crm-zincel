/** client/src/pages/InicioPage.tsx */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, Plus, Phone, FileText, CalendarDays,
  AlertTriangle, Clock, Zap, CheckCircle, Loader2,
  Sun, Sunset, Moon, Users, Target,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getResumenInicio } from "../services/inicio.api";
import type { ResumenInicio, LeadCaliente, ReunionHoy } from "../services/inicio.api";
import { COLORS } from "../lib/tokens";
import { ProspectoForm } from "../components/prospectos/ProspectoForm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function saludo(): { texto: string; icon: React.ReactNode } {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { texto: "Buenos días",   icon: <Sun    size={20} className="text-amber-400" /> };
  if (h >= 12 && h < 19) return { texto: "Buenas tardes", icon: <Sunset size={20} className="text-orange-400" /> };
  return                         { texto: "Buenas noches", icon: <Moon   size={20} className="text-indigo-400" /> };
}

function fmtHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

const ETAPA_LABEL: Record<string, string> = {
  nuevo:             "Nuevo",
  contactado:        "Contactado",
  interesado:        "Interesado",
  propuesta_enviada: "Propuesta enviada",
  negociacion:       "Negociación",
};

// ─── Componentes base ─────────────────────────────────────────────────────────

function SectionCard({ title, icon, children, badge }: {
  title:    string;
  icon:     React.ReactNode;
  children: React.ReactNode;
  badge?:   number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-50">
        {icon}
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{badge}</span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function DrillRow({ icon, label, sub, badge, badgeCls, onClick, urgente }: {
  icon:      React.ReactNode;
  label:     string;
  sub?:      string;
  badge?:    string | number;
  badgeCls?: string;
  onClick?:  () => void;
  urgente?:  boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-zinc-50 last:border-0 text-left transition-colors
        ${onClick ? "hover:bg-zinc-50 cursor-pointer" : "cursor-default"}
        ${urgente ? "bg-red-50/40 hover:bg-red-50" : ""}`}
    >
      <div className="shrink-0 text-zinc-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${urgente ? "text-red-700" : "text-zinc-800"}`}>{label}</p>
        {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
      </div>
      {badge !== undefined && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeCls ?? "bg-zinc-100 text-zinc-600"}`}>
          {badge}
        </span>
      )}
      {onClick && <ChevronRight size={14} className="text-zinc-300 shrink-0" />}
    </button>
  );
}

function ObjetivoRow({ label, real, meta, icon }: { label: string; real: number; meta: number; icon: React.ReactNode }) {
  const pct      = meta > 0 ? Math.min(100, Math.round((real / meta) * 100)) : 0;
  const cumplido = pct >= 100;
  return (
    <div className="px-4 py-3 border-b border-zinc-50 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-sm text-zinc-700">
          <span className="text-zinc-400">{icon}</span>
          {label}
        </div>
        <span className={`text-xs font-bold ${cumplido ? "text-emerald-600" : "text-zinc-600"}`}>
          {real} / {meta}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: cumplido ? "#10b981" : COLORS.primary }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InicioPage() {
  const navigate  = useNavigate();
  const { usuario } = useAuth() as any;
  const nombre    = usuario?.nombre?.split(" ")[0] ?? "Kenif";

  const [data,     setData]     = useState<ResumenInicio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modalProspecto, setModalProspecto] = useState(false);

  useEffect(() => {
    getResumenInicio()
      .then(setData)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const hoy    = new Date();
  const { texto: saludoTexto, icon: saludoIcon } = saludo();
  const fechaStr = `${DIAS[hoy.getDay()]} ${hoy.getDate()} de ${MESES[hoy.getMonth()]}`;

  // Resumen header
  const totalTareas   = (data?.tareas.pendientes_hoy ?? 0) + (data?.tareas.vencidas ?? 0);
  const reunionesHoy  = data?.reuniones_hoy.length ?? 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">

      {/* ── Header personalizado ── */}
      <div className="bg-zinc-900 rounded-2xl px-6 py-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {saludoIcon}
            <h1 className="text-xl font-bold text-white">{saludoTexto}, {nombre}</h1>
          </div>
          <p className="text-sm text-zinc-400 capitalize">{fechaStr}</p>
          {!cargando && (
            <p className="text-xs text-zinc-500 mt-2">
              {totalTareas > 0
                ? <span className="text-amber-400 font-medium">{totalTareas} tarea{totalTareas > 1 ? "s" : ""} pendiente{totalTareas > 1 ? "s" : ""}</span>
                : <span className="text-emerald-400 font-medium">Sin tareas pendientes</span>
              }
              {" · "}
              {reunionesHoy > 0
                ? <span className="text-blue-400 font-medium">{reunionesHoy} reunión{reunionesHoy > 1 ? "es" : ""} hoy</span>
                : <span className="text-zinc-500">Sin reuniones hoy</span>
              }
            </p>
          )}
        </div>
        <div className="text-3xl leading-none select-none">
          {hoy.getHours() >= 5 && hoy.getHours() < 12 ? "☀️" : hoy.getHours() < 19 ? "🌤️" : "🌙"}
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          {/* ── Acciones rápidas ── */}
          <SectionCard title="Acciones rápidas" icon={<Zap size={13} className="text-brand" />}>
            <DrillRow
              icon={<Plus size={16} />}
              label="Nuevo prospecto"
              sub="Registrar un lead en tu base"
              onClick={() => setModalProspecto(true)}
            />
            <DrillRow
              icon={<Phone size={16} />}
              label="Registrar llamada"
              sub="Añadir llamada a un lead"
              onClick={() => navigate("/llamadas")}
            />
            <DrillRow
              icon={<FileText size={16} />}
              label="Nueva propuesta"
              sub="Crear propuesta en el pipeline"
              onClick={() => navigate("/pipeline")}
            />
            <DrillRow
              icon={<CalendarDays size={16} />}
              label="Agendar reunión"
              sub="Programar reunión con un lead"
              onClick={() => navigate("/reuniones")}
            />
          </SectionCard>

          {/* ── Objetivos del día ── */}
          {data && (
            <SectionCard title="Objetivos del día" icon={<Target size={13} className="text-emerald-500" />}>
              <ObjetivoRow label="Llamadas"  real={0} meta={5}  icon={<Phone size={13} />} />
              <ObjetivoRow label="Reuniones" real={reunionesHoy} meta={2} icon={<CalendarDays size={13} />} />
              <DrillRow
                icon={<CheckCircle size={16} />}
                label="Ver objetivos completos"
                onClick={() => navigate("/inteligencia")}
              />
            </SectionCard>
          )}

          {/* ── Reuniones hoy ── */}
          {data && (
            <SectionCard
              title="Reuniones de hoy"
              icon={<CalendarDays size={13} className="text-blue-500" />}
              badge={data.reuniones_hoy.length}
            >
              {data.reuniones_hoy.length === 0 ? (
                <DrillRow icon={<CalendarDays size={16} />} label="Sin reuniones programadas hoy" sub="Puedes agendar una nueva" onClick={() => navigate("/reuniones")} />
              ) : (
                data.reuniones_hoy.map((r: ReunionHoy) => (
                  <DrillRow
                    key={r.id}
                    icon={<CalendarDays size={16} />}
                    label={r.empresa}
                    sub={`${fmtHora(r.fecha_hora)} · ${r.titulo}`}
                    onClick={() => navigate("/reuniones")}
                  />
                ))
              )}
            </SectionCard>
          )}

          {/* ── Alertas ── */}
          {data && (
            <SectionCard
              title="Alertas"
              icon={<AlertTriangle size={13} className="text-amber-500" />}
              badge={(data.alertas.estancados + data.alertas.criticos + data.alertas.urgentes) || undefined}
            >
              {data.alertas.estancados === 0 && data.alertas.criticos === 0 && data.alertas.urgentes === 0 ? (
                <DrillRow icon={<CheckCircle size={16} />} label="Todo al día — sin alertas activas" />
              ) : (
                <>
                  {data.alertas.criticos > 0 && (
                    <DrillRow
                      icon={<AlertTriangle size={16} />}
                      label={`${data.alertas.criticos} lead${data.alertas.criticos > 1 ? "s" : ""} crítico${data.alertas.criticos > 1 ? "s" : ""} (+90 días en pipeline)`}
                      badge={data.alertas.criticos}
                      badgeCls="bg-red-100 text-red-700"
                      onClick={() => navigate("/inteligencia")}
                      urgente
                    />
                  )}
                  {data.alertas.urgentes > 0 && (
                    <DrillRow
                      icon={<Clock size={16} />}
                      label={`${data.alertas.urgentes} lead${data.alertas.urgentes > 1 ? "s" : ""} urgente${data.alertas.urgentes > 1 ? "s" : ""} (+45 días en pipeline)`}
                      badge={data.alertas.urgentes}
                      badgeCls="bg-amber-100 text-amber-700"
                      onClick={() => navigate("/inteligencia")}
                    />
                  )}
                  {data.alertas.estancados > 0 && (
                    <DrillRow
                      icon={<Users size={16} />}
                      label={`${data.alertas.estancados} lead${data.alertas.estancados > 1 ? "s" : ""} sin actividad (+14 días)`}
                      badge={data.alertas.estancados}
                      badgeCls="bg-zinc-100 text-zinc-600"
                      onClick={() => navigate("/inteligencia")}
                    />
                  )}
                </>
              )}
            </SectionCard>
          )}

          {/* ── Leads calientes ── */}
          {data && data.leads_calientes.length > 0 && (
            <SectionCard title="Leads prioritarios" icon={<Zap size={13} className="text-brand" />}>
              {data.leads_calientes.map((lead: LeadCaliente) => (
                <DrillRow
                  key={lead.id}
                  icon={<Users size={16} />}
                  label={lead.empresa}
                  sub={`${ETAPA_LABEL[lead.etapa_pipeline] ?? lead.etapa_pipeline}${lead.ciudad ? ` · ${lead.ciudad}` : ""}${lead.valor_pipeline > 0 ? ` · S/ ${lead.valor_pipeline.toLocaleString("es-PE", { maximumFractionDigits: 0 })}` : ""}`}
                  badge={lead.telefono ? undefined : undefined}
                  onClick={() => navigate("/prospectos")}
                />
              ))}
              <DrillRow
                icon={<ChevronRight size={16} />}
                label="Ver todos los prospectos"
                onClick={() => navigate("/prospectos")}
              />
            </SectionCard>
          )}
        </>
      )}

      {/* ── Modal nuevo prospecto ── */}
      {modalProspecto && (
        <ProspectoForm
          onCerrar={() => setModalProspecto(false)}
          onGuardado={() => { setModalProspecto(false); getResumenInicio().then(setData).catch(console.error); }}
        />
      )}
    </div>
  );
}
