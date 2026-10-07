import { useId } from "react";

/**
 * Brand mark: a hookah silhouette (bowl with three glowing coals, stem, vase)
 * on a crimson tile. The tile carries its own contrast, so it works on any theme.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-hidden>
      <defs>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="1" stopColor="#991b1b" />
        </linearGradient>
        <radialGradient id={`${id}-ember`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff7ed" />
          <stop offset="1" stopColor="#fecaca" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id}-tile)`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" stroke="#fff" strokeOpacity="0.18" />
      {/* Coals */}
      <circle cx="12.6" cy="6.6" r="1.35" fill={`url(#${id}-ember)`} />
      <circle cx="16" cy="5.9" r="1.35" fill={`url(#${id}-ember)`} />
      <circle cx="19.4" cy="6.6" r="1.35" fill={`url(#${id}-ember)`} />
      {/* Bowl, plate, stem, vase */}
      <g fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 8.6h10l-2.2 3.2h-5.6z" fill="#fff" fillOpacity="0.95" />
        <path d="M10.2 13.6h11.6" />
        <path d="M16 11.8v6.4" />
        <path d="M16 15.6c2.6.2 4.4 1.2 5.6 3" />
        <path d="M13.4 18.2h5.2c2.6 1.4 3.6 3.4 3.1 5.5-.5 2-2.8 3.3-5.7 3.3s-5.2-1.3-5.7-3.3c-.5-2.1.5-4.1 3.1-5.5z" />
      </g>
    </svg>
  );
}

/** Full logo: mark + single-line "Nargile Malzemesi" wordmark (inherits text color). */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-6 w-6 shrink-0" />
      <span className="whitespace-nowrap text-[15px] leading-none tracking-tight">
        <span className="font-semibold">Nargile</span>{" "}
        <span className="font-light text-muted-foreground">Malzemesi</span>
      </span>
    </span>
  );
}
