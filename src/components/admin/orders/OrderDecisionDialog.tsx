"use client";

import { useState, type FormEvent } from "react";
import { RotateCcw, Undo2 } from "lucide-react";

import type { OrderActions } from "@/components/admin/orders/useOrderActions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import type { AdminOrder } from "@/types";

const choice =
  "flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm transition-colors duration-200 hover:bg-slate-50 has-[:checked]:border-red-600 has-[:checked]:bg-red-50 dark:border-white/10 dark:hover:bg-white/5 dark:has-[:checked]:bg-red-500/10";

/**
 * The two decisions that need more than a yes: İade (why, and whether the goods
 * can be sold again) and "Siparişi Kurtar" (has the money arrived). One dialog
 * per page, for whichever order `actions.deciding` holds.
 */
export function OrderDecisionDialog({ actions }: { actions: OrderActions }) {
  const decision = actions.deciding;
  const title = decision
    ? `${decision.kind === "return" ? "İade Al" : "Siparişi Kurtar"} · ${decision.order.order_number}`
    : "Sipariş";
  return (
    <Dialog open={decision !== null} onClose={actions.closeDecision} title={title}>
      {/* Keyed on the order, so a dialog opened for the next one starts clean. */}
      {decision?.kind === "return" && <ReturnForm key={decision.order.id} order={decision.order} actions={actions} />}
      {decision?.kind === "recover" && <RecoverForm key={decision.order.id} order={decision.order} actions={actions} />}
    </Dialog>
  );
}

function useSubmit(actions: OrderActions, call: () => Promise<AdminOrder>) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await call();
      actions.closeDecision();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem yapılamadı.");
    } finally {
      setSubmitting(false);
    }
  }
  return { error, submitting, submit };
}

function ReturnForm({ order, actions }: { order: AdminOrder; actions: OrderActions }) {
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);
  const { error, submitting, submit } = useSubmit(actions, () => actions.confirmReturn(order, reason.trim(), restock));

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-zinc-400">
        Kargoya verilmiş ya da teslim edilmiş bir siparişin geri gelmesi. Kazanılan puanlar geri alınır, harcanan puanlar
        müşteriye döner. Para iadesini ödeme kanalından ayrıca yapın.
      </p>
      <Input
        label="İade nedeni"
        hint="Müşteri sipariş geçmişinde görür."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={300}
        required
        minLength={3}
        placeholder="Örn. Müşteri ürünü beğenmedi"
        autoFocus
      />
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Ürünler
        </legend>
        <label className={choice}>
          <input type="radio" name="restock" checked={restock} onChange={() => setRestock(true)} className="mt-0.5 accent-red-600" />
          <span>
            <span className="font-medium">Stoğa geri al</span>
            <span className="block text-xs text-slate-500 dark:text-zinc-400">Ürünler sağlam; yeniden satışa açılır.</span>
          </span>
        </label>
        <label className={choice}>
          <input type="radio" name="restock" checked={!restock} onChange={() => setRestock(false)} className="mt-0.5 accent-red-600" />
          <span>
            <span className="font-medium">Stoğa alma</span>
            <span className="block text-xs text-slate-500 dark:text-zinc-400">Hasarlı, eksik ya da kargoda kaldı.</span>
          </span>
        </label>
      </fieldset>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" className="w-auto!" onClick={actions.closeDecision}>
          Vazgeç
        </Button>
        <Button type="submit" className="w-auto!" loading={submitting} disabled={reason.trim().length < 3}>
          <Undo2 className="h-4 w-4" aria-hidden /> İade Olarak Kaydet
        </Button>
      </div>
    </form>
  );
}

function RecoverForm({ order, actions }: { order: AdminOrder; actions: OrderActions }) {
  const [paid, setPaid] = useState(true);
  const { error, submitting, submit } = useSubmit(actions, () => actions.confirmRecover(order, paid));
  const waiting = order.payment_method === "BANK_TRANSFER" ? "Havale bekliyor" : "Onay bekliyor";

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-zinc-400">
        İptal edilen sipariş geri açılır: ürünler stoktan yeniden düşülür, kullanılan puanlar yeniden harcanmış sayılır.
        Ürünlerden biri bu arada satıldıysa sipariş kurtarılamaz; hangisi olduğu söylenir.
        {order.cancel_reason && (
          <>
            {" "}
            İptal nedeni: <strong>{order.cancel_reason}</strong>
          </>
        )}
      </p>
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Ödeme
        </legend>
        <label className={choice}>
          <input type="radio" name="paid" checked={paid} onChange={() => setPaid(true)} className="mt-0.5 accent-red-600" />
          <span>
            <span className="font-medium">Ödeme alındı: onayla</span>
            <span className="block text-xs text-slate-500 dark:text-zinc-400">
              Sipariş “Onaylandı” olur ve kargolanabilir; Sultan Puan tanımlanır.
            </span>
          </span>
        </label>
        <label className={choice}>
          <input type="radio" name="paid" checked={!paid} onChange={() => setPaid(false)} className="mt-0.5 accent-red-600" />
          <span>
            <span className="font-medium">Ödeme bekleniyor</span>
            <span className="block text-xs text-slate-500 dark:text-zinc-400">
              Sipariş “{waiting}” olur.
              {order.payment_method === "BANK_TRANSFER" && " Havale için 48 saatlik süre şimdiden yeniden başlar."}
            </span>
          </span>
        </label>
      </fieldset>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" className="w-auto!" onClick={actions.closeDecision}>
          Vazgeç
        </Button>
        <Button type="submit" className="w-auto!" loading={submitting}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Siparişi Kurtar
        </Button>
      </div>
    </form>
  );
}
