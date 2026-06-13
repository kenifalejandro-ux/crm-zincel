/**client/src/components/ui/Modal.tsx */

import { MODAL_BASE } from "../../lib/tokens";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GripHorizontal, X } from "lucide-react";

interface ModalProps {
  abierto:    boolean;
  onCerrar:   () => void;
  titulo:     string;
  children:   ReactNode;
  size?:      "sm" | "md" | "lg" | "xl";
  variant?:   "light" | "dark";
  draggable?: boolean;
}

const sizes = {
  sm:  "max-w-sm",
  md:  "max-w-md",
  lg:  "max-w-lg",
  xl:  "max-w-2xl",
};

const widths = {
  sm:  448,
  md:  448,
  lg:  512,
  xl:  672,
};

export function Modal({ abierto, onCerrar, titulo, children, size = "md", variant = "light", draggable = false }: ModalProps) {
  const contentRef        = useRef<HTMLDivElement>(null);
  const mouseDownInContent = useRef(false);

  // ── Drag state (solo cuando draggable=true) ────────────────────────────────
  const [pos, setPos] = useState(() => ({
    x: Math.max(0, window.innerWidth  / 2 - (widths[size] ?? 672) / 2),
    y: Math.max(0, window.innerHeight / 2 - 340),
  }));
  const drag = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!draggable) return;
    const onMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      setPos({
        x: drag.current.origX + e.clientX - drag.current.startX,
        y: drag.current.origY + e.clientY - drag.current.startY,
      });
    };
    const onUp = () => { drag.current.active = false; setIsDragging(false); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [draggable]);

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    setIsDragging(true);
  };
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (abierto) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [abierto]);

  if (!abierto) return null;

  // ── Modo arrastrable ───────────────────────────────────────────────────────
  if (draggable) {
    return (
      <div
        className="fixed z-50"
        style={{ left: pos.x, top: pos.y }}
      >
        <div
          ref={contentRef}
          className={`${MODAL_BASE} w-full ${sizes[size]} max-h-[90vh] flex flex-col ${ isDragging ? "ring-2 ring-brand/30 shadow-3xl" : "" } ${variant === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-slate-800/60 border-white/10"}`}
        >
          {/* Header arrastrable */}
          <div
            onMouseDown={onHeaderMouseDown}
            className={`flex items-center justify-between px-6 py-4 shrink-0 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            } ${variant === "dark" ? "border-b border-zinc-700" : "border-b border-white/8"}`}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal size={13} className="text-zinc-300 shrink-0" />
              {variant === "dark" ? (
                <div className="flex items-center gap-2.5">
                  <span className="w-1 h-4 rounded-full bg-brand block shrink-0" />
                  <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">{titulo}</h2>
                </div>
              ) : (
                <h2 className="text-base font-semibold text-zinc-200">{titulo}</h2>
              )}
            </div>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={onCerrar}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                variant === "dark"
                  ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  : "text-zinc-200 hover:bg-zinc-800"
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

  // ── Modo normal (centrado con backdrop) ────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onMouseDown={e => { mouseDownInContent.current = contentRef.current?.contains(e.target as Node) ?? false; }}
      onClick={() => { if (!mouseDownInContent.current) onCerrar(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div ref={contentRef} className={`${MODAL_BASE} relative w-full ${sizes[size]} max-h-[90vh] flex flex-col ${ variant === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-slate-800/60" }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 shrink-0 ${
          variant === "dark"
            ? "border-b border-zinc-700"
            : "border-b border-white/8"
        }`}>
          {variant === "dark" ? (
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-4 rounded-full bg-brand block shrink-0" />
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">{titulo}</h2>
            </div>
          ) : (
            <h2 className="text-base font-semibold text-zinc-200">{titulo}</h2>
          )}
          <button
            onClick={onCerrar}
            className={`p-1.5 rounded-lg transition ${
              variant === "dark"
                ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                : "text-zinc-200 hover:bg-zinc-800"
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
