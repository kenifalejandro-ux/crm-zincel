/** client/src/components/ui/GlassCard.tsx
 *
 *  Card glassmorphism reutilizable — ÚNICA fuente de verdad visual.
 *  El efecto glass se define en `GLASS_BASE` (lib/tokens.ts); este componente
 *  solo lo aplica y añade padding/hover configurables.
 *
 *  Uso:
 *    <GlassCard>contenido</GlassCard>
 *    <GlassCard padding="sm" hover>contenido</GlassCard>
 *    <GlassCard className="space-y-4" as="section">…</GlassCard>
 */

import type { ReactNode, HTMLAttributes, ElementType } from "react";
import { GLASS_BASE, GLASS_HOVER } from "../../lib/tokens";

type Padding = "none" | "sm" | "md" | "lg";

const PADDINGS: Record<Padding, string> = {
  none: "",
  sm:   "p-4",
  md:   "p-5",
  lg:   "p-6",
};

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children:   ReactNode;
  className?: string;
  padding?:   Padding;
  hover?:     boolean;      // eleva la sombra al pasar el cursor
  as?:        ElementType;  // div (default), section, article…
}

export function GlassCard({
  children,
  className = "",
  padding = "md",
  hover = false,
  as = "div",
  ...rest
}: GlassCardProps) {
  const Tag: any = as;
  return (
    <Tag
      className={`${GLASS_BASE} ${hover ? GLASS_HOVER : ""} ${PADDINGS[padding]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
