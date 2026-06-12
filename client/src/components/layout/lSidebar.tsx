// client/src/components/layout/lSidebar.tsx

import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useSearchParams } from "react-router-dom";
import {
  House, LayoutDashboard, Users, Phone,
  CalendarDays, DollarSign, FileText, User, BarChart2, X, PieChart, Settings, CheckSquare, Kanban, MessageSquare, TrendingUp, Target, Flag, Clock, Trophy, LineChart, ChevronDown, Building2,
} from "lucide-react";
import { getResumenTareas } from "../../services/tareas.api";
import { getScoresLeads } from "../../services/prospectos.api";
import { getEmpresasMetricas } from "../../services/metricas.api";

type ItemNav = {
  label: string;
  to?: string;
  icon: any;
  badge?: "leads" | "tareas";
  campanas?: boolean;
};

const SECCIONES: { titulo: string; icon: any; items: ItemNav[] }[] = [
  {
    titulo: "Mi día",
    icon: House,
    items: [
      { label: "Inicio",     to: "/inicio",     icon: LayoutDashboard },
      { label: "Mi Jornada", to: "/jornada",    icon: Clock },
      { label: "Prospectos", to: "/prospectos", icon: Users,  badge: "leads" },
      { label: "Pipeline",   to: "/pipeline",   icon: Kanban, badge: "leads" },
      { label: "Llamadas",   to: "/llamadas",   icon: Phone },
      { label: "Reuniones",  to: "/reuniones",  icon: CalendarDays },
      { label: "Tareas",     to: "/tareas",     icon: CheckSquare, badge: "tareas" },
    ],
  },
  {
    titulo: "Marketing",
    icon: BarChart2,
    items: [
      { label: "Campañas",   icon: BarChart2, campanas: true },
      { label: "Plantillas", to: "/plantillas", icon: MessageSquare },
      { label: "Brochures",  to: "/brochures",  icon: FileText },
    ],
  },
  {
    titulo: "Medición",
    icon: TrendingUp,
    items: [
      { label: "Inteligencia", to: "/inteligencia", icon: TrendingUp },
      { label: "Análisis",     to: "/analisis",     icon: PieChart },
      { label: "Resultados",   to: "/resultados",   icon: Trophy },
      { label: "Objetivos",    to: "/objetivos",    icon: Target },
      { label: "OKR",          to: "/okr",          icon: Flag },
    ],
  },
  {
    titulo: "Administración",
    icon: Settings,
    items: [
      { label: "Finanzas",      to: "/finanzas",            icon: DollarSign },
      { label: "Análisis Fin.", to: "/analisis-financiero", icon: LineChart },
      { label: "Configuración", to: "/configuracion",       icon: Settings },
      { label: "Mi perfil",     to: "/perfil",              icon: User },
    ],
  },
];

const CAMPANIAS_GRUPOS = [
  {
    label: "Campañas",
    items: [
      { tab: "todas",  label: "Todas",      dot: "bg-zinc-400" },
      { tab: "meta",   label: "Meta Ads",   dot: "bg-blue-500" },
      { tab: "google", label: "Google Ads", dot: "bg-red-500"  },
      { tab: "tiktok", label: "TikTok Ads", dot: "bg-pink-500" },
    ],
  },
  {
    label: "Análisis",
    items: [
      { tab: "comparativa",  label: "Comparativa",  dot: "bg-emerald-500" },
      { tab: "rentabilidad", label: "ROAS",         dot: "bg-blue-500"   },
      { tab: "roi",          label: "ROI",          dot: "bg-green-500"  },
      { tab: "proyeccion",   label: "Proyección",   dot: "bg-violet-500"  },
      { tab: "benchmarks",   label: "Benchmarks",   dot: "bg-orange-500"  },
    ],
  },
  {
    label: "Estrategia",
    items: [
      { tab: "optimizador", label: "Optimizador",    dot: "bg-violet-500" },
      { tab: "formatos",    label: "Formatos",       dot: "bg-green-500"  },
      { tab: "ciclo",       label: "Ciclo de Venta", dot: "bg-cyan-500"  },
    ],
  },
  {
    label: "Orgánico",
    items: [
      { tab: "organico",     label: "Contenido",    dot: "bg-fuchsia-500" },
      { tab: "competidores", label: "Competidores", dot: "bg-rose-500"    },
    ],
  },
];

