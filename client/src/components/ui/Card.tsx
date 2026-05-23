/**client/src/components/ui/Card.tsx */

interface CardProps {
  children:  React.ReactNode;
  className?: string;
  padding?:  "none" | "sm" | "md" | "lg";
}

const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_6px_20px_rgba(0,0,0,0.06)] ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}