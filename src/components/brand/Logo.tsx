import Image from "next/image";

/*
 * The brand assets are dark ink on transparency: the hookah emblem (`/logo.png`)
 * and the ~13:1 "NARGİLE MALZEMESİ" wordmark (`/logo_yazi.png`). Under `dark:`
 * the emblem is inverted to white; the wordmark is inverted too, with its red
 * turned back to red, so "MALZEMESİ" reads white and "NARGİLE" stays red.
 * Callers size both through `className` (height and width).
 */

interface AssetProps {
  className: string;
  /** Above the fold (the header): fetch it with the page. */
  preload?: boolean;
}

export function LogoEmblem({ className, preload = false }: AssetProps) {
  return (
    <Image
      src="/logo.png"
      alt="Sultan Nargile"
      width={44}
      height={40}
      preload={preload}
      className={`shrink-0 object-contain dark:invert ${className}`}
    />
  );
}

export function LogoWordmark({ className, preload = false }: AssetProps) {
  return (
    <Image
      src="/logo_yazi.png"
      alt="Sultan Nargile"
      width={265}
      height={20}
      preload={preload}
      className={`w-auto shrink-0 object-contain dark:hue-rotate-180 dark:invert dark:saturate-[2.5] ${className}`}
    />
  );
}

/**
 * Header logo: emblem, then wordmark.
 *
 * The wordmark is sized by the room it has, not by the emblem: at 15px tall it
 * is 199px wide, which with the emblem fits the 256px category column on
 * desktop. A phone has no room for it beside the header's tools, so below `sm`
 * only the emblem shows.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-0 ${className}`}>
      <LogoEmblem preload className="h-9 w-9 sm:h-10 sm:w-10" />
      <LogoWordmark preload className="hidden h-[15px] sm:block" />
    </span>
  );
}
