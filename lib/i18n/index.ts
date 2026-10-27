import { kk } from './kk'

// Язык интерфейса хранится в cookie (а не в адресе страницы), поэтому ссылки
// остаются прежними. Исходные тексты в коде — русские: t('Текст') ищет
// перевод по самой русской строке и, если его нет, показывает оригинал.
export const LOCALES = ['ru', 'kk'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ru'
export const LOCALE_COOKIE = 'lang'

export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  ru: { short: 'РУС', name: 'Русский' },
  kk: { short: 'ҚАЗ', name: 'Қазақша' },
}

// Для toLocaleDateString и т.п.
export const DATE_LOCALE: Record<Locale, string> = { ru: 'ru-RU', kk: 'kk-KZ' }

// Классы в базе называются "7th Grade" и т.п. — по-русски показываем "7 класс"
const ru: Record<string, string> = {
  '7th Grade': '7 класс', '8th Grade': '8 класс', '9th Grade': '9 класс', '10th Grade': '10 класс', '11th Grade': '11 класс',
}

const DICTS: Record<Locale, Record<string, string>> = { ru, kk }

export type TVars = Record<string, string | number | null | undefined>
export type TFunction = (text: string, vars?: TVars) => string

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function translate(locale: Locale, text: string, vars?: TVars): string {
  const out = DICTS[locale]?.[text] ?? text
  if (!vars) return out
  return out.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] === undefined || vars[k] === null ? m : String(vars[k])))
}

export function makeT(locale: Locale): TFunction {
  return (text, vars) => translate(locale, text, vars)
}

// Для ответов ИИ: на каком языке просить объяснение
export const AI_LANGUAGE: Record<Locale, string> = { ru: 'русском', kk: 'казахском' }
