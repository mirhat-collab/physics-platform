import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

const BUCKET = 'topic-media'

// Загрузка файлов темы только отсюда, через service role — у бакета
// topic-media больше нет публичной политики на запись напрямую с anon-ключа.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const form = await req.formData().catch(() => null)
    const file = form?.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const path = `topics/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const admin = createSupabaseAdmin()
    const { error } = await admin.storage.from(BUCKET).upload(path, file)
    if (error) throw error

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path)
    const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'file'
    return NextResponse.json({ url: urlData.publicUrl, type, name: file.name })
  } catch (err) {
    console.error('Admin upload error:', err)
    return NextResponse.json({ error: 'Не удалось загрузить файл' }, { status: 500 })
  }
}

// Удаление файла из бакета, когда его убирают из темы в админке —
// иначе объекты в Storage копятся без дела навсегда.
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const path = new URL(req.url).searchParams.get('path')
    if (!path || !path.startsWith('topics/')) {
      return NextResponse.json({ error: 'Некорректный путь к файлу' }, { status: 400 })
    }
    const admin = createSupabaseAdmin()
    const { error } = await admin.storage.from(BUCKET).remove([path])
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Admin upload delete error:', err)
    return NextResponse.json({ error: 'Не удалось удалить файл' }, { status: 500 })
  }
}
