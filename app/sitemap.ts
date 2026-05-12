import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://kunjaraos.com";
  const now = new Date();

  return [
    // Core
    { url: base,                    lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/waitlist`,      lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`,         lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/signup`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    // Marketing (future pages)
    { url: `${base}/pricing`,       lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/features`,      lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/about`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`,       lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/faq`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // Legal
    { url: `${base}/privacy`,       lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/terms`,         lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    // Geo-specific landing pages
    { url: `${base}/mumbai`,        lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/delhi`,         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/bangalore`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/hyderabad`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pune`,          lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/kolkata`,       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
