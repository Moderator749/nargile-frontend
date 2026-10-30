"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Printer, Truck } from "lucide-react";

import type { OrderActions } from "@/components/admin/orders/useOrderActions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { adminShippingIntegrations, type ShipOrderBody, type ShippingIntegrations } from "@/lib/adminApi";
import { shippingOption } from "@/lib/shipping";
import { CARRIER_LABELS, SHIP_CARRIERS } from "@/lib/tracking";
import type { AdminOrder, Carrier } from "@/types";

/** Who takes it unless the admin says otherwise: what the customer chose at checkout (the server's own default). */
function defaultCarrier(order: AdminOrder): Carrier {
  if (order.shipping_method === "ISTANBUL_FREE") return "OWN";
  if (order.shipping_method === "NAKLIYE_AMBARI" || order.shipping_method === "INTERNATIONAL_FREIGHT") return "OTHER";
  return "YURTICI";
}

export const labelHref = (order: Pick<AdminOrder, "id">) => `/admin/orders/${order.id}/etiket`;

const choice =
  "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors duration-200 has-[:checked]:border-red-600 has-[:checked]:bg-red-50 dark:has-[:checked]:bg-red-500/10";
const idle = "border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5";

/**
 * "Kargola": who takes the parcel and how it is tracked, in place of the old
 * one-line prompt. Yurtiçi can be registered through its web service when it
 * is connected — the label then carries our cargo key as a barcode and the
 * tracking number arrives once the branch scans it — or take a tracking code
 * typed in; another carrier or ambar is named; the shop's own van needs
 * nothing. One dialog per page, for whichever order `actions.shipping` holds.
 */
export function ShipDialog({ actions }: { actions: OrderActions }) {
  const order = actions.shipping;
  return (
    <Dialog open={order !== null} onClose={actions.closeShip} title={order ? `Kargola · ${order.order_number}` : "Kargola"}>
      {/* Keyed on the order, so a dialog opened for the next one starts clean. */}
      {order && <ShipForm key={order.id} order={order} actions={actions} />}
    </Dialog>
  );
}

function ShipForm({ order, actions }: { order: AdminOrder; actions: OrderActions }) {
  const [integrations, setIntegrations] = useState<ShippingIntegrations | null>(null);
  const [carrier, setCarrier] = useState<Carrier>(() => defaultCarrier(order));
  // null until the integrations are known: then the web service when it is connected.
  const [viaApi, setViaApi] = useState<boolean | null>(null);
  const [code, setCode] = useState(order.tracking_code ?? "");
  const [carrierName, setCarrierName] = useState(order.freight_company_name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState<AdminOrder | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminShippingIntegrations(controller.signal)
      .then(setIntegrations)
      .catch(() => setIntegrations({ yurtici_api: false, yurtici_test_mode: false, yurtici_customer_code: null }));
    return () => controller.abort();
  }, []);

  const apiAvailable = !!integrations?.yurtici_api;
  const useApi = carrier === "YURTICI" && apiAvailable && (viaApi ?? true);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const body: ShipOrderBody = useApi
      ? { carrier, use_api: true }
      : {
          carrier,
          tracking_code: carrier === "OWN" ? null : code.trim() || null,
          carrier_name: carrier === "OTHER" ? carrierName.trim() || null : null,
        };
    try {
      const shipped = await actions.confirmShip(order, body);
      // Registered with Yurtiçi: the label is the next thing the admin needs.
      if (shipped.cargo_key) setRegistered(shipped);
      else actions.closeShip();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kargoya verilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (registered) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          Yurtiçi gönderi kaydı açıldı. Kargo anahtarı{" "}
          <strong className="font-mono">{registered.cargo_key}</strong>. Etiketi yazdırıp koliye yapıştırın; takip numarası
          şube etiketi okuttuğunda kendiliğinden gelir.
        </Alert>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" className="w-auto!" onClick={actions.closeShip}>
            Kapat
          </Button>
          <Link
            href={labelHref(registered)}
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500"
          >
            <Printer className="h-4 w-4" aria-hidden /> Etiketi Yazdır
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-zinc-400">
        Müşterinin seçimi: <strong>{shippingOption(order.shipping_method).title}</strong>
        {order.shipping_branch_name && <> · şube: {order.shipping_branch_name}</>}
      </p>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Kargo firması
        </legend>
        {SHIP_CARRIERS.map((value) => (
          <label key={value} className={`${choice} ${idle}`}>
            <input
              type="radio"
              name="carrier"
              value={value}
              checked={carrier === value}
              onChange={() => setCarrier(value)}
              className="mt-0.5 accent-red-600"
            />
            <span className="font-medium">{CARRIER_LABELS[value]}</span>
          </label>
        ))}
      </fieldset>

      {carrier === "YURTICI" && apiAvailable && (
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Yurtiçi kaydı{" "}
            {integrations?.yurtici_test_mode && (
              <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                TEST
              </span>
            )}
          </legend>
          <label className={`${choice} ${idle}`}>
            <input type="radio" name="mode" checked={useApi} onChange={() => setViaApi(true)} className="mt-0.5 accent-red-600" />
            <span>
              <span className="font-medium">Web servis ile gönderi oluştur</span>
              <span className="block text-xs text-slate-500 dark:text-zinc-400">
                Barkodlu etiket yazdırılır; takip numarası şube okuttuğunda gelir.
              </span>
            </span>
          </label>
          <label className={`${choice} ${idle}`}>
            <input type="radio" name="mode" checked={!useApi} onChange={() => setViaApi(false)} className="mt-0.5 accent-red-600" />
            <span className="font-medium">Takip numarasını elle gir</span>
          </label>
        </fieldset>
      )}

      {carrier === "OTHER" && (
        <Input
          label="Kargo firması / ambar"
          value={carrierName}
          onChange={(e) => setCarrierName(e.target.value)}
          maxLength={100}
          placeholder="Örn. Aras Kargo, Kardeşler Nakliyat"
        />
      )}
      {carrier !== "OWN" && !useApi && (
        <Input
          label="Takip numarası"
          hint={carrier === "YURTICI" ? "Yurtiçi gönderi kodu; müşteri takip bağlantısını e-postada alır." : "Yoksa boş bırakın."}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={100}
          className="font-mono"
          autoFocus
        />
      )}
      {carrier === "OWN" && (
        <p className="text-sm text-slate-600 dark:text-zinc-400">Kendi aracımızla teslim: takip numarası gerekmez.</p>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" className="w-auto!" onClick={actions.closeShip}>
          Vazgeç
        </Button>
        <Button type="submit" className="w-auto!" loading={submitting} disabled={integrations === null && carrier === "YURTICI"}>
          <Truck className="h-4 w-4" aria-hidden /> {useApi ? "Gönderi Oluştur ve Kargola" : "Kargoya Ver"}
        </Button>
      </div>
    </form>
  );
}
