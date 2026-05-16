/** client/src/components/ui/ModalEditar.tsx */

import { type ReactNode } from "react";
import { Modal }   from "./Modal";
import { Button }  from "./Button";

interface Props {
  nombre:    string;
  guardando: boolean;
  error?:    string | null;
  onGuardar: () => void;
  onCerrar:  () => void;
  size?:     "sm" | "md" | "lg" | "xl";
  children:  ReactNode;
}

/**
 * Shell reutilizable para modales de edición.
 * Provee: título "Editar — {nombre}", footer con botones
 * Cancelar / Guardar cambios, y zona de error estandarizada.
 *
 * Uso:
 *   <ModalEditar nombre="Empresa — Campaña" guardando={guardando} error={error}
 *                onGuardar={handleGuardar} onCerrar={cerrar} size="xl">
 *     {campos del formulario...}
 *   </ModalEditar>
 */
export function ModalEditar({ nombre, guardando, error, onGuardar, onCerrar, size = "lg", children }: Props) {
  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Editar — ${nombre}`} size={size}>
      <div className="space-y-4">
        {children}

        {error && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-2 pt-1 border-t border-zinc-100">
          <Button variant="secondary" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button className="flex-1" loading={guardando} onClick={onGuardar}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
}
