/**
 * Whether the category column is open, remembered per visitor. Closed until the
 * visitor opens it: the homepage's hero then has the two promo boxes beside it
 * (see `HeroAside`), and the red "KATEGORİLER" button brings the column back.
 *
 * Kept in localStorage and mirrored onto `<html data-sidebar>` by a script that
 * runs before first paint — the same trick this app uses for the theme and the
 * logged-in hint. The column is then hidden by CSS (see globals.css), so a
 * visitor who collapsed it never sees it flash open, and the content beside it
 * widens without React re-rendering anything.
 */

const KEY = "sidebar-collapsed";
const EVENT = "sidebar-toggle";
const ATTRIBUTE = "data-sidebar";
const COLLAPSED = "collapsed";

/** Runs in <head>: sets the attribute before anything is painted. */
export const SIDEBAR_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(KEY)})!=="0"){document.documentElement.setAttribute(${JSON.stringify(ATTRIBUTE)},${JSON.stringify(COLLAPSED)})}}catch(_){}`;

export function isSidebarCollapsed(): boolean {
  return document.documentElement.getAttribute(ATTRIBUTE) === COLLAPSED;
}

export function setSidebarCollapsed(collapsed: boolean) {
  const root = document.documentElement;
  if (collapsed) root.setAttribute(ATTRIBUTE, COLLAPSED);
  else root.removeAttribute(ATTRIBUTE);
  try {
    window.localStorage.setItem(KEY, collapsed ? "1" : "0");
  } catch {
    // Storage blocked: the choice still holds for this page view.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Subscribe to toggles in this tab and (via `storage`) in other tabs. */
export function subscribeSidebar(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
