import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const styles = {
  error: "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300",
  success: "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
} as const;

export function Alert({ variant, children }: { variant: keyof typeof styles; children: ReactNode }) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${styles[variant]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
