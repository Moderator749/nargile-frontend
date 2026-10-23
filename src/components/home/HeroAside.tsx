import { HeroAsideCards } from "@/components/home/HeroAsideCards";
import type { PromoBox } from "@/lib/home";
import { homeMessages } from "@/lib/i18n/messages/home";
import { getMessages } from "@/lib/i18n/server";

/**
 * The two cards beside the hero, in the page's language (HeroAsideCards,
 * which /admin/promos previews too, so the editor shows what ships).
 */
export async function HeroAside({ box, className = "" }: { box?: PromoBox; className?: string }) {
  return <HeroAsideCards box={box} t={await getMessages(homeMessages)} className={className} />;
}
