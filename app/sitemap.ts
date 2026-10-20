import type { MetadataRoute } from "next";
import { profile } from "@/data/profile";

// One-page site, so one entry. Submit <siteUrl>sitemap.xml in Google Search Console.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: profile.siteUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
