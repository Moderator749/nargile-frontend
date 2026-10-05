"use client";

import { useState } from "react";
import { Coins } from "lucide-react";

interface LoyaltyPointsInputProps {
  balance: number;
  value: number;
  onChange: (points: number) => void;
}

/** ParaPuan redemption, clamped to the user's balance (1 point = ₺1). */
export function LoyaltyPointsInput({ balance, value, onChange }: LoyaltyPointsInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  if (balance <= 0) {
    return (
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Coins className="h-4 w-4" aria-hidden /> ParaPuan bakiyeniz bulunmuyor.
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
        <label htmlFor="loyalty-points" className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <Coins className="h-4 w-4 text-amber-500" aria-hidden /> ParaPuan kullan
        </label>
        <span className="text-xs text-slate-500">
          Bakiye: <strong className="text-slate-700">{balance.toLocaleString("tr-TR")}</strong> puan
        </span>
      </div>
      <div className="flex gap-2">
        <input
          id="loyalty-points"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
          className="h-10 shrink-0 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          {value === balance ? "Kaldır" : "Tümünü kullan"}
        </button>
      </div>
      <p id="loyalty-points-help" className={`text-xs ${warning ? "text-amber-700" : "text-slate-500"}`}>
        {warning ?? "1 ParaPuan = ₺1. Kargo hariç tutara uygulanır."}
      </p>
    </div>
  );
}
