import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/replikasi', '/privacy-policy', '/terms-of-service'],
      disallow: ['/dashboard/', '/api/', '/login/'],
    },
    sitemap: 'https://sgp.omnifit.cloud/sitemap.xml',
  };
}
