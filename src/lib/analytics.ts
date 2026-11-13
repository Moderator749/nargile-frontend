/** The shop's Google Analytics 4 property (www.nargilemalzemesi.com). */
const DEFAULT_GA_MEASUREMENT_ID = "G-7HMNRFXKN7";

type Env = Readonly<Record<string, string | undefined>>;

/**
 * The GA4 measurement ID to load, or null when this deployment must not send
 * any. Only the real shop measures, so previews, staging and `next dev` never
 * count as visits to it:
 * - on Vercel (VERCEL_ENV set), its production deployment only;
 * - anywhere else (the shop's own server), a production build of the site
 *   search engines may index — NEXT_PUBLIC_ALLOW_INDEXING=true, which only the
 *   live shop sets (lib/site). A local `next build` or a staging server has it off.
 * The ID goes into an inline script, so anything but the G-XXXX shape is refused.
 */
export function measurementId(env: Env): string | null {
  const id = (env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? DEFAULT_GA_MEASUREMENT_ID).trim();
  const live = env.VERCEL_ENV
    ? env.VERCEL_ENV === "production"
    : env.NODE_ENV === "production" && env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
  return live && /^G-[A-Z0-9]{4,20}$/.test(id) ? id : null;
}

export const GA_MEASUREMENT_ID: string | null = measurementId(process.env);
