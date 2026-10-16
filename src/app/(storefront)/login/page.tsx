import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm, type RegistrationNotice } from "@/components/auth/LoginForm";
import { LinkButton } from "@/components/ui/LinkButton";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabınıza giriş yapın; size özel kafe, toptan ve bayi fiyatlarına erişin.",
  robots: PRIVATE_ROBOTS,
};

/** `?registered=` as sign-up leaves it; anything else is nobody arriving from there. */
function notice(registered: string | string[] | undefined): RegistrationNotice | null {
  if (registered === "1") return "account";
  if (registered === "review" || registered === "export") return registered;
  return null;
}

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
      title="Hoş geldiniz"
      subtitle="Siparişlerinize ve size özel fiyatlara erişmek için giriş yapın."
      footer={
        /* The same button the registration page points back with. */
        <>
          <span className="block">Hesabınız yok mu?</span>
          <LinkButton href="/register" variant="secondary" className="mt-3">
            Üye olun
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
              aria-hidden
            />
          </LinkButton>
        </>
      }
    >
      <LoginForm notice={notice(registered)} redirectTo={safeRedirect(next)} />
    </AuthCard>
  );
}
