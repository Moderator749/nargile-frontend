import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  name: string;
  href: string;
}

interface CatalogHeroProps {
  title: string;
  breadcrumbs: Crumb[];
}

export function CatalogHero({ title, breadcrumbs }: CatalogHeroProps) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Soft spotlight from above. Pure CSS — no images. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 h-96 w-[64rem] max-w-[160%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,#ffffff,transparent)] dark:opacity-[0.06]"
      />

      <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
        <nav aria-label="Sayfa konumu">
          <ol className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {breadcrumbs.map((crumb, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <li key={crumb.href} className="flex items-center gap-1">
                  {last ? (
                    <span aria-current="page" className="text-foreground">
                      {crumb.name}
                    </span>
                  ) : (
                    <>
                      <Link href={crumb.href} className="transition-colors duration-200 hover:text-foreground">
                        {crumb.name}
                      </Link>
                      <ChevronRight className="h-3 w-3" aria-hidden />
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <h1 className="mt-8 max-w-4xl text-balance pb-2 text-5xl font-semibold leading-[1.02] tracking-tighter text-foreground sm:text-6xl lg:text-7xl">
          {title}
        </h1>
      </div>
    </section>
  );
}
