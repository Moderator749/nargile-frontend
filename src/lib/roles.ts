import type { UserRole } from "@/types";

/** Roles the backend admits to /admin endpoints (get_current_admin_user). */
export const ADMIN_ROLES: readonly UserRole[] = ["SUPER_ADMIN", "ADMIN"];

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

/**
 * Roles in the panel team (get_current_team_user): the admins, and the staff,
 * who reach the panel for Ekip Kanalı only — every other panel page is
 * get_current_admin_user's and stays the admins'.
 */
export const TEAM_ROLES: readonly UserRole[] = ["SUPER_ADMIN", "ADMIN", "STAFF"];

export function isTeamRole(role: UserRole | null | undefined): boolean {
  return !!role && TEAM_ROLES.includes(role);
}
