/**
 * Whether the category column is open, remembered per visitor. Closed until the
 * visitor opens it: the homepage's hero then has the two promo boxes beside it
 * (see `HeroAside`), and the red "KATEGORİLER" button brings the column back.
 *
 * The catalog's own pages are the exception (`opensByDefault`): there the
 * column is the way around, so every arrival on one opens it, whatever was
 * chosen before. Closing it there holds for that page and is not remembered —
 * the homepage keeps the visitor's own choice.
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

/** The catalog, its categories and the brand pages: they open with the column showing. */
const OPEN_BY_DEFAULT = /^\/(?:catalog|marka)(?:\/|$)/;

export const opensByDefault = (pathname: string) => OPEN_BY_DEFAULT.test(pathname);

/** Runs in <head>: sets the attribute before anything is painted. */
export const SIDEBAR_SCRIPT = `try{if(!${OPEN_BY_DEFAULT}.test(location.pathname)&&localStorage.getItem(${JSON.stringify(KEY)})!=="0"){document.documentElement.setAttribute(${JSON.stringify(ATTRIBUTE)},${JSON.stringify(COLLAPSED)})}}catch(_){}`;

/** The visitor's remembered choice: collapsed unless they opened it. */
function rememberedCollapsed(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

function apply(collapsed: boolean) {
  const root = document.documentElement;
  if (collapsed) root.setAttribute(ATTRIBUTE, COLLAPSED);
  else root.removeAttribute(ATTRIBUTE);
  window.dispatchEvent(new Event(EVENT));
}

export function isSidebarCollapsed(): boolean {
  return document.documentElement.getAttribute(ATTRIBUTE) === COLLAPSED;
}

export function setSidebarCollapsed(collapsed: boolean) {
  apply(collapsed);
  // On a catalog page the next arrival opens it anyway: nothing to remember.
  if (opensByDefault(window.location.pathname)) return;
  try {
    window.localStorage.setItem(KEY, collapsed ? "1" : "0");
  } catch {
    // Storage blocked: the choice still holds for this page view.
  }
}

/**
 * The column as a page should open with, for a client-side navigation (the
 * pre-paint script covers a full load): open on the catalog's pages, else the
 * visitor's remembered choice.
 */
export function applySidebarFor(pathname: string) {
  const collapsed = !opensByDefault(pathname) && rememberedCollapsed();
  if (collapsed !== isSidebarCollapsed()) apply(collapsed);
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
