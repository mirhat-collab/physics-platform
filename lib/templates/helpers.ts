// Генератор задач по шаблонам: числа случайные, ответ считает код,
// неправильные варианты — результаты типичных ошибок.

import type { Locale } from '@/lib/i18n'
import { contentFormat, contentLookup } from '@/lib/i18n/content'

export type Generated = { question: string; options: string[]; correct: number; solution: string }

// Язык, на котором сейчас генерируется задание. Генерация синхронная,
// поэтому достаточно выставить его на время одного вызова gen().
let locale: Locale = 'ru'

export function withLocale<T>(l: Locale, fn: () => T): T {
  const prev = locale
  locale = l
  try { return fn() } finally { locale = prev }
}

// Строка с подстановками: tl('Скорость ⟪0⟫ м/с', [v])
export function tl(key: string, values: unknown[]): string {
  return contentFormat(locale, key, values)
}

// Тег для строк заданий: lt`Скорость ${v} м/с` ищет перевод по ключу
// «Скорость ⟪0⟫ м/с» и подставляет значения — числа размечать вручную не нужно
export function lt(strings: TemplateStringsArray, ...values: unknown[]): string {
  let key = strings[0]
  for (let i = 0; i < values.length; i++) key += `⟪${i}⟫` + strings[i + 1]
  return contentFormat(locale, key, values)
}

// Готовая строка без подстановок (варианты ответа, единицы, теория).
// В английском дробная часть через точку — правим и числа, вписанные в шаблон как есть.
export function tr(text: string): string {
  const out = contentLookup(locale, text)
  return locale === 'en' ? out.replace(/\{,\}/g, '.') : out
}

export type Template = {
  topic: string
  gen: (nOptions: number) => Generated
  hard?: boolean // задача в несколько действий
}

export function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Число для записи внутри формулы ($…$): 2{,}5 или 2{,}5 \cdot 10^{5}
export function fx(x: number): string {
  if (!Number.isFinite(x)) return '—'
  if (x === 0) return '0'
  const abs = Math.abs(x)
  // Целые числа пишем точно: 1188, а не 1190
  if (Number.isInteger(x) && abs < 1e5) return String(x)
  if (abs >= 1e5 || abs < 1e-2) {
    const exp = Math.floor(Math.log10(abs))
    let mant = Number((x / 10 ** exp).toPrecision(3))
    let e = exp
    if (Math.abs(mant) >= 10) { mant /= 10; e += 1 }
    const m = String(mant).replace('.', decimalMark())
    return m === '1' ? `10^{${e}}` : m === '-1' ? `-10^{${e}}` : `${m} \\cdot 10^{${e}}`
  }
  return String(Number(x.toPrecision(3))).replace('.', decimalMark())
}

// В русском и казахском дробная часть пишется через запятую, в английском — через точку
function decimalMark(): string {
  return locale === 'en' ? '.' : '{,}'
}

// Число для обычного текста: 2,5 или $2{,}5 \cdot 10^{5}$ для очень больших и маленьких
export function fmt(x: number): string {
  const s = fx(x)
  return s.includes('10^') ? `$${s}$` : s.replace('{,}', ',')
}

function withUnit(x: number, unit: string): string {
  if (!unit) return fmt(x)
  unit = tr(unit)
  return unit === '°' || unit === '%' ? `${fmt(x)}${unit}` : `${fmt(x)} ${unit}`
}

// Варианты для числового ответа. Правильный всегда первым — порядок перемешивает API.
export function numOptions(correct: number, wrongs: number[], n: number, unit = ''): { options: string[]; correct: number } {
  const seen = new Set<string>()
  const options: string[] = []
  const add = (x: number) => {
    if (!Number.isFinite(x) || options.length >= n) return
    if (correct > 0 && x <= 0) return
    const s = withUnit(x, unit)
    if (seen.has(s)) return
    seen.add(s)
    options.push(s)
  }
  add(correct)
  for (const w of wrongs) add(w)
  for (const f of [2, 0.5, 1.5, 3, 0.25, 4, 10, 0.1, 1.25, 0.75, 5, 0.2]) add(correct * f)
  // Для нуля и маленьких целых умножение не помогает — берём соседние значения
  const step = Number.isInteger(correct) || correct === 0 ? 1 : Math.abs(correct) / 4
  for (let k = 1; options.length < n && k < 20; k++) { add(correct + k * step); add(correct - k * step) }
  return { options, correct: 0 }
}

// Варианты для текстового ответа (формулы, промежутки и т. п.)
export function textOptions(correct: string, wrongs: string[], n: number): { options: string[]; correct: number } {
  // Сравниваем без пробелов: «x - 9» и «x  - 9» выглядят одинаково
  const key = (x: string) => x.replace(/\s+/g, '')
  const options = [correct]
  const seen = new Set([key(correct)])
  for (const w of wrongs) {
    if (options.length >= n) break
    if (!seen.has(key(w))) { seen.add(key(w)); options.push(w) }
  }
  return { options, correct: 0 }
}

// Всё, что видит ученик, проходит через tr(): строки, собранные через tl(),
// уже переведены и в словаре не найдутся — останутся как есть.
export function num(question: string, correct: number, wrongs: number[], n: number, unit: string, solution: string): Generated {
  return { question: tr(question), ...numOptions(correct, wrongs, n, unit), solution: tr(solution) }
}

export function txt(question: string, correct: string, wrongs: string[], n: number, solution: string): Generated {
  return { question: tr(question), ...textOptions(tr(correct), wrongs.map(tr), n), solution: tr(solution) }
}

// Целые числа, которые не дают одинаковых значений
export function distinct(count: number, min: number, max: number): number[] {
  const set = new Set<number>()
  while (set.size < count) set.add(rnd(min, max))
  return [...set]
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a
}

// Дробь в LaTeX: 3/4 → \frac{3}{4}, 4/2 → 2
export function frac(p: number, q: number): string {
  if (q < 0) { p = -p; q = -q }
  const g = gcd(p, q) || 1
  p /= g; q /= g
  if (q === 1) return String(p)
  return `${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${q}}`
}

// Коэффициент перед π: 1 → π, 2,5 → 2{,}5π
export function pi(k: number): string {
  return k === 1 ? '\\pi' : k === -1 ? '-\\pi' : `${fx(k)}\\pi`
}

// Слагаемое-число: «+ 3», «- 3», а ноль не пишем
export function signed(k: number): string {
  if (k === 0) return ''
  return k < 0 ? `- ${Math.abs(k)}` : `+ ${k}`
}

// Слагаемое с переменной: «+ 3x», «- x», а при нулевом коэффициенте ничего
export function term(k: number, v: string): string {
  if (k === 0) return ''
  const a = Math.abs(k)
  return `${k < 0 ? '-' : '+'} ${a === 1 ? '' : a}${v}`
}

// Первое слагаемое: «3x», «-x», «x»
export function lead(k: number, v: string): string {
  return k === 1 ? v : k === -1 ? `-${v}` : `${k}${v}`
}
