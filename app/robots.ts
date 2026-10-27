import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// Поисковикам — открытые страницы; личные кабинеты и API не индексируем
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin', '/teacher', '/parent', '/dashboard', '/profile', '/stats', '/homework', '/reset-password', '/ent/print'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
