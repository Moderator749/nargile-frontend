import type { TransportMode, User } from "@/types";

/**
 * The export (yurt dışı) customer, and what is different about them.
 *
 * They have no payment screen: the prices on the site are wholesale export
 * prices, and the freight, the customs and the total are agreed after the
 * order. So their cart is a request — stock does not limit it, nothing is
 * charged, and the shop answers with a quote. `app/services/perks.py` and
 * `is_quote_account` in the checkout engine are the server's half of this.
 *
 * Everything here keys off the account type alone, which is what the server
 * uses, so the two cannot drift.
 */
export const isExportAccount = (user: Pick<User, "account_type"> | null | undefined): boolean =>
  user?.account_type === "INTERNATIONAL";

/**
 * What the shop tells an export customer before they start, and again at the
 * top of their cart. English, because it is the only language this customer is
 * addressed in, and the same text in both places on purpose: it is the terms
 * of the arrangement, not a notification.
 */
export const EXPORT_NOTICE = [
  "The checkout payment screen is disabled for your account; direct payments cannot be made. " +
    "The prices displayed on the site are wholesale export prices. You can build a cart and " +
    "submit an order approval request.",
  "In the cart, you can provide information about yourself, request details about products, and " +
    "ask questions.",
  "Upon agreement, after determining the package quantity and total weight of your order, you " +
    "will receive a price quote based on your chosen transport type, along with estimated " +
    "delivery dates and times.",
];

export interface TransportOption {
  value: TransportMode;
  title: string;
  /** What choosing it means for the quote that follows. */
  note: string;
}

/** The three ways an export shipment can leave, as the quote will price them. */
export const TRANSPORT_OPTIONS: TransportOption[] = [
  { value: "ROAD", title: "Road Transport", note: "Karayolu · full or part load by truck" },
  { value: "AIR", title: "Air Freight", note: "Hava yolu · fastest, priced by weight" },
  { value: "SEA", title: "Sea Freight", note: "Deniz yolu · container, lowest cost" },
];

/** The storage key that remembers one account acknowledged the notice. */
export const exportNoticeKey = (userId: string) => `export-notice:${userId}`;