function GrupoNav({ grupo, tabActiva, empresaActiva, enMetricas, onCerrar, defaultOpen }: {
  grupo: typeof CAMPANIAS_GRUPOS[0];
  tabActiva: string;
  empresaActiva: string;
  enMetricas: boolean;
  onCerrar: () => void;
  defaultOpen: boolean;
}) {
  const [abierto, setAbierto] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center gap-1.5 px-1 py-1 rounded hover:bg-white/5 transition-all group"
      >
        <span className="flex-1 text-left text-xs font-normal text-zinc-500 group-hover:text-zinc-300">
          {grupo.label}
        </span>
        <ChevronDown
          size={11}
          className={`text-zinc-600 group-hover:text-zinc-400 transition-transform duration-150 ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <div className="mt-0.5">
          {grupo.items.map(item => {
            const isActive = enMetricas && tabActiva === item.tab;
            const href = `/metricas?tab=${item.tab}${empresaActiva ? `&empresa=${encodeURIComponent(empresaActiva)}` : ""}`;
            return (
              <Link
                key={item.tab}
                to={href}
                onClick={onCerrar}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] transition-all ${
                  isActive
                    ? "bg-brand/10 text-amber-400 font-semibold"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? item.dot : item.dot + " opacity-30"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CampañasNav({ onCerrar }: { onCerrar: () => void }) {
  const location    = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const enMetricas  = location.pathname === "/metricas";
  const tabActiva   = searchParams.get("tab") || "todas";
  const empresaActiva = searchParams.get("empresa") || "";
  const [abierto,    setAbierto]    = useState(enMetricas);
  const [empresas,   setEmpresas]   = useState<string[]>([]);

  useEffect(() => {
    if (enMetricas) setAbierto(true);
  }, [enMetricas]);

  useEffect(() => {
    getEmpresasMetricas().then(setEmpresas).catch(() => {});
  }, []);

  const cambiarEmpresa = (empresa: string) => {
    setSearchParams(prev => {
      if (empresa) prev.set("empresa", empresa);
      else prev.delete("empresa");
      return prev;
    }, { replace: true });
  };

  return (
    <div>
      <button
        onClick={() => setAbierto(v => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 ${
          enMetricas
            ? "bg-brand/10 text-amber-400 font-semibold"
            : "text-zinc-400 font-medium hover:bg-white/5 hover:text-zinc-200"
        }`}
      >
        <BarChart2 size={16} className={enMetricas ? "text-brand" : "text-zinc-500"} />
        <span className="flex-1 text-left">Campañas</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${abierto ? "rotate-180" : ""} opacity-40`}
        />
      </button>

      {abierto && (
        <div className="ml-3 mt-0.5 border-l border-zinc-700 pl-3 pb-1">

          <div className="flex items-center gap-1.5 py-2 pr-1">
            <Building2 size={12} className="text-zinc-600 shrink-0" />
            <select
              value={empresaActiva}
              onChange={e => cambiarEmpresa(e.target.value)}
              className="flex-1 text-[11px] text-zinc-400 bg-transparent focus:outline-none truncate cursor-pointer"
            >
              <option value="">Todas las empresas</option>
              {empresas.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-zinc-800 mb-1.5" />

          <div className="space-y-1">
            {CAMPANIAS_GRUPOS.map(grupo => {
              const grupoActivo = grupo.items.some(i => i.tab === tabActiva);
              return (
                <GrupoNav
                  key={grupo.label}
                  grupo={grupo}
                  tabActiva={tabActiva}
                  empresaActiva={empresaActiva}
                  enMetricas={enMetricas}
                  onCerrar={onCerrar}
                  defaultOpen={grupoActivo}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SeccionNav({ seccion, leadsCalientes, tareasUrgentes, onCerrar }: {
  seccion: { titulo: string; icon: any; items: ItemNav[] };
  leadsCalientes: number;
  tareasUrgentes: number;
  onCerrar: () => void;
}) {
  const location = useLocation();
  const contieneActiva = seccion.items.some(it =>
    (it.to && location.pathname === it.to) ||
    (it.campanas && location.pathname === "/metricas")
  );
  const [abierto, setAbierto] = useState(contieneActiva);
  const Icon = seccion.icon;

  return (
    <div>
      <button
        onClick={() => setAbierto(v => !v)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group ${abierto ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"}`}
      >
        <Icon size={14} className="text-brand" />
        <span className={`flex-1 text-left text-[13px] font-normal`}>
          {seccion.titulo}
        </span>
        <ChevronDown
          size={12}
          className={`text-zinc-600 group-hover:text-zinc-400 transition-transform duration-200 ${abierto ? "" : "-rotate-90"}`}
        />
      </button>

      {abierto && (
        <div className="mt-0.5 space-y-0.5">
          {seccion.items.map(item => {
            if (item.campanas) return <CampañasNav key="campanas" onCerrar={onCerrar} />;
            const Icon = item.icon;
            const badge = item.badge === "leads" ? leadsCalientes
                        : item.badge === "tareas" ? tareasUrgentes
                        : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to!}
                end
                onClick={onCerrar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                    isActive
                      ? "bg-brand/10 text-amber-400 font-semibold border border-brand/15"
                      : "text-zinc-400 font-medium hover:bg-white/5 hover:text-zinc-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} className={isActive ? "text-brand" : "text-zinc-600"} />
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-500 text-white font-bold leading-none">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  return (
    <>
      {abierto && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={onCerrar} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col
          bg-zinc-900 border-r border-zinc-800
          transform transition-transform duration-300 ease-in-out
          ${abierto ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:w-56 lg:translate-x-0 lg:z-auto lg:shrink-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-zinc-900 text-xs font-black tracking-tight">Z</span>
            </div>
            <span className="font-semibold text-zinc-100 text-xs tracking-tight">CRM Zincel</span>
          </div>
          <button onClick={onCerrar} className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-3 overflow-y-auto">
          {SECCIONES.map(seccion => (
            <SeccionNav
              key={seccion.titulo}
              seccion={seccion}
              leadsCalientes={leadsCalientes}
              tareasUrgentes={tareasUrgentes}
              onCerrar={onCerrar}
            />
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-700 text-center tracking-widest uppercase">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
