"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { useLocalePath } from "@/components/i18n/navigation";
import { CartLineRow } from "@/components/cart/CartLineRow";
import { NO_AGREEMENTS, type Agreements } from "@/components/cart/LegalConsent";
import { DeliveryStep } from "@/components/cart/delivery/DeliveryStep";
import {
  EMPTY_ADDRESS,
  NEW_ADDRESS,
  TURKEY,
  addressProblem,
  billingIndex,
  freightProblem,
  fromSaved,
  savedIndex,
  receiverProblem,
  shipsToRegistered,
  shipsAbroad,
  toShippingAddress,
  type AddressChoice,
  type AddressDraft,
} from "@/components/cart/delivery/addressDraft";
import { EmptyCart } from "@/components/cart/EmptyCart";
import {
  DEFAULT_FIRM_CARD,
  METHOD_BY_FIRM_CARD,
  branchProblem,
  istanbulShortfall,
  type FirmCard,
} from "@/components/cart/delivery/firmCards";
import type { MethodDetails } from "@/components/cart/delivery/MethodFields";
import { InvoicePicker } from "@/components/cart/InvoicePicker";
import {
  hasInvoiceAddress,
  initialInvoice,
  invoiceAddressSummary,
  invoiceFirmName,
  invoiceProblem,
  invoiceShippingAddress,
  toInvoicePayload,
  type InvoiceDraft,
} from "@/components/cart/invoiceDraft";
import { PrivacyNotice } from "@/components/cart/PrivacyNotice";
import { ExportRequestNotice } from "@/components/cart/ExportRequestNotice";
import { OrderNote } from "@/components/cart/OrderNote";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { useCartQuote } from "@/hooks/useCartQuote";
import { useLegalDocuments } from "@/hooks/useLegalDocuments";
import { useIstanbulFreeMinimum } from "@/hooks/useShippingSettings";
import { PaytrFrame } from "@/components/payment/PaytrFrame";
import { useStoreParameters } from "@/hooks/useStoreParameters";
import { fetchMe } from "@/lib/authApi";
import { getApiErrorMessage } from "@/lib/errors";
import { isExportAccount } from "@/lib/exportAccount";
import { cartMessages } from "@/lib/i18n/messages/cart";
import { fetchPaytrStatus, openPaytrPage, type PaytrPage, type PaytrStatus } from "@/lib/paytr";
import { retailPerks } from "@/lib/perks";
import {
  buildCheckoutRequest,
  checkout,
  fetchCorporateInvoice,
  fetchLastAddress,
  fetchSavedAddresses,
} from "@/lib/ordersApi";
import { ISTANBUL } from "@/lib/provinces";
import { productHref } from "@/lib/seo";
import { useCartLines } from "@/hooks/useCartLines";
import { checkStock } from "@/lib/catalogApi";
import { formatMoney } from "@/lib/format";
import { estimateCart } from "@/lib/cartEstimate";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useAuthHydrated, useCartHydrated } from "@/store/useHasHydrated";
import type {
  AccountType,
  CorporateInvoiceDetails,
  Order,
  PaymentMethod,
  SavedAddress,
  ShippingMethod,
  TransportMode,
} from "@/types";

/** Refresh the profile so the Sultan Puan balance and segment are current. */
function refreshProfile() {
  fetchMe()
    .then((user) => useAuthStore.getState().setUser(user))
    .catch(() => {
      // Non-critical: the persisted profile stays; a 401 is handled by the interceptor.
    });
}

/**
 * `checkoutStep`: the same page at /checkout, where signing in from the cart lands —
 * opened at the delivery and payment steps rather than at the top of the cart.
 */
