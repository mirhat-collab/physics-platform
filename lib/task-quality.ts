// Отчёт о качестве заданий для админа: по журналу ответов (answer_log с
// task_key) находим задания, которые решают подозрительно плохо или
// подозрительно легко по сравнению с их темой.

export type QualityAnswer = { task_key: string | null; subject: string; topic: string | null; correct: boolean }

export type TaskFlag = 'hard' | 'below_topic' | 'easy'

export type TaskQuality = {
  key: string
  subject: string
  topic: string | null
  answers: number
  accuracy: number
  topicAccuracy: number | null // по остальным заданиям темы
  flags: TaskFlag[]
}

// Порог: меньше ответов — оценка случайна, не показываем
export const QUALITY_MIN_ANSWERS = 8

export function taskQuality(rows: QualityAnswer[], minAnswers = QUALITY_MIN_ANSWERS): TaskQuality[] {
  const byKey = new Map<string, { subject: string; topic: string | null; n: number; c: number }>()
  const byTopic = new Map<string, { n: number; c: number }>()
  for (const r of rows) {
    if (!r.task_key) continue
    const k = byKey.get(r.task_key) || { subject: r.subject, topic: r.topic, n: 0, c: 0 }
    k.n++
    if (r.correct) k.c++
    byKey.set(r.task_key, k)
    if (r.topic) {
      const tk = `${r.subject}|${r.topic}`
      const t = byTopic.get(tk) || { n: 0, c: 0 }
      t.n++
      if (r.correct) t.c++
      byTopic.set(tk, t)
    }
  }
  const out: TaskQuality[] = []
  for (const [key, k] of byKey) {
    if (k.n < minAnswers) continue
    const accuracy = k.c / k.n
    const t = k.topic ? byTopic.get(`${k.subject}|${k.topic}`) : undefined
    // Точность темы без самого задания — чтобы оно не тянуло среднее на себя
    const rest = t ? { n: t.n - k.n, c: t.c - k.c } : null
    const topicAccuracy = rest && rest.n >= minAnswers ? rest.c / rest.n : null
    const flags: TaskFlag[] = []
    if (accuracy < 0.25) flags.push('hard')
    if (topicAccuracy !== null && topicAccuracy - accuracy >= 0.35) flags.push('below_topic')
    if (accuracy === 1 && k.n >= 2 * minAnswers) flags.push('easy')
    out.push({ key, subject: k.subject, topic: k.topic, answers: k.n, accuracy, topicAccuracy, flags })
  }
  // Сначала подозрительные, среди них — где ответов больше и точность ниже
  return out.sort((a, b) => (b.flags.length > 0 ? 1 : 0) - (a.flags.length > 0 ? 1 : 0) || a.accuracy - b.accuracy || b.answers - a.answers)
}
