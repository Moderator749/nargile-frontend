import type { Metadata } from "next";

import Link from "@/components/i18n/Link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Şifre Yenile",
  description: "Hesabınız için yeni bir şifre belirleyin.",
  robots: PRIVATE_ROBOTS,
};

export default async function ResetPasswordPage(props: PageProps<"/[locale]/sifre-yenile">) {
  const { token } = await props.searchParams;
  return (
    <AuthCard
      title="Yeni şifre belirleyin"
      subtitle="Hesabınız için yeni bir şifre seçin."
      footer={
        <Link href="/login" className="font-medium text-red-600 hover:underline dark:text-red-400">
          ← Giriş sayfasına dön
        </Link>
      }
    >
      <ResetPasswordForm token={typeof token === "string" ? token : ""} />
    </AuthCard>
  );
}
