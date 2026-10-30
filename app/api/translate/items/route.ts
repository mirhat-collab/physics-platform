import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getLocale } from '@/lib/i18n/server'
import { aiErrorResponse } from '@/lib/ai'
import { translateFields } from '@/lib/translate'

export const maxDuration = 120

// Перевод домашних заданий и справочника ЕНТ — их пишут люди
const SOURCES = {
  homework: { table: 'homework', columns: ['title', 'description'] },
  material: { table: 'ent_materials', columns: ['title', 'body'] },
} as const

export async function POST(req: NextRequest) {
  const locale = await getLocale()
  if (locale === 'ru') return NextResponse.json({ items: {} })

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Войди в аккаунт' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const kind = body?.kind as keyof typeof SOURCES
  const ids: number[] = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isInteger).slice(0, 50) : []
  if (!SOURCES[kind]) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  if (!ids.length) return NextResponse.json({ items: {} })

  // Тексты берём из базы под правами пользователя, а не из запроса
  const src = SOURCES[kind]
  const { data } = await supabase.from(src.table).select(['id', ...src.columns].join(', ')).in('id', ids)
  const rows = (data || []) as unknown as Record<string, unknown>[]

  try {
    const items: Record<number, Record<string, string>> = {}
    // Пачками по 4, чтобы не упереться в лимиты бесплатного ИИ
    for (let i = 0; i < rows.length; i += 4) {
      await Promise.all(rows.slice(i, i + 4).map(async row => {
        const fields = Object.fromEntries(src.columns.map(c => [c, String(row[c] ?? '')]))
        items[Number(row.id)] = await translateFields(kind, Number(row.id), locale, fields)
      }))
    }
    return NextResponse.json({ items })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
