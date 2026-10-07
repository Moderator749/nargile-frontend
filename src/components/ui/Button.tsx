import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-red-600 text-white shadow-sm hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400",
  success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-600 dark:bg-emerald-500",
  secondary: "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 ring-1 ring-slate-300 dark:ring-white/15 hover:bg-slate-50 dark:hover:bg-white/5",
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
      className={`flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors duration-300 ${variants[variant]} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
