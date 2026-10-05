import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Kayıt Ol | Nargile SaaS",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Hesap oluşturun"
      subtitle="Ücretsiz kaydolun, siparişlerinizi kolayca takip edin."
      footer={
        <>
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Giriş yapın
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
