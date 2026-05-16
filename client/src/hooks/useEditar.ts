/** client/src/hooks/useEditar.ts */

import { useState } from "react";

/**
 * Hook genérico para edición en cualquier página del CRM.
 *
 * Maneja: qué item se está editando, estado de carga, errores
 * y el ciclo abrir → guardar → cerrar.
 *
 * Uso en la página:
 *   const editar = useEditar<Metrica>();
 *
 *   // Abrir modal al clickear editar en una fila:
 *   onEditar={(m) => editar.abrir(m)}
 *
 *   // En el handler de guardado:
 *   await editar.guardar(async () => {
 *     await updateMetrica(editar.editando!.id, form);
 *     recargar();
 *   });
 *
 *   // Render del modal:
 *   {editar.editando && (
 *     <ModalEditarXxx
 *       item={editar.editando}
 *       guardando={editar.guardando}
 *       error={editar.error}
 *       onGuardar={handleGuardar}
 *       onCerrar={editar.cerrar}
 *     />
 *   )}
 */
export function useEditar<T>() {
  const [editando,  setEditando]  = useState<T | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const abrir = (item: T) => {
    setEditando(item);
    setError(null);
  };

  const cerrar = () => {
    setEditando(null);
    setError(null);
  };

  /**
   * Ejecuta fn() con manejo automático de loading + error.
   * Cierra el modal si fn() resuelve sin excepción.
   */
  const guardar = async (fn: () => Promise<void>) => {
    setGuardando(true);
    setError(null);
    try {
      await fn();
      cerrar();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return { editando, guardando, error, abrir, cerrar, guardar };
}
