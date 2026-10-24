import type { EntDifficulty, EntSubject } from '@/lib/ent'
import type { Locale } from '@/lib/i18n'
import { withLocale, type Generated, type Template } from './helpers'
import { PHYSICS_TEMPLATES } from './physics'
import { MATH_TEMPLATES } from './math'
import { MATH_THEORY, PHYSICS_THEORY } from './theory'
import { MATH_MORE, PHYSICS_MORE } from './more'

const ALL: Record<EntSubject, Template[]> = {
  physics: [...PHYSICS_TEMPLATES, ...PHYSICS_THEORY, ...PHYSICS_MORE],
  math: [...MATH_TEMPLATES, ...MATH_THEORY, ...MATH_MORE],
}

// Дополнительные задания переведены на казахский, английского перевода пока нет
const NO_EN = new Set<Template>([...PHYSICS_MORE, ...MATH_MORE])

export function templatesFor(subject: EntSubject, topic: string): Template[] {
  return ALL[subject].filter(t => t.topic === topic)
}

export function hasTemplates(subject: EntSubject, topic: string): boolean {
  return ALL[subject].some(t => t.topic === topic)
}

// Доля задач в несколько действий: на уровне ЕНТ — треть, выше ЕНТ — большинство.
// base — только задачи в одно-два действия (уровень A в пробном ЕНТ).
export type TemplateLevel = EntDifficulty | 'base'
export const HARD_SHARE: Record<TemplateLevel, number> = { base: 0, ent: 0.35, hard: 0.75 }

// Теоретический вопрос (определение, явление, закон): помеченный в theory()
// или такой, что ни в одном варианте ответа нет чисел. Второе определяем по
// пробной генерации со своим генератором случайных чисел, чтобы не сбивать
// Math.random (тесты переводов на нём держатся).
const theoryCache = new Map<Template, boolean>()
export function isTheory(t: Template): boolean {
  if (t.theory) return true
  let v = theoryCache.get(t)
  if (v === undefined) {
    const orig = Math.random
    let seed = 7
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
    try {
      v = [0, 1, 2].every(() => withLocale('ru', () => t.gen(4)).options.every(o => !/\d/.test(o)))
    } finally { Math.random = orig }
    theoryCache.set(t, v)
  }
  return v
}

// Теория на ЕНТ попадается нечасто — в тренажёре даём её примерно в каждом седьмом задании
export const THEORY_SHARE = 0.15

// Какие задания есть у темы: теория, расчётные, сложные расчётные
export function topicKinds(subject: EntSubject, topic: string): { theory: boolean; calc: boolean; hard: boolean } {
  const list = templatesFor(subject, topic)
  return {
    theory: list.some(isTheory),
    calc: list.some(t => !isTheory(t)),
    hard: list.some(t => t.hard && !isTheory(t)),
  }
}

// theory — только теория, calc — только расчётные, hard — только сложные расчётные.
// Если таких заданий у темы нет — берём, что есть.
export type TemplateKind = 'theory' | 'calc' | 'hard'

// Задача по шаблону для темы (или null, если шаблонов нет)
export function generateFromTemplate(subject: EntSubject, topic: string, nOptions: number, locale: Locale = 'ru', difficulty: TemplateLevel = 'ent', kind?: TemplateKind): Generated | null {
  let list = templatesFor(subject, topic)
  if (!list.length) return null
  // На английском берём переведённые задания, если они есть у темы
  if (locale === 'en') {
    const translated = list.filter(t => !NO_EN.has(t))
    if (translated.length) list = translated
  }
  const theory = list.filter(isTheory), calc = list.filter(t => !isTheory(t))
  const hardCalc = calc.filter(t => t.hard)
  if (kind === 'theory' && theory.length) list = theory
  else if (kind === 'hard' && hardCalc.length) list = hardCalc
  else if (kind && kind !== 'theory' && calc.length) list = calc
  else if (!kind && theory.length && calc.length) list = Math.random() < THEORY_SHARE ? theory : calc
  if (list !== theory && list !== hardCalc) {
    const hard = list.filter(t => t.hard)
    if (hard.length && hard.length < list.length) {
      list = Math.random() < HARD_SHARE[difficulty] ? hard : list.filter(t => !t.hard)
    }
  }
  const template = list[Math.floor(Math.random() * list.length)]
  return withLocale(locale, () => template.gen(nOptions))
}

export function templateCount(subject: EntSubject): number {
  return ALL[subject].length
}
