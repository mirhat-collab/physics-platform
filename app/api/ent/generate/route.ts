import { NextRequest, NextResponse } from 'next/server'
import { chat, checkAiQuota, parseJsonObject } from '@/lib/ai'
import { createSupabaseServer } from '@/lib/supabase-server'
import {
  ENT_BATCH, ENT_DIFFICULTIES, ENT_SUBJECTS, sectionNames, sectionOfTopic, topicsOf,
  type EntDifficulty, type EntQuestion, type EntSubject,
} from '@/lib/ent'
import { generateFromTemplate } from '@/lib/templates'
import { AI_LANGUAGE, type Locale } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n/server'
import { translateFields } from '@/lib/translate'

export const maxDuration = 120

// Откуда берём задание. Шаблоны бесплатны и всегда верны, банк — готовые задачи
// учителей, ИИ — для разнообразия (у бесплатного ИИ общий дневной лимит).
const SHARE: Record<EntDifficulty, { template: number; bank: number }> = {
  ent: { template: 0.5, bank: 0.25 }, // остальное — ИИ
  hard: { template: 0.2, bank: 0.2 },
}

const SYSTEM = `Ты — опытный составитель заданий ЕНТ (Единое национальное тестирование, Казахстан) по физике и математике.
Составляй оригинальные задания в стиле ЕНТ: чёткое условие, числовые данные, однозначный ответ.

Правила:
- Сначала реши задачу сам и запиши краткое решение в поле "solution", и только потом составь варианты ответа.
- Ровно один вариант правильный. Неправильные варианты правдоподобные — это ответы, которые получаются при типичных ошибках (перепутанная формула, потерянный множитель, ошибка в единицах, знаке).
- Варианты не повторяются и записаны в одном формате (с единицами измерения, если они нужны).
- Числа подбирай так, чтобы ответ считался без калькулятора.
- Для физики используй g = 10 м/с², если не сказано иное.
- Формулы и выражения пиши в LaTeX внутри знаков доллара: $v = \\frac{s}{t}$. Обычный текст — без LaTeX.
- Задания в одном наборе разные по идее, не повторяй одну задачу с другими числами.

Отвечай ТОЛЬКО JSON-объектом такого вида, без пояснений:
{"questions":[{"topic":"тема","question":"условие","solution":"краткое решение","options":["…","…"],"correct":0}]}
"correct" — индекс правильного варианта, с нуля. "topic" — точное название темы из запроса.`

type Slot = { section: string; topic: string; q?: EntQuestion }
type BankRow = { id: number; section: string | null; topic: string | null; question: string; options: string[]; correct: number; solution: string | null }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shuffleOptions(q: EntQuestion): EntQuestion {
  const order = shuffle(q.options.map((_, i) => i))
  return { ...q, options: order.map(i => q.options[i]), correct: order.indexOf(q.correct) }
}

function isValid(q: EntQuestion): boolean {
  return !!q.question && Array.isArray(q.options) && q.options.length >= 2 &&
    q.options.every(o => typeof o === 'string' && o.trim()) &&
    Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length &&
    new Set(q.options).size === q.options.length
}

// Какие темы будут в этой порции. Если ученик выбрал несколько тем,
// раскладываем их по кругу в случайном порядке, чтобы ни одна не потерялась.
function planSlots(subject: EntSubject, section: string, topics: string[], count: number): Slot[] {
  const slots: Slot[] = []
  let deck: string[] = []
  for (let i = 0; i < count; i++) {
    if (topics.length) {
      if (!deck.length) deck = shuffle(topics)
      const topic = deck.pop()!
      slots.push({ section: sectionOfTopic(subject, topic)!, topic })
    } else {
      const sec = section !== 'all' ? section : shuffle(sectionNames(subject))[0]
      slots.push({ section: sec, topic: shuffle(topicsOf(subject, sec))[0] })
    }
  }
  return slots
}

function fromTemplate(subject: EntSubject, slot: Slot, nOptions: number, locale: Locale): EntQuestion | null {
  const g = generateFromTemplate(subject, slot.topic, nOptions, locale)
  return g ? { ...g, section: slot.section, topic: slot.topic } : null
}

async function loadBank(subject: EntSubject, sections: string[], difficulty: EntDifficulty, exclude: number[]): Promise<BankRow[]> {
  const supabase = await createSupabaseServer()
  let query = supabase.from('ent_bank').select('id, section, topic, question, options, correct, solution')
    .eq('subject', subject).eq('difficulty', difficulty).limit(500)
  if (sections.length) query = query.in('section', sections)
  const { data } = await query
  return shuffle(((data || []) as BankRow[]).filter(r => !exclude.includes(r.id)))
}

