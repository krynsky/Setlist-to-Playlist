import type { MetadataRoute } from "next";

const siteUrl = "https://setlist-to-playlist.krynsky.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
