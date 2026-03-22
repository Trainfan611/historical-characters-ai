import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXTAUTH_URL || "https://history-character.up.railway.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
