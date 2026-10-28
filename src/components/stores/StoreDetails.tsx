import Image from "next/image";
import { ArrowRight, Clock, MapPin, MessageCircle, Navigation, Phone, Store as StoreIcon } from "lucide-react";

import Link from "@/components/i18n/Link";
import { InstagramIcon } from "@/components/icons/SocialIcons";
import { StoreMap } from "@/components/stores/StoreMap";
import { telHref } from "@/lib/contact";
import type { Locale } from "@/lib/i18n/config";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { storeMessages } from "@/lib/i18n/messages/stores";
import { WEEK, directionsHref, fullAddress, mapEmbedSrc, missingFields, storeHref, type Store } from "@/lib/stores";

/** The day's name in the page's language (1 January 2024 was a Monday). */
const dayName = (index: number, locale: Locale) =>
  new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + index)));

const BUTTON =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";
const PRIMARY = `${BUTTON} bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600`;
const SECONDARY = `${BUTTON} border border-border bg-white text-neutral-900 hover:border-neutral-900 focus-visible:outline-neutral-900 dark:bg-transparent dark:text-white dark:hover:border-white`;

/**
 * One store: where it is, when it is open and how to reach it, what it
 * sells (as links into the catalog) and the way to the other store. A draft
 * says so at the top, with what the shop still has to send.
 */
export function StoreDetails({
  store,
  other,
  locale,
  phone,
  whatsappHref,
}: {
  store: Store;
  other: Store | null;
  locale: Locale;
  /** The store's own number, else the shop's. */
  phone: string;
  whatsappHref: string;
}) {
  const m = storeMessages[locale];
  const copy = store.copy[locale];
  const district = store.district[locale];
  const instagram = store.sameAs.find((u) => u.includes("instagram.com"));

  return (
    <div className="space-y-10">
      {!store.verified && (
        <div role="note" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-semibold">{m.draft}</p>
          <p className="mt-1">
            {m.draftMissing} {missingFields(store).join(", ")}.
          </p>
        </div>
      )}

      <div className="space-y-4 text-base leading-7 text-neutral-700 dark:text-zinc-300">
        {copy.intro.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="store-contact" className="rounded-3xl border border-border bg-white p-6 sm:p-8 dark:bg-muted">
          <h2 id="store-contact" className="sr-only">
            {m.address}
          </h2>
          <address className="space-y-5 not-italic">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
              <span>
                <strong className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">{m.address}</strong>
                <span className="text-sm text-neutral-900 dark:text-zinc-100">
                  {fullAddress(store)}
                  {store.postalCode && ` ${store.postalCode}`}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{m.nearby(store.nearby.join(", "))}</span>
              </span>
            </p>
            <p className="flex gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
              <span>
                <strong className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">{m.phone}</strong>
                <a href={telHref(phone)} dir="ltr" className="text-sm text-neutral-900 underline-offset-4 hover:underline dark:text-zinc-100">
                  {phone}
                </a>
              </span>
            </p>
            {store.hours && (
              <div className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">{m.hours}</strong>
                  <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
                    {WEEK.map((day, i) => {
                      const open = store.hours!.find((h) => h.days.includes(day));
                      return (
                        <div key={day} className="contents">
                          <dt className="text-neutral-600 dark:text-zinc-400">{dayName(i, locale)}</dt>
                          {/* Numbers read left to right on an Arabic page too. */}
                          <dd className="tabular-nums text-neutral-900 dark:text-zinc-100">
                            {open ? <bdi dir="ltr">{`${open.opens} – ${open.closes}`}</bdi> : m.closed}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              </div>
            )}
          </address>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={directionsHref(store)} target="_blank" rel="noopener noreferrer" className={PRIMARY}>
              <Navigation className="h-4 w-4" aria-hidden />
              {m.directions}
            </a>
            <a href={telHref(phone)} className={SECONDARY}>
              <Phone className="h-4 w-4" aria-hidden />
              {m.call}
            </a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={SECONDARY}>
              <MessageCircle className="h-4 w-4" aria-hidden />
              {m.whatsapp}
            </a>
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" className={SECONDARY}>
                <InstagramIcon className="h-4 w-4" />
                {m.instagram}
              </a>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <StoreMap src={mapEmbedSrc(store)} title={m.mapTitle(district)} label={m.showMap} note={m.mapNote} />
          {store.photos.length > 0 ? (
            // Each photo whole, in its own proportions: they are cropped to what may be shown.
            <ul className="space-y-4">
              {store.photos.map((photo, i) => (
                <li key={photo.src} className="overflow-hidden rounded-2xl">
                  <Image
                    src={photo.src}
                    alt={photo.alt[locale]}
                    width={photo.width}
                    height={photo.height}
                    sizes="(min-width: 1024px) 480px, 100vw"
                    priority={i === 0}
                    className="h-auto w-full"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex aspect-[16/6] items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              <StoreIcon className="h-4 w-4" aria-hidden />
              {m.photoPending}
            </div>
          )}
        </div>
      </div>

      <section aria-labelledby="store-range">
        <h2 id="store-range" className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {m.inStore}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {m.inStoreLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm text-neutral-800 transition-colors hover:border-neutral-900 dark:text-zinc-200 dark:hover:border-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="store-business" className="rounded-3xl bg-neutral-900 p-6 text-white sm:p-8">
        <h2 id="store-business" className="text-xl font-bold tracking-tight">
          {m.business}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-300">{m.businessText}</p>
        <Link href="/register" className={`${BUTTON} mt-5 bg-white text-neutral-900 hover:bg-neutral-200 focus-visible:outline-white`}>
          {m.businessCta}
        </Link>
      </section>

      {other && (
        <p>
          <Link
            href={storeHref(other)}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white"
          >
            {m.otherStore}: {other.copy[locale].heading}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
          </Link>
        </p>
      )}
    </div>
  );
}
