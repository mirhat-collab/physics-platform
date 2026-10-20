import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { AI_MODEL, aiErrorResponse, checkAiQuota, getAnthropic, textOf } from '@/lib/ai'

export const maxDuration = 120

const SYSTEM = `Ты — добрый и терпеливый репетитор по физике и математике, готовишь школьника к ЕНТ.
Ученик решал тестовое задание и ошибся или не смог решить. Объясни решение на русском языке.

Как объяснять:
- Начни с идеи: какой закон или формула здесь нужны и почему.
- Затем решение по шагам, каждый шаг — с коротким пояснением.
- Если ученик выбрал неправильный ответ, коротко покажи, какая ошибка обычно приводит к такому ответу.
- В конце — одна строка «Ответ: …» и короткий совет, как не ошибаться в похожих задачах.
- Формулы пиши в LaTeX внутри знаков доллара: $F = ma$. Жирный текст — **так**.
- Пиши понятно и без лишней воды, как живой учитель, а не учебник.
- На уточняющие вопросы отвечай коротко и по делу.`

type Turn = { role: 'user' | 'assistant'; content: string }

const MAX_LEN = 4000

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const question = String(body?.question ?? '').slice(0, MAX_LEN)
  const options: string[] = Array.isArray(body?.options) ? body.options.slice(0, 6).map((o: unknown) => String(o).slice(0, 500)) : []
  const correct = Number(body?.correct)
  const chosen = body?.chosen === null || body?.chosen === undefined ? null : Number(body.chosen)
  const solution = String(body?.solution ?? '').slice(0, MAX_LEN)
  const history: Turn[] = Array.isArray(body?.history) ? body.history : []

  if (!question || !options.length || !(correct >= 0 && correct < options.length)) {
    return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  }
  // Уточняющий диалог ограничиваем, чтобы не раздувать запросы
  if (history.length > 12 || history.some(t => (t.role !== 'user' && t.role !== 'assistant') || typeof t.content !== 'string')) {
    return NextResponse.json({ error: 'Слишком длинный диалог — начни объяснение заново' }, { status: 400 })
  }

  const quotaError = await checkAiQuota('ent_explain')
  if (quotaError) return quotaError

  const letters = 'ABCDEF'
  const optionsText = options.map((o, i) => `${letters[i]}) ${o}`).join('\n')
  const chosenText = chosen === null || !(chosen >= 0 && chosen < options.length)
    ? 'Ученик не смог решить и пропустил задание.'
    : `Ученик выбрал: ${letters[chosen]}) ${options[chosen]}`

  const intro = `Задание:
${question}

Варианты:
${optionsText}

Правильный ответ: ${letters[correct]}) ${options[correct]}
${chosenText}
${solution ? `\nКраткое решение составителя (проверь его): ${solution}` : ''}

Объясни, как решать это задание.`

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: intro },
    ...history.map(t => ({ role: t.role, content: t.content.slice(0, MAX_LEN) })),
  ]
  if (messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Нет вопроса' }, { status: 400 })
  }

  try {
    const message = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      output_config: { effort: 'medium' },
      messages,
    })
    if (message.stop_reason === 'refusal') {
      return NextResponse.json({ error: 'ИИ не смог ответить на этот вопрос' }, { status: 502 })
    }
    return NextResponse.json({ text: textOf(message) })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
