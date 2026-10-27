"use client";

import { useEffect, useState, type ReactNode, type SubmitEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Coffee, Globe, Store, User } from "lucide-react";

import { WalletPanel } from "@/components/account/WalletPanel";
import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import {
  ACCOUNT_TYPE_LABELS,
  ADDRESS_KIND_LABELS,
  APPLICATION_STATUS_LABELS,
  BILLING_ENTITY_LABELS,
  INTERNATIONAL_KIND_LABELS,
  SEGMENT_LABELS,
  SegmentChip,
} from "@/components/admin/customers/CustomerLabels";
import { SegmentAssign } from "@/components/admin/customers/SegmentAssign";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminAdjustPoints, adminCustomerDetail, adminCustomerWallet } from "@/lib/adminApi";
import { countryName } from "@/lib/countries";
import { getApiErrorMessage } from "@/lib/errors";
import type { AccountType, AdminCustomerAddress, AdminCustomerDetail, Wallet } from "@/types";
import { stepOnArrowKey } from "@/lib/numberStep";

const ICONS: Record<AccountType, typeof User> = {
  INDIVIDUAL: User,
  CAFE: Coffee,
  TOBACCO_SHOP: Store,
  INTERNATIONAL: Globe,
  SOLE_PROPRIETOR: Store,
  COMPANY: Building2,
};

const dateTime = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" });

/** One labelled fact. Nothing is hidden for being empty: a blank is information. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-slate-900 dark:text-zinc-100">
        {children || <span className="text-slate-400 dark:text-zinc-600">—</span>}
      </dd>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`panel-${title}`} className={`${panelClass} p-5 sm:p-6`}>
      <h2 id={`panel-${title}`} className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A stored address, written the way its own country writes them. */
function AddressCard({ address }: { address: AdminCustomerAddress }) {
  const domestic = address.country === "TR";
  const lines = domestic
    ? [
        [address.neighbourhood, address.street].filter(Boolean).join(", "),
        [
          address.building_no && `No: ${address.building_no}`,
          address.building_name,
          address.door_no && `Kapı No: ${address.door_no}`,
        ]
          .filter(Boolean)
          .join(", "),
        [address.district, address.city].filter(Boolean).join(" / "),
      ]
    : [
        address.address_line1,
        address.address_line2,
        [address.postal_code, address.city].filter(Boolean).join(" "),
        countryName(address.country),
      ];

  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-500">
        {ADDRESS_KIND_LABELS[address.kind]}
        {address.label ? ` · ${address.label}` : ""}
      </p>
      <address className="mt-1 text-sm not-italic leading-6 text-slate-900 dark:text-zinc-100">
        {lines.filter(Boolean).map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </address>
    </div>
  );
}

/**
 * One customer's page: everything sign-up collected, and the one decision an
 * admin makes about them — which price list they buy from.
 *
 * The points tool lives here too, with the wallet it corrects: both belong to
 * one customer, not to a list of them.
 */
