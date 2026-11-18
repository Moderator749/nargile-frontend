/**
 * Law 4207 wording check for the admin editors: the shop sells hookah
 * equipment and must never mention tobacco or frame use as pleasure. The
 * product, category and translation forms show a (non-blocking) notice
 * listing the words below when a text contains them.
 *
 * Exceptions, which are not reported: a herbal product's composition
 * statement ("tütün ve nikotin içermez") and a health warning.
 */

export type Law4207Lang = "tr" | "en" | "ar";

const PATTERNS: Record<Law4207Lang, RegExp[]> = {
  tr: [
    /tütün\p{L}*/gu,
    /(?<!\p{L})key(?:if|f)\p{L}*/gu,
    /(?<!\p{L})zevk\p{L}*/gu,
    /(?<!\p{L})(?:bol|yoğun)\s+duman\p{L}*/gu,
    /(?<!\p{L})(?:içmek\p{L}*|içerken|içilen|içilir|içenler\p{L}*)(?!\p{L})/gu,
  ],
  en: [
    /(?<!\p{L})tobacco\p{L}*/gu,
    /(?<!\p{L})(?:enjoy\p{L}*|pleasur\p{L}*|delight\p{L}*)/gu,
    /(?<!\p{L})smoking\s+(?:experience|pleasure|ritual|session)s?(?!\p{L})/gu,
    /(?<!\p{L})(?:dense|thick|abundant|rich|massive|huge)\s+(?:smoke|clouds?|vapou?r)(?!\p{L})/gu,
  ],
  ar: [/تبغ/gu, /معسل/gu, /(?<!\p{L})(?:[وبل]?ال|[وبل])?متعة|ممتع\p{L}*|استمتا?ع\p{L}*/gu, /تجربة\s+(?:ال)?تدخين/gu],
};

const ALLOWED: RegExp[] = [
  /tütün ve nikotin içer\p{L}*/gu,
  /tütün ürünleri sağlığa\p{L}*/gu,
  /(?:contains )?no tobacco (?:or|and) (?:no )?nicotine/gu,
  /tobacco products are harmful/gu,
  /لا يحتوي على (?:ال)?تبغ (?:ولا|أو|و) ?(?:على )?(?:ال)?نيكوتين/gu,
  /منتجات التبغ ضارة/gu,
];

/** Turkish-aware lower case: İ → i, I → ı. */
function lower(text: string): string {
  return text.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();
}

function plain(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/** The distinct risky words in these texts (HTML allowed), in the order found. */
export function law4207Terms(texts: Array<string | null | undefined>, lang: Law4207Lang = "tr"): string[] {
  let text = lower(plain(texts.filter(Boolean).join(" \n ")));
  for (const allowed of ALLOWED) text = text.replace(allowed, " ");
  const found: string[] = [];
  for (const pattern of PATTERNS[lang]) {
    for (const match of text.matchAll(pattern)) {
      const word = match[0].trim();
      if (!found.includes(word)) found.push(word);
    }
  }
  return found;
}
