import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  description: "Şifrenizi e-posta bağlantısı ya da SMS koduyla yenileyin.",
  robots: PRIVATE_ROBOTS,
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Şifremi unuttum"
      subtitle="Şifrenizi e-postanıza gelen bağlantıyla ya da cep telefonunuza gelen kodla yenileyin."
      footer={
        <Link href="/login" className="font-medium text-red-600 hover:underline dark:text-red-400">
          ← Giriş sayfasına dön
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
