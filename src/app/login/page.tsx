import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap | Nargile SaaS",
};

/** Only same-site relative paths, so `?next=` can't be used as an open redirect. */
function safeRedirect(next: string | string[] | undefined): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/catalog";
  }
  return next;
}

export default async function LoginPage(props: PageProps<"/login">) {
  const { registered, next } = await props.searchParams;

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
      <LoginForm justRegistered={registered === "1"} redirectTo={safeRedirect(next)} />
    </AuthCard>
  );
}
