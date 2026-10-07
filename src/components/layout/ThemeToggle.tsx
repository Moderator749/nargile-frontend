"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { getResolvedTheme, setPreference, subscribeTheme, type ResolvedTheme } from "@/lib/theme";

const serverSnapshot = (): ResolvedTheme | null => null;

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getResolvedTheme, serverSnapshot);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      // Before hydration the theme is unknown on the server: render a neutral, same-size button.
      aria-label={theme ? (theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç") : "Temayı değiştir"}
      title={theme ? (theme === "dark" ? "Açık tema" : "Koyu tema") : undefined}
      className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {/* Both icons stacked; CSS on <html> (not JS, not a forced-dark section) picks one, so no flash. */}
      <Sun
        className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 [:root.dark_&]:-rotate-90 [:root.dark_&]:scale-0"
        aria-hidden
      />
      <Moon
        className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 [:root.dark_&]:rotate-0 [:root.dark_&]:scale-100"
        aria-hidden
      />
    </button>
  );
}
