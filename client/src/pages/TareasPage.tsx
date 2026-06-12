/**client/src/pages/TareasPage.tsx */

import { useEffect, useState } from "react";
import { CheckSquare, AlertCircle, Clock, Calendar, Plus } from "lucide-react";
import { getTareas, getResumenTareas } from "../services/tareas.api";
import { TareaForm } from "../components/tareas/TareaForm";
import { TareasList } from "../components/tareas/TareasList";
import type { Tarea, ResumenTareas } from "../types/tarea.types";
import { fechaHoy } from "../utils/date";

type Filtro = "todas" | "vencidas" | "hoy" | "proximas" | "completadas";

function classFiltro(activo: boolean) {
  return `px-3 py-1.5 text-xs rounded-lg border transition ${
    activo
      ? "bg-amber-600 text-white border-amber-600"
      : "border-gray-200 text-zinc-600 hover:bg-gray-50"
  }`;
}

const hoy = () => fechaHoy();

function aplicarFiltro(tareas: Tarea[], filtro: Filtro): Tarea[] {
  const h = hoy();
  switch (filtro) {
    case "vencidas":
      return tareas.filter(t => !t.completada && t.fecha_vencimiento.split("T")[0] < h);
    case "hoy":
      return tareas.filter(t => !t.completada && t.fecha_vencimiento.split("T")[0] === h);
    case "proximas":
      return tareas.filter(t => !t.completada && t.fecha_vencimiento.split("T")[0] > h);
    case "completadas":
      return tareas.filter(t => t.completada);
    default:
      return tareas.filter(t => !t.completada);
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
      setTareas(tar);
      setResumen(res);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  const tareasFiltradas = aplicarFiltro(tareas, filtro);

  return (
    <div className="p-6 max-w-9xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="crm-section-accent h-8" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tareas de seguimiento</h1>
            <p className="text-xs text-slate-500 mt-0.5">Recordatorios y pendientes de tus prospectos</p>
          </div>
        </div>
        <button
          onClick={() => setMostrarForm(v => !v)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl transition shadow-sm"
        >
          <Plus size={13} /> Nueva tarea
        </button>
      </div>

      {/* Resumen cards */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-red-100 rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <AlertCircle size={16} className="mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-black text-red-600 tabular-nums leading-tight">{resumen.vencidas}</p>
            <p className="text-[10px] text-red-400 font-semibold uppercase tracking-widest mt-1">Vencidas</p>
          </div>
          <div className="bg-white border border-orange-100 rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <Clock size={16} className="mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-black text-orange-600 tabular-nums leading-tight">{resumen.hoy}</p>
            <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-widest mt-1">Para hoy</p>
          </div>
          <div className="bg-white border border-brand/20 rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <Calendar size={16} className="mx-auto text-brand mb-2" />
            <p className="text-2xl font-black text-brand tabular-nums leading-tight">{resumen.proximas}</p>
            <p className="text-[10px] text-brand/70 font-semibold uppercase tracking-widest mt-1">Próximas</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CheckSquare size={16} className="mx-auto text-slate-500 mb-2" />
            <p className="text-2xl font-black text-slate-700 tabular-nums leading-tight">{resumen.total}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Total</p>
          </div>
        </div>
      )}

      {/* Formulario nueva tarea */}
      {mostrarForm && (
        <TareaForm
          onGuardado={() => { setMostrarForm(false); cargar(); }}
          onCancelar={() => setMostrarForm(false)}
        />
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "todas",      label: "Pendientes" },
          { key: "vencidas",   label: `Vencidas${resumen?.vencidas ? ` (${resumen.vencidas})` : ""}` },
          { key: "hoy",        label: `Hoy${resumen?.hoy ? ` (${resumen.hoy})` : ""}` },
          { key: "proximas",   label: "Próximas" },
          { key: "completadas",label: "Completadas" },
        ] as { key: Filtro; label: string }[]).map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)} className={classFiltro(filtro === f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600" />
        </div>
      ) : (
        <TareasList tareas={tareasFiltradas} onActualizar={cargar} />
      )}
    </div>
  );
}
