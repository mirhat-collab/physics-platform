// Задачи с ответом-числом для раздела «Решение задач» (на сервере: нужны шаблоны)
import { ENT_SUBJECTS, sectionOfTopic, type EntSubject } from './ent'
import { generateFromTemplate } from './templates'
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
    if (!g?.num) continue
    const answer = g.num.values[g.correct]
    if (!Number.isFinite(answer)) continue
    return {
      question: g.question, solution: g.solution, answer, unit: g.num.unit, topic,
      section: sectionOfTopic(subject, topic), options: g.options, correct: g.correct,
      ...(g.figure ? { figure: g.figure } : {}), ...(g.key ? { key: g.key } : {}),
    }
  }
  return null
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
