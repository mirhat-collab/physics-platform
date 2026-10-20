import { NextRequest, NextResponse } from 'next/server'
import { AI_MODEL, aiErrorResponse, checkAiQuota, getAnthropic, textOf } from '@/lib/ai'
import { ENT_COUNTS, ENT_DIFFICULTIES, ENT_SUBJECTS, type EntDifficulty, type EntQuestion, type EntSubject } from '@/lib/ent'

export const maxDuration = 180

const SYSTEM = `Ты — опытный составитель заданий ЕНТ (Единое национальное тестирование, Казахстан) по физике и математике.
Составляй оригинальные задания на русском языке в стиле ЕНТ: чёткое условие, числовые данные, однозначный ответ.

Правила:
- Сначала реши задачу сам и запиши краткое решение в поле "solution", и только потом составь варианты ответа.
- Ровно один вариант правильный. Неправильные варианты правдоподобные — это ответы, которые получаются при типичных ошибках (перепутанная формула, потерянный множитель, ошибка в единицах, знаке).
- Варианты не повторяются и записаны в одном формате (с единицами измерения, если они нужны).
- Числа подбирай так, чтобы ответ считался без калькулятора.
- Для физики используй g = 10 м/с², если не сказано иное.
- Формулы и выражения пиши в LaTeX внутри знаков доллара: $v = \\frac{s}{t}$. Обычный текст — без LaTeX.
- Задания в одном наборе разные по идее, не повторяй одну задачу с другими числами.`

const SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'Условие задачи' },
          solution: { type: 'string', description: 'Краткое решение, 2-6 шагов' },
          options: { type: 'array', items: { type: 'string' }, description: 'Варианты ответа' },
          correct: { type: 'integer', description: 'Индекс правильного варианта, с нуля' },
        },
        required: ['question', 'solution', 'options', 'correct'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
}

function shuffleOptions(q: EntQuestion): EntQuestion {
  const order = q.options.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]]
  }
  return { ...q, options: order.map(i => q.options[i]), correct: order.indexOf(q.correct) }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const subject = body?.subject as EntSubject
  const difficulty = body?.difficulty as EntDifficulty
  const section = body?.section as string
  const count = Number(body?.count)

  if (!ENT_SUBJECTS[subject] || !ENT_DIFFICULTIES[difficulty] || !ENT_COUNTS.includes(count as 5 | 10)) {
    return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  }
  if (section !== 'all' && !ENT_SUBJECTS[subject].sections.includes(section)) {
    return NextResponse.json({ error: 'Неизвестный раздел' }, { status: 400 })
  }

  const quotaError = await checkAiQuota('ent_generate')
  if (quotaError) return quotaError

  const optionsCount = ENT_DIFFICULTIES[difficulty].options
  const topic = section === 'all'
    ? `разные разделы школьного курса (${ENT_SUBJECTS[subject].sections.join(', ')}) — по одному-два задания на раздел`
    : `раздел «${section}»`
  const level = difficulty === 'ent'
    ? 'уровень реального ЕНТ: от простых заданий в одно действие до сложных в 3-4 действия'
    : 'выше уровня ЕНТ: комбинированные задачи в несколько действий, нестандартные идеи, уровень вступительных экзаменов и областных олимпиад'

  try {
    const stream = getAnthropic().messages.stream({
      model: AI_MODEL,
      max_tokens: 32000,
      system: SYSTEM,
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: SCHEMA },
      },
      messages: [{
        role: 'user',
        content: `Составь ${count} заданий по предмету «${ENT_SUBJECTS[subject].label}».
Тема: ${topic}.
Сложность: ${level}.
В каждом задании ровно ${optionsCount} вариантов ответа.`,
      }],
    })
    const message = await stream.finalMessage()

    if (message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') {
      return NextResponse.json({ error: 'ИИ не смог составить задания, попробуй ещё раз' }, { status: 502 })
    }

    const parsed = JSON.parse(textOf(message)) as { questions: EntQuestion[] }
    const questions = parsed.questions
      .filter(q =>
        q.question && Array.isArray(q.options) && q.options.length >= 2 &&
        Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length &&
        new Set(q.options).size === q.options.length,
      )
      .map(shuffleOptions)

    if (!questions.length) {
      return NextResponse.json({ error: 'ИИ вернул пустой набор, попробуй ещё раз' }, { status: 502 })
    }
    return NextResponse.json({ questions })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
