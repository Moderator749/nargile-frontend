/**
 * The price catalogue as a real PDF file, made in the browser — no print
 * dialog, which on a phone reflows the A4 pages into the screen and breaks
 * them (plates overlapping, photos missing, text cut off).
 *
 * Each A4 page of the lookbook is rendered off screen at its own fixed size
 * (186 × 272 mm), photographed by the browser's own renderer (an SVG
 * snapshot: the same layout engine that draws the page, so the grid, the fonts
 * and Arabic's right-to-left all come out as designed), and placed on an A4
 * sheet with the 12 mm margins the print version had. Same file on a phone as
 * on a desktop.
 *
 * The two libraries (modern-screenshot, jsPDF) load only when a file is asked
 * for, so the catalogue pages carry neither.
 */

/** The page's place on an A4 sheet (210 × 297 mm), in millimetres. */
const MARGIN = 12;
const PAGE = { width: 186, height: 272 };
/** Pixels per CSS pixel in the snapshot: sharp on paper, light enough for a phone's memory. */
const SCALE = 2;

/**
 * A photo as the PDF can take it: through this site's own image optimiser,
 * so it is same-origin (a canvas refuses another site's picture) and no
 * larger than a plate needs.
 */
export function pdfImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("/_next/image")) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=640&q=75`;
}

/** Every photo under `root` loaded (or failed), so no frame is captured empty. */
async function imagesReady(root: HTMLElement): Promise<void> {
  await Promise.all(
    [...root.querySelectorAll("img")].map((img) =>
      img.complete
        ? img.decode().catch(() => undefined)
        : new Promise<void>((done) => {
            img.addEventListener("load", () => done(), { once: true });
            img.addEventListener("error", () => done(), { once: true });
          }),
    ),
  );
}

/** "Fiyat Listesi - Nargile Takımları - 30.10.2026.pdf", without what a file name cannot hold. */
export function pdfFileName(title: string): string {
  const safe = title.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
  return `${safe || "Fiyat Listesi"}.pdf`;
}

/**
 * Downloads the lookbook rendered under `root` (its `.catalog-page` sections)
 * as `fileName`. `onProgress` hears each page as it is done.
 */
export async function downloadLookbookPdf(
  root: HTMLElement,
  fileName: string,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const pages = [...root.querySelectorAll<HTMLElement>(".catalog-page")];
  if (pages.length === 0) throw new Error("Katalogda sayfa yok");
  const [{ domToCanvas }, { jsPDF }] = await Promise.all([import("modern-screenshot"), import("jspdf")]);
  await document.fonts.ready;
  await imagesReady(root);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const options = { scale: SCALE, backgroundColor: "#ffffff" };
  // WebKit (every browser on an iPhone) can leave a snapshot's photos blank
  // the first time it draws them: one throwaway pass warms them up.
  if (/AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Android/.test(navigator.userAgent)) {
    await domToCanvas(pages[0], options).catch(() => undefined);
  }
  onProgress?.(0, pages.length);
  for (const [n, page] of pages.entries()) {
    const canvas = await domToCanvas(page, options);
    if (n > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", MARGIN, MARGIN, PAGE.width, PAGE.height, undefined, "FAST");
    // Let go of the bitmap before the next page: a phone has little memory to spare.
    canvas.width = canvas.height = 0;
    onProgress?.(n + 1, pages.length);
  }
  pdf.setProperties({ title: fileName.replace(/\.pdf$/, "") });
  pdf.save(fileName);
}

