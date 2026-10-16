"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { ArrowLeft, Lock } from "lucide-react";

import { formatMoney } from "@/lib/format";
import type { PaytrPage } from "@/lib/paytr";

declare global {
  interface Window {
    iFrameResize?: (options: Record<string, unknown>, target: string | HTMLElement) => void;
  }
}

/**
 * PayTR's payment page, in place of the checkout form. PayTR's own
 * iframeResizer keeps the frame exactly as tall as the page inside it, so
 * there is never a second scrollbar; until it loads, the frame holds a height
 * that fits PayTR's card form, so nothing below jumps.
 *
 * When the customer finishes, PayTR sends the frame to the order's
 * confirmation page, which steps out of the frame and shows what PayTR's
 * notification decided. Going back from here leaves the order unpaid; it is
 * released automatically once the payment page has expired.
 */
export function PaytrFrame({
  page,
  orderNumber,
  onBack,
}: {
  page: PaytrPage;
  orderNumber: string;
  onBack: () => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);

  // The script may already be on the page from an earlier attempt.
  useEffect(() => {
    if (window.iFrameResize && frame.current) window.iFrameResize({}, frame.current);
  }, [page.token]);

  return (
    <section aria-labelledby="paytr-heading" className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="paytr-heading" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Lock className="h-5 w-5 text-emerald-600" aria-hidden /> Kart ile güvenli ödeme
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
            Sipariş <span className="font-mono font-semibold">{orderNumber}</span> · Ödenecek tutar{" "}
            <strong className="font-mono">{formatMoney(page.amount)}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 dark:text-zinc-300 dark:ring-white/15 dark:hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Ödeme yöntemini değiştir
        </button>
      </div>

      {page.test_mode && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/30">
          Test modu: PayTR test kartlarıyla deneyin; kartınızdan çekim yapılmaz.
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10">
        <iframe
          ref={frame}
          id="paytriframe"
          title="PayTR güvenli ödeme sayfası"
          src={page.iframe_url}
          className="block min-h-[640px] w-full border-0"
          scrolling="no"
          allow="payment"
        />
      </div>
      <p className="mt-3 text-center text-xs text-slate-500 dark:text-zinc-400">
        Kart bilgileriniz PayTR&apos;ın güvenli sayfasında işlenir; tarafımıza ulaşmaz.
      </p>

      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js"
        strategy="afterInteractive"
        onReady={() => {
          if (window.iFrameResize && frame.current) window.iFrameResize({}, frame.current);
        }}
      />
    </section>
  );
}
