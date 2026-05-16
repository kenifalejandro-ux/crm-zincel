/**client/src/components/ui/Card.tsx */

interface CardProps {
  children:  React.ReactNode;
  className?: string;
  padding?:  "none" | "sm" | "md" | "lg";
}

const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}