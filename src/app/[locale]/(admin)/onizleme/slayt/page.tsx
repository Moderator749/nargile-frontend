import type { Metadata } from "next";

import { MobileSlidePreview } from "@/components/admin/hero/MobileSlidePreview";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = { title: "Slayt önizleme (mobil)", robots: PRIVATE_ROBOTS };

/**
 * The phone's view of a hero slide, framed by /admin/hero's "Mobil" view at a
 * phone's width (so the storefront's phone styles apply). Outside the admin
 * shell on purpose: no header, no menu, only the slide. It shows only what
 * the editor's window sends it.
 */
export default function Page() {
  return <MobileSlidePreview />;
}
