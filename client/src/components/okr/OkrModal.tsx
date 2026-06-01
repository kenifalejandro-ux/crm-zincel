/** client/src/components/okr/OkrModal.tsx */

import { useEffect, useState } from "react";
import { X, Target } from "lucide-react";
import type { Okr } from "../../types/okr.types";

interface Props {
  okr?: Okr | null;
  anioDefault?: number;
  trimestreDefault?: number;
  onClose: () => void;
  onSave: (payload: { titulo: string; descripcion?: string; trimestre: number; anio: number }) => Promise<void>;
}

const TRIMESTRES = [
  { q: 1, label: "Q1", meses: "Ene – Mar" },
  { q: 2, label: "Q2", meses: "Abr – Jun" },
  { q: 3, label: "Q3", meses: "Jul – Sep" },
  { q: 4, label: "Q4", meses: "Oct – Dic" },
];

const anioActual = new Date().getFullYear();
const ANIOS = [anioActual - 1, anioActual, anioActual + 1];

export function OkrModal({ okr, anioDefault, trimestreDefault, onClose, onSave }: Props) {
  const [titulo,      setTitulo]      = useState(okr?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(okr?.descripcion ?? "");
  const [trimestre,   setTrimestre]   = useState(okr?.trimestre ?? trimestreDefault ?? 2);
  const [anio,        setAnio]        = useState(okr?.anio ?? anioDefault ?? anioActual);
  const [guardando,   setGuardando]   = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    if (!titulo.trim()) { setError("El título es obligatorio"); return; }
    setError("");
    setGuardando(true);
    try {
      await onSave({ titulo: titulo.trim(), descripcion: descripcion.trim() || undefined, trimestre, anio });
      onClose();
    } catch {
      setError("No se pudo guardar el objetivo. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-brand" />
            <h2 className="text-base font-bold text-zinc-900">
              {okr ? "Editar objetivo" : "Nuevo objetivo"}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Título del objetivo</label>
            <input
              autoFocus
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Consolidar el pipeline comercial"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Descripción (opcional)</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Contexto o motivación detrás del objetivo..."
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Período</label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {TRIMESTRES.map(t => (
                <button
                  key={t.q}
                  onClick={() => setTrimestre(t.q)}
                  className={`rounded-xl border py-2 text-center transition ${
                    trimestre === t.q
                      ? "border-brand bg-amber-50 text-brand font-bold"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                  }`}
                >
                  <p className="text-sm font-bold">{t.label}</p>
                  <p className="text-[10px]">{t.meses}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Año</label>
            <div className="mt-1 flex gap-2">
              {ANIOS.map(a => (
                <button
                  key={a}
                  onClick={() => setAnio(a)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${
                    anio === a
                      ? "border-brand bg-amber-50 text-brand"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={guardando}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand/90 transition disabled:opacity-60"
          >
            {guardando ? "Guardando…" : okr ? "Guardar cambios" : "Crear objetivo"}
          </button>
        </div>
      </div>
    </div>
  );
}
