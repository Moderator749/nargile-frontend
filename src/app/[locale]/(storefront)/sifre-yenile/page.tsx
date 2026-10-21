import type { Metadata } from "next";

import Link from "@/components/i18n/Link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { authPageMessages } from "@/lib/i18n/messages/auth";
import { getMessages } from "@/lib/i18n/server";
import { PRIVATE_ROBOTS } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { reset } = await getMessages(authPageMessages);
  return { title: reset.metaTitle, description: reset.metaDescription, robots: PRIVATE_ROBOTS };
}

export default async function ResetPasswordPage(props: PageProps<"/[locale]/sifre-yenile">) {
  const { token } = await props.searchParams;
  const t = await getMessages(authPageMessages);
  const m = t.reset;
  return (
    <AuthCard
      title={m.title}
      subtitle={m.subtitle}
      footer={
        <Link href="/login" className="font-medium text-red-600 hover:underline dark:text-red-400">
          <span aria-hidden className="inline-block rtl:-scale-x-100">
            ←
          </span>{" "}
          {t.backToLogin}
        </Link>
      }
    >
      <ResetPasswordForm token={typeof token === "string" ? token : ""} />
    </AuthCard>
  );
}
