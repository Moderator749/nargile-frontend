import type { Metadata } from "next";

import { AccountView } from "@/components/account/AccountView";
import { accountMessages } from "@/lib/i18n/messages/account";
import { getMessages } from "@/lib/i18n/server";
import { PRIVATE_ROBOTS } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(accountMessages);
  return { title: m.metaTitle, description: m.metaDescription, robots: PRIVATE_ROBOTS };
}

export default function AccountPage() {
  return <AccountView />;
}
