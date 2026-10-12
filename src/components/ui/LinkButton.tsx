import Link from "next/link";
import type { ComponentProps } from "react";

const variants = {
  // Crimson is reserved for the primary action.
  primary: "bg-accent text-white shadow-[0_8px_30px_-8px] shadow-accent/50 hover:bg-accent-hover",
  secondary:
    "bg-background text-foreground ring-1 ring-inset ring-border hover:bg-foreground/[0.04] hover:ring-foreground/20",
  // Frosted glass, for use on dark/imagery backgrounds.
  glass: "bg-white/[0.06] text-white ring-1 ring-inset ring-white/15 backdrop-blur-md hover:bg-white/[0.12] hover:ring-white/25",
} as const;

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: keyof typeof variants };

/** The button's look, for a stand-in that must match it without being a link (an editor preview). */
export const linkButtonClass = (variant: keyof typeof variants = "primary") =>
  `group inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-medium tracking-tight transition-[background-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:active:scale-[0.98] ${variants[variant]}`;

/** A navigation link styled as a call-to-action button. */
export function LinkButton({ variant = "primary", className = "", children, ...props }: LinkButtonProps) {
  return (
    <Link {...props} className={`${linkButtonClass(variant)} ${className}`}>
      {children}
    </Link>
  );
}
