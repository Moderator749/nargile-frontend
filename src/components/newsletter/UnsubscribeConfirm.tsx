"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import { useMessages } from "@/components/i18n/LocaleProvider";
import Link from "@/components/i18n/Link";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { unsubscribeEmail } from "@/lib/newsletterApi";
import { unsubscribeMessages } from "@/lib/i18n/messages/unsubscribe";

type State = { kind: "working" } | { kind: "done"; email: string } | { kind: "invalid" } | { kind: "failed" };

/**
 * Unsubscribes the link's address as the page opens: one click in the e-mail
 * is all it takes. It is done from here, in the browser, and not by the link
 * itself, because mail security scanners open every link in a message — but
 * do not run a page's scripts.
 */
export function UnsubscribeConfirm({ token }: { token: string }) {
  const m = useMessages(unsubscribeMessages);
  const [state, setState] = useState<State>(token ? { kind: "working" } : { kind: "invalid" });
  const started = useRef(false);

  const run = useCallback(async () => {
    setState({ kind: "working" });
    try {
      setState({ kind: "done", email: await unsubscribeEmail(token) });
    } catch (err) {
      setState(axios.isAxiosError(err) && err.response?.status === 400 ? { kind: "invalid" } : { kind: "failed" });
    }
  }, [token]);

  useEffect(() => {
    // Once, even where React runs effects twice in development.
    if (!token || started.current) return;
    started.current = true;
    void run();
  }, [token, run]);

  const links = (
    <div className="flex flex-col items-center gap-2 pt-2 text-sm font-semibold sm:flex-row sm:justify-center sm:gap-6">
      <Link href="/account" className="text-red-600 hover:underline dark:text-red-400">
        {m.account}
      </Link>
      <Link href="/" className="text-slate-600 hover:underline dark:text-zinc-400">
        {m.home}
      </Link>
    </div>
  );

  if (state.kind === "working") {
    return (
      <p className="flex h-24 items-center justify-center text-sm text-slate-500 dark:text-zinc-400" aria-busy aria-live="polite">
        {m.working}
      </p>
    );
  }
  if (state.kind === "done") {
    return (
      <div className="space-y-4">
        <Alert variant="success">{m.done(state.email)}</Alert>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-400">{m.doneNote}</p>
        {links}
      </div>
    );
  }
  if (state.kind === "invalid") {
    return (
      <div className="space-y-4">
        <Alert variant="error">{m.invalid}</Alert>
        {links}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Alert variant="error">{m.failed}</Alert>
      <Button type="button" onClick={() => void run()}>
        {m.retry}
      </Button>
    </div>
  );
}
