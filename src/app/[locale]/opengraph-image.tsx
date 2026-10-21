import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { pageMessages } from "@/lib/i18n/messages/layout";
import { SITE_NAME } from "@/lib/site";

// The shop's own link preview, for pages that have no photo of their own (the
// homepage, a category without products, the information pages). Rendered
// once per language at build time.
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params;
  const locale = isLocale(segment) ? segment : DEFAULT_LOCALE;
  // The image renderer (Satori) does not lay out right-to-left text or join
  // Arabic letters, so the Arabic card carries the English line rather than
  // broken Arabic. The wordmark is the shop's name in every language.
  const tagline = pageMessages[locale === "ar" ? "en" : locale].ogTagline;
  const logo = await readFile(join(process.cwd(), "public/logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 55%, #ef4444 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 220,
            height: 220,
            borderRadius: 48,
            background: "white",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <img src={logoSrc} alt="" width={170} height={170} style={{ objectFit: "contain" }} />
        </div>
        <div style={{ marginTop: 48, fontSize: 76, fontWeight: 800, letterSpacing: -1 }}>NARGİLE MALZEMESİ</div>
        <div style={{ marginTop: 16, fontSize: 32, opacity: 0.9 }}>
          {tagline}
        </div>
      </div>
    ),
    size,
  );
}
