// client/src/components/layout/lSidebar.tsx

import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Phone,
  CalendarDays, DollarSign, FileText, User, BarChart2, X, PieChart, Settings, CheckSquare, Kanban, MessageSquare, TrendingUp, Target, Flag,
} from "lucide-react";
import { getResumenTareas } from "../../services/tareas.api";
import { getScoresLeads } from "../../services/prospectos.api";

const navegacion = [
  { label: "Análisis",      to: "/",               icon: PieChart },
  { label: "Objetivos",     to: "/objetivos",      icon: Target },
  { label: "OKR",           to: "/okr",            icon: Flag },
  { label: "Llamadas",      to: "/llamadas",        icon: Phone },
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
          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 ${
            isActive
              ? "bg-amber-50 text-amber-800 font-semibold"
              : "text-zinc-700 hover:bg-white/40 hover:text-zinc-900"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon size={16} className={isActive ? "text-amber-600" : "text-zinc-600"} />
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
      {/* Overlay móvil */}
      {abierto && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={onCerrar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col
          bg-white/20 backdrop-blur-2xl border-r border-white/20
          transform transition-transform duration-300 ease-in-out
          ${abierto ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:w-56 lg:translate-x-0 lg:z-auto lg:shrink-0
        `}
      >
              {/* ───────────────────────── */}
      {/* BLUR BOTTOM LEFT */}
      {/* ───────────────────────── */}
      <div className="pointer-events-none absolute -bottom-32 right-0 h-[420px] w-[820px] rounded-full  blur-3xl" />

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-zinc-900 rounded-lg border border-zinc-800
                            flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">Z</span>
            </div>
            <span className="font-semibold text-zinc-900 text-xs tracking-tight">CRM Zincel</span>
          </div>

          <button
            onClick={onCerrar}
            className="lg:hidden p-1.5 text-slate-900 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavItem label="Inicio"      to="/inicio"     icon={LayoutDashboard} />
          <NavItem label="Prospectos" to="/prospectos" icon={Users}  badge={leadsCalientes} badgeColor="bg-red-500" />
          <NavItem label="Pipeline"   to="/pipeline"   icon={Kanban} badge={leadsCalientes} badgeColor="bg-red-500" />

          {navegacion.map(({ label, to, icon }) => (
            <NavItem key={to} label={label} to={to} icon={icon} />
          ))}

          <NavItem label="Tareas" to="/tareas" icon={CheckSquare} badge={tareasUrgentes} />

          <div className="my-2 border-t border-gray-100" />

          {navegacionFinal.map(({ label, to, icon }) => (
            <NavItem key={to} label={label} to={to} icon={icon} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-[10px] text-zinc-600 text-center tracking-widest uppercase">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
