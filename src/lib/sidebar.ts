import { ROOT_ROUTES, isRootSlugPath } from "@/lib/rootRoutes";

/**
 * Whether the category column is open, remembered per visitor. Closed until the
 * visitor opens it: the homepage's hero then has the two promo boxes beside it
 * (see `HeroAside`), and the red "KATEGORİLER" button brings the column back.
 *
 * The catalog's own pages and "Fırsat Ürünleri" are the exception
 * (`opensByDefault`): there the column is the way around, so every arrival on
 * one opens it, whatever was chosen before — a category's page included,
 * now at the root (/<slug>). Product pages, at the root too, are the opposite
 * exception (`closesByDefault`): the product is what the visitor came for, so
 * every arrival closes it, and opening it there gives the column the room of
 * the advantages beside the price (see `ProductDetail`). On either kind, the
 * choice holds for that page and is not remembered — the homepage keeps the
 * visitor's own choice.
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

/** The catalog, the brand pages and the deals: they open with the column showing. */
const OPEN_BY_DEFAULT = /^\/(?:(?:en|ar)\/)?(?:catalog|marka|firsat-urunleri)(?:\/|$)/;

/**
 * A category's page and a product's are both /<slug> (lib/rootRoutes): which
 * one an address is, the category list says. The layout writes it into the
 * page as `window.__shelves` (SHELVES_SCRIPT), ahead of the script below, so
 * the column is right before the first paint: open on a category, closed on a
 * product. Without the list (a 404 drawn without the layout), a slug is taken
 * for a product's.
 */
const ROOT_SLUG = `^/(?:(?:en|ar)/)?(?!(?:${ROOT_ROUTES.join("|")})/?$)([^/]+)/?$`;

declare global {
  interface Window {
    __shelves?: string[];
  }
}

/** The slug of a root page (/<slug>, /en/<slug>), or null. */
function rootSlug(pathname: string): string | null {
  return isRootSlugPath(pathname) ? pathname.split("/").filter(Boolean).pop()! : null;
}

const isShelf = (slug: string | null) =>
  slug !== null && typeof window !== "undefined" && (window.__shelves ?? []).includes(slug);

export const opensByDefault = (pathname: string) => OPEN_BY_DEFAULT.test(pathname) || isShelf(rootSlug(pathname));
export const closesByDefault = (pathname: string) => {
  const slug = rootSlug(pathname);
  return slug !== null && !isShelf(slug);
};

/** The category slugs for the pre-paint script, written by the layout before it. */
export const shelvesScript = (slugs: string[]) =>
  `window.__shelves=${JSON.stringify(slugs).replace(/</g, "\\u003c")};`;

/** Runs in <head>: sets the attribute before anything is painted. */
export const SIDEBAR_SCRIPT = `try{var p=location.pathname,m=new RegExp(${JSON.stringify(ROOT_SLUG)}).exec(p),s=m&&(window.__shelves||[]).indexOf(decodeURIComponent(m[1]))>=0;if(!${OPEN_BY_DEFAULT}.test(p)&&!s&&(m||localStorage.getItem(${JSON.stringify(KEY)})!=="0")){document.documentElement.setAttribute(${JSON.stringify(ATTRIBUTE)},${JSON.stringify(COLLAPSED)})}}catch(_){}`;

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
  // On a catalog, deals or product page the next arrival sets it anyway: nothing to remember.
  const { pathname } = window.location;
  if (opensByDefault(pathname) || closesByDefault(pathname)) return;
  try {
    window.localStorage.setItem(KEY, collapsed ? "1" : "0");
  } catch {
    // Storage blocked: the choice still holds for this page view.
  }
}

/**
 * Before "KATEGORİLER" opens the column from down the page: the column opens
 * where it stands, beside the hero at the top, out of sight from there — so
 * the page glides back up to it first (at once, with reduced motion). Not
 * where it keeps itself in view (the catalog's, sticky under the header), nor
 * while its row's top is still on screen.
 */
export function scrollToSidebar() {
  const column = document.querySelector<HTMLElement>(".category-sidebar");
  const row = column?.parentElement;
  if (!column || !row || getComputedStyle(column).position === "sticky") return;
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 0;
  if (row.getBoundingClientRect().top >= header) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}

/**
 * The column as a page should open with, for a client-side navigation (the
 * pre-paint script covers a full load): open on the catalog's pages, a
 * category's and the deals, closed on a product's, else the visitor's
 * remembered choice.
 */
export function applySidebarFor(pathname: string) {
  const collapsed = !opensByDefault(pathname) && (closesByDefault(pathname) || rememberedCollapsed());
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
