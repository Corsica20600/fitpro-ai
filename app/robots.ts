import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/src/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/data-deletion", "/login"],
      disallow: [
        "/api/",
        "/dashboard",
        "/exercises",
        "/history",
        "/programs",
        "/progress",
        "/settings",
        "/watch",
        "/workout",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
