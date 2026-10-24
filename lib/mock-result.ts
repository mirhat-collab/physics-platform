// Итог пробного ЕНТ: баллы, верные ответы и потери по разделам спецификации.
// Общий для страницы пробного ЕНТ, статистики и тестов.
import { mockPoints, type EntQuestion, type EntSubject } from './ent'
import { specSectionOf, specSections } from './ent-spec'

export type MockResult = {
  score: number
  max: number
  correct: number
  answered: number
  // Раздел спецификации → [набрано, максимум], в порядке спецификации
  sections: Record<string, [number, number]>
  // Темы тренажёра с ошибками по каждому разделу — для ссылок «тренировать»
  wrongTopics: Record<string, string[]>
}

export function mockResult(subject: EntSubject, questions: EntQuestion[], answers: (number | null)[]): MockResult {
  const sections: Record<string, [number, number]> = {}
  const wrongTopics: Record<string, string[]> = {}
  for (const name of specSections(subject)) { sections[name] = [0, 0]; wrongTopics[name] = [] }
  let score = 0, max = 0, correct = 0, answered = 0
  questions.forEach((q, i) => {
    const pts = mockPoints(i)
    const ok = answers[i] === q.correct
    const sec = specSectionOf(subject, q.topic)
    if (!sections[sec]) { sections[sec] = [0, 0]; wrongTopics[sec] = [] }
    max += pts
    sections[sec][1] += pts
    if (answers[i] !== null && answers[i] !== undefined) answered++
    if (ok) { score += pts; correct++; sections[sec][0] += pts }
    else if (q.topic && !wrongTopics[sec].includes(q.topic)) wrongTopics[sec].push(q.topic)
  })
  return { score, max, correct, answered, sections, wrongTopics }
}

// Сохранённая попытка пробного ЕНТ (строка ent_attempts с section = 'mock')
export type MockAttempt = {
  subject: string
  score: number | null
  max_score: number | null
  correct: number
  total: number
  details: Record<string, [number, number]> | null
  created_at: string
}

export type MockSummary = {
  count: number
  last: number // баллы последней попытки
  best: number
  avg: number // средний балл последних попыток
  delta: number | null // последняя минус предыдущая
  max: number
  history: { score: number; date: string }[] // от старых к новым
  // Раздел → средний процент за все попытки, от слабых к сильным
  sections: { name: string; pct: number; got: number; max: number }[]
}

// Итоги пробных ЕНТ по одному предмету. Попытки без баллов (до миграции)
// пересчитываются по числу верных ответов.
export function mockSummary(attempts: MockAttempt[], subject: EntSubject, avgOf = 5): MockSummary | null {
  const list = attempts.filter(a => a.subject === subject)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  if (!list.length) return null
  const scoreOf = (a: MockAttempt) => a.score ?? a.correct
  const history = list.map(a => ({ score: scoreOf(a), date: a.created_at }))
  const scores = history.map(h => h.score)
  const recent = scores.slice(-avgOf)
  const agg: Record<string, [number, number]> = {}
  for (const a of list) {
    for (const [name, [got, max]] of Object.entries(a.details || {})) {
      agg[name] = agg[name] || [0, 0]
      agg[name][0] += got
      agg[name][1] += max
    }
  }
  const order = specSections(subject)
  const sections = Object.entries(agg).filter(([, [, m]]) => m > 0)
    .map(([name, [got, max]]) => ({ name, got, max, pct: got / max }))
    .sort((a, b) => a.pct - b.pct || order.indexOf(a.name) - order.indexOf(b.name))
  return {
    count: list.length,
    last: scores[scores.length - 1],
    best: Math.max(...scores),
    avg: Math.round((recent.reduce((s, x) => s + x, 0) / recent.length) * 10) / 10,
    delta: scores.length > 1 ? scores[scores.length - 1] - scores[scores.length - 2] : null,
    max: list[list.length - 1].max_score ?? list[list.length - 1].total,
    history,
    sections,
  }
}
