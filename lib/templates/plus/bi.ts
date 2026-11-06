// Двуязычные шаблоны: русский и казахский текст записаны рядом, поэтому
// отдельный словарь перевода не нужен. Числа подставляются в обе версии.
import { currentLocale, num, txt, type Generated, type Template } from '../helpers'

export { pick, rnd, fx, fmt, frac, gcd, distinct, pi, signed } from '../helpers'

export type B = [ru: string, kk: string]

// Выбор текста под язык генерации
export const L = (ru: string, kk: string): string => (currentLocale() === 'kk' ? kk : ru)
// Вне формул дробная запятая — обычная: 0{,}5 → 0,5
const plain = (s: string): string => s.split('$').map((part, i) => (i % 2 ? part : part.replace(/\{,\}/g, ','))).join('$')
const l = (b: B | string): string => plain(typeof b === 'string' ? b : L(b[0], b[1]))

export const G = 10 // g, м/с²

// Расчётная задача: условие и решение на двух языках
export function c(topic: string, gen: (n: number) => Generated): Template {
  return { topic, gen }
}
export function h(topic: string, gen: (n: number) => Generated): Template {
  return { topic, gen, hard: true }
}

// Числовой ответ: q и s — [ru, kk] или строка, одинаковая на обоих языках
export function N(q: B, ans: number, wrongs: number[], n: number, unit: string, s: B | string): Generated {
  return num(l(q), ans, wrongs, n, unit, l(s))
}

// Текстовый ответ (формулы, слова)
export function T(q: B, right: B | string, wrongs: (B | string)[], n: number, s: B | string): Generated {
  return txt(l(q), l(right), wrongs.map(l), n, l(s))
}

// Теоретические вопросы: [вопрос, верно, 4 неверных, пояснение]
export function th(topic: string, list: [B, B | string, (B | string)[], B][]): Template[] {
  return list.map(([q, right, wrongs, why]) => ({ topic, theory: true, gen: (n: number) => T(q, right, wrongs, n, why) }))
}
