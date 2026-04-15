import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { topicName, theory, formulas, examples } = await req.json()

  const content = [
    topicName && `Тема: ${topicName}`,
    theory && `Теория: ${theory}`,
    formulas && `Формулы: ${formulas}`,
    examples && `Примеры: ${examples}`,
  ].filter(Boolean).join('\n\n')

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `На основе этого материала по физике составь 4 вопроса с вариантами ответа. Отвечай ТОЛЬКО в формате JSON (без лишнего текста):

${content}

Формат ответа:
[
  {
    "question": "Вопрос?",
    "options": ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"],
    "correct": 0
  }
]

"correct" — это индекс правильного ответа (0, 1, 2 или 3).`
    }]
  })

  const text = (message.content[0] as { text: string }).text
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return NextResponse.json({ error: 'Не удалось сгенерировать вопросы' }, { status: 500 })

  const questions = JSON.parse(jsonMatch[0])
  return NextResponse.json({ questions })
}
