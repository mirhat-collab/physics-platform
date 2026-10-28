import { NextRequest, NextResponse } from 'next/server'
import { aiErrorResponse, chat, checkAiQuota } from '@/lib/ai'
import { AI_LANGUAGE } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n/server'

export const maxDuration = 60

// «Не понимаю этот шаг»: ИИ объясняет один шаг решения, а не всё решение
const SYSTEM = `Ты — терпеливый репетитор по физике и математике, готовишь школьника к ЕНТ.
Ученик разбирает решение задачи по шагам и не понял один шаг. Объясни ТОЛЬКО этот шаг.

Как объяснять:
- 3–6 коротких предложений, простыми словами, как живой учитель.
- Скажи, откуда берётся этот шаг: какая формула, закон или правило, и почему его применяют здесь.
- Если в шаге есть вычисление — покажи его подробнее, по действиям.
- Не пересказывай остальные шаги и не решай задачу целиком.
- Формулы — только в LaTeX между знаками доллара: $F = ma$. Без таблиц, заголовков, HTML.`

const HIDE = `
- Ученик ещё решает задачу сам: НЕ называй итоговый ответ, не вычисляй финальное число и не говори, какой вариант верный.`

const MAX_LEN = 4000

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const question = String(body?.question ?? '').slice(0, MAX_LEN)
  const steps: string[] = Array.isArray(body?.steps) ? body.steps.slice(0, 20).map((s: unknown) => String(s).slice(0, 1000)) : []
  const index = Number(body?.index)
  const hideAnswer = body?.hideAnswer === true
  const simpler = typeof body?.previous === 'string' ? String(body.previous).slice(0, MAX_LEN) : ''
  if (!question || !steps.length || !(index >= 0 && index < steps.length)) {
    return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  }

  const quota = await checkAiQuota('ent_step')
  if (quota.error) return quota.error

  const prompt = `Задание:
${question}

Шаги решения:
${steps.slice(0, index + 1).map((s, i) => `${i + 1}) ${s}`).join('\n')}

Ученик не понял шаг ${index + 1}: «${steps[index]}»
${simpler ? `\nТы уже объяснил так:\n${simpler}\n\nУченик всё ещё не понял — объясни ещё проще, с другой стороны или на бытовом примере.` : '\nОбъясни этот шаг.'}`

  try {
    const text = await chat([
      { role: 'system', content: `${SYSTEM}${hideAnswer ? HIDE : ''}\n- Отвечай только на ${AI_LANGUAGE[await getLocale()]} языке.` },
      { role: 'user', content: prompt },
    ], { maxTokens: 1200, effort: 'low' })
    await quota.record()
    return NextResponse.json({ text })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