export function CartView({ checkoutStep = false }: { checkoutStep?: boolean } = {}) {
  const router = useRouter();
  const to = useLocalePath();
  const locale = useLocale();
  const t = useMessages(cartMessages);
  const cartHydrated = useCartHydrated();
  const authHydrated = useAuthHydrated();

  const items = useCartStore((s) => s.items);
  const storedPoints = useCartStore((s) => s.loyaltyPointsToRedeem);
  const setPoints = useCartStore((s) => s.setLoyaltyPointsToRedeem);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [chosenMethod, setPaymentMethod] = useState<PaymentMethod>("CREDIT_CARD");
  // Card payment is open only while PayTR is configured on the server; until
  // that is known the card stays on offer, and once it is known to be off the
  // cart pays by transfer instead.
  const [paytr, setPaytr] = useState<PaytrStatus | null>(null);
  const cardAvailable = paytr?.enabled !== false;
  const paymentMethod: PaymentMethod =
    chosenMethod === "CREDIT_CARD" && !cardAvailable ? "BANK_TRANSFER" : chosenMethod;
  // The PayTR page, once a card order has been placed: it replaces the form.
  const [cardPayment, setCardPayment] = useState<{ order: Order; page: PaytrPage } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchPaytrStatus(controller.signal)
      .then(setPaytr)
      .catch(() => {
        // Unknown: leave the card on offer; checkout says so if it is not.
      });
    return () => controller.abort();
  }, []);
  // Addresses on file; null until they arrive.
  const [saved, setSaved] = useState<SavedAddress[] | null>(null);
  // The customer's own choice of address; null until they make one, when the
  // default below applies instead.
  const [choice, setChoice] = useState<AddressChoice | null>(null);
  // The new-address form, prefilled from the last order (then the profile).
  const [typed, setTyped] = useState<AddressDraft | null>(null);
  // A firm picks one of five cards, and the card is also the shipping method.
  const [firmCard, setFirmCard] = useState<FirmCard>(DEFAULT_FIRM_CARD);
  // "Şubeme istiyorum": what the firm calls the branch this order is for.
  const [branchName, setBranchName] = useState("");
  const [otherReceiver, setOtherReceiver] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  // Optional, and each only reaches the server with the method it belongs to.
  const [details, setDetails] = useState<MethodDetails>({
    contractNo: "",
    freightCompanyName: "",
    freightPhone: "",
  });
  // Whose name the invoice is made out to; a firm already invoices to itself.
  // Null until the customer touches it, when the draft below applies instead.
  const [invoiceTyped, setInvoiceTyped] = useState<InvoiceDraft | null>(null);
  // The firm the account keeps on file, if any; null while it loads as well,
  // which is why the draft below is derived rather than seeded once.
  const [corporateOnFile, setCorporateOnFile] = useState<CorporateInvoiceDetails | null>(null);
  // "Kart bilgilerimi sonraki alışverişlerim için güvenle kaydet": a wish we
  // pass on to the payment provider; no card data reaches us.
  const [saveCard, setSaveCard] = useState(false);
  // "Sipariş Notu": optional, free text, read by a person and nothing else.
  const [orderNote, setOrderNote] = useState("");
  // An export account chooses how the shipment travels; nobody else may.
  const [transportMode, setTransportMode] = useState<TransportMode | null>(null);
  // The two agreements. The server refuses an order without both.
  const [agreements, setAgreements] = useState<Agreements>(NO_AGREEMENTS);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  // "Karşı ödemeli" consent; only asked for (and only sent) when the receiver pays.
  const [shippingConsent, setShippingConsent] = useState(false);

  const legalDocuments = useLegalDocuments();
  // What the İstanbul van asks for; the shop can change it from the panel.
  const istanbulMinimum = useIstanbulFreeMinimum();
  const isLoggedIn = authHydrated && !!user;
  // A visitor has no quote: their lines' pages, codes and stock come from here.
  const guestLines = useCartLines(
    items.map((i) => i.variant_id),
    authHydrated && !user,
  );

  /*
   * Quantities held to the stock without telling anyone the count: a raised
   * quantity is asked about (`checkStock`), and taken down to the most there
   * is when it is more — "Stok sınırına ulaştınız". The most learned for a
   * line then holds the stepper. A request (an export cart) has no limit.
   */
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const [stockMax, setStockMax] = useState<Record<string, number>>({});
  const asked = useRef(0);
  const holdsToStock = authHydrated && !isExportAccount(user);
  function changeQuantity(variantId: string, quantity: number) {
    const before = useCartStore.getState().items.find((i) => i.variant_id === variantId)?.quantity ?? 0;
    updateQuantity(variantId, quantity);
    if (!holdsToStock || quantity <= before) return;
    const ask = ++asked.current;
    checkStock([{ variant_id: variantId, quantity }])
      .then(([line]) => {
        if (!line || ask !== asked.current || !line.capped || line.quantity < 1) return;
        updateQuantity(variantId, line.quantity);
        setStockMax((m) => ({ ...m, [variantId]: line.quantity }));
      })
      .catch(() => {
        // Checkout holds the order to the stock anyway.
      });
  }
  // The cart as it was left may hold more than there is now: once, on arrival.
  const checkedOnArrival = useRef(false);
  useEffect(() => {
    if (!cartHydrated || !holdsToStock || checkedOnArrival.current || items.length === 0) return;
    checkedOnArrival.current = true;
    checkStock(items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })))
      .then((lines) => {
        const held = lines.filter((l) => l.capped && l.quantity > 0);
        held.forEach((l) => updateQuantity(l.variant_id, l.quantity));
        if (held.length > 0) setStockMax((m) => ({ ...m, ...Object.fromEntries(held.map((l) => [l.variant_id, l.quantity])) }));
      })
      .catch(() => {});
  }, [cartHydrated, holdsToStock, items, updateQuantity]);

  // /checkout is for a signed-in buyer: a visitor signs in first and comes back here.
  useEffect(() => {
    if (checkoutStep && authHydrated && !user) router.replace(to("/login?next=/checkout"));
  }, [checkoutStep, authHydrated, user, router, to]);
  // The summary in sight or not: the phone's checkout bar shows while it is not.
  const summary = useRef<HTMLDivElement>(null);
  const [summaryInView, setSummaryInView] = useState(true);
  useEffect(() => {
    const element = summary.current;
    if (!element) return;
    // Reached once it is up in the screen, not when its first line peeps over the tab bar.
    const observer = new IntersectionObserver(([entry]) => setSummaryInView(entry.isIntersecting), {
      rootMargin: "0px 0px -40% 0px",
    });
    observer.observe(element);
    return () => observer.disconnect();
  });
  // ...and lands at the delivery and payment steps, once the cart is drawn.
  const steps = useRef<HTMLDivElement>(null);
  const landed = useRef(false);
  useEffect(() => {
    if (!checkoutStep || landed.current || !user || !cartHydrated || !steps.current) return;
    landed.current = true;
    steps.current.scrollIntoView({ block: "start" });
  });
  const accountType: AccountType = user?.account_type ?? "INDIVIDUAL";
  const abroad = shipsAbroad(accountType);
  // The export account: no payment screen, and an order that is a request.
  const quoteOnly = isExportAccount(user);
  // Sultan Puan and the cart discounts are retail promotions; the server decides
  // the amounts, this decides what is on screen.
  const perks = retailPerks(user ?? null);
  const balance = user?.loyalty_balance ?? 0;
  const params = useStoreParameters();
  // Nothing is spent while the program is switched off in the panel.
  const points = perks && params.loyalty.enabled ? Math.min(storedPoints, balance) : 0;

  useEffect(() => {
    if (token) refreshProfile();
  }, [token]);

  /** Re-read the addresses after one is corrected here, so the cards follow. */
  const reloadAddresses = useCallback(() => {
    fetchSavedAddresses()
      .then(setSaved)
      .catch(() => {
        // Non-critical: what is on screen stays, and the order carries its own copy.
      });
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchCorporateInvoice(controller.signal)
      .then(setCorporateOnFile)
      .catch(() => {
        // Non-critical: the invoice section is then filled in by hand.
      });
    fetchSavedAddresses(controller.signal)
      .then(setSaved)
      .catch(() => {
        if (!controller.signal.aborted) setSaved([]); // the form still works
      });
    fetchLastAddress(controller.signal)
      .then((last) => {
        if (!last) return;
        setTyped((current) => current ?? { ...EMPTY_ADDRESS, ...last, district: last.district ?? "", postal_code: last.postal_code ?? "" });
      })
      .catch(() => {
        // Non-critical: the form starts from the profile instead.
      });
    return () => controller.abort();
  }, [token]);

  /**
   * Fatura bilgileri, the cart's first decision — and the first thing derived,
   * because the delivery cards below follow from it.
   *
   * Derived rather than stored, so the firm the account keeps on file can
   * arrive late and fill the section in without overwriting anything already
   * typed.
   */
  const invoice: InvoiceDraft = useMemo(
    () => invoiceTyped ?? initialInvoice(corporateOnFile),
    [invoiceTyped, corporateOnFile],
  );

  /**
   * An address on file is the frictionless default; with none, the form.
   * Derived rather than stored, so a list that arrives late cannot overwrite a
   * choice the customer has already made — and null while it is still loading,
   * which is what keeps the section from selecting something and then moving.
   */
  const selected: AddressChoice | null = useMemo(() => {
    // The firm's card goes when the invoice stops being a firm's, so the
    // customer is never left confirming a card that is no longer there.
    const held = choice?.kind === "corporate" && !invoice.toCompany ? null : choice;
    if (held) return held;
    if (saved === null) return null;
    return saved.length > 0 ? { kind: "saved", index: billingIndex(saved) } : NEW_ADDRESS;
  }, [choice, invoice.toCompany, saved]);

  // A firm is held to its registered address, so editing a field there is a
  // correction to that address rather than a different one.
  const locked = shipsToRegistered(accountType);
  // The five-card step: a firm here at home. An export order ships one way to
  // one address, so it has no cards to pick from.
  const firmFlow = locked && !abroad;

  /**
   * "Fatura adresime istiyorum" with the invoice made out to a firm: the
   * parcel goes to that firm's registered address, which the section above is
   * the one place to edit. A firm's own order is not affected — its invoice
   * and its delivery were always the address it registered.
   */
  const invoicedToFirm = !locked && invoice.toCompany;
  const corporateDelivery = invoicedToFirm && selected?.kind === "corporate";
  // The card's preview, said whether or not it is the chosen one: the firm, its
  // open address and its il / ilçe, exactly as the section above left them.
  const invoiceTarget = invoicedToFirm
    ? {
        summary: hasInvoiceAddress(invoice)
          ? [invoiceFirmName(invoice), invoiceAddressSummary(invoice)].filter(Boolean).join(" · ")
          : t.view.corporateSummaryMissing,
        notice: hasInvoiceAddress(invoice) ? null : t.view.corporateNotice,
      }
    : null;

  /**
   * Our own İstanbul van is offered on the *registered* address rather than on
   * the city typed into the form, which is the line the server draws too: a
   * firm registered in Adana is not in İstanbul because it wrote İstanbul in a
   * box. It is left out while the addresses load, so the option cannot appear
   * and then vanish under the cursor.
   */
  const registeredInIstanbul = (saved ?? []).some(
    (entry) => entry.country === TURKEY && entry.city === ISTANBUL,
  );
  /**
   * What the cart is worth, from the prices it was filled with.
   *
   * The İstanbul van is offered against this rather than against the server
   * quote, because the quote is asked for the method this figure chooses and
   * the two cannot wait on each other. It is the segment price in both cases,
   * so they agree unless a price moved under the cart — and then the server
   * refuses the van and says, in full, what the limit is and what is missing.
   */
  const estimatedSubtotal = items.reduce(
    (sum, i) => sum + Number(i.segment_price ?? i.price) * i.quantity,
    0,
  );

  /**
   * Which of the five cards a firm is on.
   *
   * Derived, so the van gives way on its own: empty the cart below the limit,
   * or pick it before the addresses say where the firm is, and the card simply
   * stops being the confirmed one — the invoice address is, and the van says
   * what it is still waiting for. Nothing is ever asked of the server that it
   * would refuse.
   */
  const vanAvailable =
    registeredInIstanbul &&
    istanbulShortfall(estimatedSubtotal, istanbulMinimum) === 0;
  const card: FirmCard =
    firmCard === "ISTANBUL_FREE" && !vanAvailable ? DEFAULT_FIRM_CARD : firmCard;

  /**
   * The address on file, and whether a parcel could be sent to it as it stands.
   *
   * A firm's cards do not ask for an address — they deliver to the one it
   * registered — so this is what they deliver to. An account whose row is too
   * thin to post anything to (one from before the current sign-up form) gets
   * the fields back instead of a button it cannot use.
   */
  const onFile = useMemo(() => {
    if (saved === null || saved.length === 0) return null;
    return fromSaved(saved[billingIndex(saved)], {
      full_name: user?.full_name ?? "",
      phone: user?.phone ?? "",
    });
  }, [saved, user]);
  const onFileAddressReady = onFile !== null && addressProblem(onFile, locale) === null;

  /**
   * What ships: whatever has been typed, else the chosen card, else a blank form
   * with whatever the profile knows. `typed` is cleared when another card is
   * picked, so a card's own address is what a card shows.
   */
  const draft: AddressDraft = useMemo(() => {
    const blank: AddressDraft = {
      ...EMPTY_ADDRESS,
      country: abroad ? "" : TURKEY,
      full_name: user?.full_name ?? "",
      phone: user?.phone ?? "",
    };
    // A branch collection is addressed to the customer, so it travels under the
    // address on file; with nothing on file it is typed like any other.
    const index = savedIndex(selected, saved);
    const chosen = index !== null ? saved?.[index] : undefined;
    // A firm's order goes to the address it registered, and every card but
    // "Şubeme istiyorum" says only that: no form, nothing typed, and nothing
    // left behind by another card. The account with nothing usable on file is
    // the exception, and types one like anyone else.
    if (firmFlow && card !== "BRANCH" && onFileAddressReady && onFile) return onFile;
    // An export order is read off the account for the same reason, and with no
    // card to pick: its cart shows the registered address instead of a form,
    // so this is where that address comes from. An account with nothing usable
    // on file still types one, which is what `typed` then holds.
    if (abroad && onFileAddressReady && onFile) return onFile;
    if (typed) return typed;
    // Invoiced to a firm: the parcel is addressed to the firm, at the address
    // the invoice shows, and the number is still the buyer's own.
    if (corporateDelivery) {
      return invoiceShippingAddress(invoice, {
        full_name: blank.full_name,
        phone: chosen?.phone ?? blank.phone,
      });
    }
    if (chosen) {
      return fromSaved(chosen, { full_name: blank.full_name, phone: blank.phone });
    }
    return blank;
  }, [
    selected,
    saved,
    typed,
    user,
    abroad,
    corporateDelivery,
    invoice,
    firmFlow,
    card,
    onFile,
    onFileAddressReady,
  ]);

  /**
   * How it travels. Every account decides that by picking a card — the branch
   * card *is* the branch delivery, the ambar card *is* the ambar — so there is
   * nothing separate to choose and nothing that can disagree with what is
   * confirmed on screen. An export order has one way to travel.
   */
  const method: ShippingMethod = abroad
    ? "INTERNATIONAL_FREIGHT"
    : locked
      ? METHOD_BY_FIRM_CARD[card]
      : selected?.kind === "branch"
        ? "YURTICI_BRANCH"
        : "YURTICI_DOOR";

  const addressFault = addressProblem(draft, locale);

  const deliveryProblem =
    invoiceProblem(invoice, locale) ??
    (firmFlow && card === "BRANCH" ? branchProblem(branchName, locale) : null) ??
    addressFault ??
    (otherReceiver ? receiverProblem(receiverName, receiverPhone, abroad, locale) : null) ??
    (method === "NAKLIYE_AMBARI" ? freightProblem(details.freightPhone, locale) : null);

  const { quote, loading: quoteLoading, error: quoteError } = useCartQuote(
    items,
    paymentMethod,
    points,
    isLoggedIn,
    method,
  );
  const needsConsent = !!quote?.shipping.receiver_pays;
  // A line above the shop's stock would be refused at checkout: say which,
  // here. A request has no limit. A firm's account is told the count; a
  // bireysel buyer only that the line is short.
  const overStock = quoteOnly ? undefined : quote?.items.find((i) => i.stock_short);
  const stockProblem = overStock
    ? overStock.available_quantity == null
      ? t.view.stockShort(overStock.product_name)
      : overStock.available_quantity > 0
        ? t.view.overStock(overStock.product_name, overStock.available_quantity)
        : t.view.soldOut(overStock.product_name)
    : null;
  const checkoutBlocker = quoteOnly
    ? // A request asks for one thing the cart cannot supply: how it travels.
      (deliveryProblem ??
      (transportMode === null ? t.export.transportBlocker : null))
    : (stockProblem ??
      deliveryProblem ??
      (needsConsent && !shippingConsent ? t.view.consentBlocker : null) ??
      // An order is a contract: both agreements, or no order.
      (agreements.distanceSales && agreements.terms ? null : t.view.agreementsBlocker));
  const serverLines = new Map(quote?.items.map((i) => [i.variant_id, i]));

  async function handleCheckout() {
    if (!isLoggedIn) {
      // Signed in (or signed up), they land at the delivery and payment steps.
      router.push(to("/login?next=/checkout"));
      return;
    }
    if (submitting || checkoutBlocker) return;
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const order = await checkout(
        buildCheckoutRequest(items, paymentMethod, points, method, toShippingAddress(draft), {
          shippingConsent,
          receiverName: otherReceiver ? receiverName : null,
          receiverPhone: otherReceiver ? receiverPhone : null,
          shippingContractNo: details.contractNo,
          freightCompanyName: details.freightCompanyName,
          freightPhone: details.freightPhone,
          shippingBranchName: firmFlow && card === "BRANCH" ? branchName : null,
          invoice: toInvoicePayload(invoice),
          saveCard: paymentMethod === "CREDIT_CARD" && saveCard,
          orderNote,
          transportMode: quoteOnly ? transportMode : null,
          agreements,
        }),
      );
      if (order.payment_method === "CREDIT_CARD") {
        // Paid on PayTR's page. The cart stays as it is until the payment is
        // confirmed, so a declined card can be tried again or swapped for a
        // transfer without filling the basket again.
        try {
          const page = await openPaytrPage(order.id);
          setCardPayment({ order, page });
          window.scrollTo({ top: 0 });
        } catch (err) {
          // The server has already released the order it could not open a page for.
          setCheckoutError(getApiErrorMessage(err, t.view.paymentPageFailed));
        }
        setSubmitting(false);
        refreshProfile(); // points spent on it are held, or back
        return;
      }
      // Confirmation: bank details for havale/EFT, how it travels, where to.
      router.push(to(`/orders/${order.id}/confirmation`));
      useCartStore.getState().clearCart();
      refreshProfile(); // Sultan Puan balance changed
      // Keep `submitting` so the page doesn't flash the empty-cart state while navigating.
    } catch (err) {
      setCheckoutError(getApiErrorMessage(err, t.view.checkoutFailed));
      setSubmitting(false);
    }
  }

  if (!cartHydrated) {
    return <main className="flex-1" aria-busy />;
  }

  if (cardPayment) {
    return (
      <main className="w-full flex-1 px-4 py-8 sm:px-6">
        <PaytrFrame
          page={cardPayment.page}
          orderNumber={cardPayment.order.order_number}
          onBack={() => setCardPayment(null)}
        />
      </main>
    );
  }

  if (items.length === 0 && !submitting) {
    return (
      <main className="flex-1 px-4">
        <EmptyCart />
      </main>
    );
  }

  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      {/* An export account is addressed in English, or in Arabic on an Arabic page. */}
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{quoteOnly ? t.export.title : t.view.title}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        {quoteOnly ? t.export.items(itemCount) : t.view.items(itemCount)}
      </p>

      {/* The terms first: everything below behaves differently because of them. */}
      {quoteOnly && (
        <div className="mt-5">
          <ExportRequestNotice />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <section aria-labelledby="cart-items-heading" className="lg:col-span-2">
          <h2 id="cart-items-heading" className="sr-only">
            {t.view.itemsHeading}
          </h2>
          <ul className="divide-y divide-slate-200 dark:divide-white/10 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 sm:px-6">
            {items.map((item) => {
              const line = serverLines.get(item.variant_id);
              const guest = guestLines?.get(item.variant_id);
              const product = line?.product_id
                ? { id: line.product_id, slug: line.product_slug }
                : guest
                  ? { id: guest.product_id, slug: guest.product_slug }
                  : null;
              return (
                <CartLineRow
                  key={item.variant_id}
                  item={item}
                  serverUnitPrice={line?.unit_price}
                  serverColorName={line?.color_name}
                  serverImageUrl={line?.image_url}
                  productHref={product ? productHref(product) : undefined}
                  havaleEligible={line?.havale_eligible}
                  havaleDiscount={line?.havale_discount}
                  maxQuantity={quoteOnly ? null : (stockMax[item.variant_id] ?? line?.available_quantity)}
                  limitReached={!quoteOnly && stockMax[item.variant_id] === item.quantity}
                  soldOut={!quoteOnly && guest?.in_stock === false}
                  onQuantityChange={(q) => changeQuantity(item.variant_id, q)}
                  sku={line?.sku ?? guest?.sku}
                />
              );
            })}
          </ul>
          {/* Where /checkout opens: the steps after the lines. */}
          <div ref={steps} id="odeme-adimlari" className="scroll-mt-28" />
          {/* Fatura first: how the invoice is issued decides what the delivery
              cards below offer. A firm's invoice is already made out to the
              firm, so only a personal order has a choice to make here. */}
          {isLoggedIn && !locked && (
            <div className="mt-6">
              <InvoicePicker
                value={invoice}
                onChange={(patch) => setInvoiceTyped({ ...invoice, ...patch })}
                billingAddress={saved === null ? null : (saved[billingIndex(saved)] ?? null)}
                addressesLoading={saved === null}
                onBillingAddressSaved={reloadAddresses}
                corporateOnFile={corporateOnFile}
                onCorporateSaved={setCorporateOnFile}
              />
            </div>
          )}
          {isLoggedIn && (
            <div className="mt-6">
              <DeliveryStep
                transportMode={transportMode}
                onTransportModeChange={setTransportMode}
                accountType={accountType}
                saved={saved}
                invoiceTarget={invoiceTarget}
                registeredInIstanbul={registeredInIstanbul}
                choice={selected}
                onChoiceChange={(next) => {
                  setChoice(next);
                  // A card carries its own address: picking one starts from it,
                  // and picking "Yeni Adres Ekle" starts from nothing — except
                  // the buyer's own name and number, which are theirs either
                  // way. A branch collection reads the address on file too.
                  setTyped(
                    next.kind === "new"
                      ? {
                          ...EMPTY_ADDRESS,
                          country: abroad ? "" : TURKEY,
                          full_name: draft.full_name,
                          phone: draft.phone,
                        }
                      : null,
                  );
                  setShippingConsent(false);
                }}
                address={draft}
                onAddressChange={(next) => {
                  setTyped(next);
                  // Editing a saved card's address makes it a new one, and the
                  // card stops claiming it. A firm has no such card, and its
                  // edit stays a correction; a branch collection keeps its own
                  // card, since the fields there are the only ones it has.
                  if (!locked && selected?.kind === "saved") setChoice(NEW_ADDRESS);
                }}
                card={card}
                onCardChange={(next) => {
                  setFirmCard(next);
                  // A branch is typed out; every other card delivers to the
                  // address on file, so it goes back to reading that one.
                  setChoice(
                    next === "BRANCH"
                      ? NEW_ADDRESS
                      : saved?.length
                        ? { kind: "saved", index: billingIndex(saved) }
                        : NEW_ADDRESS,
                  );
                  setTyped(
                    next === "BRANCH"
                      ? {
                          ...EMPTY_ADDRESS,
                          country: TURKEY,
                          full_name: draft.full_name,
                          phone: draft.phone,
                        }
                      : null,
                  );
                  setShippingConsent(false);
                }}
                branchName={branchName}
                onBranchNameChange={setBranchName}
                subtotal={estimatedSubtotal}
                istanbulMinimum={istanbulMinimum}
                onFileAddressReady={onFileAddressReady}
                otherReceiver={otherReceiver}
                onOtherReceiverChange={setOtherReceiver}
                receiverName={receiverName}
                receiverPhone={receiverPhone}
                onReceiverChange={({ receiverName: name, receiverPhone: phone }) => {
                  if (name !== undefined) setReceiverName(name);
                  if (phone !== undefined) setReceiverPhone(phone);
                }}
                details={details}
                onDetailsChange={(patch) => setDetails((current) => ({ ...current, ...patch }))}
              />
            </div>
          )}
          {isLoggedIn && (
            <div className="mt-6">
              <OrderNote value={orderNote} onChange={setOrderNote} exportCopy={quoteOnly} />
            </div>
          )}
          {isLoggedIn && (
            <div className="mt-6">
              <PrivacyNotice document={legalDocuments?.PRIVACY_NOTICE} />
            </div>
          )}
        </section>

        {/* Stretched down the row, so the summary inside can stay in view as the steps scroll. */}
        <div ref={summary} id="siparis-ozeti" className="scroll-mt-24 lg:self-stretch">
        <OrderSummary
          isLoggedIn={isLoggedIn}
          perks={perks}
          params={params}
          cardAvailable={cardAvailable}
          quoteOnly={quoteOnly}
          shippingMethod={method}
          estimatedSubtotal={estimatedSubtotal}
          quote={quote}
          quoteLoading={quoteLoading}
          quoteError={quoteError}
          balance={balance}
          points={points}
          onPointsChange={setPoints}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onCheckout={handleCheckout}
          shippingConsent={shippingConsent}
          onShippingConsentChange={setShippingConsent}
          saveCard={saveCard}
          onSaveCardChange={setSaveCard}
          agreements={agreements}
          onAgreementsChange={(patch) => setAgreements((current) => ({ ...current, ...patch }))}
          legalDocuments={legalDocuments}
          submitting={submitting}
          checkoutError={checkoutError}
          blocker={isLoggedIn ? checkoutBlocker : null}
        />
        </div>
      </div>

      {/* A phone's way to pay from anywhere down the cart: the total and
          "Ödemeye Geç", over the tab bar while the summary is out of sight.
          A visitor signs in first (and lands at /checkout); a buyer is taken
          to the summary, where the order is placed. */}
      <CheckoutBar
        shown={!summaryInView}
        label={t.view.checkoutBar}
        totalLabel={t.view.barTotal}
        total={formatMoney(
          quote ? Number(quote.net_total) : isLoggedIn ? estimatedSubtotal : estimateCart(estimatedSubtotal, params).total,
        )}
        action={t.view.goToPayment}
        onGo={() => (isLoggedIn ? summary.current?.scrollIntoView({ behavior: "smooth", block: "start" }) : handleCheckout())}
      />
      <div aria-hidden className="h-20 md:hidden" />
    </main>
  );
}

