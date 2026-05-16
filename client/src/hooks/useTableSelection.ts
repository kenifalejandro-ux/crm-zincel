/**client/src/hooks/useTableSelection.ts */
/**ELIMINAR MASIVO */

import { useMemo, useState } from "react";

export function useTableSelection<T extends { id: string }>(
  items: T[]
) {

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  // ✅ seleccionar individual
  const toggleOne = (id: string) => {

    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );

  };

  // ✅ seleccionar todos
  const toggleAll = () => {

    const ids = items.map(x => x.id);

    const allSelected =
      ids.every(id =>
        selectedIds.includes(id)
      );

    if (allSelected) {

      setSelectedIds(prev =>
        prev.filter(id => !ids.includes(id))
      );

    } else {

      setSelectedIds(prev => [
        ...new Set([...prev, ...ids])
      ]);

    }

  };

  // ✅ limpiar
  const clearSelection = () => {
    setSelectedIds([]);
  };

  // ✅ verificar
  const isSelected = (id: string) => {
    return selectedIds.includes(id);
  };

  // ✅ todos seleccionados
  const allSelected = useMemo(() => {

    if (items.length === 0) return false;

    return items.every(item =>
      selectedIds.includes(item.id)
    );

  }, [items, selectedIds]);

  // ✅ cantidad
  const selectedCount = selectedIds.length;

  return {
    selectedIds,
    selectedCount,

    toggleOne,
    toggleAll,

    clearSelection,

    isSelected,
    allSelected,
  };
}