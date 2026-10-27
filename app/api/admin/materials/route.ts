import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { extractStoragePath } from '@/lib/file-protect'

const BUCKET = 'topic-media'
const SUBJECTS = ['physics', 'math', 'general']

type MediaItem = { url: string; type: string; name: string; size?: number }

// Поля материала из запроса: лишнее отбрасываем, чтобы через API нельзя
// было записать в таблицу что-то кроме самого материала
function pickFields(body: Record<string, unknown>) {
  const media = Array.isArray(body.media) ? (body.media as MediaItem[]).filter(m => m && typeof m.url === 'string' && /^https?:\/\//i.test(m.url)) : []
  return {
    subject: SUBJECTS.includes(String(body.subject)) ? String(body.subject) : 'general',
    title: String(body.title ?? '').trim().slice(0, 300),
    body: String(body.body ?? '').slice(0, 50000),
    media: media.map(m => ({
      url: m.url,
      type: ['image', 'video', 'file', 'link'].includes(m.type) ? m.type : 'file',
      name: String(m.name ?? '').slice(0, 300),
      ...(typeof m.size === 'number' ? { size: m.size } : {}),
    })),
  }
}

async function removeFiles(urls: string[]) {
  const paths = urls.map(u => extractStoragePath(u, BUCKET)).filter((p): p is string => !!p && p.startsWith('topics/'))
  if (paths.length) await createSupabaseAdmin().storage.from(BUCKET).remove(paths)
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  const body = await req.json().catch(() => null)
  const fields = body ? pickFields(body) : null
  if (!fields?.title) return NextResponse.json({ error: 'Укажи название материала' }, { status: 400 })
  const { error } = await createSupabaseAdmin().from('ent_materials').insert(fields)
  if (error) {
    console.error('Materials POST error:', error)
    return NextResponse.json({ error: 'Не удалось сохранить материал' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  const body = await req.json().catch(() => null)
  const id = Number(body?.id)
  const fields = body ? pickFields(body) : null
  if (!Number.isInteger(id) || !fields?.title) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data: old } = await admin.from('ent_materials').select('media').eq('id', id).single()
  const { error } = await admin.from('ent_materials').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) {
    console.error('Materials PATCH error:', error)
    return NextResponse.json({ error: 'Не удалось сохранить материал' }, { status: 500 })
  }
  // Файлы, которые убрали из материала, удаляем из Storage
  const kept = new Set(fields.media.map(m => m.url))
  await removeFiles(((old?.media || []) as MediaItem[]).map(m => m.url).filter(u => !kept.has(u))).catch(() => {})
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data: old } = await admin.from('ent_materials').select('media').eq('id', id).single()
  const { error } = await admin.from('ent_materials').delete().eq('id', id)
  if (error) {
    console.error('Materials DELETE error:', error)
    return NextResponse.json({ error: 'Не удалось удалить материал' }, { status: 500 })
  }
  await removeFiles(((old?.media || []) as MediaItem[]).map(m => m.url)).catch(() => {})
  return NextResponse.json({ ok: true })
}
