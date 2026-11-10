import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { UnsubscribeConfirm } from "@/components/newsletter/UnsubscribeConfirm";
import { unsubscribeMessages } from "@/lib/i18n/messages/unsubscribe";
import { getMessages } from "@/lib/i18n/server";
import { PRIVATE_ROBOTS } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(unsubscribeMessages);
  return { title: m.metaTitle, description: m.metaDescription, robots: PRIVATE_ROBOTS };
}

/** "Abonelikten Çık": where a campaign e-mail's footer link lands (the backend's services/unsubscribe). */
export default async function UnsubscribePage(props: PageProps<"/[locale]/abonelikten-cik">) {
  const { token } = await props.searchParams;
  const m = await getMessages(unsubscribeMessages);
  return (
    <AuthCard title={m.title} subtitle={m.subtitle} footer={null}>
      <UnsubscribeConfirm token={typeof token === "string" ? token : ""} />
    </AuthCard>
  );
}
