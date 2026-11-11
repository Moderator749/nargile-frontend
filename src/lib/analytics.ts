/** The shop's Google Analytics 4 property (www.nargilemalzemesi.com). */
const DEFAULT_GA_MEASUREMENT_ID = "G-7HMNRFXKN7";

const configured = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? DEFAULT_GA_MEASUREMENT_ID).trim();

/**
 * The GA4 measurement ID to load, or null when this deployment must not send
 * any: only Vercel's production build measures, so previews, the staging
 * branch and `next dev` never count as visits to the real shop. The ID goes
 * into an inline script, so anything but the G-XXXX shape is refused.
 */
export const GA_MEASUREMENT_ID: string | null =
  process.env.VERCEL_ENV === "production" && /^G-[A-Z0-9]{4,20}$/.test(configured) ? configured : null;
