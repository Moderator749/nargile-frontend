"use client";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelledBy: string;
  describedBy?: string;
  disabled?: boolean;
  /**
   * What "on" looks like. "brand" (the default) is the crimson used across the
   * admin; "success" is for a list of rules, where green reads as "evet" at a
   * glance and crimson would read as a warning.
   */
  tone?: "brand" | "success";
}

export function Switch({ checked, onChange, labelledBy, describedBy, disabled, tone = "brand" }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? tone === "success"
            ? "bg-emerald-500"
            : "bg-red-600"
          : "bg-slate-300 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          // The track fills from the reading side: in Arabic the thumb starts at the right.
          checked ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"
        }`}
      />
    </button>
  );
}
