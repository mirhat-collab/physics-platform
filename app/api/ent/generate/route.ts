import { NextRequest, NextResponse } from 'next/server'
import { aiErrorResponse, chat, checkAiQuota, parseJsonObject } from '@/lib/ai'
import { createSupabaseServer } from '@/lib/supabase-server'
import { ENT_BATCH, ENT_DIFFICULTIES, ENT_SUBJECTS, type EntDifficulty, type EntQuestion, type EntSubject } from '@/lib/ent'

export const maxDuration = 120

// Доля заданий из банка, если в банке есть подходящие (остальные — от ИИ)
const BANK_SHARE = 0.5

const SYSTEM = `Ты — опытный составитель заданий ЕНТ (Единое национальное тестирование, Казахстан) по физике и математике.
Составляй оригинальные задания на русском языке в стиле ЕНТ: чёткое условие, числовые данные, однозначный ответ.

Правила:
- Сначала реши задачу сам и запиши краткое решение в поле "solution", и только потом составь варианты ответа.
- Ровно один вариант правильный. Неправильные варианты правдоподобные — это ответы, которые получаются при типичных ошибках (перепутанная формула, потерянный множитель, ошибка в единицах, знаке).
- Варианты не повторяются и записаны в одном формате (с единицами измерения, если они нужны).
- Числа подбирай так, чтобы ответ считался без калькулятора.
- Для физики используй g = 10 м/с², если не сказано иное.
- Формулы и выражения пиши в LaTeX внутри знаков доллара: $v = \\frac{s}{t}$. Обычный текст — без LaTeX.
- Задания в одном наборе разные по идее, не повторяй одну задачу с другими числами.

Отвечай ТОЛЬКО JSON-объектом такого вида, без пояснений:
{"questions":[{"section":"раздел","question":"условие","solution":"краткое решение","options":["…","…"],"correct":0}]}
"correct" — индекс правильного варианта, с нуля. "section" — точное название раздела из запроса, к которому относится задание.`

function shuffleOptions(q: EntQuestion): EntQuestion {
  const order = q.options.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]]
  }
  return { ...q, options: order.map(i => q.options[i]), correct: order.indexOf(q.correct) }
}

function isValid(q: EntQuestion): boolean {
  return !!q.question && Array.isArray(q.options) && q.options.length >= 2 &&
    q.options.every(o => typeof o === 'string' && o.trim()) &&
    Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length &&
    new Set(q.options).size === q.options.length
}

// Случайные задания из банка, которые ученик ещё не видел в этом тесте
async function pickFromBank(subject: EntSubject, section: string, difficulty: EntDifficulty, n: number, exclude: number[]): Promise<EntQuestion[]> {
  if (n <= 0) return []
  const supabase = await createSupabaseServer()
  let query = supabase.from('ent_bank').select('id').eq('subject', subject).eq('difficulty', difficulty).limit(2000)
  if (section !== 'all') query = query.eq('section', section)
  const { data: ids } = await query
  const pool = (ids || []).map(r => r.id as number).filter(id => !exclude.includes(id))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const chosen = pool.slice(0, n)
  if (!chosen.length) return []
  const { data: rows } = await supabase.from('ent_bank').select('id, section, question, options, correct, solution').in('id', chosen)
  return (rows || [])
    .map(r => ({ question: r.question, options: r.options, correct: r.correct, solution: r.solution || '', section: r.section || undefined, bankId: r.id }))
    .filter(isValid)
}

async function generateWithAi(subject: EntSubject, section: string, difficulty: EntDifficulty, n: number): Promise<EntQuestion[]> {
  const optionsCount = ENT_DIFFICULTIES[difficulty].options
  const sections = ENT_SUBJECTS[subject].sections
  // В режиме «вперемешку» каждый раз берём случайные разделы, чтобы порции не повторялись
  const topic = section === 'all'
    ? `разделы: ${[...sections].sort(() => Math.random() - 0.5).slice(0, n).join(', ')} — по одному заданию на раздел`
    : `раздел «${section}»`
  const level = difficulty === 'ent'
    ? 'уровень реального ЕНТ: от простых заданий в одно действие до сложных в 3-4 действия'
    : 'выше уровня ЕНТ: комбинированные задачи в несколько действий, нестандартные идеи, уровень вступительных экзаменов и областных олимпиад'

  const text = await chat([
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: `Составь ${n} заданий по предмету «${ENT_SUBJECTS[subject].label}».
Тема: ${topic}.
Сложность: ${level}.
В каждом задании ровно ${optionsCount} вариантов ответа.`,
    },
  ], { json: true, maxTokens: 6000 })

  const parsed = parseJsonObject<{ questions: EntQuestion[] }>(text)
  return (parsed.questions || [])
    .map(q => ({
      question: String(q.question || ''),
      options: (q.options || []).map(String),
      correct: Number(q.correct),
      solution: String(q.solution || ''),
      section: section !== 'all' ? section : sections.includes(String(q.section)) ? String(q.section) : undefined,
    }))
    .filter(isValid)
    .slice(0, n)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const subject = body?.subject as EntSubject
  const difficulty = body?.difficulty as EntDifficulty
  const section = body?.section as string
  const count = Number(body?.count)
  const exclude: number[] = Array.isArray(body?.exclude) ? body.exclude.filter(Number.isInteger).slice(0, 200) : []

  if (!ENT_SUBJECTS[subject] || !ENT_DIFFICULTIES[difficulty] || !(count >= 1 && count <= ENT_BATCH)) {
    return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  }
  if (section !== 'all' && !ENT_SUBJECTS[subject].sections.includes(section)) {
    return NextResponse.json({ error: 'Неизвестный раздел' }, { status: 400 })
  }

  // Каждое задание с вероятностью BANK_SHARE берём из банка (если там что-то есть)
  let wantBank = 0
  for (let i = 0; i < count; i++) if (Math.random() < BANK_SHARE) wantBank++
  const fromBank = await pickFromBank(subject, section, difficulty, wantBank, exclude)
  const aiCount = count - fromBank.length

  let fromAi: EntQuestion[] = []
  if (aiCount > 0) {
    const quotaError = await checkAiQuota('ent_generate')
    if (quotaError) {
      // Лимит ИИ кончился, но задания из банка всё равно отдаём
      if (fromBank.length) return NextResponse.json({ questions: fromBank.map(shuffleOptions) })
      return quotaError
    }
    try {
      fromAi = await generateWithAi(subject, section, difficulty, aiCount)
    } catch (err) {
      if (fromBank.length) return NextResponse.json({ questions: fromBank.map(shuffleOptions) })
      return aiErrorResponse(err)
    }
  }

  const questions = [...fromBank, ...fromAi].sort(() => Math.random() - 0.5).map(shuffleOptions)
  if (!questions.length) {
    return NextResponse.json({ error: 'ИИ вернул пустой набор, попробуй ещё раз' }, { status: 502 })
  }
  return NextResponse.json({ questions })
}
