// Задания ЕНТ в форматах «один или несколько правильных ответов» и
// «на соответствие», собранные из обычных задач по шаблонам.
//
// Несколько ответов: верный ответ записан в нескольких формах — в разных
// единицах (20 м/с и 72 км/ч) или разными записями числа (8, $\sqrt{64}$, $2^3$).
// Среди неверных вариантов тоже есть такие пары, поэтому ответ не угадать
// по совпадающим вариантам — задачу нужно решить.
//
// Соответствие: три задачи и пять ответов, к каждой задаче — свой ответ.
import type { EntQuestion, EntSubject } from './ent'
import { tr, withLocale, withUnit, type Generated } from './templates/helpers'
import { piFrac } from './templates/more/common'
import type { Locale } from './i18n'

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Conv = { to: string; f: (v: number) => number; ok?: (v: number) => boolean }
const big = (v: number) => Math.abs(v) >= 100, small = (v: number) => Math.abs(v) < 10, tiny = (v: number) => Math.abs(v) < 1
const x = (k: number) => (v: number) => v * k

// Другие единицы для той же величины
const UNITS: Record<string, Conv[]> = {
  'м': [{ to: 'см', f: x(100), ok: v => Math.abs(v) < 100 }, { to: 'км', f: x(1e-3), ok: v => Math.abs(v) >= 1000 }, { to: 'мм', f: x(1000), ok: tiny }],
  'см': [{ to: 'мм', f: x(10) }, { to: 'м', f: x(0.01) }],
  'мм': [{ to: 'см', f: x(0.1) }, { to: 'мкм', f: x(1000), ok: tiny }],
  'км': [{ to: 'м', f: x(1000) }],
  'м/с': [{ to: 'км/ч', f: x(3.6) }],
  'км/ч': [{ to: 'м/с', f: x(1 / 3.6) }],
  'см/с': [{ to: 'мм/с', f: x(10) }, { to: 'м/с', f: x(0.01) }],
  'мм/с': [{ to: 'см/с', f: x(0.1) }],
  'км/с': [{ to: 'м/с', f: x(1000) }],
  'Дж': [{ to: 'кДж', f: x(1e-3), ok: big }, { to: 'мДж', f: x(1000), ok: tiny }],
  'кДж': [{ to: 'Дж', f: x(1000) }],
  'мДж': [{ to: 'Дж', f: x(1e-3) }],
  'мкДж': [{ to: 'мДж', f: x(1e-3) }],
  'Н': [{ to: 'кН', f: x(1e-3), ok: big }, { to: 'мН', f: x(1000), ok: tiny }],
  'мН': [{ to: 'Н', f: x(1e-3) }],
  'с': [{ to: 'мин', f: x(1 / 60), ok: v => Math.abs(v) >= 60 }, { to: 'мс', f: x(1000), ok: tiny }],
  'мин': [{ to: 'с', f: x(60) }],
  'ч': [{ to: 'мин', f: x(60) }],
  'сут': [{ to: 'ч', f: x(24) }],
  'кг': [{ to: 'г', f: x(1000), ok: small }, { to: 'т', f: x(1e-3), ok: v => Math.abs(v) >= 1000 }],
  'г': [{ to: 'кг', f: x(1e-3) }, { to: 'мг', f: x(1000), ok: tiny }],
  'т': [{ to: 'кг', f: x(1000) }],
  'А': [{ to: 'мА', f: x(1000), ok: small }],
  'В': [{ to: 'мВ', f: x(1000), ok: tiny }, { to: 'кВ', f: x(1e-3), ok: v => Math.abs(v) >= 1000 }],
  'Гц': [{ to: 'кГц', f: x(1e-3), ok: big }],
  'Ом': [{ to: 'кОм', f: x(1e-3), ok: big }],
  'нм': [{ to: 'мкм', f: x(1e-3) }],
  'мкм': [{ to: 'нм', f: x(1000) }],
  'Па': [{ to: 'кПа', f: x(1e-3) }],
  'кПа': [{ to: 'Па', f: x(1000) }],
  'Вт': [{ to: 'кВт', f: x(1e-3), ok: big }],
  'МэВ': [{ to: 'кэВ', f: x(1000) }],
  'кэВ': [{ to: 'МэВ', f: x(1e-3) }],
  'эВ': [{ to: 'Дж', f: x(1.6e-19) }],
  'л': [{ to: 'м³', f: x(1e-3) }, { to: 'мл', f: x(1000), ok: small }],
  'м³': [{ to: 'л', f: x(1000) }],
  'дм³': [{ to: 'л', f: x(1) }],
  'мкс': [{ to: 'мс', f: x(1e-3) }],
  'мкФ': [{ to: 'нФ', f: x(1000) }],
  'нФ': [{ to: 'мкФ', f: x(1e-3) }],
  'Тл': [{ to: 'мТл', f: x(1000), ok: tiny }],
  'мВб': [{ to: 'Вб', f: x(1e-3) }],
  'Вб': [{ to: 'мВб', f: x(1000) }],
  'Кл': [{ to: 'мКл', f: x(1000), ok: tiny }],
  'мкКл': [{ to: 'нКл', f: x(1000) }],
  'нКл': [{ to: 'мкКл', f: x(1e-3) }],
  'Гн': [{ to: 'мГн', f: x(1000), ok: tiny }],
  'мГн': [{ to: 'Гн', f: x(1e-3) }],
  'кВт·ч': [{ to: 'Дж', f: x(3.6e6) }],
  '°C': [{ to: 'К', f: v => v + 273 }],
  'К': [{ to: '°C', f: v => v - 273 }],
}

