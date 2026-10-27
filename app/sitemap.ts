import type { MetadataRoute } from 'next'
import type { EntSubject } from '@/lib/ent'
import { SITE_URL, SUBJECT_SLUG, pagePath, seoTopics } from '@/lib/seo'

// Карта сайта для поисковиков: открытые страницы на русском и казахском
export default function sitemap(): MetadataRoute.Sitemap {
  const entry = (parts: string[], priority: number): MetadataRoute.Sitemap[number] => ({
    url: SITE_URL + pagePath('ru', ...parts),
    changeFrequency: 'weekly',
    priority,
    alternates: { languages: { ru: SITE_URL + pagePath('ru', ...parts), kk: SITE_URL + pagePath('kk', ...parts) } },
  })
  const pages: MetadataRoute.Sitemap = [{ url: SITE_URL, changeFrequency: 'weekly', priority: 1 }, entry([], 0.9)]
  for (const s of Object.keys(SUBJECT_SLUG) as EntSubject[]) {
    const slug = SUBJECT_SLUG[s]
    pages.push(entry([slug], 0.9), entry([slug, 'formuly'], 0.8))
    for (const t of seoTopics(s)) pages.push(entry([slug, t.slug], 0.7))
  }
  // Казахские версии — отдельными адресами (у каждой те же альтернативы языков)
  return [...pages, ...pages.filter(p => p.alternates).map(p => ({ ...p, url: p.alternates!.languages!.kk as string }))]
}
