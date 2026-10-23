import type { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { API_URL } from "@/lib/config";
import { isAdminRole } from "@/lib/roles";
import type { User } from "@/types";

/** Whether two secrets match, in time that does not depend on where they differ. */
function sameSecret(given: string, expected: string): boolean {
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * The catalog's data everywhere — expire: 0, so the next visitor gets fresh
 * data, never the stale menu — and, by name, the pages a brand or homepage
 * edit shows on: every brand and category page and the homepage, in every
 * language, prerendered ones included.
 */
function refresh() {
  revalidateTag("catalog", { expire: 0 });
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/marka/[slug]", "page");
  revalidatePath("/[locale]/catalog/[category]", "page");
}

/**
 * POST /api/revalidate — called by the admin panel after a catalog/menu/brand
 * edit, so the storefront shows it on the next request instead of after the
 * day-long cache window. Only admins (verified with the backend) may trigger
 * it — or the backend itself, with the shared REVALIDATE_SECRET in
 * X-Revalidate-Secret, after work no admin is waiting on (Claude's
 * translation drafts, app/services/auto_translate.py).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = request.headers.get("x-revalidate-secret");
  if (secret && secret.length >= 32 && given && sameSecret(given, secret)) {
    refresh();
    return Response.json({ revalidated: true });
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return Response.json({ revalidated: false }, { status: 401 });

  const me = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: auth }, cache: "no-store" }).catch(
    () => null,
  );
  if (!me?.ok) return Response.json({ revalidated: false }, { status: 401 });
  const user = (await me.json()) as User;
  if (!isAdminRole(user.role)) return Response.json({ revalidated: false }, { status: 403 });

  refresh();
  return Response.json({ revalidated: true });
}
