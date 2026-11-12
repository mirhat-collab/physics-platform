import { NextRequest, NextResponse } from 'next/server'
import { ENT_SUBJECTS, sectionNames, topicsOf, type EntSubject } from '@/lib/ent'
import { numericTask, numericTopics } from '@/lib/solve-server'
import { getLocale } from '@/lib/i18n/server'

// «Решение задач»: темы, где ответ — число, и сами задачи (по шаблонам —
// быстро и без лимита ИИ)
export async function GET(req: NextRequest) {
  const subject = req.nextUrl.searchParams.get('subject') as EntSubject
  if (!ENT_SUBJECTS[subject]) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  return NextResponse.json({ topics: numericTopics(subject) }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const subject = body?.subject as EntSubject
  if (!ENT_SUBJECTS[subject]) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  const hard = body?.hard === true
  const available = numericTopics(subject)
  // Тема, раздел или всё вперемешку
  const section = typeof body?.section === 'string' && sectionNames(subject).includes(body.section) ? body.section : null
  const topics: string[] = Array.isArray(body?.topics) ? body.topics.map(String).filter((x: string) => available.includes(x)).slice(0, 200) : []
  const pool = topics.length ? topics : section ? topicsOf(subject, section).filter(x => available.includes(x)) : available
  if (!pool.length) return NextResponse.json({ error: 'По этой теме пока нет задач с ответом-числом' }, { status: 404 })
  const locale = await getLocale()
  for (let i = 0; i < 6; i++) {
    const topic = pool[Math.floor(Math.random() * pool.length)]
    const task = numericTask(subject, topic, locale, hard)
    if (task) return NextResponse.json({ task })
  }
  return NextResponse.json({ error: 'Не удалось подготовить задачу, попробуй ещё раз' }, { status: 502 })
}
