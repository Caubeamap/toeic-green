import type { NextConfig } from "next";

const mediaRemotePattern = (() => {
  const mediaOrigin = process.env.NEXT_PUBLIC_MEDIA_ORIGIN;
  if (!mediaOrigin) return null;

  try {
    const url = new URL(mediaOrigin);

    if (url.protocol !== "https:") {
      return null;
    }

    return {
      protocol: "https" as const,
      hostname: url.hostname,
      pathname: "/**"
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      ...(mediaRemotePattern ? [mediaRemotePattern] : [])
    ]
  }
};

export default nextConfig;
