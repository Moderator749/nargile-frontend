/**
 * Which links next/link may fetch ahead. Every link in view is prefetched, and
 * the chrome on every page (header, tab bar, cookie notice, perks bar, footer)
 * pointed at pages few visitors open from there — sign-in, cargo tracking,
 * contracts, the perks page — about 200 KB of a phone's data per page view
 * (Search Console traffic is ~90% mobile). These go on demand; the shop itself
 * (home, categories, products, brands, the catalogue, the cart) is still
 * fetched ahead, so a shopper's next tap opens at once.
 */
const ON_DEMAND = [
  "/login",
  "/register",
  "/sifremi-unuttum",
  "/sifre-yenile",
  "/account",
  "/orders",
  "/kargo-takip",
  "/sozlesmeler",
  "/bilgi",
  "/sss",
  "/magazalar",
  "/abonelikten-cik",
  "/admin",
];

/** Whether a site path (unprefixed, as the components write it) is fetched ahead by default. */
export function prefetchByDefault(path: string): boolean {
  const bare = path.split(/[?#]/)[0] ?? "";
  return !ON_DEMAND.some((root) => bare === root || bare.startsWith(`${root}/`));
}
