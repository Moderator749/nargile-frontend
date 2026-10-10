import { ArrowRight, Mail, MessageCircle, Phone } from "lucide-react";

import { EMAIL, EMAIL_HREF, PHONE, PHONE_HREF, WHATSAPP_HREF } from "@/lib/contact";

const CONTACT = [
  { label: "Telefon", value: PHONE, href: PHONE_HREF, Icon: Phone },
  { label: "E-Posta", value: EMAIL, href: EMAIL_HREF, Icon: Mail },
  { label: "WhatsApp", value: "Hemen Yazın", href: WHATSAPP_HREF, Icon: MessageCircle },
] as const;

/**
 * The three ways to reach the shop, on the same dark ruby as the deals funnel.
 *
 * Staged, not mounted: it was built for the homepage's brand showcase, where it
 * sat between the world brands and the advantages and read as an interruption
 * rather than an invitation. It belongs at the foot of the page, so it waits
 * here — drop `<ContactBar />` into `SiteFooter` and it is live.
 *
 * The numbers themselves are in `lib/contact`.
 */
export function ContactBar() {
  return (
    <div className="rounded-3xl border border-red-500/20 bg-gradient-to-r from-[#1b0508] via-[#100305] to-[#1b0508] p-6 shadow-xl md:p-8">
      <ul className="grid gap-4 md:grid-cols-3">
        {CONTACT.map(({ label, value, href, Icon }) => (
          <li key={label} className="flex">
            <a
              href={href}
              className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-white transition-all duration-300 hover:border-white/25 hover:bg-white/[0.1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 shadow-md shadow-red-950/50">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-white/50">
                    {label}
                  </span>
                  <span className="block truncate text-sm font-semibold tracking-tight">{value}</span>
                </span>
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-white/40 transition-all duration-300 group-hover:text-white motion-safe:group-hover:translate-x-0.5"
                strokeWidth={2}
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
