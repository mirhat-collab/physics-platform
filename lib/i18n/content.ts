import { contentKk } from './content-kk'
import { contentEn } from './content-en'
import type { Locale } from './index'

// Переводы учебного контента, который генерирует код на сервере: условия,
// решения и варианты заданий ЕНТ по шаблонам. Ключ — русский текст; числа и
// формулы подставляются через метки ⟪0⟫, ⟪1⟫… — фигурные скобки здесь
// заняты LaTeX (\frac{s}{t}), поэтому {name} как в интерфейсе не подходит.
const CONTENT: Record<Locale, Record<string, string> | null> = { ru: null, kk: contentKk, en: contentEn }

export function contentLookup(locale: Locale, text: string): string {
  return CONTENT[locale]?.[text] ?? text
}

export function contentFormat(locale: Locale, key: string, values: unknown[]): string {
  const out = contentLookup(locale, key)
  return out.replace(/⟪(\d+)⟫/g, (m, i: string) => {
    const v = values[Number(i)]
    if (v === undefined || v === null) return ''
    // Подставляемые слова («вверх», «стекло») тоже переводим, числа — как есть
    return typeof v === 'string' ? contentLookup(locale, v) : String(v)
  })
}
