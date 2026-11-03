import Link from "next/link";
import { Package, ReceiptText } from "lucide-react";

import { messageParts, orderHref, productHref, type MessagePart } from "@/lib/teamLinks";

/**
 * A message's text with its order and product references drawn as chips —
 * links for an admin, the same chips without a link for staff, whom those
 * pages would refuse. Everything else is text, exactly as typed.
 */
export function MessageBody({
  body,
  mine,
  canOpen,
  onNavigate,
}: {
  body: string;
  mine: boolean;
  canOpen: boolean;
  onNavigate: () => void;
}) {
  const chip = `mx-0.5 inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-px align-baseline text-[13px] font-semibold ${
    mine ? "bg-white/20 text-white" : "bg-white text-red-700 ring-1 ring-inset ring-slate-200 dark:bg-white/10 dark:text-red-300 dark:ring-white/10"
  }`;
  const link = `${chip} underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 ${mine ? "focus-visible:outline-white" : "focus-visible:outline-red-500"}`;

  return messageParts(body).map((part: MessagePart, i) => {
    if (part.kind === "text") return part.text;
    const Icon = part.kind === "order" ? ReceiptText : Package;
    const inner = (
      <>
        <Icon className="h-3 w-3 shrink-0" aria-hidden />
        <span className={`truncate ${part.kind === "order" ? "font-mono" : ""}`}>{part.text}</span>
      </>
    );
    const href = part.kind === "order" ? orderHref(part.ref) : productHref(part.id);
    return canOpen ? (
      <Link key={i} href={href} onClick={onNavigate} className={link} title={part.kind === "order" ? "Siparişi aç" : "Ürünü aç"}>
        {inner}
      </Link>
    ) : (
      <span key={i} className={chip}>
        {inner}
      </span>
    );
  });
}
