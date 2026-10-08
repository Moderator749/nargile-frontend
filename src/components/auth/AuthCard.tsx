import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  /** "lg" for a form with sections side by side; "md" for a login. */
  size?: "md" | "lg";
}

export function AuthCard({ title, subtitle, children, footer, size = "md" }: AuthCardProps) {
  return (
    // A login is short enough to centre; a form with sections is not.
    <main className={`flex flex-1 justify-center px-4 py-12 ${size === "lg" ? "items-start" : "items-center"}`}>
      <div className={`w-full ${size === "lg" ? "max-w-3xl" : "max-w-md"}`}>
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-zinc-400">{footer}</p>
      </div>
    </main>
  );
}
