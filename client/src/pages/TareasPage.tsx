/**client/src/pages/TareasPage.tsx */

import { useEffect, useState } from "react";
import { CheckSquare, AlertCircle, Clock, Calendar, Plus } from "lucide-react";
import { getTareas, getResumenTareas } from "../services/tareas.api";
import { TareaForm } from "../components/tareas/TareaForm";
import { TareasList } from "../components/tareas/TareasList";
import type { Tarea, ResumenTareas } from "../types/tarea.types";

type Filtro = "todas" | "vencidas" | "hoy" | "proximas" | "completadas";

function classFiltro(activo: boolean) {
  return `px-3 py-1.5 text-xs rounded-lg border transition ${
    activo
      ? "bg-indigo-600 text-white border-indigo-600"
      : "border-gray-200 text-zinc-600 hover:bg-gray-50"
  }`;
}

const hoy = () => new Date().toISOString().split("T")[0];

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
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <CheckSquare size={20} className="text-indigo-500" />
            Tareas de seguimiento
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Recordatorios y pendientes de tus prospectos</p>
        </div>
        <button
          onClick={() => setMostrarForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          <Plus size={13} /> Nueva tarea
        </button>
      </div>

      {/* Resumen cards */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <AlertCircle size={16} className="mx-auto text-red-500 mb-1" />
            <p className="text-xl font-bold text-red-600">{resumen.vencidas}</p>
            <p className="text-[10px] text-red-400 font-medium uppercase tracking-wide">Vencidas</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
            <Clock size={16} className="mx-auto text-orange-500 mb-1" />
            <p className="text-xl font-bold text-orange-600">{resumen.hoy}</p>
            <p className="text-[10px] text-orange-400 font-medium uppercase tracking-wide">Para hoy</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
            <Calendar size={16} className="mx-auto text-blue-500 mb-1" />
            <p className="text-xl font-bold text-blue-600">{resumen.proximas}</p>
            <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wide">Próximas</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
            <CheckSquare size={16} className="mx-auto text-zinc-400 mb-1" />
            <p className="text-xl font-bold text-zinc-600">{resumen.total}</p>
            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Total</p>
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <TareasList tareas={tareasFiltradas} onActualizar={cargar} />
      )}
    </div>
  );
}
