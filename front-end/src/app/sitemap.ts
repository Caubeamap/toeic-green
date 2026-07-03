import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/practice`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/explore`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/vocabulary`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/login`, lastModified, changeFrequency: "monthly", priority: 0.3 }
  ];
}
