/**client/src/components/ui/Modal.tsx */

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  abierto:   boolean;
  onCerrar:  () => void;
  titulo:    string;
  children:  ReactNode;
  size?:     "sm" | "md" | "lg" | "xl";
  variant?:  "light" | "dark";
}

const sizes = {
  sm:  "max-w-sm",
  md:  "max-w-md",
  lg:  "max-w-lg",
  xl:  "max-w-2xl",
};

export function Modal({ abierto, onCerrar, titulo, children, size = "md", variant = "light" }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const mouseDownInContent = useRef(false);

  useEffect(() => {
    if (abierto) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onMouseDown={e => { mouseDownInContent.current = contentRef.current?.contains(e.target as Node) ?? false; }}
      onClick={() => { if (!mouseDownInContent.current) onCerrar(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div ref={contentRef} className={`relative rounded-2xl shadow-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col ${
        variant === "dark"
          ? "bg-zinc-800 border border-zinc-700"
          : "bg-white"
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 shrink-0 ${
          variant === "dark"
            ? "border-b border-zinc-700"
            : "border-b border-gray-100"
        }`}>
          {variant === "dark" ? (
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-4 rounded-full bg-brand block shrink-0" />
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">{titulo}</h2>
            </div>
          ) : (
            <h2 className="text-base font-semibold text-zinc-800">{titulo}</h2>
          )}
          <button
            onClick={onCerrar}
            className={`p-1.5 rounded-lg transition ${
              variant === "dark"
                ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                : "text-zinc-800 hover:bg-gray-100"
            }`}
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