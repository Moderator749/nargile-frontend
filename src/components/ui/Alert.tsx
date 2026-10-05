import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const styles = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
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
