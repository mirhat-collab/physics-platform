import { NextRequest, NextResponse } from 'next/server'
import { ENT_SUBJECTS, type EntQuestion, type EntSubject } from '@/lib/ent'
import { generateFromTemplate } from '@/lib/templates'
import { getLocale } from '@/lib/i18n/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { kzDate } from '@/lib/streak'

// Задача дня: одна на день для всех (по предмету и языку). Первый, кто открыл
// страницу, «создаёт» задачу из шаблонов, остальные получают ту же.
function makeTask(subject: EntSubject, locale: 'ru' | 'kk'): EntQuestion | null {
  const all = ENT_SUBJECTS[subject].sections.flatMap(s => s.topics.map(topic => ({ section: s.name, topic })))
  for (let i = 0; i < 40; i++) {
    const pick = all[Math.floor(Math.random() * all.length)]
    const g = generateFromTemplate(subject, pick.topic, 4, locale, 'ent')
    if (g) return { ...g, section: pick.section, topic: pick.topic }
  }
  return null
}

export async function GET(req: NextRequest) {
  const subject = req.nextUrl.searchParams.get('subject') as EntSubject
  if (!ENT_SUBJECTS[subject]) return NextResponse.json({ error: 'Неверный предмет' }, { status: 400 })
  const locale = await getLocale()
  const day = kzDate()

  const supabase = await createSupabaseServer()
  const found = await supabase.from('daily_tasks').select('question').eq('day', day).eq('subject', subject).eq('locale', locale).maybeSingle()
  if (found.data) return NextResponse.json({ day, question: found.data.question })

  const q = makeTask(subject, locale)
  if (!q) return NextResponse.json({ error: 'Не удалось подготовить задачу' }, { status: 502 })
  try {
    const admin = createSupabaseAdmin()
    await admin.from('daily_tasks').upsert({ day, subject, locale, question: q }, { onConflict: 'day,subject,locale', ignoreDuplicates: true })
    // Если кто-то успел раньше — отдаём его задачу, чтобы у всех была одна
    const again = await admin.from('daily_tasks').select('question').eq('day', day).eq('subject', subject).eq('locale', locale).maybeSingle()
    if (again.data) return NextResponse.json({ day, question: again.data.question })
  } catch (err) {
    console.error('daily task store:', err)
  }
  return NextResponse.json({ day, question: q })
}
