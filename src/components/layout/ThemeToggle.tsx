"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { chromeMessages } from "@/lib/i18n/messages/layout";
import { getResolvedTheme, setPreference, subscribeTheme, type ResolvedTheme } from "@/lib/theme";

const serverSnapshot = (): ResolvedTheme | null => null;

/** Light or dark. `className` places and sizes it (36px in the header, 40px in a phone's drawer). */
export function ThemeToggle({ className = "h-9 w-9" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, getResolvedTheme, serverSnapshot);
  const next = theme === "dark" ? "light" : "dark";
  const m = useMessages(chromeMessages);

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      // Before hydration the theme is unknown on the server: render a neutral, same-size button.
      aria-label={theme ? (theme === "dark" ? m.themeToLight : m.themeToDark) : m.themeToggle}
      title={theme ? (theme === "dark" ? m.themeLight : m.themeDark) : undefined}
      className={`relative flex shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
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
