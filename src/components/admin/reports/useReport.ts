"use client";

import { useEffect, useEffectEvent, useState } from "react";
import axios from "axios";

import { getApiErrorMessage } from "@/lib/errors";

interface Loaded<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * One report, fetched again whenever `key` (its filters and options, written
 * out) changes; the request for an old key is cancelled. While a new answer
 * is on its way the last one stays on screen, so nothing jumps.
 */
export function useReport<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);
  const run = useEffectEvent((signal: AbortSignal) => load(signal));

  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal)
      .then((data) => setLoaded({ key, data, error: null }))
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setLoaded({ key, data: null, error: getApiErrorMessage(err, "Rapor yüklenemedi; lütfen yeniden deneyin.") });
      });
    return () => controller.abort();
  }, [key]);

  return {
    data: loaded?.data ?? null,
    error: loaded?.key === key ? loaded.error : null,
    loading: loaded?.key !== key,
  };
}
