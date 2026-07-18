import type { MetadataRoute } from "next";
import { problems } from "@/lib/problems";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/problems`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...problems.map((p) => ({
      url: `${BASE_URL}/problems/${p.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
