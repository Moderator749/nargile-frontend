import type { ComponentType, ReactNode } from "react";
import { ArrowRight, Clock, Link2, MapPin } from "lucide-react";

import { BlogQuestionsButton } from "@/components/blog/BlogQuestionsDialog";
import Link from "@/components/i18n/Link";
import { LogoEmblem, LogoWordmark } from "@/components/brand/Logo";
import { InstagramIcon, YouTubeIcon } from "@/components/icons/SocialIcons";
import { CookiePreferencesButton } from "@/components/common/CookiePreferencesButton";
import { ContactBar } from "@/components/layout/ContactBar";
import { PaymentBadges } from "@/components/payment/PaymentBadges";
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

const arrowClass =
  "mt-1.5 h-3.5 w-3.5 shrink-0 text-red-600 transition-transform duration-200 rtl:-scale-x-100 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5";

/**
 * A column of links, each behind a red arrow — pointing, and nudging, the way
 * the text reads. `extra`: one more row after them that is not a link (a
 * button drawn the same way).
 */
function ArrowLinks({ links, extra }: { links: { label: string; href: string }[]; extra?: ReactNode }) {
  return (
    // A phone's link is a row a finger can hit (40px, its padding); from md the list is as dense as it was.
    <ul className="md:space-y-2.5">
      {links.map((link, i) => (
        <li key={`${link.href}-${i}`}>
          <Link href={link.href} className={`group flex gap-2 py-2 md:py-0 ${linkClass}`}>
            <ArrowRight className={arrowClass} aria-hidden />
            <span>{link.label}</span>
          </Link>
        </li>
      ))}
      {extra && <li>{extra}</li>}
    </ul>
  );
}

/**
 * One of the three link columns, with its pill under the list when it has one.
 * `always`: links the column shows whatever the editor left in it (the legal
 * texts under "Bilgi Sayfaları"), after its own, each once. `cta`: the pill
 * drawn some other way than as a plain link. `extra`: a last row that is not
 * a link (see ArrowLinks).
 */
function LinkColumn({
  id,
  column,
  always = [],
  cta,
  extra,
}: {
  id: string;
  column: HomeFooterColumn;
  always?: { label: string; href: string }[];
  cta?: (href: string, label: string) => ReactNode;
  extra?: ReactNode;
}) {
  const own = new Set(column.links.map((link) => link.href));
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className={headingClass}>
        {column.title}
      </h2>
      <ArrowLinks links={[...column.links, ...always.filter((link) => !own.has(link.href))]} extra={extra} />
      {column.cta_label &&
        column.cta_href &&
        (cta ? (
          cta(column.cta_href, column.cta_label)
        ) : (
          <Link href={column.cta_href} className={pillClass}>
            {column.cta_label}
            <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
          </Link>
        ))}
    </nav>
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
                // A branch with a store (lib/stores) opens its place on Google Maps,
                // name and address as one wide target; its page, once published,
                // is the small link under it (a link can't hold another).
                const store = storeForBranch(branch.name);
                const lines = (
                  <>
                    <strong className="text-xs font-bold uppercase tracking-wider text-white transition-colors duration-200 group-hover:text-red-400">
                      {branch.name}
                    </strong>
                    <span className="transition-colors duration-200 group-hover:text-neutral-200">{branch.address}</span>
                  </>
                );
                return (
                  <div key={`${branch.name}-${i}`} className="text-sm leading-5 text-neutral-400">
                    {store?.mapsUrl ? (
                      <a
                        href={store.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group -m-2 flex gap-2.5 rounded-lg p-2 transition-colors duration-200 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
                      >
                        <MapPin
                          className="mt-0.5 h-4 w-4 shrink-0 text-red-600 transition-[color,transform] duration-200 group-hover:text-red-400 motion-safe:group-hover:-translate-y-0.5"
                          aria-hidden
                        />
                        <span className="flex flex-col">
                          {lines}
                          <span className="sr-only">{m.opensMap}</span>
                        </span>
                      </a>
                    ) : (
                      <p className="flex gap-2.5">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                        <span className="flex flex-col">{lines}</span>
                      </p>
                    )}
                    {store?.verified && (
                      <Link
                        href={storeHref(store)}
                        className="group ms-[26px] mt-2 inline-flex items-center gap-1 py-1 text-xs font-semibold text-neutral-500 transition-colors duration-200 hover:text-white md:py-0"
                      >
                        {m.storePage}
                        <ArrowRight
                          className="h-3 w-3 rtl:-scale-x-100 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5"
                          aria-hidden
                        />
                      </Link>
                    )}
                  </div>
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

          {/* "Tüm yazıları gör" opens every question of the blog over the page. */}
          <LinkColumn
            id="footer-blog"
            column={footer.blog}
            cta={(href, label) => <BlogQuestionsButton href={href} label={label} className={pillClass} />}
          />
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
            // "Çerez Tercihleri": the cookie banner again, to change the choice (KVKK).
            extra={
              <CookiePreferencesButton
                className={`group flex w-full cursor-pointer gap-2 py-2 text-start md:py-0 ${linkClass}`}
                icon={<ArrowRight className={arrowClass} aria-hidden />}
              />
            }
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
