import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "topsortassets.com",
      },
      {
        protocol: "https",
        hostname: "cdn1.staticpanvel.com.br",
      },
      {
        protocol: "https",
        hostname: "sjdigital.vtexassets.com",
      },
      {
        protocol: "https",
        hostname: "devb8supernosso.vtexassets.com",
        pathname: "/assets/vtex/assets-builder/devb8supernosso.store-theme/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "carrefour-latam.flavedo.io",
      },
    ],
  },
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
