import type { ComponentType } from "react";
import { ArrowRight, Mail, Phone } from "lucide-react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { telHref } from "@/lib/contact";
import { footerMessages } from "@/lib/i18n/messages/layout";
import { getMessages } from "@/lib/i18n/server";

/**
 * The three ways to reach the shop, as cards across the top of the footer.
 * The numbers come from the footer settings ("Ana Sayfa Düzenleme").
 */
export async function ContactBar({ phone, email, whatsappHref }: { phone: string; email: string; whatsappHref: string }) {
  const m = await getMessages(footerMessages);
  const CONTACT: {
    label: string;
    value: string;
    href: string;
    Icon: ComponentType<{ className?: string }>;
    external?: boolean;
  }[] = [
    { label: m.phone, value: phone, href: telHref(phone), Icon: Phone },
    { label: m.email, value: email, href: `mailto:${email}`, Icon: Mail },
    { label: m.whatsapp, value: m.writeNow, href: whatsappHref, Icon: WhatsAppIcon, external: true },
  ];

  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {CONTACT.map(({ label, value, href, Icon, external }) => (
        <li key={label} className="flex">
          <a
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 text-white transition-all duration-300 hover:border-red-600/50 hover:shadow-[0_0_24px_-6px_rgb(220_38_38/0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 shadow-md shadow-red-950/50">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold uppercase tracking-widest text-neutral-400">{label}</span>
                <span className="block truncate text-sm font-semibold tracking-tight">
                  {/* Kept left to right as one piece: in Arabic the digit groups
                      of "0212 553 05 92" would otherwise read in reverse order. */}
                  <span dir="ltr">{value}</span>
                </span>
              </span>
            </span>
            {/* Points, and nudges, the way the text reads. */}
            <ArrowRight
              className="h-4 w-4 shrink-0 text-neutral-500 transition-all duration-300 group-hover:text-red-500 rtl:-scale-x-100 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5"
              strokeWidth={2}
              aria-hidden
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
