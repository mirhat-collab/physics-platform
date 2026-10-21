import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getLocale } from '@/lib/i18n/server'
import { aiErrorResponse } from '@/lib/ai'
import { translateFields } from '@/lib/translate'

export const maxDuration = 120

// Перевод темы (название, теория, примеры, задачи) на язык интерфейса.
// Формулы — это LaTeX, их не переводим. Результат кэшируется в базе.
export async function POST(req: NextRequest) {
  const locale = await getLocale()
  if (locale === 'ru') return NextResponse.json({ fields: null })

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Войди в аккаунт' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const topicId = Number(body?.topicId)
  if (!Number.isInteger(topicId)) return NextResponse.json({ error: 'Не указана тема' }, { status: 400 })

  // Читаем тему под правами ученика — закрытые темы RLS не отдаст
  const { data: topic } = await supabase.from('topics')
    .select('name, theory, examples, tasks').eq('id', topicId).maybeSingle()
  if (!topic) return NextResponse.json({ error: 'Тема не найдена' }, { status: 404 })

  try {
    const fields = await translateFields('topic', topicId, locale, {
      name: topic.name || '', theory: topic.theory || '', examples: topic.examples || '', tasks: topic.tasks || '',
    })
    return NextResponse.json({ fields })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
