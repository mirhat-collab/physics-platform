import { supabase } from '@/lib/supabase'
import type { EntQuestion } from '@/lib/ent'
import { queueMistakes } from '@/lib/review'

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
// Ошибки в заданиях ЕНТ (с условием) сами попадают в «Работу над ошибками».
export async function logAnswers(rows: AnswerRow[], opts: { queue?: boolean } = {}) {
  if (!rows.length) return
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('answer_log').insert(rows.map(r => ({ ...r, user_id: user.id })))
    if (opts.queue !== false) {
      const wrong = rows.filter(r => r.source === 'ent' && !r.correct && r.payload)
      await queueMistakes(user.id, wrong.map(r => ({ subject: r.subject, section: r.section, topic: r.topic, payload: r.payload as unknown as MistakePayload })))
    }
  } catch (err) {
    console.error('answer_log:', err)
  }
}
