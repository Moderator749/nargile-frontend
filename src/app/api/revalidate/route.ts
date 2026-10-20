import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

import { API_URL } from "@/lib/config";
import { isAdminRole } from "@/lib/roles";
import type { User } from "@/types";

/**
 * POST /api/revalidate — called by the admin panel after a catalog/menu/brand
 * edit, so the storefront shows it on the next request instead of after the
 * day-long cache window. Only admins (verified with the backend) may trigger it.
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return Response.json({ revalidated: false }, { status: 401 });

  const me = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: auth }, cache: "no-store" }).catch(
    () => null,
  );
  if (!me?.ok) return Response.json({ revalidated: false }, { status: 401 });
  const user = (await me.json()) as User;
  if (!isAdminRole(user.role)) return Response.json({ revalidated: false }, { status: 403 });

  // expire: 0 — the next visitor gets fresh data, never the stale menu.
  revalidateTag("catalog", { expire: 0 });
  return Response.json({ revalidated: true });
}
