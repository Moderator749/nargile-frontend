import type { Metadata } from "next";

import { InfoPage } from "@/components/info/InfoPage";
import { CargoTracking } from "@/components/orders/CargoTracking";
import { pageMessages } from "@/lib/i18n/messages/layout";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

const HREF = "/kargo-takip";

// Its words are the shop's own, in every language: all three are indexed.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMessages[locale];
  return pageMetadata({
    title: m.trackingTitle,
    description: m.trackingDescription,
    href: HREF,
    locale,
    locales: "all",
  });
}

export default async function CargoTrackingPage() {
  const m = pageMessages[await getLocale()];
  return (
    <InfoPage title={m.trackingTitle} href={HREF}>
      <CargoTracking />
    </InfoPage>
  );
}