export function CustomerDetailView({ userId }: { userId: string }) {
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [pointsResult, setPointsResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminCustomerDetail(userId, controller.signal)
      .then(setCustomer)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Müşteri yüklenemedi."));
      });
    adminCustomerWallet(userId, controller.signal)
      .then(setWallet)
      .catch(() => undefined);
    return () => controller.abort();
  }, [userId]);

  const parsed = Number.parseInt(amount, 10);
  const pointsProblem =
    !amount || !Number.isFinite(parsed) || parsed === 0
      ? "Eklenecek (+) veya düşülecek (−) puanı girin."
      : note.trim().length < 3
        ? "Bir gerekçe yazın (müşteri geçmişinde görünür)."
        : null;

  async function adjust(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pointsProblem || saving) return;
    setSaving(true);
    setPointsResult(null);
    try {
      const updated = await adminAdjustPoints(userId, parsed, note.trim());
      setWallet(updated);
      setCustomer((c) => (c ? { ...c, loyalty_balance: updated.balance } : c));
      setAmount("");
      setNote("");
      setPointsResult({
        kind: "success",
        text: `Kaydedildi. Yeni bakiye: ${updated.balance.toLocaleString("tr-TR")} puan.`,
      });
    } catch (err) {
      setPointsResult({ kind: "error", text: getApiErrorMessage(err, "Puan güncellenemedi.") });
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <>
        <BackLink />
        <Alert variant="error">{loadError}</Alert>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <BackLink />
        <div className="space-y-4" aria-busy>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" />
          ))}
        </div>
      </>
    );
  }

  const profile = customer.profile;
  const Icon = ICONS[customer.account_type];
  const title = profile?.company_title || customer.full_name || customer.email;
  const corporate = profile?.billing_entity_type != null;

  return (
    <>
      <BackLink />
      <AdminPageHeader
        title={title}
        description={`${ACCOUNT_TYPE_LABELS[customer.account_type]} · ${customer.order_count} sipariş · ${dateTime.format(new Date(customer.created_at))} tarihinde kaydoldu`}
        actions={
          <span className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-slate-400 dark:text-zinc-500" aria-hidden />
            <SegmentChip segment={customer.segment} />
          </span>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Kimlik ve İletişim">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Fact label="Hesap türü">{ACCOUNT_TYPE_LABELS[customer.account_type]}</Fact>
            <Fact label={customer.account_type === "INDIVIDUAL" ? "İsim soyisim" : "Yetkili kişi"}>
              {customer.full_name}
            </Fact>
            <Fact label="E-posta">
              <a
                href={`mailto:${customer.email}`}
                className="break-all underline decoration-slate-300 underline-offset-2 hover:text-red-600 dark:decoration-white/20 dark:hover:text-red-400"
              >
                {customer.email}
              </a>
            </Fact>
            <Fact label="Kullanıcı adı">{customer.username}</Fact>
            <Fact label="Cep telefonu">{customer.phone}</Fact>
            <Fact label="Sabit telefon">{customer.landline_phone}</Fact>
            <Fact label="TC kimlik no">{profile?.national_id}</Fact>
            <Fact label="Yurt dışı müşteri türü">
              {profile?.international_kind ? INTERNATIONAL_KIND_LABELS[profile.international_kind] : null}
            </Fact>
          </dl>
        </Panel>

        <Panel title="Fatura Bilgileri">
          {corporate ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label="Fatura kime">{BILLING_ENTITY_LABELS[profile.billing_entity_type!]}</Fact>
              <Fact label="Ünvan">{profile?.company_title}</Fact>
              <Fact label="Vergi levhasındaki isim">{profile?.tax_plate_name}</Fact>
              <Fact label="Vergi dairesi">{profile?.tax_office}</Fact>
              <Fact label="Vergi / VAT numarası">{profile?.tax_number}</Fact>
            </dl>
          ) : (
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Fatura şahsına kesiliyor; kurumsal fatura istenmemiş.
            </p>
          )}
        </Panel>

        <Panel title="Adresler">
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Kayıt sırasında adres verilmemiş. Teslimat adresi her siparişte ayrıca alınır.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {customer.addresses.map((address) => (
                <AddressCard key={address.kind} address={address} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Fiyat Grubu">
          <SegmentAssign customer={customer} onAssigned={setCustomer} />
          {customer.application_status && (
            <p className="mt-4 rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-600 dark:border-white/10 dark:text-zinc-400">
              Müşterinin başvurusu:{" "}
              <strong className="font-semibold">
                {customer.requested_segment ? SEGMENT_LABELS[customer.requested_segment] : "—"}
              </strong>{" "}
              · {APPLICATION_STATUS_LABELS[customer.application_status] ?? customer.application_status}. Başvurular
              Müşteriler sayfasındaki kuyruktan onaylanır.
            </p>
          )}
        </Panel>
      </div>

      <section aria-labelledby="points-heading" className={`${panelClass} mt-6 p-5 sm:p-6`}>
        <h2
          id="points-heading"
          className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400"
        >
          Sultan Puan
        </h2>
        <form
          onSubmit={adjust}
          className="mt-4 grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-white/10 sm:grid-cols-[9rem_1fr_auto] sm:items-end"
        >
          <Input
            label="Puan (+/−)"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d-]/g, ""))}
            onKeyDown={(e) => stepOnArrowKey(e, (v) => setAmount(v.replace(/[^\d-]/g, "")), { integer: true, negative: true })}
            placeholder="ör. 500 / -200"
          />
          <Input
            label="Gerekçe"
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ör. Telafi, hatalı tanım düzeltmesi"
          />
          <Button type="submit" loading={saving} disabled={!!pointsProblem} className="sm:w-28!">
            Kaydet
          </Button>
        </form>
        {pointsResult && (
          <div className="mt-3">
            <Alert variant={pointsResult.kind}>{pointsResult.text}</Alert>
          </div>
        )}
        <div className="mt-6">
          {wallet ? (
            <WalletPanel wallet={wallet} />
          ) : (
            <div className="h-40 rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
          )}
        </div>
      </section>
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/customers"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:text-zinc-400 dark:hover:text-red-400"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden /> Müşteriler
    </Link>
  );
}
