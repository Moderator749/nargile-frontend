import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap | Nargile SaaS",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const { registered } = await props.searchParams;

  return (
    <AuthCard
      title="Tekrar hoş geldiniz"
      subtitle="Siparişlerinize ve size özel fiyatlara erişmek için giriş yapın."
      footer={
        <>
          Hesabınız yok mu?{" "}
          <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Hemen kayıt olun
          </Link>
        </>
      }
    >
      <LoginForm justRegistered={registered === "1"} />
    </AuthCard>
  );
}
