/** client/src/hooks/useSeleccion.ts */

import { useState } from "react";

/**
 * Hook genérico para manejar selección masiva en tablas.
 * Funciona con cualquier lista de items que tengan un campo `id`.
 */
export function useSeleccion<T extends { id: string }>(items: T[]) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  /** Marca o desmarca un item individual */
  const toggleUno = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /** Marca o desmarca todos los items de la página actual */
  const toggleTodos = () => {
    const ids = items.map((i) => i.id);
    const todosSeleccionados = ids.every((id) => seleccionados.includes(id));

    if (todosSeleccionados) {
      setSeleccionados((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSeleccionados((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  /** Limpia la selección */
  const limpiar = () => setSeleccionados([]);

  /** true si todos los items actuales están seleccionados */
  const todosSeleccionados =
    items.length > 0 && items.every((i) => seleccionados.includes(i.id));

  return {
    seleccionados,
    toggleUno,
    toggleTodos,
    limpiar,
    todosSeleccionados,
    cantidad: seleccionados.length,
  };
}