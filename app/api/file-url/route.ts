import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

const BUCKET = 'topic-media'
// Ссылка живёт недолго — открыть/долистать документ хватает, а "утекшая"
// ссылка быстро перестаёт работать.
const SIGNED_URL_TTL_SECONDS = 180

// Простой rate limit: не больше 60 запросов ссылок в час с одного IP
const requests = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const bucket = requests.get(ip)
  if (bucket && now < bucket.resetAt) {
    if (bucket.count >= 60) {
      return NextResponse.json({ error: 'Слишком много запросов. Попробуй позже.' }, { status: 429 })
    }
    bucket.count++
  } else {
    requests.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
  }

  // 1) Проверяем, что пользователь реально залогинен на сайте
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  // 2) Получаем путь файла в бакете
  const { path } = await req.json().catch(() => ({ path: null }))
  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'Не указан путь к файлу' }, { status: 400 })
  }

  // 3) Генерируем короткоживущую подписанную ссылку через service role,
  //    работает даже если бакет приватный (без публичного доступа)
  const admin = createSupabaseAdmin()
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Не удалось получить файл' }, { status: 404 })
  }

  return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS })
}
