import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { topicName, theory, formulas, examples } = await req.json()

    const content = [
      topicName && `Тема: ${topicName}`,
      theory && `Теория: ${theory?.slice(0, 800)}`,
      formulas && `Формулы: ${formulas?.slice(0, 300)}`,
      examples && `Примеры: ${examples?.slice(0, 300)}`,
    ].filter(Boolean).join('\n\n')

    const prompt = `На основе этого материала по физике составь 4 вопроса с вариантами ответа. Отвечай ТОЛЬКО в формате JSON массива (без лишнего текста, без markdown):

${content}

Формат:
[{"question":"Вопрос?","options":["А","Б","В","Г"],"correct":0}]

"correct" — индекс правильного ответа (0, 1, 2 или 3).`

    const apiKey = process.env.GROQ_API_KEY
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.7
      })
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Не удалось разобрать ответ AI' }, { status: 500 })
    }

    const questions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ questions })

  } catch (err: any) {
    console.error('Quiz API error:', err)
    return NextResponse.json({ error: err.message || 'Ошибка генерации вопросов' }, { status: 500 })
  }
}
