import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { LinkButton } from "@/components/ui/LinkButton";
import { authPageMessages } from "@/lib/i18n/messages/auth";
import { getMessages } from "@/lib/i18n/server";
import { PRIVATE_ROBOTS } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { register } = await getMessages(authPageMessages);
  return { title: register.metaTitle, description: register.metaDescription, robots: PRIVATE_ROBOTS };
}

export default async function RegisterPage() {
  const { register: m } = await getMessages(authPageMessages);
  return (
    <AuthCard
      size="lg"
      title={m.title}
      subtitle={m.subtitle}
      footer={
        /* A button, not a link in a sentence: somebody who already has an
           account should not have to read their way out of a long form. */
        <>
          <span className="block">{m.haveAccount}</span>
          <LinkButton href="/login" variant="secondary" className="mt-3">
            {m.signIn}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:motion-safe:group-hover:-translate-x-0.5"
              aria-hidden
            />
          </LinkButton>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
