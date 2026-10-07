import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabınıza giriş yapın; size özel kafe, toptan ve bayi fiyatlarına erişin.",
  robots: PRIVATE_ROBOTS,
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
          <Link href="/register" className="font-semibold text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300">
            Hemen kayıt olun
          </Link>
        </>
      }
    >
      <LoginForm justRegistered={registered === "1"} redirectTo={safeRedirect(next)} />
    </AuthCard>
  );
}
