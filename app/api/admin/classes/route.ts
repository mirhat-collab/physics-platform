import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

// Пишем в classes только отсюда, через service role: RLS на classes
// разрешает authenticated только чтение, запись — не пропустит, поэтому
// admin-панель (после проверки profiles.role === 'admin') идёт сюда.
export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin.from('classes').select('*')
    if (error) throw error
    return NextResponse.json({ classes: data })
  } catch (err) {
    console.error('Admin classes GET error:', err)
    return NextResponse.json({ error: 'Не удалось получить классы' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const body = await req.json().catch(() => null)
    if (!body?.name) return NextResponse.json({ error: 'Не указано название класса' }, { status: 400 })
    const admin = createSupabaseAdmin()
    const { error } = await admin.from('classes').insert({
      name: body.name,
      program: body.program ?? '',
      total_topics: body.total_topics ?? 0,
    })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Admin classes POST error:', err)
    return NextResponse.json({ error: 'Не удалось создать класс' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const body = await req.json().catch(() => null)
    if (!body?.id) return NextResponse.json({ error: 'Не указан id класса' }, { status: 400 })
    const { id, ...fields } = body
    const admin = createSupabaseAdmin()
    const { error } = await admin.from('classes').update(fields).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Admin classes PATCH error:', err)
    return NextResponse.json({ error: 'Не удалось обновить класс' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Не указан id класса' }, { status: 400 })
    const admin = createSupabaseAdmin()
    const { error } = await admin.from('classes').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Admin classes DELETE error:', err)
    return NextResponse.json({ error: 'Не удалось удалить класс' }, { status: 500 })
  }
}