const isInt = (v: number) => Math.abs(v - Math.round(v)) < 1e-9

// Ещё одна запись числа без единиц: $\sqrt{64}$, $2^3$, $\log_2 8$, $\frac{1}{4}$
function numberForms(v: number): string[] {
  const out: string[] = []
  if (isInt(v)) {
    const n = Math.round(v), a = Math.abs(n)
    if (a >= 2 && a <= 20) out.push(`$${n < 0 ? '-' : ''}\\sqrt{${a * a}}$`)
    for (const b of [2, 3, 5, 10]) {
      for (let e = 2; b ** e <= 1000; e++) if (b ** e === a && a > 1) out.push(`$${n < 0 ? '-' : ''}${b}^{${e}}$`)
    }
    if (n >= 1 && n <= 10) out.push(`$\\log_2 ${2 ** n}$`)
  } else {
    for (const q of [2, 4, 5, 8, 10, 20, 25]) {
      if (isInt(v * q)) {
        const p = Math.round(v * q), g = gcd(Math.abs(p), q)
        out.push(`$${p < 0 ? '-' : ''}\\frac{${Math.abs(p) / g}}{${q / g}}$`)
        break
      }
    }
  }
  return out
}

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b]
  return a
}

// Другие записи того же значения (без исходной). Разные записи числа ($\sqrt{64}$)
// — только в математике, в физике — только другие единицы.
export function altForms(v: number, unit: string, subject: EntSubject): string[] {
  if (!Number.isFinite(v)) return []
  if (unit === '') return subject === 'math' ? numberForms(v) : []
  if (unit === '°') return v !== 0 && isInt(v / 15) ? [`$${piFrac(Math.round(v), 180)}$`] : []
  const main = withUnit(v, unit)
  return (UNITS[unit] || [])
    .filter(c => !c.ok || c.ok(v))
    .map(c => withUnit(c.f(v), c.to))
    .filter(s => s !== main && !s.includes('—'))
}

