/**client/src/pages/TareasPage.tsx — REDISEÑO NEON
 * Cambios SOLO de presentación: header con kicker, chips de filtro neon (antes
 * border-gray-200 hover:bg-gray-50 — tema claro), tarjetas resumen neon con glow
 * (antes border-red-100/border-orange-100 + text-red-600 sobre dark), spinner con acento.
 * Lógica (carga, filtros, alta) INTACTA.
 */
import { useEffect, useState } from "react";
import { CheckSquare, AlertCircle, Clock, Calendar, Plus } from "lucide-react";
import { getTareas, getResumenTareas } from "../services/tareas.api";
import { TareaForm } from "../components/tareas/TareaForm";
import { TareasList } from "../components/tareas/TareasList";
import type { Tarea, ResumenTareas } from "../types/tarea.types";
import { fechaHoy } from "../utils/date";

type Filtro = "todas" | "vencidas" | "hoy" | "proximas" | "completadas";

const hoy = () => fechaHoy();

function aplicarFiltro(tareas: Tarea[], filtro: Filtro): Tarea[] {
  const h = hoy();
  switch (filtro) {
    case "vencidas":    return tareas.filter(t => !t.completada && t.fecha_vencimiento.split("T")[0] < h);
    case "hoy":         return tareas.filter(t => !t.completada && t.fecha_vencimiento.split("T")[0] === h);
    case "proximas":    return tareas.filter(t => !t.completada && t.fecha_vencimiento.split("T")[0] > h);
    case "completadas": return tareas.filter(t => t.completada);
    default:            return tareas.filter(t => !t.completada);
  }
}

export default function TareasPage() {
  const [tareas,  setTareas]  = useState<Tarea[]>([]);
  const [resumen, setResumen] = useState<ResumenTareas | null>(null);
  const [filtro,  setFiltro]  = useState<Filtro>("todas");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const [tar, res] = await Promise.all([getTareas(), getResumenTareas()]);
      setTareas(tar); setResumen(res);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  }

  const tareasFiltradas = aplicarFiltro(tareas, filtro);

  // Tarjetas resumen neon (color semántico sobre fondo translúcido)
  const cards = resumen ? [
    { n: resumen.vencidas, label: "Vencidas",  Icon: AlertCircle, hex: "#f87171" },
    { n: resumen.hoy,      label: "Para hoy",  Icon: Clock,       hex: "#fbbf24" },
    { n: resumen.proximas, label: "Próximas",  Icon: Calendar,    hex: "var(--accent-hex)" },
    { n: resumen.total,    label: "Total",     Icon: CheckSquare, hex: null },
  ] : [];

  return (
    <div className="mx-auto max-w-[1320px] space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Comercial</p>
          <h1 className="font-display text-[26px] font-bold text-zinc-50 tracking-tight leading-tight mt-1">Tareas de seguimiento</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Recordatorios y pendientes de tus prospectos</p>
        </div>
        <button onClick={() => setMostrarForm(v => !v)} className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-[13px]">
          <Plus size={14} /> Nueva tarea
        </button>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cards.map(({ n, label, Icon, hex }) => {
            const accent = hex === "var(--accent-hex)";
            const color = accent ? "rgb(var(--accent))" : hex ?? "#a1a1aa";
            return (
              <div key={label} className="neon-panel p-4 text-center"
                   style={hex ? { borderColor: accent ? "rgb(var(--accent) / 0.3)" : `${hex}40`, background: accent ? "rgb(var(--accent) / 0.06)" : `${hex}12` } : undefined}>
                <Icon size={16} className="mx-auto mb-2" style={{ color }} />
                <p className="font-display text-2xl font-bold tabular-nums leading-tight" style={{ color: hex ? color : "#e4e4e7", textShadow: hex ? `0 0 12px ${accent ? "rgb(var(--accent) / calc(0.5*var(--glow)))" : hex + "66"}` : undefined }}>{n}</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: hex ? color : "#71717a" }}>{label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <TareaForm onGuardado={() => { setMostrarForm(false); cargar(); }} onCancelar={() => setMostrarForm(false)} />
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "todas",       label: "Pendientes" },
          { key: "vencidas",    label: `Vencidas${resumen?.vencidas ? ` (${resumen.vencidas})` : ""}` },
          { key: "hoy",         label: `Hoy${resumen?.hoy ? ` (${resumen.hoy})` : ""}` },
          { key: "proximas",    label: "Próximas" },
          { key: "completadas", label: "Completadas" },
        ] as { key: Filtro; label: string }[]).map(f => {
          const activo = filtro === f.key;
          return (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                activo ? "bg-accent-15 text-accent border-accent-30" : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.07]"
              }`}
              style={activo ? { boxShadow: "0 0 14px rgb(var(--accent) / calc(0.18*var(--glow)))" } : undefined}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/10" style={{ borderBottomColor: "rgb(var(--accent))" }} />
        </div>
      ) : (
        <TareasList tareas={tareasFiltradas} onActualizar={cargar} />
      )}
    </div>
  );
}