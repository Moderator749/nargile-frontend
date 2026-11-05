/**
 * Scroll a section to the top of its scroller and give it the focus — and
 * keep it there while the page around it settles: the rich-text editors
 * above it mount a moment later and push it down. It stops following as soon
 * as the admin scrolls, clicks or types, and after `settleMs` at most.
 * Returns the stop, for an effect's cleanup.
 *
 * `container` is what grows as the page settles (the form the section is in).
 */
export function scrollIntoPlace(section: HTMLElement, container: Element, settleMs = 2000): () => void {
  const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const align = () => section.scrollIntoView({ behavior, block: "start" });
  align();
  section.focus({ preventScroll: true });

  const settle = new ResizeObserver(align);
  settle.observe(container);
  const interrupts = ["wheel", "touchstart", "keydown", "mousedown"] as const;
  const stop = () => {
    settle.disconnect();
    window.clearTimeout(timer);
    for (const type of interrupts) window.removeEventListener(type, stop);
  };
  const timer = window.setTimeout(stop, settleMs);
  for (const type of interrupts) window.addEventListener(type, stop, { passive: true });
  return stop;
}
