import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bike, Crown, CreditCard, Landmark, Layers, PiggyBank, Truck, type LucideIcon } from "lucide-react";

import { BilgiLayout } from "@/components/bilgi/BilgiLayout";
import { BILGI_HREF, PERKS_PAGE } from "@/lib/bilgi";
import { pageMetadata } from "@/lib/seo";
import { getStoreParameters } from "@/lib/server/catalog";
import { formatRate } from "@/lib/storeParameters";
import type { ParameterTier, StoreParameters } from "@/types";

// A day, as the catalog; saving "Parametreler" in the panel refreshes it at once.
export const revalidate = 86400;

/** "3000.00" → "3.000 TL", "29999.99" → "29.999,99 TL". */
const tl = (amount: string | number) =>
  `${Number(amount).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL`;

/** A point's life in the wallet (`app/services/wallet.py`, POINT_LIFETIME): a year. */
const POINT_LIFETIME = "1 yıl";

/**
 * A discount ladder as sentences, lowest rung first: each rung up to the next
 * one's threshold less a kuruş, the last "and above". Rungs that give nothing
 * are left out.
 */
function ladder(tiers: ParameterTier[], line: (range: string, rate: string, last: boolean) => ReactNode): ReactNode[] {
  const live = tiers.filter((t) => Number(t.rate) > 0).sort((a, b) => Number(a.threshold) - Number(b.threshold));
  return live.map((tier, i) => {
    const next = live[i + 1];
    const range = next
      ? `${tl(tier.threshold)} – ${tl(Number(next.threshold) - 0.01)} arası`
      : `${tl(tier.threshold)} ve üzeri`;
    return line(range, formatRate(tier.rate), !next);
  });
}

interface Perk {
  id: string;
  Icon: LucideIcon;
  title: string;
  points: ReactNode[];
  /** Fine print under the points, in its own quiet box. */
  note?: ReactNode;
}

/** Everything the page states, from the rules checkout applies (`params`). */
function perks(params: StoreParameters): Perk[] {
  const threshold = tl(params.free_shipping_threshold);
  const coalRatio = formatRate(params.coal_max_ratio);
  const coalMinimum =
    params.coal_rule_basis === "quantity" ? `${params.coal_min_quantity} adet` : `${Number(params.coal_min_kg)} kg`;
  const { loyalty } = params;
  const volume = ladder(params.volume_tiers, (range, rate, last) => (
    <>
      {range} alışverişlerde anında <strong>{rate}</strong> {last ? "toptan sepet indirimi" : "sepet indirimi"} uygulanır.
    </>
  ));
  const transfer = ladder(params.bank_transfer_tiers, (range, rate) => (
    <>
      {range} havale/EFT ödemelerinde anında <strong>{rate}</strong> nakit indirimi uygulanır.
    </>
  ));
  const bonusRate =
    loyalty.annual_bonus_points > 0 && Number(loyalty.annual_spend_threshold) > 0
      ? formatRate((loyalty.annual_bonus_points * Number(loyalty.conversion_rate)) / Number(loyalty.annual_spend_threshold))
      : null;
  const ceiling = Number(loyalty.annual_order_ceiling) > 0 ? `${tl(loyalty.annual_order_ceiling)} altındaki` : "tüm";

  return [
    {
      id: "ucretsiz-kargo",
      Icon: Truck,
      title: "Ücretsiz Kargo Avantajı",
      points: [
        <>
          <strong>{threshold} ve üzeri</strong> tüm perakende siparişlerinizde kargo tamamen ücretsizdir.
        </>,
        <>
          <strong>Kömür siparişleri:</strong> Kömür bedeli sepet tutarının {coalRatio} oranını aşıyorsa, ücretsiz kargo
          için tek seferde en az <strong>{coalMinimum}</strong> kömür alınması gerekir.
        </>,
        <>
          <strong>Sepet dengesi:</strong> Kömür bedelinin sepet tutarının {coalRatio} oranını aşmadığı karma sepetlerde ayrıca{" "}
          {params.coal_rule_basis === "quantity" ? "adet" : "kilo"} şartı aranmaz; {threshold} barajı yeterlidir.
        </>,
      ],
      note: "Ücretsiz kargo koşullarını karşılamayan siparişler, kargo ücreti teslimatta alıcı tarafından ödenmek üzere (karşı ödemeli) gönderilir.",
    },
    {
      id: "istanbul-kurye",
      Icon: Bike,
      title: "İstanbul İçi VIP Kurye ile Hızlı Teslimat",
      points: [
        "İstanbul içi acil siparişlerinizde hızlı moto kurye teslimatı sağlanır.",
        "Sevkiyatlar teslimat adresinize en yakın mağazamızdan (Bahçelievler veya Esenyurt) organize edilir.",
        <>
          Kurye hizmetimiz <strong>10:00 – 20:00</strong> saatleri arasında geçerlidir.
        </>,
      ],
      note: "Sipariş oluşturulduğunda güncel kurye mesafesi ve bedeli belirlenerek onayınıza sunulur; kurye masrafı alıcıya aittir.",
    },
    {
      id: "taksit",
      Icon: CreditCard,
      title: "Peşin Fiyatına 3 Taksit İmkânı",
      points: [
        <>
          Seçili ürün gruplarında anlaşmalı kredi kartlarına <strong>vade farksız 3 taksit</strong> seçeneği sunulmaktadır.
        </>,
        "3 taksitin üzerindeki vadeli seçenekler, bankanızın sunduğu oranlarla ödeme adımında listelenir.",
      ],
    },
    ...(volume.length > 0
      ? [
          {
            id: "sepet-indirimi",
            Icon: Layers,
            title: "Kademeli Otomatik Sepet İndirimi",
            points: volume,
            note: "İndirim, sepet tutarınıza göre ödeme adımında kendiliğinden uygulanır; ayrıca bir kod girmeniz gerekmez.",
          },
        ]
      : []),
    ...(transfer.length > 0
      ? [
          {
            id: "havale-indirimi",
            Icon: Landmark,
            title: "Havale & EFT Ekstra Nakit İndirimi",
            points: transfer,
            note:
              volume.length > 0
                ? "Havale/EFT indirimi, varsa kademeli sepet indirimi düşüldükten sonra kalan tutara uygulanır."
                : undefined,
          },
        ]
      : []),
    ...(loyalty.enabled && Number(loyalty.base_rate) > 0
      ? [
          {
            id: "sultanpuan",
            Icon: Crown,
            title: `SultanPuan Sadakat Programı (${formatRate(loyalty.base_rate)})`,
            points: [
              <>
                {tl(loyalty.band_min)} – {tl(loyalty.band_max)} arasındaki tek seferlik siparişlerinizde{" "}
                <strong>{formatRate(loyalty.base_rate)} SultanPuan</strong> hesabınıza yüklenir.
              </>,
              <>
                Kazandığınız puanları sonraki siparişlerinizde kısmen ya da tek seferde kullanabilirsiniz; 1 SultanPuan ={" "}
                {tl(loyalty.conversion_rate)}.
              </>,
              <>Puanların kullanım süresi, kazanıldıkları tarihten itibaren {POINT_LIFETIME}dır.</>,
            ],
          },
        ]
      : []),
    ...(loyalty.enabled && bonusRate
      ? [
          {
            id: "kumbarapuan",
            Icon: PiggyBank,
            title: `KumbaraPuan Birikim Sistemi (${bonusRate})`,
            points: [
              <>
                {ceiling.charAt(0).toUpperCase() + ceiling.slice(1)} siparişlerinizin son {loyalty.annual_period_days} gün
                içindeki toplamı <strong>{tl(loyalty.annual_spend_threshold)}</strong>’ye ulaştığında hesabınıza otomatik
                olarak <strong>{loyalty.annual_bonus_points.toLocaleString("tr-TR")} puan ({bonusRate})</strong> tanımlanır.
              </>,
              <>
                Puanlar SultanPuan bakiyenize eklenir; sonraki alışverişlerinizde serbestçe kullanabilirsiniz ({POINT_LIFETIME}{" "}
                geçerli).
              </>,
            ],
          },
        ]
      : []),
  ];
}

