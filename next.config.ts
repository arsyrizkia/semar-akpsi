import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // unggahan naskah "Uji pada Contoh" (UC-02) lewat server action; batas badan permintaan Vercel 4,5 MB
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
