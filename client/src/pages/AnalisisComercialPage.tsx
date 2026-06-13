/** client/src/pages/AnalisisComercialPage.tsx */

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Globe, Megaphone, Palette, Box, Database,
  AlertTriangle, Building2, WifiOff, TrendingUp,
  ChevronDown, ChevronUp, Search, LayoutGrid, BarChart3,
  Wifi, Clock, ShieldAlert, Info, CheckCircle2,
} from "lucide-react";
import { CARD_CLASS, BADGE_BASE, PANEL_BASE } from "../lib/tokens";
import api from "../services/api";
import { ProspectoDetalle } from "../components/prospectos/ProspectoDetalle";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Stats {
  total: number; alta: number; media: number; baja: number;
  sin_web: number; ignorables: number;
  excluidos: { no_interesados: number; perdidas: number; inactivos: number };
  sin_web_detalle: { total_bd: number; no_interesados: number; perdidas: number; inactivos: number };
}

interface Lead {
  id: string; empresa: string; nombre_contacto: string | null;
  telefono: string | null; ciudad: string | null;
  sector: string | null; perfil_empresa: string | null;
  cantidad_trabajadores: number | null; tamano_empresa: string | null;
  web_activa: boolean; estado_web: string | null;
  redes_sociales: string[] | null;
  prioridad: string; estado_lead: string;
  score: number;
}

interface LeadConServicios extends Lead {
  servicios: string[];
}

interface PorWeb {
  sin_web: Lead[]; vencida: Lead[]; por_actualizar: Lead[];
  en_mantenimiento: Lead[]; sin_informacion: Lead[]; actualizada: Lead[];
}

interface AnalisisData {
  stats: Stats;
  desarrollo_web: Lead[]; marketing_digital: Lead[];
  branding: Lead[]; modelamiento_3d: Lead[];
  erp_crm: Lead[]; ignorables: Lead[];
  por_web: PorWeb;
}

// ── Constantes de servicios ────────────────────────────────────────────────────

