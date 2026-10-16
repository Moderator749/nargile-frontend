import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { InstagramIcon, YouTubeIcon } from "@/components/icons/SocialIcons";
import { SmoothAnchor } from "@/components/home/SmoothAnchor";
import type { PromoBox } from "@/lib/home";

/** The channels, in order; one without a link in /admin/promos is left out. */
const CHANNELS: { key: "instagram" | "youtube"; Icon: ComponentType<{ className?: string }> }[] = [
  { key: "instagram", Icon: InstagramIcon },
  { key: "youtube", Icon: YouTubeIcon },
];

/** Where the brand column leads: the whole catalog. */
const COLLECTION_HREF = "/catalog";

// The roomier padding waits for xl: at lg the outer quarters are too narrow for it.
const COLUMN = "flex flex-col justify-center p-8 xl:p-12";
const OVERLINE = "text-xs font-bold uppercase tracking-widest";
const HEADING = "mt-2 mb-4 text-2xl font-bold text-gray-900 dark:text-white";
const ARROW = "ml-1.5 h-4 w-4";

/**
 * Modules 6 & 7, as one editorial band: three columns split by hairlines (the
 * shop's channels, the brand, the advantages), with no boxes of their own.
 * Equal thirds on a tablet; from `lg` the brand takes the middle half and the
 * other two a quarter each. Stacked below `md`, the lines turn horizontal.
 *
 * The advantages column and the channels come from the "social" promo box in
 * /admin/promos (eyebrow, title, links); the middle column is fixed copy.
 */
export function PromoSpotlight({ box }: { box: PromoBox }) {
  const widget = box.widget;
  // The admin types the dots into the eyebrow; the overline has none.
  const eyebrow = box.eyebrow.replace(/^[•·\s]+|[•·\s]+$/g, "");
  const channels = CHANNELS.flatMap(({ key, Icon }) => {
    const href = widget?.[`${key}_href`];
    return href ? [{ key, href, label: widget![`${key}_label`] || key, Icon }] : [];
  });

  return (
    <section className="grid grid-cols-1 divide-y divide-gray-200 border-y border-gray-200 md:grid-cols-3 md:divide-x md:divide-y-0 lg:grid-cols-4 dark:divide-border dark:border-border">
      {channels.length > 0 && (
        <div className={COLUMN}>
          <p className={`${OVERLINE} text-gray-500 dark:text-neutral-400`}>{box.text || "Bizi takip edin"}</p>
          <h2 className={HEADING}>Topluluğa Katılın</h2>
          <ul className="mt-2 flex flex-row flex-wrap gap-3">
            {channels.map(({ key, href, label, Icon }) => (
              <li key={key}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition-all hover:border-red-700 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-neutral-700 dark:text-white dark:hover:border-red-400 dark:hover:text-red-400"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                  <span className="sr-only">(yeni sekmede açılır)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${COLUMN} ${channels.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
        <p className={`${OVERLINE} text-gray-500 dark:text-neutral-400`}>Güvenilir Marka</p>
        <h2 className={HEADING}>Sektörde Referans Noktası</h2>
        <p className="mb-6 leading-relaxed text-gray-600 dark:text-neutral-400">
          Nargile kültürünü modern mühendislik ve birinci sınıf materyallerle yeniden tanımlıyoruz. Sadece bir donanım
          değil; estetik, performans ve uzun ömürlülüğü bir araya getiren premium bir deneyim sunuyoruz.
        </p>
        <Link
          href={COLLECTION_HREF}
          className="inline-flex w-fit items-center whitespace-nowrap font-semibold text-gray-900 transition-colors hover:text-red-700 dark:text-white dark:hover:text-red-400"
        >
          Koleksiyonu Keşfet
          <ArrowUpRight className={ARROW} aria-hidden />
        </Link>
      </div>

      <div className={COLUMN}>
        {eyebrow && <p className={`${OVERLINE} text-red-700 dark:text-red-400`}>{eyebrow}</p>}
        <h2 className="mt-2 mb-4 text-balance text-3xl font-extrabold text-gray-900 dark:text-white">{box.title}</h2>
        <SmoothAnchor
          href={box.href}
          className="inline-flex w-fit items-center whitespace-nowrap font-semibold text-red-700 transition-colors hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
        >
          {widget?.anchor_label || "Avantajları Keşfet"}
          <ArrowUpRight className={ARROW} aria-hidden />
        </SmoothAnchor>
      </div>
    </section>
  );
}
