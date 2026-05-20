// client/src/components/layout/lSidebar.tsx

import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Phone,
  CalendarDays, DollarSign, FileText, User, BarChart2, X, Settings, CheckSquare, Kanban, MessageSquare, TrendingUp,
} from "lucide-react";
import { getResumenTareas } from "../../services/tareas.api";
import { getScoresLeads } from "../../services/prospectos.api";

const navegacion = [
  { label: "Dashboard",      to: "/",               icon: LayoutDashboard },
  { label: "Llamadas",       to: "/llamadas",       icon: Phone },
  { label: "Reuniones",      to: "/reuniones",      icon: CalendarDays },
  { label: "Finanzas",       to: "/finanzas",       icon: DollarSign },
  { label: "Brochures",      to: "/brochures",      icon: FileText },
  { label: "Métricas",       to: "/metricas",       icon: BarChart2 },
  { label: "Inteligencia",   to: "/inteligencia",   icon: TrendingUp },
  { label: "Plantillas",     to: "/plantillas",     icon: MessageSquare },
];

const navegacionFinal = [
  { label: "Mi perfil",      to: "/perfil",         icon: User },
  { label: "Configuración",  to: "/configuracion",  icon: Settings },
];

interface Props {
  abierto:  boolean;
  onCerrar: () => void;
}

export function lSidebar({ abierto, onCerrar }: Props) {
  const [tareasUrgentes, setTareasUrgentes] = useState(0);
  const [leadsCalientes, setLeadsCalientes] = useState(0);

  useEffect(() => {
    getResumenTareas()
      .then(r => setTareasUrgentes(r.vencidas + r.hoy))
      .catch(() => {});
    getScoresLeads()
      .then(s => setLeadsCalientes(s.filter(l => l.nivel === "caliente").length))
      .catch(() => {});
  }, []);

  function NavItem({ label, to, icon: Icon, badge, badgeColor = "bg-red-500" }: {
    label: string; to: string; icon: any; badge?: number; badgeColor?: string;
  }) {
    return (
      <NavLink
        to={to}
        end={to === "/"}
        onClick={onCerrar}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${
            isActive
              ? "bg-indigo-100/15 text-zinc-100 font-medium border border-indigo-500/20"
              : "text-slate-200 hover:bg-white/[0.09] hover:text-slate-100 border border-transparent"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon size={16} className={isActive ? "text-indigo-400" : ""} />
            <span className="flex-1">{label}</span>
            {badge != null && badge > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${badgeColor} text-white font-bold leading-none`}>
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  }

  return (
    <>
      {/* ── Overlay oscuro — solo en móvil/tablet cuando el drawer está abierto ── */}
      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onCerrar}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col
          bg-zinc-950 border-r border-white/[0.06]
          transform transition-transform duration-300 ease-in-out
          ${abierto ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:w-56 lg:translate-x-0 lg:z-auto lg:shrink-0
        `}
      >
        {/* Logo + botón cerrar en móvil */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg
                            flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.4)]">
              <span className="text-zinc-100 text-xs font-bold">Z</span>
            </div>
            <span className="font-semibold text-slate-100 text-xs tracking-tight">CRM Zincel</span>
          </div>

          {/* Botón X solo visible en móvil/tablet */}
          <button
            onClick={onCerrar}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/10 rounded-lg transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {/* Prospectos + Pipeline con badge de leads calientes */}
          <NavItem label="Prospectos" to="/prospectos" icon={Users}  badge={leadsCalientes} badgeColor="bg-orange-500" />
          <NavItem label="Pipeline"   to="/pipeline"   icon={Kanban} badge={leadsCalientes} badgeColor="bg-orange-500" />

          {navegacion.map(({ label, to, icon }) => (
            <NavItem key={to} label={label} to={to} icon={icon} />
          ))}

          {/* Tareas con badge */}
          <NavItem label="Tareas" to="/tareas" icon={CheckSquare} badge={tareasUrgentes} />

          {/* Separador */}
          <div className="my-2 border-t border-white/[0.05]" />

          {navegacionFinal.map(({ label, to, icon }) => (
            <NavItem key={to} label={label} to={to} icon={icon} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/[0.05]">
          <p className="text-[10px] text-slate-600 text-center tracking-widest uppercase">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