const SERVICIOS_CONFIG = {
  desarrollo_web:    { label: "Web",      color: "bg-blue-100 text-blue-700",    icon: <Globe size={10}/> },
  marketing_digital: { label: "Marketing", color: "bg-violet-100 text-violet-700", icon: <Megaphone size={10}/> },
  branding:          { label: "Branding",  color: "bg-pink-100 text-pink-700",    icon: <Palette size={10}/> },
  modelamiento_3d:   { label: "3D",        color: "bg-orange-100 text-orange-700", icon: <Box size={10}/> },
  erp_crm:           { label: "ERP/CRM",   color: "bg-emerald-100 text-emerald-700", icon: <Database size={10}/> },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

const SECTOR_LABEL: Record<string, string> = {
  construccion: "Construcción", inmobiliaria: "Inmobiliaria",
  manufactura_industria: "Manufactura", agroindustria: "Agroindustria",
  mineria_energia: "Minería/Energía", salud: "Salud",
  servicios_profesionales: "Serv. Prof.", comercio_mayorista: "Com. Mayorista",
  arquitectura_ingenieria: "Arquitectura/Ing.", tecnologia: "Tecnología",
  transporte_logistica: "Transporte/Log.", seguridad: "Seguridad",
  educacion: "Educación", comercio_retail: "Com. Retail",
  gastronomia_turismo: "Gastronomía", otro: "Otro",
};

const TAMANO_LABEL: Record<string, string> = {
  "1_10": "1–10", "11_50": "11–50", "51_200": "51–200",
  "201_500": "201–500", "mas_500": "500+",
};

const ESTADO_LEAD_CFG: Record<string, { label: string; color: string }> = {
  nuevo:                { label: "Nuevo",           color: "bg-zinc-100 text-zinc-600" },
  por_gestionar:        { label: "Por gestionar",   color: "bg-zinc-100 text-zinc-600" },
  interesado:           { label: "Interesado",      color: "bg-emerald-100 text-emerald-700" },
  solicita_informacion: { label: "Solicita info",   color: "bg-blue-100 text-blue-700" },
  volver_a_llamar:      { label: "Volver a llamar", color: "bg-yellow-100 text-yellow-700" },
  no_contesta:          { label: "No contesta",     color: "bg-zinc-100 text-zinc-500" },
  prometio_llamar:      { label: "Prometió llamar", color: "bg-yellow-100 text-yellow-700" },
  ocupado_en_reunion:   { label: "Ocupado",         color: "bg-zinc-100 text-zinc-500" },
  no_interesado:        { label: "No interesado",   color: "bg-red-100 text-red-600" },
  buzon_de_voz:         { label: "Buzón de voz",    color: "bg-zinc-100 text-zinc-400" },
};

function PrioridadBadge({ p, score }: { p: string; score: number }) {
  const cfg = p === "alta" ? "bg-red-100 text-red-700"
    : p === "media" ? "bg-yellow-100 text-yellow-700"
    : "bg-zinc-100 text-zinc-500";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg}`}>
      {p.toUpperCase()} <span className="opacity-60">· {score}</span>
    </span>
  );
}

function ServiciosChips({ servicios }: { servicios: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {servicios.map(s => {
        const cfg = SERVICIOS_CONFIG[s as keyof typeof SERVICIOS_CONFIG];
        if (!cfg) return null;
        return (
          <span key={s} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
        );
      })}
    </div>
  );
}

function EstadoWebCell({ activa, estado }: { activa: boolean; estado: string | null }) {
  if (!activa) return <span className="text-red-500 font-semibold text-xs">Sin web</span>;
  const map: Record<string, { label: string; color: string }> = {
    actualizada:     { label: "Actualizada",    color: "text-emerald-600" },
    vencida:         { label: "Vencida",        color: "text-red-500" },
    por_actualizar:  { label: "Por actualizar", color: "text-yellow-600" },
    en_mantenimiento:{ label: "En mantenimiento",color: "text-blue-500" },
    sin_informacion: { label: "Sin info",       color: "text-zinc-400" },
  };
  const cfg = map[estado ?? ""] ?? { label: estado ?? "Activa", color: "text-blue-500" };
  return <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>;
}

// ── Tooltip Sin web ───────────────────────────────────────────────────────────

function SinWebCard({ n, detalle, excTot, activo = false }: {
  n: number;
  detalle: { total_bd: number; no_interesados: number; perdidas: number; inactivos: number };
  excTot: number;
  activo?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative flex items-center gap-3 cursor-default"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="text-blue-600"><WifiOff size={16}/></span>
      <div>
        <p className="text-xl font-bold text-zinc-200">{n}</p>
        <p className={`text-[10px] leading-tight ${activo ? "text-blue-500 font-semibold" : "text-zinc-400"}`}>Sin web</p>
      </div>
      {visible && (
        <div className="absolute top-full left-0 mt-3 z-[9999] w-64 pointer-events-none">
          <div className="bg-zinc-900 text-white rounded-xl p-3 shadow-2xl text-[11px] space-y-1.5 border border-zinc-700">
            <p className="font-bold text-zinc-200 mb-2">¿Por qué {n} y no {detalle.total_bd}?</p>
            <div className="flex justify-between text-zinc-400">
              <span>Total sin web en BD</span>
              <span className="font-semibold text-white">{detalle.total_bd}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>No interesados</span>
              <span className="text-red-400">− {detalle.no_interesados}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Venta perdida</span>
              <span className="text-red-400">− {detalle.perdidas}</span>
            </div>
            {detalle.inactivos > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Inactivos</span>
                <span className="text-red-400">− {detalle.inactivos}</span>
              </div>
            )}
            <div className="border-t border-zinc-700 pt-1.5 flex justify-between font-bold">
              <span className="text-zinc-300">Prospectables</span>
              <span className="text-yellow-400">{detalle.total_bd - excTot}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tabla común ───────────────────────────────────────────────────────────────

function FilaLead({ l, mostrarServicios, onClick }: { l: LeadConServicios; mostrarServicios?: boolean; onClick?: (l: LeadConServicios) => void }) {
  const estadoLead = ESTADO_LEAD_CFG[l.estado_lead] ?? { label: l.estado_lead, color: "bg-zinc-100 text-zinc-500" };
  return (
    <tr onClick={() => onClick?.(l)} className={`border-b border-white/5 transition-colors ${onClick ? "cursor-pointer hover:bg-zinc-800" : "hover:bg-zinc-800/40"}`}>
      <td className="px-3 py-2.5">
        <p className="font-semibold text-zinc-200 text-xs leading-tight">{l.empresa}</p>
        {l.nombre_contacto && <p className="text-[10px] text-zinc-400 mt-0.5">{l.nombre_contacto}</p>}
      </td>
      <td className="px-3 py-2.5">
        <p className="text-xs text-zinc-300">{SECTOR_LABEL[l.sector ?? ""] ?? l.sector ?? "—"}</p>
        {l.perfil_empresa && <p className="text-[10px] text-zinc-400 capitalize">{l.perfil_empresa.replace(/_/g, " ")}</p>}
      </td>
      <td className="px-3 py-2.5 text-center text-xs">
        {l.cantidad_trabajadores != null
          ? <span className="font-medium text-zinc-300">{l.cantidad_trabajadores}</span>
          : l.tamano_empresa
          ? <span className="text-zinc-400">{TAMANO_LABEL[l.tamano_empresa] ?? l.tamano_empresa}</span>
          : <span className="text-zinc-300">—</span>}
      </td>
      <td className="px-3 py-2.5"><PrioridadBadge p={l.prioridad} score={l.score} /></td>
      {mostrarServicios && (
        <td className="px-3 py-2.5"><ServiciosChips servicios={l.servicios} /></td>
      )}
      <td className="px-3 py-2.5"><EstadoWebCell activa={l.web_activa} estado={l.estado_web} /></td>
      <td className="px-3 py-2.5">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${estadoLead.color}`}>
          {estadoLead.label}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-zinc-400">{l.ciudad ?? "—"}</td>
    </tr>
  );
}

