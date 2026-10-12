"use client";

import { useLayoutEffect } from "react";

import { AUTH_HINT_SCRIPT } from "@/lib/auth";
import { SIDEBAR_SCRIPT } from "@/lib/sidebar";
import { THEME_SCRIPT } from "@/lib/theme";

/**
 * Runs the layout's pre-paint scripts (theme, signed-in hint, sidebar state)
 * once, before the browser paints this render.
 *
 * For a page that calls `notFound()` after it has started loading, Next
 * renders the 404 without the layout's `beforeInteractive` scripts in the
 * HTML, so a visitor who chose the dark theme would get a light 404. These are
 * the same constant strings the layout injects — our own code, not input.
 */
export function PrePaintFallback() {
  useLayoutEffect(() => {
    for (const script of [THEME_SCRIPT, AUTH_HINT_SCRIPT, SIDEBAR_SCRIPT]) new Function(script)();
  }, []);
  return null;
}
