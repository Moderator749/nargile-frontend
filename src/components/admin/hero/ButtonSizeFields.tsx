"use client";

import { ArrowRight } from "lucide-react";

import { BUTTON_PREVIEW } from "@/components/home/HeroSlideView";
import { linkButtonClass } from "@/components/ui/LinkButton";
import type { HeroButtonSize } from "@/types";

const BUTTON_SIZES: { value: HeroButtonSize; label: string }[] = [
  { value: "sm", label: "Küçük" },
  { value: "md", label: "Normal" },
  { value: "lg", label: "Büyük" },
];

/** One screen's size: three choices side by side, each showing the button it gives. */
function ButtonSizeChoice({
  label,
  device,
  value,
  onChange,
}: {
  label: string;
  device: "mobile" | "desktop";
  value: HeroButtonSize;
  onChange: (size: HeroButtonSize) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">{label}</legend>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
        {BUTTON_SIZES.map((size) => {
          const on = size.value === value;
          return (
            <button
              key={size.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(size.value)}
              className={`flex flex-col items-center gap-3 rounded-xl border p-3 text-xs font-medium transition-colors ${
                on
                  ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-zinc-400"
              }`}
            >
              {/* The button as the slide shows it at this size. */}
              <span className="flex h-14 items-center" aria-hidden>
                <span className={`${linkButtonClass("primary")} pointer-events-none ${BUTTON_PREVIEW[device][size.value]}`}>
                  Keşfet
                  <ArrowRight className={size.value === "lg" && device === "desktop" ? "h-5 w-5" : size.value === "sm" ? "h-3 w-3" : "h-4 w-4"} />
                </span>
              </span>
              {size.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * The slide's buttons' size, beside their text and links: on a phone and from
 * a tablet up, each a size down, the shop's own or a size up. The canvas
 * above shows the choice at once (its "Mobil" view, the phone's).
 */
export function ButtonSizeFields({
  desktop,
  mobile,
  onChange,
}: {
  desktop: HeroButtonSize;
  mobile: HeroButtonSize;
  onChange: (patch: { button_size_desktop?: HeroButtonSize; button_size_mobile?: HeroButtonSize }) => void;
}) {
  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 p-4 @2xl:grid-cols-2 dark:border-white/10">
      <ButtonSizeChoice
        label="Masaüstü buton boyutu"
        device="desktop"
        value={desktop}
        onChange={(button_size_desktop) => onChange({ button_size_desktop })}
      />
      <ButtonSizeChoice
        label="Mobil buton boyutu"
        device="mobile"
        value={mobile}
        onChange={(button_size_mobile) => onChange({ button_size_mobile })}
      />
    </div>
  );
}
