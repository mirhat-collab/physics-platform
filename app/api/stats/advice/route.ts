import { NextResponse } from 'next/server'
import { aiErrorResponse, chat, checkAiQuota } from '@/lib/ai'
import { createSupabaseServer } from '@/lib/supabase-server'
import { SOURCE_LABEL, SUBJECT_LABEL, sectionStats, type LogRow } from '@/lib/stats'

export const maxDuration = 100

const SYSTEM = `Ты — опытный репетитор по физике и математике, готовишь школьника из Казахстана к ЕНТ.
Тебе дают статистику ученика с учебной платформы: точность по разделам в тренажёре ЕНТ и в тренажёре формул.
Составь короткий личный план на русском языке:
1. **Сильные стороны** — 1-2 предложения.
2. **Что подтянуть в первую очередь** — 2-4 самых слабых раздела, для каждого: почему это важно для ЕНТ и что конкретно повторить (законы, формулы, типы задач).
3. **План на неделю** — по дням, 15-30 минут в день, используя разделы платформы: «Тренажёр формул» (выбрать раздел) и «Подготовка к ЕНТ» (выбрать тему).
4. Одна мотивирующая фраза в конце.
Пиши по-доброму и конкретно, без воды. Формулы — в LaTeX внутри $…$. Жирный — **так**. Если данных мало, так и скажи и предложи с чего начать.`

export async function POST() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Войди в аккаунт' }, { status: 401 })

  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows } = await supabase
    .from('answer_log')
    .select('source, subject, section, correct, created_at')
    .eq('user_id', user.id)
    .gte('created_at', since)
    .limit(5000)

  const stats = sectionStats((rows || []) as LogRow[])
  if (!stats.length) {
    return NextResponse.json({ error: 'Пока нет данных — реши несколько заданий в тренажёрах, и я составлю план' }, { status: 400 })
  }

  const quotaError = await checkAiQuota('stats_advice')
  if (quotaError) return quotaError

  const lines = stats
    .sort((a, b) => a.accuracy - b.accuracy)
    .map(s => `- ${SOURCE_LABEL[s.source]} · ${SUBJECT_LABEL[s.subject]} · ${s.section}: ${s.correct} из ${s.total} верно (${Math.round(s.accuracy * 100)}%), ошибок за 2 недели: ${s.recentWrong}`)
    .join('\n')

  try {
    const text = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Статистика ученика за последние 60 дней:\n${lines}` },
    ], { maxTokens: 4000, effort: 'low' })
    return NextResponse.json({ text })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
