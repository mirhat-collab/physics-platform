import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { extractStoragePath, fileExt } from '@/lib/file-protect'
import { extractTextFromFile } from '@/lib/extract-text'

export const maxDuration = 30

const BUCKET = 'topic-media'
const EXTRACTABLE_EXT = ['docx', 'pptx', 'pdf']
const MAX_FILES = 2

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
    const body = await req.json()
    const topicId = body.topicId
    let topicName = body.topicName
    let theory = body.theory
    let formulas = body.formulas
    let examples = body.examples
    let media: { url: string; name: string }[] = []

    // Квиз для темы один и тот же для всех учеников — генерируем через AI
    // только один раз и переиспользуем, а не на каждое открытие темы.
    const admin = topicId ? createSupabaseAdmin() : null
    if (admin) {
      const { data: topic } = await admin
        .from('topics')
        .select('name, theory, formulas, examples, media, quiz')
        .eq('id', topicId)
        .single()

      if (topic?.quiz) {
        return NextResponse.json({ questions: topic.quiz })
      }
      if (topic) {
        topicName = topic.name
        theory = topic.theory
        formulas = topic.formulas
        examples = topic.examples
        media = topic.media || []
      }
    }

    // Дополнительно достаём текст из прикреплённых файлов темы (докладов,
    // презентаций, конспектов) — квиз можно собрать и по ним, не только
    // по полю "теория".
    let filesText = ''
    if (admin && media.length) {
      const extractable = media
        .filter(m => EXTRACTABLE_EXT.includes(fileExt(m.name)))
        .slice(0, MAX_FILES)

      for (const item of extractable) {
        const path = extractStoragePath(item.url, BUCKET)
        if (!path) continue
        const { data: blob, error } = await admin.storage.from(BUCKET).download(path)
        if (error || !blob) continue
        const buffer = Buffer.from(await blob.arrayBuffer())
        const text = await extractTextFromFile(buffer, fileExt(item.name))
        if (text) filesText += `\n\n[Файл: ${item.name}]\n${text}`
      }
    }

    const content = [
      topicName && `Тема: ${topicName}`,
      theory && `Теория: ${theory?.slice(0, 800)}`,
      formulas && `Формулы: ${formulas?.slice(0, 300)}`,
      examples && `Примеры: ${examples?.slice(0, 300)}`,
      filesText && `Материалы из файлов темы:${filesText}`,
    ].filter(Boolean).join('\n\n')

    if (!content) {
      return NextResponse.json({ error: 'Недостаточно материала для квиза' }, { status: 400 })
    }

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
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1536,
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

    if (admin) {
      await admin.from('topics').update({ quiz: questions }).eq('id', topicId)
    }

    return NextResponse.json({ questions })

  } catch (err: any) {
    console.error('Quiz API error:', err) // Только на сервере
    return NextResponse.json({ error: 'Ошибка генерации вопросов' }, { status: 500 })
  }
}
