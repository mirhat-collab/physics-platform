import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getLocale } from '@/lib/i18n/server'
import { aiErrorResponse } from '@/lib/ai'
import { translateShort } from '@/lib/translate'

export const maxDuration = 120

// Перевод коротких строк для списков: названия тем и описания классов.
const SOURCES = {
  topic: { table: 'topics', column: 'name' },
  class: { table: 'classes', column: 'program' },
} as const

export async function POST(req: NextRequest) {
  const locale = await getLocale()
  if (locale === 'ru') return NextResponse.json({ names: {} })

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Войди в аккаунт' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const kind = body?.kind as keyof typeof SOURCES
  const ids: number[] = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isInteger).slice(0, 300) : []
  if (!SOURCES[kind]) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  if (!ids.length) return NextResponse.json({ names: {} })

  // Тексты берём из базы под правами пользователя, а не из запроса
  const src = SOURCES[kind]
  const { data } = await supabase.from(src.table).select(`id, ${src.column}`).in('id', ids)
  const items = ((data || []) as unknown as Record<string, unknown>[])
    .map(r => ({ id: Number(r.id), text: String(r[src.column] ?? '') }))
    .filter(r => r.text)

  try {
    const names = await translateShort(`${kind}_name`, items, locale)
    return NextResponse.json({ names })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
