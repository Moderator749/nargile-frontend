import { ShieldCheck } from "lucide-react";

/**
 * The Sistem Yöneticisi's mark (User.is_superadmin): the account above the
 * roles, which no other admin may change. Wherever it appears, its row's
 * controls are hidden from everyone but itself and its peers.
 */
export function SystemAdminBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Bu hesabı yalnızca kendisi ya da başka bir sistem yöneticisi değiştirebilir."
      className={`inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 align-middle text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30 ${className}`}
    >
      <ShieldCheck className="h-3 w-3" aria-hidden />
      Sistem Yöneticisi
    </span>
  );
}
