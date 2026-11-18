// Задачи с ответом-числом для раздела «Решение задач» (на сервере: нужны шаблоны)
import { ENT_SUBJECTS, sectionOfTopic, type EntSubject } from './ent'
import { generateFromTemplate, isTheory, templateKey, templatesFor } from './templates'
import { withLocale, type Generated } from './templates/helpers'
import type { Locale } from './i18n'
import { withSeed } from './seeded'

export type NumericTask = {
  question: string
  figure?: string
  solution: string
  answer: number
  unit: string
  topic: string
  section?: string
  key?: string
  // Варианты ответа — для «Работы над ошибками», где задача решается выбором
  options: string[]
  correct: number
}

// Задача, у которой ответ — число (не формула и не слово)
export function numericTask(subject: EntSubject, topic: string, locale: Locale, hard = false): NumericTask | null {
  for (let i = 0; i < 30; i++) {
    const g = generateFromTemplate(subject, topic, 4, locale, hard ? 'hard' : 'ent', i < 20 ? (hard ? 'hard' : 'calc') : undefined)
    const task = asNumeric(subject, topic, g)
    if (task) return task
  }
  // Случайный выбор может не попасть в числовые задачи, если их в теме мало, —
  // тогда перебираем шаблоны темы по очереди (в случайном порядке)
  // (сначала шаблоны нужного уровня)
  const list = templatesFor(subject, topic).filter(t => !isTheory(t)).sort(() => Math.random() - 0.5)
  for (const t of [...list.filter(t => Boolean(t.hard) === hard), ...list.filter(t => Boolean(t.hard) !== hard)]) {
    const task = asNumeric(subject, topic, { ...withLocale(locale, () => t.gen(4)), key: templateKey(t) })
    if (task) return task
  }
  return null
}

function asNumeric(subject: EntSubject, topic: string, g: Generated | null): NumericTask | null {
  if (!g?.num) return null
  const answer = g.num.values[g.correct]
  if (!Number.isFinite(answer)) return null
  return {
    question: g.question, solution: g.solution, answer, unit: g.num.unit, topic,
    section: sectionOfTopic(subject, topic), options: g.options, correct: g.correct,
    ...(g.figure ? { figure: g.figure } : {}), ...(g.key ? { key: g.key } : {}),
  }
}

// Темы, по которым есть задачи с ответом-числом (проверяем пробной генерацией)
const cache = new Map<EntSubject, string[]>()
export function numericTopics(subject: EntSubject): string[] {
  let list = cache.get(subject)
  if (!list) {
    list = withSeed(31, () => ENT_SUBJECTS[subject].sections.flatMap(s => s.topics)
      .filter(topic => Array.from({ length: 8 }, () => generateFromTemplate(subject, topic, 4, 'ru', 'ent', 'calc')).some(g => g?.num)))
    cache.set(subject, list)
  }
  return list
}
