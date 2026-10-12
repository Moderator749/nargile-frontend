/**
 * The footer's default lists, kept apart from how it looks. Editable in
 * "Ana Sayfa Düzenleme"; `lib/homepage` builds the default footer from these.
 *
 * The blog links point at the sections of the lüle guide (`lib/blog`) and the
 * support links at the answers on /sss (`lib/faq`), so each id here must match
 * an anchor there.
 */

import { BILGI_DOCUMENTS, bilgiHref } from "@/lib/bilgi";
import { BLOG_HREF, LULE_GUIDE_HREF } from "@/lib/blog";
import { FAQ, FAQ_HREF } from "@/lib/faq";

export const BRANCHES = [
  { name: "Bahçelievler", address: "Soğanlı Mah. Site Sok. No:5/A Bahçelievler / İstanbul" },
  {
    name: "Esenyurt",
    address: "Barbaros Hayrettin Paşa Mah. 1988 Sok. No:4 Papatya 1 Residence Esenyurt / İstanbul",
  },
] as const;

export const WORKING_HOURS = "Hafta içi 09:30 – 20:00 · Cumartesi 09:30 – 20:00";

export const SOCIAL_LINKS = [
  { label: "YouTube Kanalımız", href: "https://www.youtube.com/@sultannargile1982", kind: "youtube" },
  {
    label: "Instagram (Bahçelievler)",
    href: "https://www.instagram.com/sultannargile_bahcelievler",
    kind: "instagram",
  },
  { label: "Instagram (Esenyurt)", href: "https://www.instagram.com/sultannargile_esenyurt", kind: "instagram" },
] as const;

export const BLOG_LINKS = [
  { label: "Nargile lülesi nedir, çeşitleri var mıdır?", href: `${LULE_GUIDE_HREF}#lule-nedir` },
  { label: "Phunnel ve Killer lüle arasındaki fark nedir?", href: `${LULE_GUIDE_HREF}#phunnel-killer` },
  { label: "Sırlı lüle mi, sırsız lüle mi? Hangi lüleyi satın almalıyım?", href: `${LULE_GUIDE_HREF}#sirli-sirsiz` },
  { label: "Hangi nargile lülesini satın almalıyım?", href: `${LULE_GUIDE_HREF}#malzeme-secimi` },
];
export { BLOG_HREF };

/** The three documents the shop supplied, in the order it listed them. */
export const INFO_LINKS = BILGI_DOCUMENTS.map((doc) => ({ label: doc.title, href: bilgiHref(doc) }));

export const FAQ_LINKS = FAQ.map((item) => ({ label: item.question, href: `${FAQ_HREF}#${item.id}` }));
export { FAQ_HREF };
