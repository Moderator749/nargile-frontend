import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { LinkButton } from "@/components/ui/LinkButton";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description:
    "Bireysel, şahıs firması veya şirket olarak ücretsiz hesap oluşturun; siparişlerinizi takip edin ve ParaPuan kazanın.",
  robots: PRIVATE_ROBOTS,
};

export default function RegisterPage() {
  return (
    <AuthCard
      size="lg"
      title="Hesap oluşturun"
      subtitle="Hesap türünüzü seçin; yalnızca size uygun alanlar sorulur."
      footer={
        /* A button, not a link in a sentence: somebody who already has an
           account should not have to read their way out of a long form. */
        <>
          <span className="block">Zaten hesabınız var mı?</span>
          <LinkButton href="/login" variant="secondary" className="mt-3">
            Giriş yapın
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
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