function TablaLeads({ leads, busqueda, mostrarServicios, onSelect }: { leads: LeadConServicios[]; busqueda: string; mostrarServicios?: boolean; onSelect?: (l: LeadConServicios) => void }) {
  const filtrados = useMemo(() => {
    if (!busqueda) return leads;
    const q = busqueda.toLowerCase();
    return leads.filter(l =>
      l.empresa.toLowerCase().includes(q) ||
      (l.ciudad ?? "").toLowerCase().includes(q) ||
      (l.sector ?? "").toLowerCase().includes(q)
    );
  }, [leads, busqueda]);

  if (!filtrados.length)
    return <p className="text-xs text-zinc-400 text-center py-6">Sin resultados</p>;

  const headers = ["Empresa", "Sector / Perfil", "Trabajadores", "Prioridad",
    ...(mostrarServicios ? ["Servicios sugeridos"] : []),
    "Estado web", "Estado lead", "Ciudad"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/8">
            {headers.map(h => (
              <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-zinc-100 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtrados.map(l => <FilaLead key={l.id} l={l} mostrarServicios={mostrarServicios} onClick={onSelect} />)}
        </tbody>
      </table>
    </div>
  );
}

// ── Sección colapsable genérica ───────────────────────────────────────────────

interface SeccionProps {
  titulo: string; descripcion: string; leads: LeadConServicios[];
  icon: React.ReactNode; color: string; bgColor: string;
  badgeColor?: string; mostrarServicios?: boolean;
  defaultOpen?: boolean; onSelect?: (l: LeadConServicios) => void;
}

function Seccion({ titulo, descripcion, leads, icon, color, bgColor, badgeColor, mostrarServicios, defaultOpen = false, onSelect }: SeccionProps) {
  const [abierto, setAbierto] = useState(defaultOpen);
  const [busqueda, setBusqueda] = useState("");
  const alta  = leads.filter(l => l.prioridad === "alta").length;
  const media = leads.filter(l => l.prioridad === "media").length;

  return (
    <div className={`${CARD_CLASS} p-0 overflow-hidden`}>
      <button
        onClick={() => setAbierto(a => !a)}
        className="w-full flex items-center gap-3 p-5 hover:bg-zinc-800/40 transition-colors text-left"
      >
        <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
          <span className={color}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-zinc-200 text-sm">{titulo}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor ?? `${bgColor} ${color}`}`}>
              {leads.length} empresas
            </span>
            {alta > 0 && <span className={`${BADGE_BASE} text-[10px] font-bold px-2 py-0.5 text-red-600`}>{alta} alta</span>}
            {media > 0 && <span className={`${BADGE_BASE} text-[10px] font-bold px-2 py-0.5 text-yellow-700`}>{media} media</span>}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">{descripcion}</p>
        </div>
        <span className="text-zinc-400 shrink-0">{abierto ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</span>
      </button>

      {abierto && (
        <div className="border-t border-white/8">
          <div className="px-5 py-3 flex items-center gap-2 border-b border-white/5">
            <Search size={13} className="text-zinc-400"/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar empresa, ciudad, sector..."
              className="flex-1 text-xs outline-none bg-transparent text-zinc-400 placeholder:text-zinc-300"/>
          </div>
          <TablaLeads leads={leads} busqueda={busqueda} mostrarServicios={mostrarServicios} onSelect={onSelect} />
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AnalisisComercialPage() {
  const navigate = useNavigate();
  const [data, setData]       = useState<AnalisisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [vista, setVista]               = useState<"servicio" | "prioridad" | "web">("servicio");
  const [mostrarIgnorables, setMostrarIgnorables] = useState(false);
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState<any>(null);

  useEffect(() => {
    api.get("/prospectos/analisis-comercial")
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  // Construir mapa de leads con sus servicios (para vista por prioridad)
  const leadsConServicios = useMemo<LeadConServicios[]>(() => {
    if (!data) return [];
    const mapa = new Map<string, LeadConServicios>();
    const agregar = (leads: Lead[], servicio: string) => {
      leads.forEach(l => {
        if (!mapa.has(l.id)) mapa.set(l.id, { ...l, servicios: [] });
        mapa.get(l.id)!.servicios.push(servicio);
      });
    };
    agregar(data.desarrollo_web,    "desarrollo_web");
    agregar(data.marketing_digital, "marketing_digital");
    agregar(data.branding,          "branding");
    agregar(data.modelamiento_3d,   "modelamiento_3d");
    agregar(data.erp_crm,           "erp_crm");
    return Array.from(mapa.values()).sort((a, b) => b.score - a.score);
  }, [data]);

  const porPrioridad = useMemo(() => ({
    alta:  leadsConServicios.filter(l => l.prioridad === "alta"),
    media: leadsConServicios.filter(l => l.prioridad === "media"),
    baja:  leadsConServicios.filter(l => l.prioridad === "baja"),
  }), [leadsConServicios]);

  // Adaptar tipos para Seccion (Lead → LeadConServicios con servicios vacíos)
  const toSeccion = (leads: Lead[]): LeadConServicios[] =>
    leads.map(l => ({ ...l, servicios: [] }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  if (!data) return null;

  const { stats } = data;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* Modal detalle prospecto */}
      {prospectoSeleccionado && (
        <ProspectoDetalle
          prospecto={prospectoSeleccionado}
          onCerrar={() => setProspectoSeleccionado(null)}
          onEditar={() => setProspectoSeleccionado(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/prospectos")}
            className="p-2 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-500 shrink-0">
            <ArrowLeft size={18}/>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Análisis Comercial</h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              {vista === "servicio" ? "Segmentación por servicio — qué venderle a quién"
              : vista === "prioridad" ? "Segmentación por prioridad — a quién llamar primero"
              : "Oportunidad web — empresas gestionables por estado de sitio"}
            </p>
          </div>
        </div>

        {/* Toggle vista */}
        <div className="flex items-center gap-1 bg-zinc-800 rounded-xl p-1 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setVista("servicio")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              vista === "servicio" ? "bg-slate-800/60 shadow text-zinc-200" : "text-zinc-400 hover:text-zinc-400"
            }`}
          >
            <LayoutGrid size={13}/>
            <span className="hidden sm:inline">Por </span>Servicio
          </button>
          <button
            onClick={() => setVista("prioridad")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              vista === "prioridad" ? "bg-slate-800/60 shadow text-zinc-200" : "text-zinc-400 hover:text-zinc-400"
            }`}
          >
            <BarChart3 size={13}/>
            <span className="hidden sm:inline">Por </span>Prioridad
          </button>
          <button
            onClick={() => setVista("web")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              vista === "web" ? "bg-slate-800/60 shadow text-zinc-200" : "text-zinc-400 hover:text-zinc-400"
            }`}
          >
            <Globe size={13}/> Web
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Prospectables",   value: stats.total,      icon: <Building2 size={16}/>,    color: "text-zinc-600",   bg: "bg-zinc-50",   activo: vista === "servicio" },
          { label: "Prioridad Alta",  value: stats.alta,       icon: <TrendingUp size={16}/>,   color: "text-red-600",    bg: "bg-red-50",    activo: vista === "prioridad" },
          { label: "Prioridad Media", value: stats.media,      icon: <TrendingUp size={16}/>,   color: "text-yellow-600", bg: "bg-yellow-50", activo: vista === "prioridad" },
          { label: "Prioridad Baja",  value: stats.baja,       icon: <TrendingUp size={16}/>,   color: "text-zinc-400",   bg: "bg-zinc-50",   activo: vista === "prioridad" },
          { label: "Ignorables",      value: stats.ignorables, icon: <AlertTriangle size={16}/>,color: "text-zinc-400",   bg: "bg-zinc-50",   activo: false },
        ].map(k => (
          <div key={k.label} className={`${CARD_CLASS} ${k.bg} flex items-center gap-3 p-4 transition-all ${k.activo ? "ring-2 ring-brand shadow-md" : ""}`}>
            <span className={k.color}>{k.icon}</span>
            <div>
              <p className="text-xl font-bold text-zinc-200">{k.value}</p>
              <p className={`text-[10px] leading-tight ${k.activo ? "text-brand font-semibold" : "text-zinc-400"}`}>{k.label}</p>
            </div>
          </div>
        ))}
        {/* KPI Sin web con tooltip */}
        <div className={`${CARD_CLASS} bg-blue-50 p-4 transition-all ${vista === "web" ? "ring-2 ring-blue-400 shadow-md" : ""}`}>
          <SinWebCard
            n={stats.sin_web}
            detalle={stats.sin_web_detalle}
            excTot={stats.sin_web_detalle.no_interesados + stats.sin_web_detalle.perdidas + stats.sin_web_detalle.inactivos}
            activo={vista === "web"}
          />
        </div>
      </div>

      {/* Nota de exclusión */}
      {/* Nota de exclusión */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 -mt-2 px-1">
        <span className="text-[11px] text-zinc-400">No contabilizados:</span>
        <span className="text-[11px] text-zinc-500">
          <span className="font-semibold text-red-400">{stats.excluidos.no_interesados}</span> No interesados
        </span>
        <span className="text-zinc-300 text-[11px]">·</span>
        <span className="text-[11px] text-zinc-500">
          <span className="font-semibold text-red-400">{stats.excluidos.perdidas}</span> Venta perdida
        </span>
        <span className="text-zinc-300 text-[11px]">·</span>
        <span className="text-[11px] text-zinc-500">
          <span className="font-semibold text-zinc-400">{stats.excluidos.inactivos}</span> Inactivos
        </span>
        <span className="text-zinc-300 text-[11px]">·</span>
        <span className="text-[11px] text-zinc-400">
          Total excluidos: <strong className="text-zinc-400">{stats.excluidos.no_interesados + stats.excluidos.perdidas + stats.excluidos.inactivos}</strong>
          {" "}· Prospectables: <strong className="text-zinc-300">{stats.total}</strong>
          {" "}· Total BD: <strong className="text-zinc-300">{stats.total + stats.excluidos.no_interesados + stats.excluidos.perdidas + stats.excluidos.inactivos}</strong>
        </span>
      </div>

      {/* Barra distribución */}
      <div className={`${CARD_CLASS} p-5`}>
        <p className="text-xs font-semibold text-zinc-100 uppercase tracking-wider mb-3">Distribución de prioridad</p>
        <div className="flex rounded-xl overflow-hidden h-4">
          <div className="bg-red-400"    style={{ width: `${(stats.alta  / stats.total * 100).toFixed(1)}%` }}/>
          <div className="bg-yellow-400" style={{ width: `${(stats.media / stats.total * 100).toFixed(1)}%` }}/>
          <div className="bg-zinc-700"   style={{ width: `${(stats.baja  / stats.total * 100).toFixed(1)}%` }}/>
        </div>
        <div className="flex gap-4 mt-2">
          {[
            { label: "Alta",  n: stats.alta,  color: "bg-red-400" },
            { label: "Media", n: stats.media, color: "bg-yellow-400" },
            { label: "Baja",  n: stats.baja,  color: "bg-zinc-200" },
          ].map(d => (
            <div key={d.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${d.color}`}/>
              <span className="text-xs text-zinc-500">
                {d.label} <strong className="text-zinc-300">{d.n}</strong> · {(d.n / stats.total * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── VISTA POR SERVICIO ── */}
      {vista === "servicio" && (
        <>
          <Seccion titulo="Desarrollo Web" descripcion="Empresas sin web o con web desactualizada — oportunidad directa de venta"
            leads={toSeccion(data.desarrollo_web)} icon={<Globe size={18}/>} color="text-blue-600" bgColor="bg-blue-50" onSelect={setProspectoSeleccionado}/>
          <Seccion titulo="Marketing Digital" descripcion="Empresas con redes activas o en sectores de consumo — candidatas a campañas"
            leads={toSeccion(data.marketing_digital)} icon={<Megaphone size={18}/>} color="text-violet-600" bgColor="bg-violet-50" onSelect={setProspectoSeleccionado}/>
          <Seccion titulo="Branding" descripcion="Empresas pequeñas que necesitan construir identidad de marca"
            leads={toSeccion(data.branding)} icon={<Palette size={18}/>} color="text-pink-600" bgColor="bg-pink-50" onSelect={setProspectoSeleccionado}/>
          <Seccion titulo="Modelamiento 3D" descripcion="Constructoras, inmobiliarias y estudios de arquitectura — alto potencial visual"
            leads={toSeccion(data.modelamiento_3d)} icon={<Box size={18}/>} color="text-orange-600" bgColor="bg-orange-50" onSelect={setProspectoSeleccionado}/>
          <Seccion titulo="ERP / CRM Futuro" descripcion="Empresas grandes con estructura para operar software de gestión"
            leads={toSeccion(data.erp_crm)} icon={<Database size={18}/>} color="text-emerald-600" bgColor="bg-emerald-50" onSelect={setProspectoSeleccionado}/>

          {/* Ignorables */}
          <div className={`${PANEL_BASE} overflow-hidden`}>
            <button onClick={() => setMostrarIgnorables(v => !v)}
              className="w-full flex items-center gap-3 p-5 hover:bg-zinc-800 transition-colors text-left">
              <div className="w-9 h-9 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-zinc-500"/>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-zinc-500 text-sm">Dejar para después</p>
                  <span className={`${BADGE_BASE} text-[10px] font-bold px-2 py-0.5 text-zinc-500`}>
                    {data.ignorables.length} empresas
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">Score muy bajo — llamarlas ahora es pérdida de tiempo</p>
              </div>
              <span className="text-zinc-400">{mostrarIgnorables ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</span>
            </button>
            {mostrarIgnorables && (
              <div className="border-t border-white/10">
                <TablaLeads leads={toSeccion(data.ignorables)} busqueda=""/>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── VISTA OPORTUNIDAD WEB ── */}
      {vista === "web" && (
        <>
          {/* Resumen web */}
          <div className={`${CARD_CLASS} p-5 overflow-visible`}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-visible">

              {[
                { label: "Sin web",          n: data.por_web.sin_web.length,          color: "text-red-600",    bg: "bg-red-50",     icon: <WifiOff size={14}/> },
                { label: "Sin información",  n: data.por_web.sin_informacion.length,  color: "text-zinc-500",   bg: "bg-zinc-50",    icon: <Info size={14}/> },
                { label: "Por actualizar",   n: data.por_web.por_actualizar.length,   color: "text-yellow-600", bg: "bg-yellow-50",  icon: <Clock size={14}/> },
                { label: "Vencida",          n: data.por_web.vencida.length,          color: "text-orange-600", bg: "bg-orange-50",  icon: <ShieldAlert size={14}/> },
                { label: "En mantenimiento", n: data.por_web.en_mantenimiento.length, color: "text-blue-600",   bg: "bg-blue-50",    icon: <Wifi size={14}/> },
                { label: "Actualizada",      n: data.por_web.actualizada.length,      color: "text-emerald-600",bg: "bg-emerald-50", icon: <CheckCircle2 size={14}/> },
              ].map(k => (
                <div key={k.label} className={`${k.bg} rounded-xl p-3 flex items-center gap-2`}>
                  <span className={k.color}>{k.icon}</span>
                  <div>
                    <p className="text-lg font-bold text-zinc-200">{k.n}</p>
                    <p className="text-[10px] text-zinc-400 leading-tight">{k.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secciones gestionables */}
          <Seccion titulo="Sin web" descripcion="Empresas sin presencia web — mayor oportunidad de venta desde cero"
            leads={toSeccion(data.por_web.sin_web)} icon={<WifiOff size={18}/>} color="text-red-600" bgColor="bg-red-50"
            badgeColor="bg-red-100 text-red-700" onSelect={setProspectoSeleccionado}/>
          <Seccion titulo="Sin información" descripcion="Tienen web pero no sabemos su estado — verificar y vender"
            leads={toSeccion(data.por_web.sin_informacion)} icon={<Info size={18}/>} color="text-zinc-500" bgColor="bg-zinc-50"
            badgeColor="bg-zinc-200 text-zinc-600" onSelect={setProspectoSeleccionado}/>
          <Seccion titulo="Por actualizar" descripcion="Admitieron que su web necesita actualización — oportunidad clara"
            leads={toSeccion(data.por_web.por_actualizar)} icon={<Clock size={18}/>} color="text-yellow-600" bgColor="bg-yellow-50"
            badgeColor="bg-yellow-100 text-yellow-700" onSelect={setProspectoSeleccionado}/>
          <Seccion titulo="Web vencida" descripcion="Dominio o sitio caído — renovación urgente"
            leads={toSeccion(data.por_web.vencida)} icon={<ShieldAlert size={18}/>} color="text-orange-600" bgColor="bg-orange-50"
            badgeColor="bg-orange-100 text-orange-700" onSelect={setProspectoSeleccionado}/>
          <Seccion titulo="En mantenimiento" descripcion="Web pausada — a menudo abandonada sin retomar"
            leads={toSeccion(data.por_web.en_mantenimiento)} icon={<Wifi size={18}/>} color="text-blue-600" bgColor="bg-blue-50"
            badgeColor="bg-blue-100 text-blue-700" onSelect={setProspectoSeleccionado}/>

          {/* Sin oportunidad */}
          <div className={`${PANEL_BASE} overflow-hidden`}>
            <div className="flex items-center gap-3 p-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-emerald-500"/>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-zinc-400 text-sm">Web actualizada — sin oportunidad inmediata</p>
                  <span className={`${BADGE_BASE} text-[10px] font-bold px-2 py-0.5 text-emerald-600`}>
                    {data.por_web.actualizada.length} empresas
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">Ya tienen proveedor activo — no llamar para web, sí para marketing o branding</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── VISTA POR PRIORIDAD ── */}
      {vista === "prioridad" && (
        <>
          <Seccion
            titulo="Prioridad Alta"
            descripcion="Llamar primero — mayor potencial de cierre según scoring"
            leads={porPrioridad.alta}
            icon={<TrendingUp size={18}/>}
            color="text-red-600" bgColor="bg-red-50"
            badgeColor="bg-red-100 text-red-700"
            mostrarServicios onSelect={setProspectoSeleccionado}
          />
          <Seccion
            titulo="Prioridad Media"
            descripcion="Segunda ronda de llamadas — potencial moderado"
            leads={porPrioridad.media}
            icon={<TrendingUp size={18}/>}
            color="text-yellow-600" bgColor="bg-yellow-50"
            badgeColor="bg-yellow-100 text-yellow-700"
            mostrarServicios onSelect={setProspectoSeleccionado}
          />
          <Seccion
            titulo="Prioridad Baja"
            descripcion="Última prioridad — solo si no hay leads de mayor valor disponibles"
            leads={porPrioridad.baja}
            icon={<TrendingUp size={18}/>}
            color="text-zinc-400" bgColor="bg-zinc-50"
            badgeColor="bg-zinc-200 text-zinc-500"
            mostrarServicios onSelect={setProspectoSeleccionado}
          />
        </>
      )}

    </div>
  );
}
