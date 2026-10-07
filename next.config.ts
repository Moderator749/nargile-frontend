import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dashboard ("Genel Bakış") lives at /admin; keep /admin/overview working too.
  async redirects() {
    return [{ source: "/admin/overview", destination: "/admin", permanent: false }];
  },
  images: {
    // Product photos imported from the supplier catalog (products.image_url).
    remotePatterns: [new URL("https://www.nargilemalzemesi.com/image/**")],
  },
};

export default nextConfig;
