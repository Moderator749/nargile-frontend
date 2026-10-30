"use client";

import { useCallback, useState } from "react";

import {
  adminApproveOrder,
  adminCancelOrder,
  adminDeliverInStore,
  adminRecoverOrder,
  adminRefreshShipment,
  adminReturnOrder,
  adminSetInternalNote,
  adminShipOrder,
  adminWithdrawShipment,
  type ShipOrderBody,
} from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import type { AdminOrder, OrderStatus } from "@/types";

/** Waiting for money or for an admin's approval. The server enforces all three
 * rules below with a 409, so these only decide what to offer. A card order
 * waiting for PayTR is approvable too: if PayTR's notification never arrives,
 * an admin who sees the payment in the PayTR panel can still mark it paid. */
const PENDING: OrderStatus[] = ["PENDING_APPROVAL", "AWAITING_TRANSFER", "AWAITING_PAYMENT"];

export function canApproveOrder(status: OrderStatus): boolean {
  return PENDING.includes(status);
}

/** Anything that has not left the warehouse, including an order already paid. */
export function canCancelOrder(status: OrderStatus): boolean {
  return PENDING.includes(status) || status === "APPROVED";
}

/** Paid and still here: ready to hand to the carrier — or to the customer at the shop. */
export function canShipOrder(status: OrderStatus): boolean {
  return status === "APPROVED";
}

/** Gone out (shipped or delivered): what comes back now is an İade, not a cancellation. */
export function canReturnOrder(status: OrderStatus): boolean {
  return status === "SHIPPED" || status === "DELIVERED";
}

/** "Siparişi Kurtar": a cancellation can be undone (a failed card payment cannot: that customer never paid). */
export function canRecoverOrder(status: OrderStatus): boolean {
  return status === "CANCELLED";
}

/** The İade or "Siparişi Kurtar" dialog, and the order it is open for. */
export interface OrderDecision {
  kind: "return" | "recover";
  order: AdminOrder;
}

export interface OrderNotice {
  kind: "success" | "error";
  text: string;
}

/** Applies the server's answer to the row the admin acted on. */
export type OrderPatch = (id: string, changes: Partial<AdminOrder>) => void;

/** A web-service shipment registered with the carrier and not yet collected: it can be withdrawn. */
export function canWithdrawShipment(order: AdminOrder): boolean {
  return order.status === "SHIPPED" && !!order.cargo_key && order.carrier_status === "NOP";
}

export interface OrderActions {
  busy: (id: string) => boolean;
  notice: (id: string) => OrderNotice | undefined;
  approve: (order: AdminOrder) => Promise<void>;
  cancel: (order: AdminOrder) => Promise<void>;
  /** "Kargola": opens the dialog for this order (see ShipDialog). */
  ship: (order: AdminOrder) => void;
  /** The order the "Kargola" dialog is open for, if any. */
  shipping: AdminOrder | null;
  closeShip: () => void;
  /** Sends the dialog's answer; resolves to the shipped order, or rejects with the server's reason. */
  confirmShip: (order: AdminOrder, body: ShipOrderBody) => Promise<AdminOrder>;
  refreshShipment: (order: AdminOrder) => Promise<void>;
  withdrawShipment: (order: AdminOrder) => Promise<void>;
  /** "Mağazadan Teslim": asks, then marks an approved order delivered at the shop. */
  deliverInStore: (order: AdminOrder) => Promise<void>;
  /** Opens the İade or "Siparişi Kurtar" dialog (see OrderDecisionDialog). */
  decide: (kind: OrderDecision["kind"], order: AdminOrder) => void;
  deciding: OrderDecision | null;
  closeDecision: () => void;
  /** The dialogs' answers; each resolves to the updated order, or rejects with the server's reason. */
  confirmReturn: (order: AdminOrder, reason: string, restock: boolean) => Promise<AdminOrder>;
  confirmRecover: (order: AdminOrder, paid: boolean) => Promise<AdminOrder>;
  /** "Gizli Mağaza Notu": saves it, or rejects with the server's reason. */
  saveNote: (order: AdminOrder, note: string) => Promise<AdminOrder>;
}