export async function generateMetadata(): Promise<Metadata> {
  const params = await getStoreParameters();
  return pageMetadata({
    title: PERKS_PAGE.title,
    description: `${tl(params.free_shipping_threshold)} ve üzeri ücretsiz kargo, İstanbul içi aynı gün kurye, havale/EFT ve sepet indirimleri, SultanPuan ve KumbaraPuan: Sultan Nargile ayrıcalıkları.`,
    href: PERKS_PAGE.href,
  });
}

/**
 * "Ayrıcalıklar ve Avantajlar": every retail perk on one page, each its own
 * section card — a number, an icon, an <h2>, the points and any fine print.
 * Linked from the footer's Bilgi Sayfaları column and listed on /bilgi.
 *
 * The figures are the ones checkout applies, read from "Parametreler"
 * (`getStoreParameters`), so the page cannot promise a threshold or a rate
 * the cart does not honour; a rule the panel switches off (Sultan Puan, a
 * ladder with no rungs) drops its section. The courier and the instalments
 * are the shop's own terms, stated as written. Each section has an id, so a
 * perk can be linked to directly (…#sultanpuan).
 */
export default async function PerksPage() {
  const params = await getStoreParameters();
  const list = perks(params);

  return (
    <BilgiLayout
      title={PERKS_PAGE.title}
      breadcrumbs={[
        { name: "Ana Sayfa", href: "/" },
        { name: "Bilgi Sayfaları", href: BILGI_HREF },
        { name: PERKS_PAGE.title, href: PERKS_PAGE.href },
      ]}
    >
      <p className="max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
        Bireysel (perakende) alışverişlerinizde geçerli kargo, teslimat, ödeme ve puan ayrıcalıklarının tamamı. Tutarlar ve
        oranlar, ödeme adımında uygulananlarla aynıdır.
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-500">
        Bayi, Toptan ve Kafe hesapları kendi fiyat listeleriyle alışveriş yapar; bu sayfadaki indirim ve puanlar bu
        hesaplara uygulanmaz.
      </p>

      {/* The perks at a glance: each a link to its card. */}
      <nav aria-label="Ayrıcalıklar" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {list.map(({ id, title }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="inline-flex rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors duration-200 hover:border-red-300 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-red-400/50 dark:hover:text-red-400"
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 space-y-5">
        {list.map(({ id, Icon, title, points, note }, i) => (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-baslik`}
            className="scroll-mt-[calc(var(--header-height,4rem)+1.5rem)] rounded-2xl border border-neutral-200 bg-white p-6 transition-colors duration-200 hover:border-red-200 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:border-red-400/30"
          >
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20"
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] font-medium tracking-[0.2em] text-neutral-400 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 id={`${id}-baslik`} className="mt-0.5 text-lg font-bold tracking-tight text-neutral-900 sm:text-xl dark:text-white">
                  {title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {points.map((point, j) => (
                    <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300 [&_strong]:font-semibold [&_strong]:text-neutral-900 dark:[&_strong]:text-white">
                      <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                {note && (
                  <p className="mt-5 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600 dark:bg-white/[0.03] dark:text-neutral-400">
                    {note}
                  </p>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </BilgiLayout>
  );
}
