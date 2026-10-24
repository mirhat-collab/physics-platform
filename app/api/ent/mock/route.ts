import { NextRequest, NextResponse } from 'next/server'
import { ENT_SUBJECTS, type EntSubject } from '@/lib/ent'
import { buildMock } from '@/lib/mock-build'
import { getLocale } from '@/lib/i18n/server'

// Вариант пробного ЕНТ целиком: только задачи по шаблонам — быстро,
// без лимита ИИ и всегда с верным ответом
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const subject = body?.subject as EntSubject
  if (!ENT_SUBJECTS[subject]) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  try {
    return NextResponse.json({ questions: buildMock(subject, await getLocale()) })
  } catch (err) {
    console.error('mock build:', err)
    return NextResponse.json({ error: 'Не удалось подготовить задания, попробуй ещё раз' }, { status: 502 })
  }
}
