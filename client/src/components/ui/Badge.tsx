/**client/src/components/ui/Badge.tsx */

type Color = "blue" | "green" | "red" | "yellow" | "orange" | "purple" | "pink" | "gray" | "indigo";

interface BadgeProps {
  color?: Color;
  children: React.ReactNode;
  className?: string;
}

const colors: Record<Color, string> = {
  blue:   "bg-blue-100 text-zinc-800",
  green:  "bg-green-100 text-green-700",
  red:    "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
  pink:   "bg-pink-100 text-pink-700",
  gray:   "bg-gray-100 gray-100",
  indigo: "bg-indigo-100 text-indigo-700",
};

export function Badge({ color = "gray", children, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}