/**
 * Approve ("Ödendi" / ONAY) and cancel (İPTAL) for an order list, with the
 * per-row busy flag and result message. Shared by the orders list and the
 * expanded order sheet so a row acted on in either place updates the same state.
 */
export function useOrderActions(patch: OrderPatch): OrderActions {
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [notices, setNotices] = useState<Record<string, OrderNotice>>({});

  const setBusy = useCallback((id: string, on: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const approve = useCallback(
    async (order: AdminOrder) => {
      if (pending.has(order.id)) return;
      setBusy(order.id, true);
      setNotices((n) => {
        const next = { ...n };
        delete next[order.id];
        return next;
      });
      try {
        const res = await adminApproveOrder(order.id);
        patch(order.id, { status: res.new_status, paid_at: res.paid_at });
        setNotices((n) => ({
          ...n,
          [order.id]: {
            kind: "success",
            text:
              res.loyalty_points_awarded > 0
                ? `Ödendi · ${res.loyalty_points_awarded.toLocaleString("tr-TR")} puan tanımlandı`
                : "Ödendi / onaylandı",
          },
        }));
      } catch (err) {
        setNotices((n) => ({ ...n, [order.id]: { kind: "error", text: getApiErrorMessage(err, "Onaylanamadı.") } }));
      } finally {
        setBusy(order.id, false);
      }
    },
    [patch, pending, setBusy],
  );

  const cancel = useCallback(
    async (order: AdminOrder) => {
      if (pending.has(order.id)) return;
      const reason = window.prompt(`${order.order_number} iptal edilsin mi? İptal nedeni (müşteri görür):`, "Ödeme alınamadı");
      if (reason === null) return;
      if (reason.trim().length < 3) {
        setNotices((n) => ({ ...n, [order.id]: { kind: "error", text: "İptal nedeni en az 3 karakter olmalı." } }));
        return;
      }
      setBusy(order.id, true);
      try {
        const updated = await adminCancelOrder(order.id, reason.trim());
        patch(order.id, updated);
        setNotices((n) => ({
          ...n,
          [order.id]: { kind: "success", text: "İptal edildi · stok ve kullanılan puanlar iade edildi" },
        }));
      } catch (err) {
        setNotices((n) => ({ ...n, [order.id]: { kind: "error", text: getApiErrorMessage(err, "İptal edilemedi.") } }));
      } finally {
        setBusy(order.id, false);
      }
    },
    [patch, pending, setBusy],
  );

  const [shipping, setShipping] = useState<AdminOrder | null>(null);
  const ship = useCallback((order: AdminOrder) => setShipping(order), []);
  const closeShip = useCallback(() => setShipping(null), []);

  const confirmShip = useCallback(
    async (order: AdminOrder, body: ShipOrderBody) => {
      setBusy(order.id, true);
      try {
        const updated = await adminShipOrder(order.id, body);
        patch(order.id, updated);
        setNotices((n) => ({
          ...n,
          [order.id]: {
            kind: "success",
            text: updated.cargo_key
              ? `Yurtiçi gönderi kaydı açıldı (${updated.cargo_key}) · müşteriye bilgilendirme e-postası gönderildi`
              : "Kargoya verildi · müşteriye bilgilendirme e-postası gönderildi",
          },
        }));
        return updated;
      } catch (err) {
        throw new Error(getApiErrorMessage(err, "Kargoya verilemedi."));
      } finally {
        setBusy(order.id, false);
      }
    },
    [patch, setBusy],
  );

  /** Runs one shipment call for a row, with its busy flag and its result line. */
  const shipmentCall = useCallback(
    async (order: AdminOrder, call: (id: string) => Promise<AdminOrder>, done: string, failed: string) => {
      if (pending.has(order.id)) return;
      setBusy(order.id, true);
      try {
        patch(order.id, await call(order.id));
        setNotices((n) => ({ ...n, [order.id]: { kind: "success", text: done } }));
      } catch (err) {
        setNotices((n) => ({ ...n, [order.id]: { kind: "error", text: getApiErrorMessage(err, failed) } }));
      } finally {
        setBusy(order.id, false);
      }
    },
    [patch, pending, setBusy],
  );

  const refreshShipment = useCallback(
    (order: AdminOrder) => shipmentCall(order, adminRefreshShipment, "Kargo durumu güncellendi", "Kargo durumu alınamadı."),
    [shipmentCall],
  );

  const withdrawShipment = useCallback(
    async (order: AdminOrder) => {
      if (!window.confirm(`${order.order_number}: Yurtiçi gönderi kaydı iptal edilip sipariş "Onaylandı" durumuna dönsün mü?`)) return;
      await shipmentCall(order, adminWithdrawShipment, "Gönderi kaydı iptal edildi · sipariş yeniden kargolanabilir", "Gönderi kaydı iptal edilemedi.");
    },
    [shipmentCall],
  );

  const deliverInStore = useCallback(
    async (order: AdminOrder) => {
      if (!window.confirm(`${order.order_number} mağazada müşteriye teslim edildi olarak işaretlensin mi? Kargo kaydı açılmaz.`)) return;
      await shipmentCall(order, adminDeliverInStore, "Mağazadan teslim edildi", "Teslim olarak işaretlenemedi.");
    },
    [shipmentCall],
  );

  const [deciding, setDeciding] = useState<OrderDecision | null>(null);
  const decide = useCallback((kind: OrderDecision["kind"], order: AdminOrder) => setDeciding({ kind, order }), []);
  const closeDecision = useCallback(() => setDeciding(null), []);

  /** A dialog's call: busy flag, the row patched, the result line; a failure goes back to the dialog. */
  const decisionCall = useCallback(
    async (order: AdminOrder, call: () => Promise<AdminOrder>, done: string, failed: string) => {
      setBusy(order.id, true);
      try {
        const updated = await call();
        patch(order.id, updated);
        setNotices((n) => ({ ...n, [order.id]: { kind: "success", text: done } }));
        return updated;
      } catch (err) {
        throw new Error(getApiErrorMessage(err, failed));
      } finally {
        setBusy(order.id, false);
      }
    },
    [patch, setBusy],
  );

  const confirmReturn = useCallback(
    (order: AdminOrder, reason: string, restock: boolean) =>
      decisionCall(
        order,
        () => adminReturnOrder(order.id, reason, restock),
        restock ? "İade edildi · ürünler stoğa geri alındı, puanlar düzeltildi" : "İade edildi · ürünler stoğa alınmadı, puanlar düzeltildi",
        "İade kaydedilemedi.",
      ),
    [decisionCall],
  );

  const confirmRecover = useCallback(
    (order: AdminOrder, paid: boolean) =>
      decisionCall(
        order,
        () => adminRecoverOrder(order.id, paid),
        paid ? "Sipariş kurtarıldı · ödendi olarak onaylandı" : "Sipariş kurtarıldı · ödeme bekleniyor",
        "Sipariş kurtarılamadı.",
      ),
    [decisionCall],
  );

  const saveNote = useCallback(
    async (order: AdminOrder, note: string) => {
      try {
        const updated = await adminSetInternalNote(order.id, note);
        patch(order.id, { internal_note: updated.internal_note });
        return updated;
      } catch (err) {
        throw new Error(getApiErrorMessage(err, "Not kaydedilemedi."));
      }
    },
    [patch],
  );

  return {
    busy: (id) => pending.has(id),
    notice: (id) => notices[id],
    approve,
    cancel,
    ship,
    shipping,
    closeShip,
    confirmShip,
    refreshShipment,
    withdrawShipment,
    deliverInStore,
    decide,
    deciding,
    closeDecision,
    confirmReturn,
    confirmRecover,
    saveNote,
  };
}
