import { Geist, Geist_Mono } from "next/font/google";

/*
 * The site's typefaces, shared by the root layout and app/global-error.tsx,
 * which replaces it and brings its own document.
 */

// latin-ext carries Turkish ğ, ş, ı, İ — without it they fall back to another font.
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});
