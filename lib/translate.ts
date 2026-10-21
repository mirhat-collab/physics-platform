import { createHash } from 'crypto'
import { chat, parseJsonObject } from '@/lib/ai'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type { Locale } from '@/lib/i18n'

// ИИ-перевод учебного контента из базы (темы, тесты, банк задач) с кэшем в
// таблице content_translations. Каждый текст переводится один раз на язык;
// если исходник изменили, хэш не совпадёт и перевод сделается заново.

type TargetLocale = Exclude<Locale, 'ru'>

const LANGUAGE: Record<TargetLocale, string> = { kk: 'казахский', en: 'английский' }

// Сколько символов отдаём ИИ за один запрос: у бесплатного Groq лимит
// ~8000 токенов в минуту на запрос вместе с ответом.
const BATCH_CHARS = 2500

function hashOf(fields: Record<string, string>): string {
  return createHash('sha256').update(JSON.stringify(fields)).digest('hex').slice(0, 32)
}

// Длинный текст режем по строкам на куски не длиннее BATCH_CHARS
function splitLong(text: string): string[] {
  if (text.length <= BATCH_CHARS) return [text]
  const parts: string[] = []
  let cur = ''
  for (const line of text.split('\n')) {
    if (cur && cur.length + line.length + 1 > BATCH_CHARS) { parts.push(cur); cur = '' }
    cur = cur ? cur + '\n' + line : line
  }
  if (cur) parts.push(cur)
  return parts
}

async function translateBatch(locale: TargetLocale, items: Record<string, string>): Promise<Record<string, string>> {
  const text = await chat([
    {
      role: 'system',
      content: `Ты — переводчик учебных материалов по физике и математике для школьников Казахстана. Переводи с русского на ${LANGUAGE[locale]} язык.
Правила:
- Переводи точно и естественно, школьной терминологией этого языка (ЕНТ по-казахски — ҰБТ, по-английски — UNT).
- Сохраняй переносы строк, нумерацию, знаки списков и форматирование.
- Формулы LaTeX внутри $…$ и команды вида \\frac, \\sqrt не меняй, кроме русских слов внутри \\text{…}.
- Числа, ссылки, имена файлов оставляй как есть.
- Отвечай ТОЛЬКО JSON-объектом с теми же ключами, значения — перевод.`,
    },
    { role: 'user', content: JSON.stringify(items) },
  ], { json: true, maxTokens: 6000, effort: 'low' })
  const parsed = parseJsonObject<Record<string, unknown>>(text)
  const out: Record<string, string> = {}
  for (const k of Object.keys(items)) {
    const v = parsed[k]
    out[k] = typeof v === 'string' && v.trim() ? v : items[k]
  }
  return out
}

// Переводит набор полей; пустые поля и поля без кириллицы не трогает
export async function translateFields(
  kind: string, refId: number, locale: TargetLocale, fields: Record<string, string>,
): Promise<Record<string, string>> {
  const hash = hashOf(fields)
  const admin = createSupabaseAdmin()
  const { data: cached } = await admin.from('content_translations')
    .select('source_hash, data').eq('kind', kind).eq('ref_id', refId).eq('locale', locale).maybeSingle()
  if (cached && cached.source_hash === hash) return cached.data as Record<string, string>

  // Раскладываем поля на куски и собираем пачки до BATCH_CHARS символов
  const pieces: { key: string; field: string; text: string }[] = []
  for (const [field, value] of Object.entries(fields)) {
    if (!value || !/[А-Яа-яЁё]/.test(value)) continue
    splitLong(value).forEach((text, i) => pieces.push({ key: `${field}#${i}`, field, text }))
  }
  const batches: Record<string, string>[] = []
  let cur: Record<string, string> = {}
  let size = 0
  for (const p of pieces) {
    if (size && size + p.text.length > BATCH_CHARS) { batches.push(cur); cur = {}; size = 0 }
    cur[p.key] = p.text
    size += p.text.length
  }
  if (size) batches.push(cur)

  // Не больше трёх запросов к ИИ одновременно
  const translated: Record<string, string> = {}
  for (let i = 0; i < batches.length; i += 3) {
    const results = await Promise.all(batches.slice(i, i + 3).map(b => translateBatch(locale, b)))
    for (const r of results) Object.assign(translated, r)
  }

  const data: Record<string, string> = { ...fields }
  const byField = new Map<string, string[]>()
  for (const p of pieces) {
    const list = byField.get(p.field) ?? []
    list.push(translated[p.key] ?? p.text)
    byField.set(p.field, list)
  }
  for (const [field, list] of byField) data[field] = list.join('\n')

  await admin.from('content_translations').upsert({
    kind, ref_id: refId, locale, source_hash: hash, data, updated_at: new Date().toISOString(),
  })
  return data
}

// Готовый перевод из кэша без обращения к ИИ (для списков: названия тем и т.п.)
export async function cachedTranslations(kind: string, refIds: number[], locale: TargetLocale): Promise<Map<number, { hash: string; data: Record<string, string> }>> {
  const map = new Map<number, { hash: string; data: Record<string, string> }>()
  if (!refIds.length) return map
  const admin = createSupabaseAdmin()
  const { data } = await admin.from('content_translations')
    .select('ref_id, source_hash, data').eq('kind', kind).eq('locale', locale).in('ref_id', refIds)
  for (const row of data || []) map.set(Number(row.ref_id), { hash: row.source_hash, data: row.data as Record<string, string> })
  return map
}

// Короткие строки (названия тем, описания классов) переводим пачкой —
// один запрос к ИИ на десятки названий, кэш — по строке на каждое.
export async function translateShort(
  kind: string, items: { id: number; text: string }[], locale: TargetLocale,
): Promise<Record<number, string>> {
  const out: Record<number, string> = {}
  const cache = await cachedTranslations(kind, items.map(i => i.id), locale)
  const missing: { id: number; text: string; hash: string }[] = []
  for (const it of items) {
    const hash = hashOf({ text: it.text })
    const hit = cache.get(it.id)
    if (hit && hit.hash === hash) out[it.id] = hit.data.text
    else if (/[А-Яа-яЁё]/.test(it.text)) missing.push({ ...it, hash })
    else out[it.id] = it.text
  }
  if (!missing.length) return out

  const batches: { id: number; text: string; hash: string }[][] = [[]]
  let size = 0
  for (const m of missing) {
    if (size && size + m.text.length > BATCH_CHARS) { batches.push([]); size = 0 }
    batches[batches.length - 1].push(m)
    size += m.text.length
  }
  const admin = createSupabaseAdmin()
  for (const batch of batches) {
    const res = await translateBatch(locale, Object.fromEntries(batch.map(m => [String(m.id), m.text])))
    const rows = batch.map(m => ({
      kind, ref_id: m.id, locale, source_hash: m.hash, data: { text: res[String(m.id)] ?? m.text }, updated_at: new Date().toISOString(),
    }))
    for (const r of rows) out[r.ref_id] = r.data.text
    await admin.from('content_translations').upsert(rows)
  }
  return out
}

export { hashOf }
export type { TargetLocale }
