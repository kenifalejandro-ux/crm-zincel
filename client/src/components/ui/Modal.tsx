/**client/src/components/ui/Modal.tsx */

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  abierto:   boolean;
  onCerrar:  () => void;
  titulo:    string;
  children:  ReactNode;
  size?:     "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm:  "max-w-sm",
  md:  "max-w-md",
  lg:  "max-w-lg",
  xl:  "max-w-2xl",
};

export function Modal({ abierto, onCerrar, titulo, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (abierto) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-zinc-800">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-zinc-800 hover:gray-100 hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}