import { useAuthStore } from "@/store/useAuthStore";

/**
 * Ask the storefront to drop its cached catalog/menu/brands after an admin edit.
 * Best effort: if it fails, the change still shows within the day-long cache window.
 */
export async function refreshStorefront(): Promise<void> {
  const token = useAuthStore.getState().token;
  if (!token) return;
  try {
    await fetch("/api/revalidate", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  } catch {
    // Ignored: see above.
  }
}
