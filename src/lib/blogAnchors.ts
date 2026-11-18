/**
 * Blog questions live on /blog as anchors (`/blog#sss-<id>`), not as pages of
 * their own, so a renamed question id cannot be a server redirect: the part
 * after `#` never reaches the server. Old anchors that may be bookmarked or
 * linked from elsewhere are mapped here, and the /blog page (BlogAnchorAlias)
 * swaps the old anchor for the new one and opens that question.
 *
 * 2026-11-18: two ids renamed so no address on the site carries pleasure
 * wording (law 4207).
 */
export const RENAMED_BLOG_QUESTIONS: Record<string, string> = {
  "mukemmel-bir-nargile-keyfi-icin-nelere-dikkat-edilmeli": "dogru-nargile-kullanimi-icin-nelere-dikkat-edilmeli",
  "nargile-komuru-secimi-nargile-keyfini-ve-sagligi-nasil-etkiler": "nargile-komuru-secimi-kullanimi-nasil-etkiler",
};

export const BLOG_ANCHOR_PREFIX = "sss-";

/** The anchor a `#hash` should land on: a renamed question's current id, else the same. */
export function currentBlogAnchor(hash: string): string {
  const raw = decodeURIComponent(hash.replace(/^#/, ""));
  if (!raw.startsWith(BLOG_ANCHOR_PREFIX)) return raw;
  const id = raw.slice(BLOG_ANCHOR_PREFIX.length);
  return BLOG_ANCHOR_PREFIX + (RENAMED_BLOG_QUESTIONS[id] ?? id);
}
