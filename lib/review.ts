import { supabase } from '@/lib/supabase'
import type { MistakePayload } from '@/lib/answer-log'

// «Работа над ошибками» — интервальные повторы.
// Ошибся → задача вернётся завтра. Решил верно → через 3 дня, потом через 7.
// Три верных ответа подряд — задача выучена и уходит из очереди.
export const REVIEW_INTERVALS = [1, 3, 7] as const
const DAY = 24 * 60 * 60 * 1000

export type ReviewItem = {
  id: number
  subject: 'physics' | 'math'
  section: string | null
  topic: string | null
  payload: MistakePayload
  stage: number
  due_at: string
}

type Mistake = { subject: 'physics' | 'math'; section?: string | null; topic?: string | null; payload: MistakePayload }

// Новая ошибка (или повторная) — в очередь на завтра, с самого начала
export async function queueMistakes(userId: string, list: Mistake[]) {
  const rows = list.filter(m => m.payload?.question && Array.isArray(m.payload.options))
  if (!rows.length) return
  const due = new Date(Date.now() + REVIEW_INTERVALS[0] * DAY).toISOString()
  const now = new Date().toISOString()
  try {
    await supabase.from('review_queue').upsert(
      rows.map(m => ({ user_id: userId, subject: m.subject, section: m.section ?? null, topic: m.topic ?? null, payload: m.payload, stage: 0, due_at: due, done: false, updated_at: now })),
      { onConflict: 'user_id,qkey' },
    )
  } catch (err) {
    console.error('review_queue:', err)
  }
}

// Ответ на повторе: верно — следующая ступень, неверно — снова завтра
export function nextReview(stage: number, ok: boolean): { stage: number; done: boolean; due_at: string } {
  const next = ok ? stage + 1 : 0
  const done = next >= REVIEW_INTERVALS.length
  const days = done ? 0 : REVIEW_INTERVALS[next]
  return { stage: next, done, due_at: new Date(Date.now() + days * DAY).toISOString() }
}

export async function answerReview(item: ReviewItem, ok: boolean) {
  const upd = nextReview(item.stage, ok)
  await supabase.from('review_queue').update({ ...upd, updated_at: new Date().toISOString() }).eq('id', item.id)
  return upd
}

// Сколько задач ждёт повтора сегодня (для главной и меню)
export async function dueReviewCount(userId: string): Promise<number> {
  const { count } = await supabase.from('review_queue').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('done', false).lte('due_at', new Date().toISOString())
  return count || 0
}
