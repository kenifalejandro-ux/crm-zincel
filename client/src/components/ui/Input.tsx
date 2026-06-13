/**client/src/components/ui/Input.tsx */

import { INPUT_BASE } from "../../lib/tokens";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:   string;
  error?:   string;
  hint?:    string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium gray-100">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent placeholder:text-zinc-200 transition ${error ? "border-red-300 bg-red-50" : "border-white/10 bg-slate-800/60"} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-zinc-200">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";