import { Switch } from "@/components/ui/Switch";

/**
 * One "Evet / Hayır" rule of the sheet. The state is also spelled out in words:
 * a toggle alone is ambiguous on a dense form full of them.
 */
export function RuleSwitch({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashed border-slate-200 py-2.5 last:border-b-0 dark:border-white/10">
      <span className="min-w-0">
        <span id={id} className="block text-sm font-medium">
          {label}
        </span>
        {hint && (
          <span id={`${id}-hint`} className="mt-0.5 block text-[11px] leading-4 text-slate-500 dark:text-zinc-400">
            {hint}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span
          className={`w-9 text-right text-xs font-semibold ${
            checked ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500"
          }`}
          aria-hidden
        >
          {checked ? "Evet" : "Hayır"}
        </span>
        <Switch
          checked={checked}
          onChange={onChange}
          labelledBy={id}
          describedBy={hint ? `${id}-hint` : undefined}
          tone="success"
        />
      </span>
    </div>
  );
}
