// «Решение задач»: задачи с ответом-числом (ученик вписывает число, а не
// выбирает вариант) и режим «По шагам» (промежуточные значения решения).
// Модуль без серверных зависимостей — проверка ответа идёт и в браузере.
import { solutionSteps } from './ent'

// Число из ввода ученика: «2,5», «-3», «1/4», «1 200», «2.5e3»
export function parseAnswer(raw: string): number | null {
  const s = raw.trim().replace(/\s+/g, '').replace(/−/g, '-').replace(',', '.')
  if (!s) return null
  const frac = /^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(s)
  if (frac) { const d = Number(frac[2]); return d ? Number(frac[1]) / d : null }
  if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) return null
  const v = Number(s)
  return Number.isFinite(v) ? v : null
}

// Верен ли ответ: целое — точно, дробное — с точностью до 1% (ответы в
// шаблонах округлены до сотых, ученик может округлить чуть иначе)
export function isCorrectNumber(input: number, answer: number): boolean {
  if (Number.isInteger(answer) && Math.abs(answer) < 1e5) return Math.abs(input - answer) < 1e-9
  return Math.abs(input - answer) <= Math.max(1e-9, Math.abs(answer) * 0.01)
}

// Число из LaTeX: «2{,}5», «-\frac{3}{4}», «1{,}2 \cdot 10^{5}», «10^{-3}»
export function latexNumber(raw: string): number | null {
  let s = raw.trim().replace(/\\[,;!]|\\ /g, '').replace(/\{,\}/g, '.').replace(/\s+/g, '').replace(/−/g, '-')
  s = s.replace(/\\approx|\\text\{[^}]*\}|°/g, '')
  const fr = /^(-?)\\[dt]?frac\{(-?[\d.]+)\}\{([\d.]+)\}$/.exec(s)
  if (fr) return (fr[1] ? -1 : 1) * Number(fr[2]) / Number(fr[3])
  const sci = /^(-?[\d.]+)\\cdot10\^\{?(-?\d+)\}?$/.exec(s)
  if (sci) return Number(sci[1]) * 10 ** Number(sci[2])
  const pow = /^10\^\{?(-?\d+)\}?$/.exec(s)
  if (pow) return 10 ** Number(pow[1])
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  return Number(s)
}

export type Step = {
  text: string // шаг целиком (показывается после ответа)
  prompt?: string // шаг без итогового числа: «$t = \frac{30}{5} = \ldots$»
  value?: number // промежуточное значение, которое ученик вписывает
}

// Решение по шагам для режима «По шагам». У шага с выкладкой в формуле
// («… = 25$») прячем последнее число — его ученик находит сам. Шаги без
// числа (пояснения) показываются как есть.
export function guidedSteps(solution: string): Step[] {
  return solutionSteps(solution).map(text => {
    const end = text.lastIndexOf('$'), start = text.lastIndexOf('$', end - 1)
    if (start < 0 || end <= start) return { text }
    const math = text.slice(start + 1, end)
    let depth = 0, eq = -1
    for (let i = 0; i < math.length; i++) {
      if (math[i] === '{') depth++
      else if (math[i] === '}') depth--
      else if (depth === 0 && math[i] === '=') eq = i
    }
    if (eq < 0) return { text }
    const value = latexNumber(math.slice(eq + 1))
    if (value === null) return { text }
    return { text, prompt: `${text.slice(0, start + 1)}${math.slice(0, eq + 1)} \\ldots${text.slice(end)}`, value }
  })
}
