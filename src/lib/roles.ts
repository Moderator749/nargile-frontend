import type { UserRole } from "@/types";

/** Roles the backend admits to /admin endpoints (get_current_admin_user). */
export const ADMIN_ROLES: readonly UserRole[] = ["SUPER_ADMIN", "ADMIN"];

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}
