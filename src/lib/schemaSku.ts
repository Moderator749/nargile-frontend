/**
 * A product code as structured data may carry it. The shop's codes have
 * spaces ("STEAM 91-1", "CSM 13"), and Search Console rejects those in
 * `sku` / `mpn` ("Geçersiz değer", merchant listings, 2026-11): runs of
 * whitespace become one hyphen. The page itself still shows the code as is.
 */
export function schemaSku(code: string | null | undefined): string | undefined {
  const clean = (code ?? "").trim().replace(/\s+/g, "-");
  return clean || undefined;
}
