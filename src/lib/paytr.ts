import { api } from "@/lib/api";
import type { DecimalString, UUID } from "@/types";

/** Whether card payment is open: PayTR is configured on the server. */
export interface PaytrStatus {
  enabled: boolean;
  test_mode: boolean;
}

/** A PayTR payment page opened for one card order. */
export interface PaytrPage {
  token: string;
  iframe_url: string;
  merchant_oid: string;
  amount: DecimalString;
  test_mode: boolean;
}

export async function fetchPaytrStatus(signal?: AbortSignal): Promise<PaytrStatus> {
  const { data } = await api.get<PaytrStatus>("/payments/paytr/status", { signal });
  return data;
}

/**
 * Opens PayTR's payment page for an unpaid card order. The amount is the
 * order's own, priced by checkout; the server signs the request. If PayTR
 * refuses, the server releases the order and this throws its reason.
 */
export async function openPaytrPage(orderId: UUID): Promise<PaytrPage> {
  const { data } = await api.post<PaytrPage>("/payments/paytr/token", { order_id: orderId });
  return data;
}
