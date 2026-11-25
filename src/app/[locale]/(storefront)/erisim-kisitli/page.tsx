import type { Metadata } from "next";

import { AccessRestricted } from "@/components/layout/AccessRestricted";
import { accessMessages } from "@/lib/i18n/messages/access";
import { getMessages } from "@/lib/i18n/server";

/** Never indexed: what src/proxy.ts answers a closed address with ("Grup Erişim Kısıtlamaları"). */
export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(accessMessages);
  return { title: m.meta, robots: { index: false, follow: false } };
}

export default function Page() {
  return <AccessRestricted />;
}
