import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm, type RegistrationNotice } from "@/components/auth/LoginForm";
import { LinkButton } from "@/components/ui/LinkButton";
import { authPageMessages } from "@/lib/i18n/messages/auth";
import { getMessages } from "@/lib/i18n/server";
import { PRIVATE_ROBOTS } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { login } = await getMessages(authPageMessages);
  return { title: login.metaTitle, description: login.metaDescription, robots: PRIVATE_ROBOTS };
}

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

export default async function LoginPage(props: PageProps<"/[locale]/login">) {
  const { registered, next } = await props.searchParams;
  const { login: m } = await getMessages(authPageMessages);

  return (
    <AuthCard
      title={m.title}
      subtitle={m.subtitle}
      footer={
        /* The same button the registration page points back with. */
        <>
          <span className="block">{m.noAccount}</span>
          <LinkButton href="/register" variant="secondary" className="mt-3">
            {m.signUp}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:motion-safe:group-hover:-translate-x-0.5"
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
