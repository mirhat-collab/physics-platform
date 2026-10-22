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

// Округление для промежуточных значений в решениях
export function r(x: number, digits = 3): number {
  return Number(x.toPrecision(digits))
}
