"use client";

import { useEffect, useState } from "react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import Link from "@/components/i18n/Link";
import { B2BApplicationPanel } from "@/components/account/B2BApplicationPanel";
import { CommunicationPreferencesPanel } from "@/components/account/CommunicationPreferencesPanel";
import { WalletPanel } from "@/components/account/WalletPanel";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/errors";
import { accountMessages } from "@/lib/i18n/messages/account";
import { fetchMyWallet } from "@/lib/ordersApi";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { Wallet } from "@/types";

/** "Hesabım": profile basics and the Sultan Puan wallet. */
export function AccountView() {
  const m = useMessages(accountMessages);
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    const controller = new AbortController();
    fetchMyWallet(controller.signal)
      .then(setWallet)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, m.walletFailed));
      });
    return () => controller.abort();
  }, [hydrated, token, m.walletFailed]);

  if (!hydrated) return <main className="flex-1" aria-busy />;
  if (!user) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">{m.title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{m.signInToContinue}</p>
        <Link href="/login?next=/account" className="mt-6 inline-flex h-11 items-center rounded-lg bg-red-600 px-6 text-sm font-semibold text-white hover:bg-red-500">
          {m.signIn}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{m.title}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        {user.full_name ? `${user.full_name} · ` : ""}
        {user.email}
      </p>

      {/* Only retail customers can apply; B2B customers already have their segment. */}
      {(!user.segment_code || user.segment_code === "RETAIL") && (
        <div className="mt-8">
          <B2BApplicationPanel />
        </div>
      )}

      <h2 className="mt-10 text-lg font-bold tracking-tight">{m.wallet}</h2>
      <div className="mt-4">
        {error ? (
          <Alert variant="error">{error}</Alert>
        ) : wallet ? (
          <WalletPanel wallet={wallet} />
        ) : (
          <div className="h-40 rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
        )}
      </div>

      <div className="mt-10">
        <CommunicationPreferencesPanel />
      </div>

      <p className="mt-10 text-sm">
        <Link href="/orders" className="font-medium text-red-600 hover:underline dark:text-red-400">
          {m.orders} <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
        </Link>
      </p>
    </main>
  );
}
