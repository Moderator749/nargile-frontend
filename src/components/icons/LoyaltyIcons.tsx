import { useId } from "react";

/** What a perk's mark takes: a lucide icon's props, so the two sit in one table. */
export interface MarkProps {
  className?: string;
  strokeWidth?: number | string;
  /** Accepted for a lucide icon's sake; a mark is always hidden from assistive tech. */
  "aria-hidden"?: boolean | "true" | "false";
}

/** S and P, 12 units tall, side by side on the coin's face. */
const LETTERS =
  "M18.2 15.7C17.3 14.5 16 14 14.6 14C12.5 14 11.1 15.2 11.1 16.9C11.1 18.7 12.6 19.3 14.6 19.9C16.8 20.5 18.2 21.3 18.2 23.1C18.2 24.9 16.7 26 14.6 26C13 26 11.7 25.4 10.8 24.2" +
  "M22.4 26V14H25.6C27.7 14 29.2 15.4 29.2 17.5C29.2 19.6 27.7 21 25.6 21H22.4";

/**
 * SultanPuan's own mark: "SP" struck on a gold coin, its letters embossed —
 * a light edge under them, the rim ringed. One mark for every place the
 * programme is named (the product page's perks, the cart's reward card, the
 * wallet, "Ayrıcalıklar ve Avantajlar", the homepage's advantages card, the
 * admin's loyalty settings), so it reads as the same thing everywhere. Its colours are its own; it does not
 * follow currentColor. Each copy names its gradient with useId, as a page
 * draws it more than once.
 */
export function SultanPuanMark({ className = "" }: MarkProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-gold`} x1="6" y1="4" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.45" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`${id}-face`} x1="20" y1="6" x2="20" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={`url(#${id}-gold)`} />
      <circle cx="20" cy="20" r="15.25" fill={`url(#${id}-face)`} stroke="#92400e" strokeOpacity="0.45" strokeWidth="1" />
      <circle cx="20" cy="20" r="18.4" fill="none" stroke="#fffbeb" strokeOpacity="0.55" strokeWidth="0.8" />
      {/* "SP", drawn rather than set as text, so a page's text does not read
          "SP" twice: a light copy a hair lower is the emboss. */}
      <g fill="none" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round">
        <path d={LETTERS} stroke="#fffbeb" strokeOpacity="0.7" transform="translate(0 0.9)" />
        <path d={LETTERS} stroke="#451a03" />
      </g>
    </svg>
  );
}

/**
 * Kumbara: the round tin money box, a coin over the slot in its lid —
 * saving up, not a pig. Drawn like a lucide icon (24 grid, round
 * strokes, currentColor), to stand beside them.
 */
export function KumbaraIcon({ className = "", strokeWidth = 2 }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* The coin, over the slot. */}
      <circle cx="12" cy="3.5" r="2.5" />
      {/* The tin, the slot in its lid. */}
      <ellipse cx="12" cy="10" rx="8" ry="2.75" />
      <path d="M4 10v8.5c0 1.5 3.6 2.75 8 2.75s8-1.25 8-2.75V10" />
      <path d="M10 10h4" />
    </svg>
  );
}
