import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

// Роль учителя выдаёт только сервер: клиенту база менять роль не даёт
// (триггер protect_profile_role). Код учителя проверяем здесь же.
const attempts = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const attempt = attempts.get(ip)
  if (attempt && now < attempt.resetAt) {
    if (attempt.count >= 10) return NextResponse.json({ error: 'Слишком много попыток, подожди 15 минут' }, { status: 429 })
    attempt.count++
  } else {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
  }
  await new Promise(r => setTimeout(r, 200))

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Войди в аккаунт' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const code = String(body?.code ?? '')
  if (!process.env.TEACHER_PASSWORD || code !== process.env.TEACHER_PASSWORD) {
    return NextResponse.json({ error: 'Неверный код учителя' }, { status: 403 })
  }
  attempts.delete(ip)

  const admin = createSupabaseAdmin()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  // Админа в учителя не понижаем
  if (profile?.role === 'admin') return NextResponse.json({ ok: true })

  const { error } = await admin.from('profiles').update({ role: 'teacher', grade: 'Учитель' }).eq('id', user.id)
  if (error) return NextResponse.json({ error: 'Не удалось сохранить роль' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
