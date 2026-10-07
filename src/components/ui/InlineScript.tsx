/**
 * A pre-paint inline script that only runs on full page loads. On the client it
 * renders as inert text/plain, avoiding React's dev warning about <script> tags
 * (pattern from node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md).
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
