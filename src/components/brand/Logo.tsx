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
 * desktop. On a phone it takes the width the header's tools leave it — the
 * viewport less 228px — the row's 12px padding each side, the 40px menu
 * button, the 32px emblem, the 68px currency and 40px tracking, and the four
 * 6px gaps — up to that same 199px: 132px on a 360px phone, 162px on a
 * 390px one, the whole of it from 427px. Its height follows its width
 * (h-auto), so it never wraps. The admin panel's header has two more tools
 * on a phone (account, cart), so there it keeps the emblem alone
 * (`emblemOnPhone`).
 */
export function Logo({ className = "", emblemOnPhone = false }: { className?: string; emblemOnPhone?: boolean }) {
  return (
    <span className={`flex items-center gap-0 ${className}`}>
      <LogoEmblem preload className="h-8 w-8 sm:h-10 sm:w-10" />
      <LogoWordmark
        preload
        className={`h-[15px] max-sm:h-auto max-sm:w-[min(199px,calc(100vw_-_228px))] ${emblemOnPhone ? "max-sm:hidden" : ""}`}
      />
    </span>
  );
}
