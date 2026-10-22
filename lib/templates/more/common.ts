// Дополнительные задания ЕНТ (по 10 и больше на каждую тему). Пока только
// на русском: переводов в словарях content-kk/en для них нет, поэтому на
// казахском и английском они выдаются, только если у темы нет переведённых.
import type { Template, Generated } from '../helpers'

export { theory } from '../theory'
export { num, txt, rnd, pick, fmt, fx, frac, gcd, distinct, signed, term, lead, pi } from '../helpers'

export const G = 10 // g, м/с²
export const PI = 3.14

// Расчётная задача: числа случайные, ответ считает код
export function calc(topic: string, gen: (n: number) => Generated): Template {
  return { topic, gen }
}

// Сложная задача в несколько действий: чаще попадается на уровне «Выше ЕНТ»
export function hardCalc(topic: string, gen: (n: number) => Generated): Template {
  return { topic, gen, hard: true }
}

// Округление для промежуточных значений в решениях
export function r(x: number, digits = 3): number {
  return Number(x.toPrecision(digits))
}

// Угол kπ/m в LaTeX: \frac{5\pi}{6}, \pi, 2\pi, -\frac{\pi}{3}
export function piFrac(k: number, m: number): string {
  const g = gcdOf(k, m) || 1
  k /= g; m /= g
  if (m < 0) { k = -k; m = -m }
  if (k === 0) return '0'
  const sign = k < 0 ? '-' : ''
  const a = Math.abs(k)
  const num = a === 1 ? '\\pi' : `${a}\\pi`
  return m === 1 ? `${sign}${num}` : `${sign}\\frac{${num}}{${m}}`
}

function gcdOf(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a
}

// Промежуток: iv(2, 5, '[', ')') → $[2;\ 5)$; бесконечность — null
export function iv(a: number | null, b: number | null, l: '[' | '(', rb: ']' | ')'): string {
  const left = a === null ? '(-\\infty' : `${l}${a}`
  const right = b === null ? '+\\infty)' : `${b}${rb}`
  return `$${left};\\ ${right}$`
}

// Комплексное число a + bi без «1i» и «+ 0i»
export function cplx(x: number, y: number): string {
  if (y === 0) return `${x}`
  const im = Math.abs(y) === 1 ? 'i' : `${Math.abs(y)}i`
  if (x === 0) return y < 0 ? `-${im}` : im
  return `${x} ${y < 0 ? '-' : '+'} ${im}`
}

// Многочлен по коэффициентам от старшей степени: poly([2, -5, 3]) → 2x^2 - 5x + 3
export function poly(coefs: number[], v = 'x'): string {
  const deg = coefs.length - 1
  let out = ''
  coefs.forEach((c, i) => {
    if (c === 0) return
    const p = deg - i
    const mon = p === 0 ? '' : p === 1 ? v : `${v}^${p > 9 ? `{${p}}` : p}`
    const a = Math.abs(c)
    const body = p === 0 ? `${a}` : `${a === 1 ? '' : a}${mon}`
    out += out ? ` ${c < 0 ? '-' : '+'} ${body}` : `${c < 0 ? '-' : ''}${body}`
  })
  return out || '0'
}

// Случайное целое без нуля
export function nz(min: number, max: number): number {
  let v = 0
  while (v === 0) v = Math.floor(Math.random() * (max - min + 1)) + min
  return v
}

// Число вида (p/q)·π: 9\pi, \frac{8\pi}{3}, \pi
export function piK(p: number, q = 1): string {
  return piFrac(p, q)
}