/** The phone's checkout bar over the tab bar: the total and the way to pay. */
function CheckoutBar({
  shown,
  label,
  totalLabel,
  total,
  action,
  onGo,
}: {
  shown: boolean;
  label: string;
  totalLabel: string;
  total: string;
  action: string;
  onGo: () => void;
}) {
  // A notice (a removal's "Geri Al") rises over the bar while it is up, as over a product page's.
  useEffect(() => {
    if (!shown || !window.matchMedia("(max-width: 47.99rem)").matches) return;
    const root = document.documentElement;
    root.style.setProperty("--buy-bar-height", "4.375rem");
    return () => {
      root.style.removeProperty("--buy-bar-height");
    };
  }, [shown]);

  return (
    <div
      role="region"
      aria-label={label}
      aria-hidden={!shown}
      inert={!shown}
      className={`fixed inset-x-0 bottom-[calc(4rem+1px+env(safe-area-inset-bottom,0px))] z-40 border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-[0_-8px_16px_-12px_rgb(0_0_0/0.35)] backdrop-blur-md transition-[transform,opacity] duration-200 md:hidden dark:border-white/10 dark:bg-zinc-900/95 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-xs text-slate-500 dark:text-zinc-400">{totalLabel}</p>
          <p dir="ltr" className="truncate text-lg font-bold tabular-nums text-slate-900 dark:text-zinc-100">
            {total}
          </p>
        </div>
        <button
          type="button"
          onClick={onGo}
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-bold text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          {action}
          <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </button>
      </div>
    </div>
  );
}
