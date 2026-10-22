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

// Доля задач в несколько действий: на уровне ЕНТ — треть, выше ЕНТ — большинство
const HARD_SHARE: Record<EntDifficulty, number> = { ent: 0.35, hard: 0.75 }

// Задача по шаблону для темы (или null, если шаблонов нет)
export function generateFromTemplate(subject: EntSubject, topic: string, nOptions: number, locale: Locale = 'ru', difficulty: EntDifficulty = 'ent'): Generated | null {
  let list = templatesFor(subject, topic)
  if (!list.length) return null
  // На английском берём переведённые задания, если они есть у темы
  if (locale === 'en') {
    const translated = list.filter(t => !NO_EN.has(t))
    if (translated.length) list = translated
  }
  const hard = list.filter(t => t.hard)
  if (hard.length && hard.length < list.length) {
    list = Math.random() < HARD_SHARE[difficulty] ? hard : list.filter(t => !t.hard)
  }
  const template = list[Math.floor(Math.random() * list.length)]
  return withLocale(locale, () => template.gen(nOptions))
}

export function templateCount(subject: EntSubject): number {
  return ALL[subject].length
}
