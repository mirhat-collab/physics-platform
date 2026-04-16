import { NextRequest, NextResponse } from 'next/server'

// Rate limiting: максимум 20 запросов с одного IP в час
const requests = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()

  const req_data = requests.get(ip)
  if (req_data && now < req_data.resetAt) {
    if (req_data.count >= 20) {
      return NextResponse.json({ error: 'Слишком много запросов. Попробуй позже.' }, { status: 429 })
    }
    req_data.count++
  } else {
    requests.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
  }

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
      console.error('Groq API error:', res.status) // Логируем на сервере, не отдаём клиенту
      return NextResponse.json({ error: 'Не удалось сгенерировать вопросы' }, { status: 500 })
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
    console.error('Quiz API error:', err) // Только на сервере
    return NextResponse.json({ error: 'Ошибка генерации вопросов' }, { status: 500 })
  }
}
