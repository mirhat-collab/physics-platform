import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-token'
import { extractStoragePath } from '@/lib/file-protect'

const BUCKET = 'topic-media'

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin.from('topics').select('*')
    if (error) throw error
    return NextResponse.json({ topics: data })
  } catch (err) {
    console.error('Admin topics GET error:', err)
    return NextResponse.json({ error: 'Не удалось получить темы' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const body = await req.json().catch(() => null)
    if (!body?.name) return NextResponse.json({ error: 'Не указано название темы' }, { status: 400 })
    const admin = createSupabaseAdmin()
    const { error } = await admin.from('topics').insert(body)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Admin topics POST error:', err)
    return NextResponse.json({ error: 'Не удалось создать тему' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const body = await req.json().catch(() => null)
    if (!body?.id) return NextResponse.json({ error: 'Не указан id темы' }, { status: 400 })
    const { id, ...fields } = body
    const admin = createSupabaseAdmin()
    // Материал темы изменился — сбрасываем закэшированный квиз, чтобы он
    // перегенерировался под новый контент при следующем открытии темы.
    const { error } = await admin.from('topics').update({ ...fields, quiz: null }).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Admin topics PATCH error:', err)
    return NextResponse.json({ error: 'Не удалось обновить тему' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Не указан id темы' }, { status: 400 })
    const admin = createSupabaseAdmin()

    // Забираем медиа темы, чтобы не оставлять висячие файлы в Storage.
    const { data: topic } = await admin.from('topics').select('media').eq('id', id).single()
    const paths = (topic?.media || [])
      .map((m: { url: string }) => extractStoragePath(m.url, BUCKET))
      .filter((p: string | null): p is string => !!p)
    if (paths.length) await admin.storage.from(BUCKET).remove(paths)

    const { error } = await admin.from('topics').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Admin topics DELETE error:', err)
    return NextResponse.json({ error: 'Не удалось удалить тему' }, { status: 500 })
  }
}
