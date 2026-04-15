import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { topicName, theory, formulas, examples } = await req.json()

    const content = [
      topicName && `Тема: ${topicName}`,
      theory && `Теория: ${theory?.slice(0, 800)}`,
      formulas && `Формулы: ${formulas?.slice(0, 300)}`,
      examples && `Примеры: ${examples?.slice(0, 300)}`,
    ].filter(Boolean).join('\n\n')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `На основе этого материала по физике составь 4 вопроса с вариантами ответа. Отвечай ТОЛЬКО в формате JSON массива (без лишнего текста, без markdown):

${content}

Формат:
[{"question":"Вопрос?","options":["А","Б","В","Г"],"correct":0}]

"correct" — индекс правильного ответа (0, 1, 2 или 3).`
      }]
    })

    const text = (message.content[0] as { text: string }).text
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Не удалось разобрать ответ AI' }, { status: 500 })
    }

    const questions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ questions })

  } catch (err: any) {
    console.error('Quiz API error:', err)
    return NextResponse.json({
      error: err.message || 'Ошибка генерации вопросов',
      detail: err?.status || err?.code || String(err)
    }, { status: 500 })
  }
}
