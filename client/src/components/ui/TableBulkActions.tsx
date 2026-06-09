/** client/src/ui/TableBulkActions.tsx */

import { useState, useRef, useEffect } from "react";
import { Tag } from "lucide-react";

interface TableBulkActionsProps {
  count:              number;
  proyectos?:         string[];
  onDelete?:          () => void;
  onAsignarProyecto?: (proyecto: string) => void;
}

export function TableBulkActions({ count, proyectos = [], onDelete, onAsignarProyecto }: TableBulkActionsProps) {
  const [showInput, setShowInput] = useState(false);
  const [valor,     setValor]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput) inputRef.current?.focus();
  }, [showInput]);

  const confirmar = () => {
    if (valor.trim() && onAsignarProyecto) {
      onAsignarProyecto(valor.trim());
      setValor("");
      setShowInput(false);
    }
  };

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2">

      {/* Asignar proyecto */}
      {onAsignarProyecto && (
        showInput ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmar(); if (e.key === "Escape") setShowInput(false); }}
              list="proyectos-list"
              placeholder="Nombre del proyecto..."
              className="text-xs border border-violet-300 rounded-lg px-2.5 py-1.5 w-44 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <datalist id="proyectos-list">
              {proyectos.map((p) => <option key={p} value={p} />)}
            </datalist>
            <button
              onClick={confirmar}
              disabled={!valor.trim()}
              className="px-2.5 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 transition"
            >
              Asignar
            </button>
            <button
              onClick={() => { setShowInput(false); setValor(""); }}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-50 border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-100 transition"
          >
            <Tag size={11} />
            Asignar proyecto ({count})
          </button>
        )
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          🗑️ Eliminar ({count})
        </button>
      )}

    </div>
  );
}
