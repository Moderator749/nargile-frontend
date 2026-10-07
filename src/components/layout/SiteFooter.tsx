import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import type { Category } from "@/types";

const linkClass = "text-sm font-light text-zinc-400 transition-colors duration-200 hover:text-white";

/** Charcoal footer, dark in both themes. */
export function SiteFooter({ categories }: { categories: Category[] }) {
  const columns = [
    {
      title: "Kategoriler",
      // Top-level groups only; their pages include every subcategory.
      links: categories.filter((c) => c.parent_id === null).map((c) => ({ href: `/catalog/${c.slug}`, label: c.name })),
    },
    {
      title: "Alışveriş",
      links: [
        { href: "/catalog", label: "Tüm Ürünler" },
        { href: "/#firsat-urunleri", label: "Fırsat Ürünleri" },
        { href: "/#avantajlar", label: "Avantajlar" },
      ],
    },
    {
      title: "Hesabım",
      links: [
        { href: "/login", label: "Giriş Yap" },
        { href: "/register", label: "Kayıt Ol" },
        { href: "/orders", label: "Sipariş Takibi" },
        { href: "/cart", label: "Sepetim" },
      ],
    },
  ];

  return (
    <footer className="dark bg-[#1d1d1f] text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" aria-label="Nargile Malzemesi ana sayfa" className="inline-block text-white">
              <Logo />
            </Link>
            <p className="mt-4 max-w-xs text-sm font-light text-zinc-400">
              Endüstriyel nargile ve premium sarf malzemeleri. Toptan, perakende ve bayi.
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">{col.title}</h2>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs font-light text-zinc-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Nargile Malzemesi</p>
          <p>Fiyatlara KDV dahildir. Döviz fiyatları TCMB kuruyla yaklaşıktır; ödeme TL ile alınır.</p>
        </div>
      </div>
    </footer>
  );
}
