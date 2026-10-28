import type { ComponentType } from "react";
import { ArrowRight, Clock, Link2, MapPin } from "lucide-react";

import Link from "@/components/i18n/Link";
import { LogoEmblem, LogoWordmark } from "@/components/brand/Logo";
import { InstagramIcon, YouTubeIcon } from "@/components/icons/SocialIcons";
import { ContactBar } from "@/components/layout/ContactBar";
import { footerMessages } from "@/lib/i18n/messages/layout";
import { DISTANCE_SALES_HREF, legalHref } from "@/lib/legalPages";
import { storeForBranch, storeHref } from "@/lib/stores";
import { getMessages } from "@/lib/i18n/server";
import type { HomeFooter, HomeFooterColumn, HomeSocialKind } from "@/types";

const SOCIAL_ICONS: Partial<Record<HomeSocialKind, ComponentType<{ className?: string }>>> = {
  youtube: YouTubeIcon,
  instagram: InstagramIcon,
};

const headingClass = "mb-4 text-sm font-black uppercase tracking-wider text-white";
const linkClass = "text-sm leading-6 text-neutral-400 transition-colors duration-200 hover:text-white";
const pillClass =
  "mt-6 inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors duration-200 hover:border-red-600 hover:text-red-400";

/** A column of links, each behind a red arrow — pointing, and nudging, the way the text reads. */
function ArrowLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    // A phone's link is a row a finger can hit (40px, its padding); from md the list is as dense as it was.
    <ul className="md:space-y-2.5">
      {links.map((link, i) => (
        <li key={`${link.href}-${i}`}>
          <Link href={link.href} className={`group flex gap-2 py-2 md:py-0 ${linkClass}`}>
            <ArrowRight
              className="mt-1.5 h-3.5 w-3.5 shrink-0 text-red-600 transition-transform duration-200 rtl:-scale-x-100 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5"
              aria-hidden
            />
            <span>{link.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * One of the three link columns, with its pill under the list when it has one.
 * `always`: links the column shows whatever the editor left in it (the legal
 * texts under "Bilgi Sayfaları"), after its own, each once.
 */
function LinkColumn({ id, column, always = [] }: { id: string; column: HomeFooterColumn; always?: { label: string; href: string }[] }) {
  const own = new Set(column.links.map((link) => link.href));
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className={headingClass}>
        {column.title}
      </h2>
      <ArrowLinks links={[...column.links, ...always.filter((link) => !own.has(link.href))]} />
      {column.cta_label && column.cta_href && (
        <Link href={column.cta_href} className={pillClass}>
          {column.cta_label}
          <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
        </Link>
      )}
    </nav>
  );
}

/**
 * The ways to pay, as small marks on white chips: the card schemes checkout
 * takes and the payment institution behind the card form. Drawn here (wordmarks
 * and the Mastercard circles), not images, so they are crisp and load nothing.
 */
function PaymentBadges({ label }: { label: string }) {
  const chip = "flex h-8 items-center justify-center rounded-md bg-white px-3 shadow-sm";
  return (
    <ul aria-label={label} className="flex flex-wrap items-center justify-center gap-2">
      <li className={chip}>
        <span className="text-[13px] font-extrabold tracking-tight text-[#1b75bb]">
          Pay<span className="text-[#1e3a5f]">TR</span>
        </span>
      </li>
      <li className={chip}>
        <span className="text-[15px] font-black italic tracking-tight text-[#1a1f71]">VISA</span>
      </li>
      <li className={chip} aria-label="Mastercard">
        <svg viewBox="0 0 38 24" className="h-5 w-8" aria-hidden>
          <circle cx="14" cy="12" r="9" fill="#eb001b" />
          <circle cx="24" cy="12" r="9" fill="#f79e1b" />
          <path d="M19 4.6a9 9 0 0 1 0 14.8 9 9 0 0 1 0-14.8z" fill="#ff5f00" />
        </svg>
      </li>
      <li className={chip}>
        <span className="text-[14px] font-extrabold lowercase tracking-tight text-[#00a0a6]">troy</span>
      </li>
    </ul>
  );
}

/**
 * Near-black with a crimson wash, dark in both themes. Every line of it comes
 * from the footer settings in "Ana Sayfa Düzenleme" (`lib/homepage`), but for
 * the few labels of its own (`footerMessages`).
 */
export async function SiteFooter({ footer }: { footer: HomeFooter }) {
  const m = await getMessages(footerMessages);
  return (
    <footer className="dark relative overflow-hidden bg-[#0b0b0c] text-foreground">
      {/* The ruby glow behind the contact cards; decoration only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgb(153_27_27/0.28),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <ContactBar phone={footer.phone} email={footer.email} whatsappHref={footer.whatsapp_href} />

        <div className="mt-12 grid grid-cols-1 gap-8 border-t border-neutral-800 py-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand, branches, hours and social. */}
          <section aria-labelledby="footer-brand">
            {/* Wordmark heights keep emblem + wordmark inside the column: one
                column on a phone, two from md, four (≈284px each) from lg. */}
            <Link
              href="/"
              aria-label={m.homeAria(footer.brand_name)}
              className="inline-flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <LogoEmblem className="h-10 w-10 md:h-11 md:w-11" />
              <span>
                <span id="footer-brand" className="sr-only">
                  {footer.brand_name}
                </span>
                <LogoWordmark className="block h-[18px] md:h-5 lg:h-4" />
                {footer.tagline && (
                  <span className="mt-2 block text-xs font-semibold tracking-[0.25em] text-neutral-400">
                    {footer.tagline}
                  </span>
                )}
              </span>
            </Link>

            <address className="mt-6 space-y-4 not-italic">
              {footer.branches.map((branch, i) => {
                // A branch whose store page is published leads to it (lib/stores).
                const store = storeForBranch(branch.name);
                return (
                  <p key={`${branch.name}-${i}`} className="flex gap-2.5 text-sm leading-5 text-neutral-400">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                    <span>
                      <strong className="block text-xs font-bold uppercase tracking-wider text-white">
                        {store?.verified ? (
                          <Link href={storeHref(store)} className="underline-offset-4 hover:underline">
                            {branch.name}
                          </Link>
                        ) : (
                          branch.name
                        )}
                      </strong>
                      {branch.address}
                    </span>
                  </p>
                );
              })}
              {footer.hours && (
                <p className="flex gap-2.5 text-sm leading-5 text-neutral-400">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                  <span>
                    <strong className="block text-xs font-bold uppercase tracking-wider text-white">{m.hours}</strong>
                    {footer.hours}
                  </span>
                </p>
              )}
            </address>

            {footer.social.length > 0 && (
              <ul className="mt-6 space-y-2">
                {footer.social.map((social, i) => {
                  const Icon = SOCIAL_ICONS[social.kind] ?? Link2;
                  return (
                    <li key={`${social.href}-${i}`}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex min-h-10 items-center gap-2.5 md:min-h-0 ${linkClass}`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-red-600" />
                        {social.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <LinkColumn id="footer-blog" column={footer.blog} />
          {/* Every legal text a shop has to show, under "Bilgi Sayfaları" with the
              rest. Cancellation and returns are article 6 of the distance sales
              agreement, so that link covers them. */}
          <LinkColumn
            id="footer-info"
            column={footer.info}
            always={[
              { href: DISTANCE_SALES_HREF, label: m.distanceSales },
              { href: legalHref("PRIVACY"), label: m.kvkk },
              { href: legalHref("COOKIES"), label: m.cookies },
            ]}
          />
          <LinkColumn id="footer-faq" column={footer.faq} />
        </div>

        {/* The ways to pay: fixed, whatever the columns above hold. */}
        <div className="flex justify-center border-t border-neutral-800 py-8">
          <PaymentBadges label={m.payments} />
        </div>

        <div className="border-t border-neutral-800 py-8 text-center">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} {footer.copyright}
          </p>
          {footer.price_note && <p className="mt-1 text-xs text-neutral-400">{footer.price_note}</p>}
        </div>
      </div>
    </footer>
  );
}
