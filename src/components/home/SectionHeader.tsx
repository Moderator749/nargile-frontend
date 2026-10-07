import type { ReactNode } from "react";

interface SectionHeaderProps {
  id: string;
  eyebrow: string;
  title: string;
  action?: ReactNode;
}

/** Small spaced eyebrow over a large, tightly tracked heading. No body copy. */
export function SectionHeader({ id, eyebrow, title, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
        <h2
          id={id}
          className="mt-4 text-balance text-4xl font-semibold tracking-tighter text-foreground sm:text-5xl"
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
