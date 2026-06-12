/**client/src/components/ui/Card.tsx
 *
 *  Alias de compatibilidad → reexporta GlassCard.
 *  El efecto glass vive en GlassCard / GLASS_BASE (lib/tokens.ts).
 */

import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

interface CardProps {
  children:  ReactNode;
  className?: string;
  padding?:  "none" | "sm" | "md" | "lg";
}

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <GlassCard padding={padding} className={className}>
      {children}
    </GlassCard>
  );
}
