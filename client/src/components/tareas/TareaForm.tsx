/**client/src/components/tareas/TareaForm.tsx */

import { useState } from "react";
import { crearTarea } from "../../services/tareas.api";
import { fechaHoy } from "../../utils/date";

interface Props {
  prospectoId?: string;
  onGuardado:  () => void;
  onCancelar:  () => void;
}

const cls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50";

const hoyMas = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function TareaForm({ prospectoId, onGuardado, onCancelar }: Props) {
  const [titulo,      setTitulo]      = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha,       setFecha]       = useState(hoyMas(7));
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleGuardar() {
    if (!titulo.trim()) { setError("El título es obligatorio"); return; }
    setLoading(true);
    setError(null);
    try {
      await crearTarea({ prospecto_id: prospectoId, titulo, descripcion: descripcion || undefined, fecha_vencimiento: fecha });
      onGuardado();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-brand">Nueva tarea de seguimiento</p>

      {/* Accesos rápidos de fecha */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { label: "Mañana",    dias: 1  },
          { label: "3 días",    dias: 3  },
          { label: "1 semana",  dias: 7  },
          { label: "2 semanas", dias: 14 },
          { label: "1 mes",     dias: 30 },
        ].map(({ label, dias }) => (
          <button key={dias} onClick={() => setFecha(hoyMas(dias))}
            className={`px-2 py-1 text-[10px] rounded-md border transition ${
              fecha === hoyMas(dias)
                ? "bg-brand text-white border-brand"
                : "border-brand/30 text-brand hover:bg-brand/5"
            }`}>
            {label}
          </button>
        ))}
      </div>

      <input type="text" placeholder="¿Qué hay que hacer? Ej: Llamar para dar seguimiento" value={titulo}
        onChange={e => setTitulo(e.target.value)} className={cls} />

      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={cls} />
        <input type="text" placeholder="Nota adicional (opcional)" value={descripcion}
          onChange={e => setDescripcion(e.target.value)} className={cls} />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button onClick={handleGuardar} disabled={loading}
          className="flex-1 px-3 py-1.5 text-xs bg-brand hover:bg-brand-hover disabled:opacity-60 text-white rounded-lg transition">
          {loading ? "Guardando..." : "Guardar tarea"}
        </button>
      </div>
    </div>
  );
}
