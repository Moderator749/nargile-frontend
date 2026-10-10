"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { adminGetOrder } from "@/lib/adminApi";
import type { AdminOrder } from "@/types";

/**
 * The order as it stands, starting from the row the panel already has.
 *
 * A listing is a page read at a moment; a sheet is opened later and shows one
 * order, which may have gained a customer note, a corrected address or a
 * tracking code since that read. So the sheet re-reads its own order when it
 * opens and swaps it in. There is nothing to wait for and nothing shifts: the
 * row it was handed has the same shape and renders immediately.
 *
 * The answer is used only while it still describes the row it was asked for —
 * an action on the sheet (approve, ship, cancel) hands back a newer row, and
 * that one wins. A failed read is not worth reporting: the row stays, which is
 * what would have been shown anyway.
 */
export function useFreshOrder(row: AdminOrder): AdminOrder {
  const [fresh, setFresh] = useState<AdminOrder | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminGetOrder(row.id, controller.signal)
      .then(setFresh)
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return; // the sheet closed
      });
    return () => controller.abort();
  }, [row.id]);

  const current = fresh?.id === row.id && fresh.status === row.status;
  return current ? (fresh as AdminOrder) : row;
}
