# Frontend Rules — Nargile SaaS

Permanent operating rules for every file created or changed in `saas_frontend`.
Loaded automatically into every Claude Code session via `CLAUDE.md`.

## A. Performance & Core Web Vitals (100/100 Target)

- Never use heavy raster images if CSS or inline SVGs (via `lucide-react`) can achieve the same result.
- Implement strictly modular component structures. Avoid monolithic files.
- Ensure 0 Cumulative Layout Shift (CLS). Reserve exact dimensions for dynamic elements.
- Use Next.js dynamic imports (`next/dynamic`) for heavy components below the fold.

## B. Awwwards-Level Design Principles

- Aesthetic: Modern, minimalist, "Dark Mode compatible", premium enterprise B2B SaaS feel.
- Interactions: Use subtle, buttery-smooth CSS transitions for hovers, clicks, and cart actions. No abrupt or "flashy" AI-slop animations.
- Typography & Spacing: Strict adherence to Tailwind's scale. Generous negative space (padding/margins) to breathe life into the UI.
- Inspiration Context: Think of cutting-edge tech portals (Vercel, Stripe, Linear) mixed with high-end commerce.

## C. Semrush-Grade Technical SEO

- All pages must utilize Next.js App Router `generateMetadata` for dynamic, localized (tr-TR) title tags and meta descriptions.
- Semantic HTML is non-negotiable (`<header>`, `<main>`, `<article>`, `<section>`, `<nav>`, `<aside>`).
- Implement Schema.org JSON-LD structured data for E-Commerce (Product, BreadcrumbList, Organization).
- Ensure perfect heading hierarchy (H1 -> H2 -> H3). Never skip heading levels for styling purposes.

---

## Project notes (how the rules apply here)

- **Metadata:** pages with fixed text may export a static `metadata` object (same output, no per-request cost); use `generateMetadata` whenever title/description depend on params or data (e.g. product detail). Every page has a Turkish `title` and `description`.
- **Indexing:** private pages (`/cart`, `/orders`, `/login`, `/register`, admin) set `robots: { index: false }`. Only public catalog/product pages are indexable and carry JSON-LD.
- **JSON-LD:** render server-side in a `<script type="application/ld+json">`, built from the same data as the visible page (Google penalises mismatches). Product `offers` must use the public RETAIL price, never a segment price.
- **Dark mode:** colors come from tokens or paired `dark:` variants; no hard-coded light-only surfaces.
- **Motion:** transitions 150–300 ms on `transform`/`opacity`/colors only; respect `prefers-reduced-motion` (`motion-safe:`/`motion-reduce:`).
- **CLS:** skeletons match the final component's dimensions; images/placeholders use fixed `aspect-*` boxes.
- **Data & money:** prices are server-authoritative Decimal strings; format with `src/lib/format.ts`. Follow `AGENTS.md`: check `node_modules/next/dist/docs/` before using Next.js APIs.
