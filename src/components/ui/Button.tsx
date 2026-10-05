import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500",
  secondary: "bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: keyof typeof variants;
}

export function Button({
  loading = false,
  variant = "primary",
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${variants[variant]} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
