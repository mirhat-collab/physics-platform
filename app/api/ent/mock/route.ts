import { NextRequest, NextResponse } from 'next/server'
import { ENT_SUBJECTS, type EntSubject } from '@/lib/ent'
import { buildMock } from '@/lib/mock-build'
import { getLocale } from '@/lib/i18n/server'
import { findVariant } from '@/lib/variants'

// Вариант пробного ЕНТ целиком: только задачи по шаблонам — быстро,
// без лимита ИИ и всегда с верным ответом. С variant — готовый вариант НЦТ.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const subject = body?.subject as EntSubject
  if (!ENT_SUBJECTS[subject]) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  if (body?.variant) {
    const v = findVariant(body.variant)
    if (!v || v.subject !== subject) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
    return NextResponse.json({ questions: v.questions })
  }
  try {
    return NextResponse.json({ questions: buildMock(subject, await getLocale()) })
  } catch (err) {
    console.error('mock build:', err)
    return NextResponse.json({ error: 'Не удалось подготовить задания, попробуй ещё раз' }, { status: 502 })
  }
}
