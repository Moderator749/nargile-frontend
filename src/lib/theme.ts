// Light/dark theme engine: no dependency, no flash.
// Light unless the visitor chose dark with the toggle: the stored preference is
// "light" | "dark", and absent means light. The operating system's setting
// (prefers-color-scheme) is never read, so a first visit, a private window or
// a cleared browser always opens on the white theme.

export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "theme";
const CHANGE_EVENT = "themechange";

/**
 * Inline, pre-paint script for layout.tsx: applies the `dark` class and native
 * color-scheme before first paint, so there is never a wrong-theme flash. Only
 * a stored "dark" turns it on.
 */
export const THEME_SCRIPT = `try{var d=localStorage.getItem(${JSON.stringify(THEME_KEY)})==="dark";var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(_){}`;

export function getResolvedTheme(): ResolvedTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function apply(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** The toggle's choice, remembered in this browser and applied at once. */
export function setPreference(theme: ResolvedTheme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  apply(theme);
}

/** Subscribe to theme changes (the toggle, here or in another tab). */
export function subscribeTheme(onChange: () => void): () => void {
  // Another tab's toggle: follow it, as this one's own would.
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY || e.key === null) apply(e.newValue === "dark" ? "dark" : "light");
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