async function fillWithAi(subject: EntSubject, difficulty: EntDifficulty, slots: Slot[], locale: Locale): Promise<void> {
  const optionsCount = ENT_DIFFICULTIES[difficulty].options
  const level = difficulty === 'ent'
    ? 'уровень реального ЕНТ: от простых заданий в одно действие до сложных в 3-4 действия'
    : 'выше уровня ЕНТ: комбинированные задачи в несколько действий, нестандартные идеи, уровень вступительных экзаменов и областных олимпиад'
  const text = await chat([
    // Язык заданий — язык интерфейса ученика; поле topic оставляем русским
    { role: 'system', content: `${SYSTEM}\nЯзык условий, решений и вариантов ответа — ${AI_LANGUAGE[locale]}. Поле "topic" пиши точно как в запросе (по-русски).` },
    {
      role: 'user',
      content: `Составь ${slots.length} заданий по предмету «${ENT_SUBJECTS[subject].label}», по одному на каждую тему:
${slots.map((s, i) => `${i + 1}. ${s.topic}`).join('\n')}
Сложность: ${level}.
В каждом задании ровно ${optionsCount} вариантов ответа.`,
    },
  ], { json: true, maxTokens: 6000 })

  const parsed = parseJsonObject<{ questions: (EntQuestion & { topic?: string })[] }>(text)
  const list = (parsed.questions || [])
    .map(q => ({ question: String(q.question || ''), options: (q.options || []).map(String), correct: Number(q.correct), solution: String(q.solution || ''), topic: String(q.topic || '') }))
    .filter(isValid)
  // Раскладываем ответы ИИ по слотам: сначала по совпадению темы, потом по порядку
  const free = slots.filter(s => !s.q)
  for (const q of list) {
    const slot = free.find(s => !s.q && s.topic === q.topic) || free.find(s => !s.q)
    if (slot) slot.q = { ...q, section: slot.section, topic: slot.topic }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const subject = body?.subject as EntSubject
  const difficulty = body?.difficulty as EntDifficulty
  const section = String(body?.section ?? 'all')
  const topic = String(body?.topic ?? 'all')
  // Несколько тем сразу (можно из разных разделов); старый параметр topic — одна тема
  const topics: string[] = Array.isArray(body?.topics)
    ? [...new Set(body.topics.map(String) as string[])].slice(0, 200)
    : topic !== 'all' ? [topic] : []
  const count = Number(body?.count)
  const exclude: number[] = Array.isArray(body?.exclude) ? body.exclude.filter(Number.isInteger).slice(0, 200) : []

  if (!ENT_SUBJECTS[subject] || !ENT_DIFFICULTIES[difficulty] || !(count >= 1 && count <= ENT_BATCH)) {
    return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  }
  if (section !== 'all' && !sectionNames(subject).includes(section)) {
    return NextResponse.json({ error: 'Неизвестный раздел' }, { status: 400 })
  }
  if (topics.some(t => !sectionOfTopic(subject, t))) {
    return NextResponse.json({ error: 'Неизвестная тема' }, { status: 400 })
  }

  const locale = await getLocale()
  const nOptions = ENT_DIFFICULTIES[difficulty].options
  const share = SHARE[difficulty]
  const slots = planSlots(subject, section, topics, count)
  const bankSections = topics.length ? [...new Set(slots.map(s => s.section))] : section !== 'all' ? [section] : []
  const bank = await loadBank(subject, bankSections, difficulty, exclude)
  const aiSlots: Slot[] = []

  for (const slot of slots) {
    const r = Math.random()
    if (r < share.template) {
      slot.q = fromTemplate(subject, slot, nOptions, locale) ?? undefined
    } else if (r < share.template + share.bank) {
      // Подходящая задача из банка: та же тема, а если тема не указана — тот же раздел
      const idx = bank.findIndex(b => b.topic ? b.topic === slot.topic : b.section === slot.section)
      if (idx >= 0) {
        const b = bank.splice(idx, 1)[0]
        slot.q = { question: b.question, options: b.options, correct: b.correct, solution: b.solution || '', section: slot.section, topic: slot.topic, bankId: b.id }
      }
    }
    if (!slot.q) aiSlots.push(slot)
  }

  if (aiSlots.length) {
    // Если лимит ИИ исчерпан или ИИ недоступен — молча добираем задачами по шаблонам
    const quota = await checkAiQuota('ent_generate')
    if (!quota.error) {
      try {
        await fillWithAi(subject, difficulty, aiSlots, locale)
        await quota.record()
      } catch (err) {
        console.error('ENT AI fallback to templates:', err)
      }
    }
    for (const slot of aiSlots) if (!slot.q) slot.q = fromTemplate(subject, slot, nOptions, locale) ?? undefined
  }

  if (locale !== 'ru') await localizeBank(slots, locale)

  const questions = slots.map(s => s.q).filter((q): q is EntQuestion => !!q && isValid(q)).map(shuffleOptions)
  if (!questions.length) {
    return NextResponse.json({ error: 'Не удалось подготовить задания, попробуй ещё раз' }, { status: 502 })
  }
  return NextResponse.json({ questions })
}

// Задачи из банка учителя пишут по-русски — переводим их через ИИ (один раз,
// перевод кэшируется по id задачи). Если ИИ недоступен, остаётся оригинал.
async function localizeBank(slots: Slot[], locale: Exclude<Locale, 'ru'>): Promise<void> {
  await Promise.all(slots.map(async slot => {
    const q = slot.q
    if (!q?.bankId) return
    const fields: Record<string, string> = { question: q.question, solution: q.solution || '' }
    q.options.forEach((o, i) => { fields[`o${i}`] = o })
    try {
      const tr = await translateFields('bank', q.bankId, locale, fields)
      slot.q = { ...q, question: tr.question ?? q.question, solution: tr.solution ?? q.solution, options: q.options.map((o, i) => tr[`o${i}`] ?? o) }
    } catch (err) {
      console.error('Bank translation failed:', err)
    }
  }))
}
