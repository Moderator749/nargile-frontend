/**
 * How the shop is reached, as it publishes it.
 *
 * One place for the three the storefront prints, so a changed number is one
 * edit rather than a search. These are the shop's own published contacts, not
 * anything a customer typed — which is why the WhatsApp link is built here
 * instead of through `lib/whatsapp`: that helper refuses a landline on purpose,
 * because a number a *customer* writes into a form has to be a mobile to be
 * worth opening a chat with. A business running WhatsApp Business on its
 * switchboard is a different case.
 */

export const PHONE = "0212 553 05 92";
export const EMAIL = "turhan@sultannargile.com";

/** `tel:` wants no spaces; Turkey's code, since that is where the shop is. */
export const PHONE_HREF = `tel:+90${PHONE.replace(/\D/g, "").replace(/^0/, "")}`;
export const EMAIL_HREF = `mailto:${EMAIL}`;
/** The switchboard on wa.me. Swap in a mobile if WhatsApp lives elsewhere. */
export const WHATSAPP_HREF = `https://wa.me/90${PHONE.replace(/\D/g, "").replace(/^0/, "")}`;
