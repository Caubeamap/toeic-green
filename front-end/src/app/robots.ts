import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/profile",
          "/progress",
          "/verify-email",
          "/forgot-password",
          "/practice/*/test",
          "/practice/*/results"
        ]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
