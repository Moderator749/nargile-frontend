// Light/dark theme engine: no dependency, no flash.
// The stored preference is "light" | "dark"; absent means "follow the system".

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "theme";
const CHANGE_EVENT = "themechange";

/**
 * Inline, pre-paint script for layout.tsx: applies the `dark` class and native
 * color-scheme before first paint, so there is never a wrong-theme flash.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(_){}`;

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getPreference(): ThemePreference {
  try {
    const t = window.localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

export function getResolvedTheme(): ResolvedTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function apply(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setPreference(pref: ThemePreference) {
  try {
    if (pref === "system") window.localStorage.removeItem(THEME_KEY);
    else window.localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  apply(pref === "system" ? systemTheme() : pref);
}

/** Subscribe to theme changes (user toggle, or OS change while following the system). */
export function subscribeTheme(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (getPreference() === "system") apply(systemTheme());
  };
  media.addEventListener("change", onSystem);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onSystem);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
