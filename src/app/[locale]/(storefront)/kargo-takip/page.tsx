import type { Metadata } from "next";

import { InfoPage } from "@/components/info/InfoPage";
import { CargoTracking } from "@/components/orders/CargoTracking";
import { pageMetadata } from "@/lib/seo";

const TITLE = "Kargo Takip";
const HREF = "/kargo-takip";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: "Yurtiçi Kargo takip numaranızla gönderinizi sorgulayın; üyeyseniz siparişlerinizin kargo durumunu görün.",
  href: HREF,
});

export default function CargoTrackingPage() {
  return (
    <InfoPage title={TITLE} href={HREF}>
      <CargoTracking />
    </InfoPage>
  );
}
