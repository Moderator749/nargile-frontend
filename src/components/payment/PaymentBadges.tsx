/**
 * The ways to pay, as small marks on white chips: the card schemes checkout
 * takes and the payment institution behind the card form. Drawn here (wordmarks
 * and the Mastercard circles), not images, so they are crisp and load nothing.
 * White in both themes: they are the schemes' own colours, on their own ground.
 *
 * `compact`: the smaller row under checkout's pay button; the footer's is the full size.
 */
export function PaymentBadges({ label, compact = false, className = "" }: { label: string; compact?: boolean; className?: string }) {
  const chip = compact
    ? "flex h-6 items-center justify-center rounded bg-white px-2 shadow-sm ring-1 ring-black/5"
    : "flex h-8 items-center justify-center rounded-md bg-white px-3 shadow-sm";
  const text = compact ? "text-[11px]" : "text-[13px]";
  return (
    <ul aria-label={label} className={`flex flex-wrap items-center justify-center ${compact ? "gap-1.5" : "gap-2"} ${className}`}>
      <li className={chip}>
        <span className={`${text} font-extrabold tracking-tight text-[#1b75bb]`}>
          Pay<span className="text-[#1e3a5f]">TR</span>
        </span>
      </li>
      <li className={chip}>
        <span className={`${compact ? "text-[12px]" : "text-[15px]"} font-black italic tracking-tight text-[#1a1f71]`}>VISA</span>
      </li>
      <li className={chip} aria-label="Mastercard">
        <svg viewBox="0 0 38 24" className={compact ? "h-4 w-6" : "h-5 w-8"} aria-hidden>
          <circle cx="14" cy="12" r="9" fill="#eb001b" />
          <circle cx="24" cy="12" r="9" fill="#f79e1b" />
          <path d="M19 4.6a9 9 0 0 1 0 14.8 9 9 0 0 1 0-14.8z" fill="#ff5f00" />
        </svg>
      </li>
      <li className={chip}>
        <span className={`${compact ? "text-[12px]" : "text-[14px]"} font-extrabold lowercase tracking-tight text-[#00a0a6]`}>troy</span>
      </li>
    </ul>
  );
}
