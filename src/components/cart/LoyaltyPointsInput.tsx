"use client";

import { useState } from "react";
import { Coins } from "lucide-react";

import { formatMoney } from "@/lib/format";

interface LoyaltyPointsInputProps {
  balance: number;
  value: number;
  onChange: (points: number) => void;
  /** TRY per point, from the live loyalty parameters. */
  conversionRate: string;
}

/** "Sultan Puan Kullan": redeem points, clamped to the balance. */
export function LoyaltyPointsInput({ balance, value, onChange, conversionRate }: LoyaltyPointsInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  if (balance <= 0) {
    return (
      <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
        <Coins className="h-4 w-4" aria-hidden /> Kullanılabilir puanınız bulunmuyor.
      </p>
    );
  }

  function commit(raw: string) {
    const n = raw === "" ? 0 : Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0) {
      setWarning("Geçerli bir puan girin.");
    } else if (n > balance) {
      setWarning(`Bakiyeniz ${balance} puan; en fazla bu kadar kullanabilirsiniz.`);
      onChange(balance);
    } else {
      setWarning(null);
      onChange(n);
    }
    setDraft(null);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="loyalty-points" className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-zinc-300">
          <Coins className="h-4 w-4 text-red-500" aria-hidden /> Sultan Puan Kullan
        </label>
        <span className="text-xs text-slate-500 dark:text-zinc-400">
          Bakiye: <strong className="text-slate-700 dark:text-zinc-300">{balance.toLocaleString("tr-TR")}</strong> puan
        </span>
      </div>
      <div className="flex gap-2">
        <input
          id="loyalty-points"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="h-10 min-w-0 flex-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-white/15 px-3 text-sm tabular-nums focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          value={draft ?? (value ? String(value) : "")}
          placeholder="0"
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          onBlur={(e) => commit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-describedby="loyalty-points-help"
        />
        <button
          type="button"
          onClick={() => {
            setDraft(null);
            setWarning(null);
            onChange(value === balance ? 0 : balance);
          }}
          className="h-10 shrink-0 rounded-lg border border-slate-300 dark:border-white/15 px-3 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
        >
          {value === balance ? "Kaldır" : "Tümünü kullan"}
        </button>
      </div>
      <p id="loyalty-points-help" className={`text-xs ${warning ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-zinc-400"}`}>
        {warning ?? `1 Sultan Puan = ${formatMoney(conversionRate)} · kargo hariç tutara uygulanır.`}
      </p>
    </div>
  );
}
