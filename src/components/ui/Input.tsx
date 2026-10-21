"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { uiMessages } from "@/lib/i18n/messages/layout";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function Input({ label, hint, type = "text", id, className = "", ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);
  const m = useMessages(uiMessages);

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={isPassword && revealed ? "text" : type}
          aria-describedby={hintId}
          className={`block h-11 w-full rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 text-sm text-slate-900 dark:text-zinc-100 shadow-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:bg-slate-100 dark:disabled:bg-white/5 ${isPassword ? "pe-10" : ""} ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? m.hidePassword : m.showPassword}
            className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-400"
          >
            {revealed ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-slate-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
    </div>
  );
}
