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
  variant?:  "dark" | "light";
  children:  ReactNode;
}

export function ModalEditar({ nombre, guardando, error, onGuardar, onCerrar, size = "lg", variant, children }: Props) {
  const dark = variant === "dark";
  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Editar — ${nombre}`} size={size} variant={variant}>
      <div className="space-y-4">
        {children}

        {error && (
          <p className={`text-xs px-3 py-2 rounded-lg ${dark ? "text-red-400 bg-red-900/30" : "text-red-500 bg-red-50"}`}>{error}</p>
        )}

        <div className={`flex gap-2 pt-1 border-t ${dark ? "border-zinc-700" : "border-white/8"}`}>
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
