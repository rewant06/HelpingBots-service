import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://helpingbots.in';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/veil`, // Assuming this is your feed page
      lastModified: new Date(),
      changeFrequency: 'always', // Important for dynamic feeds
      priority: 0.9,
    },

    {
      url: `${baseUrl}/services`, // Assuming this is your feed page
      lastModified: new Date(),
      changeFrequency: 'always', // Important for dynamic feeds
      priority: 0.8,
    },

       {
      url: `${baseUrl}/products/veil`, // Assuming this is your feed page
      lastModified: new Date(),
      changeFrequency: 'always', // Important for dynamic feeds
      priority: 0.9,
    },

     {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // ── Products ──────────────────────────────────────────────────────
    {
      url: `${baseUrl}/products/crm`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // ── Demo hub ──────────────────────────────────────────────────────
    {
      url: `${baseUrl}/demo`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // ── CRM (live interactive demo — public, no login) ─────────────────
    {
      url: `${baseUrl}/crm`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Add other static pages here (e.g., /about, /contact)
  ];
}