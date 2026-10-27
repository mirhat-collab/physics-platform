import { supabase } from '@/lib/supabase'
import type { EntQuestion } from '@/lib/ent'

export type AnswerRow = {
  source: 'ent' | 'formula'
  subject: 'physics' | 'math'
  section?: string | null
  topic?: string | null
  correct: boolean
  payload?: Record<string, unknown> | null
}

// Задание и ответ ученика, которые храним для «работы над ошибками»
export type MistakePayload = {
  question: string
  options: string[]
  correct: number
  chosen: number | null // null — «не знаю»
  solution: string
  figure?: string
}

export function entMistakePayload(q: EntQuestion, chosen: number | null): MistakePayload {
  return { question: q.question, options: q.options, correct: q.correct, chosen, solution: q.solution, ...(q.figure ? { figure: q.figure } : {}) }
}

// Записывает ответ в статистику. Ошибки сети не мешают решать дальше.
export async function logAnswers(rows: AnswerRow[]) {
  if (!rows.length) return
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('answer_log').insert(rows.map(r => ({ ...r, user_id: user.id })))
  } catch (err) {
    console.error('answer_log:', err)
  }
}
