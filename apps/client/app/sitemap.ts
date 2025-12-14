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
    // Add other static pages here (e.g., /about, /contact)
  ];
}