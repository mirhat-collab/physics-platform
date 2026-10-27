// Домашнее задание из тренажёра ЕНТ: учитель выбирает предмет, темы и число
// заданий. Выполнение считаем по журналу ответов (answer_log) после выдачи ДЗ:
// сколько заданий ученик решил по этим темам и сколько из них верно.
import type { EntSubject } from './ent'

export type EntHomework = { subject: EntSubject; topics: string[]; count: number }
export type HwAnswer = { user_id?: string; subject: string; topic: string | null; correct: boolean; created_at: string }

export const HW_COUNTS = [10, 20, 30, 50] as const

export type HwProgress = { solved: number; correct: number; done: boolean; accuracy: number }

export function hwProgress(rows: HwAnswer[], hw: EntHomework, since: string): HwProgress {
  const from = new Date(since).getTime()
  const mine = rows.filter(r => r.subject === hw.subject && r.topic && hw.topics.includes(r.topic) && new Date(r.created_at).getTime() >= from)
  const correct = mine.filter(r => r.correct).length
  return { solved: mine.length, correct, done: mine.length >= hw.count, accuracy: mine.length ? correct / mine.length : 0 }
}

export function hwHref(hw: EntHomework): string {
  return `/ent?subject=${hw.subject}${hw.topics.map(x => `&topic=${encodeURIComponent(x)}`).join('')}`
}