// Условие требует ответ в определённых единицах («найдите в метрах»,
// «метрмен табыңыз») — другие единицы тогда не верны
const TARGET_UNIT = [
  /(^|[\s(])[вВ] (метрах|сантиметрах|миллиметрах|километрах|секундах|минутах|часах|сутках|граммах|килограммах|тоннах|литрах|джоулях|ньютонах|паскалях|вольтах|амперах|ваттах|герцах|нанометрах|кельвинах|градусах|радианах|мм\/с|см\/с|м\/с|км\/ч|МэВ|кэВ|эВ|Дж|кДж|миллиардах|световых|единицах)/,
  /(мен|пен|бен)\s+(табыңыз|көрсетіңіз|бағалаңыз|өрнектеңіз)/,
  /(мен|пен|бен)\.?\s*$/,
  /\bin (metres|meters|seconds|minutes|hours|grams|kilograms|joules|newtons|volts|amperes|kelvins|degrees|radians|MeV|keV|eV)\b/i,
]
export function needsUnit(question: string): boolean {
  return TARGET_UNIT.some(re => re.test(question))
}

// «Один или несколько правильных ответов» из числовой задачи: 6 вариантов
export function buildMulti(g: Generated, subject: EntSubject, locale: Locale): EntQuestion | null {
  if (!g.num || g.num.values.length < 4 || needsUnit(g.question)) return null
  return withLocale(locale, () => {
    const { values, unit } = g.num!
    const main = (v: number) => withUnit(v, unit)
    const right = [main(values[0]), ...altForms(values[0], unit, subject)]
    if (right.length < 2) return null
    // Верных вариантов 1–3: чаще два
    const k = Math.min(right.length, [1, 2, 2, 2, 3][Math.floor(Math.random() * 5)])
    const correct = shuffled(right).slice(0, k)
    const taken = new Set(right)
    const wrong: string[] = []
    const add = (s: string) => { if (!taken.has(s) && wrong.length < 6 - k) { taken.add(s); wrong.push(s) } }
    // Первый неверный ответ — тоже парой в двух записях
    const w = values.slice(1)
    w.forEach((v, i) => { add(main(v)); if (i === 0 || Math.random() < 0.5) altForms(v, unit, subject).slice(0, 1).forEach(add) })
    w.forEach(v => altForms(v, unit, subject).forEach(add))
    if (wrong.length < 6 - k) return null
    const options = shuffled([...correct, ...wrong])
    const answers = correct.map(c => options.indexOf(c)).sort((a, b) => a - b)
    const note = tr('Верные варианты — одно и то же значение, записанное по-разному.')
    return {
      question: g.question, options, correct: answers[0], kind: 'multi' as const, answers,
      ...(g.figure ? { figure: g.figure } : {}),
      solution: k > 1 ? `${g.solution} ${note}` : g.solution,
    }
  })
}

// «Соответствие» из трёх задач: к каждой — её ответ, плюс два лишних варианта
export function buildMatch(gs: Generated[], locale: Locale): EntQuestion | null {
  // В соответствии у пунктов нет места для рисунка — задачи по рисунку не берём
  if (gs.length !== 3 || gs.some(g => g.figure) || new Set(gs.map(g => g.question)).size !== 3) return null
  const right = gs.map(g => g.options[g.correct])
  if (new Set(right).size !== 3) return null
  const extra: string[] = []
  for (const g of shuffled(gs)) {
    const w = shuffled(g.options.filter((o, i) => i !== g.correct && !right.includes(o) && !extra.includes(o)))[0]
    if (w && extra.length < 2) extra.push(w)
  }
  if (extra.length < 2) return null
  const options = shuffled([...right, ...extra])
  return withLocale(locale, () => ({
    question: tr('Установите соответствие между задачами и ответами.'),
    left: gs.map(g => g.question),
    options,
    pairs: right.map(r => options.indexOf(r)),
    correct: 0,
    kind: 'match' as const,
    solution: gs.map((g, i) => `${i + 1}) ${g.solution}`).join('\n\n'),
  }))
}
