// Подсчёт статистики ученика по журналу ответов (answer_log).
// Используется и на странице статистики, и в API совета от ИИ.

export type LogRow = {
  source: 'ent' | 'formula'
  subject: 'physics' | 'math'
  section: string | null
  correct: boolean
  created_at: string
}

export type SectionStat = {
  source: 'ent' | 'formula'
  subject: 'physics' | 'math'
  section: string
  total: number
  correct: number
  wrong: number
  accuracy: number // 0..1
  recentWrong: number // ошибок за последние 14 дней
}

export const MIN_FOR_RANKING = 3 // меньше ответов — делать выводы рано
export const WEAK_THRESHOLD = 0.6

export function sectionStats(rows: LogRow[]): SectionStat[] {
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
  const map = new Map<string, SectionStat>()
  for (const r of rows) {
    const section = r.section || 'Без раздела'
    const key = `${r.source}|${r.subject}|${section}`
    let s = map.get(key)
    if (!s) {
      s = { source: r.source, subject: r.subject, section, total: 0, correct: 0, wrong: 0, accuracy: 0, recentWrong: 0 }
      map.set(key, s)
    }
    s.total++
    if (r.correct) s.correct++
    else {
      s.wrong++
      if (new Date(r.created_at).getTime() >= twoWeeksAgo) s.recentWrong++
    }
  }
  for (const s of map.values()) s.accuracy = s.total ? s.correct / s.total : 0
  return [...map.values()]
}

export function weakSections(stats: SectionStat[]): SectionStat[] {
  return stats
    .filter(s => s.total >= MIN_FOR_RANKING && s.accuracy < WEAK_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong)
}

export function strongSections(stats: SectionStat[]): SectionStat[] {
  return stats
    .filter(s => s.total >= MIN_FOR_RANKING && s.accuracy >= 0.8)
    .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)
}

// Точность по дням за последние n дней (для графика)
export function dailyAccuracy(rows: LogRow[], days: number): { date: string; total: number; correct: number }[] {
  const out: { date: string; total: number; correct: number }[] = []
  const byDay = new Map<string, { total: number; correct: number }>()
  for (const r of rows) {
    const d = r.created_at.slice(0, 10)
    const v = byDay.get(d) || { total: 0, correct: 0 }
    v.total++
    if (r.correct) v.correct++
    byDay.set(d, v)
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    out.push({ date: d, ...(byDay.get(d) || { total: 0, correct: 0 }) })
  }
  return out
}

export const SUBJECT_LABEL = { physics: 'Физика', math: 'Математика' } as const
export const SOURCE_LABEL = { ent: 'ЕНТ', formula: 'Формулы' } as const
