"use client";

import { useCallback, useState } from "react";

import {
  adminApproveOrder,
  adminCancelOrder,
  adminRefreshShipment,
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

/** Paid and still here: ready to hand to the carrier. */
export function canShipOrder(status: OrderStatus): boolean {
  return status === "APPROVED";
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
  };
}
