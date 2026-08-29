import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

const BUCKET = 'topic-media'

// Файл больше не проходит телом через этот serverless-роут — у Vercel
// жёсткий лимит на размер запроса (4.5MB), в который не помещается
// презентация или видео. Вместо этого отдаём клиенту подписанную ссылку
// на загрузку (service role создаёт её даже для приватного бакета), и
// браузер грузит файл напрямую в Supabase Storage, минуя наш сервер.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const { name } = await req.json().catch(() => ({ name: null }))
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Не указано имя файла' }, { status: 400 })
    }

    const ext = name.split('.').pop()
    const path = `topics/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const admin = createSupabaseAdmin()
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
    if (error || !data) throw error || new Error('Не удалось создать подписанную ссылку')

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({ token: data.token, path, url: urlData.publicUrl })
  } catch (err) {
    console.error('Admin upload error:', err)
    return NextResponse.json({ error: 'Не удалось подготовить загрузку файла' }, { status: 500 })
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
