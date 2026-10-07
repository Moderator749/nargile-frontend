import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Ücretsiz hesap oluşturun, siparişlerinizi takip edin ve ParaPuan kazanın.",
  robots: PRIVATE_ROBOTS,
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Hesap oluşturun"
      subtitle="Ücretsiz kaydolun, siparişlerinizi kolayca takip edin."
      footer={
        <>
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="font-semibold text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300">
            Giriş yapın
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
