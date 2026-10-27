// Открытые страницы для поисковиков: /podgotovka/… (русский) и /kk/podgotovka/…
// (казахский) — темы ЕНТ с задачами и решениями, формулы. Здесь адреса,
// названия и примеры задач. Примеры — с постоянным «зерном»: поисковик видит
// одну и ту же страницу при каждом заходе.
import { ENT_SUBJECTS, type EntSubject } from './ent'
import { generateFromTemplate, hasTemplates } from './templates'
import type { Generated } from './templates/helpers'
import type { Locale } from './i18n'

export const SITE_URL = 'https://mirha-edu.vercel.app'

export const SUBJECT_SLUG: Record<EntSubject, string> = { physics: 'fizika', math: 'matematika' }
export const subjectBySlug = (slug: string): EntSubject | null =>
  (Object.keys(SUBJECT_SLUG) as EntSubject[]).find(s => SUBJECT_SLUG[s] === slug) ?? null

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

export function slugify(text: string): string {
  return text.toLowerCase().split('').map(c => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '')
}

export type SeoTopic = { subject: EntSubject; section: string; topic: string; slug: string }

// Темы с задачами по шаблонам — у каждой своя страница
export function seoTopics(subject: EntSubject): SeoTopic[] {
  const out: SeoTopic[] = []
  for (const sec of ENT_SUBJECTS[subject].sections) {
    for (const topic of sec.topics) {
      if (hasTemplates(subject, topic)) out.push({ subject, section: sec.name, topic, slug: slugify(topic) })
    }
  }
  return out
}

export function topicBySlug(subject: EntSubject, slug: string): SeoTopic | null {
  return seoTopics(subject).find(t => t.slug === slug) ?? null
}

export function pagePath(locale: Locale, ...parts: string[]): string {
  return [locale === 'kk' ? '/kk' : '', '/podgotovka', ...parts.map(p => `/${p}`)].join('')
}

function hash(text: string): number {
  let h = 2166136261
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

// Генерация с постоянным зерном: Math.random подменяем только на время вызова
function seeded<T>(seed: number, fn: () => T): T {
  const orig = Math.random
  let s = seed % 2147483648
  Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
  try { return fn() } finally { Math.random = orig }
}

// Примеры задач темы: сначала обычные, затем сложная; без повторов условий
export function topicExamples(subject: EntSubject, topic: string, locale: Locale, count = 6): Generated[] {
  const out: Generated[] = []
  const seen = new Set<string>()
  const base = hash(`${subject}|${topic}`)
  for (let i = 0; out.length < count && i < count * 6; i++) {
    const kind = out.length === count - 1 ? 'hard' : 'calc'
    const g = seeded(base + i * 7919, () => generateFromTemplate(subject, topic, 4, locale, kind === 'hard' ? 'hard' : 'ent', kind))
    if (!g || seen.has(g.question)) continue
    seen.add(g.question)
    out.push(g)
  }
  return out
}

// Заголовок для поиска — до 70 символов (длиннее поисковик обрежет):
// сначала полный, затем без «с решением», затем первая часть названия темы
export function fitTitle(name: string, tails: string[], max = 70): string {
  const short = name.split(/\.\s/)[0]
  for (const n of [name, short]) for (const tail of tails) if ((n + tail).length <= max) return n + tail
  return short.length <= max ? short : short.slice(0, max - 1).trimEnd() + '…'
}
