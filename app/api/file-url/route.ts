import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { extractStoragePath } from '@/lib/file-protect'

const BUCKET = 'topic-media'
// Для PDF/картинок/видео 180с хватало — страница берёт ссылку и сразу её использует.
// Но презентации и Word-файлы открываются через внешний вьюер (view.officeapps.live.com):
// он сам скачивает, конвертирует и кеширует документ, и на это у него нередко уходит
// больше 3 минут, особенно для больших файлов. Ссылка протухала прямо во время этого
// процесса, и вьюер показывал свою ошибку "не удалось открыть документ". Даём больше запаса.
const SIGNED_URL_TTL_SECONDS = 900

// Простой rate limit: не больше 300 запросов ссылок в час с одного IP
// (с одного IP сидит весь класс за школьным Wi-Fi, и каждый скачивает файлы справочника)
const requests = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const bucket = requests.get(ip)
  if (bucket && now < bucket.resetAt) {
    if (bucket.count >= 300) {
      return NextResponse.json({ error: 'Слишком много запросов. Попробуй позже.' }, { status: 429 })
    }
    bucket.count++
  } else {
    requests.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
  }

  try {
    // 1) Проверяем, что пользователь реально залогинен на сайте
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // 2) Получаем путь файла в бакете
    // material — файл справочника ЕНТ: его можно открыть напрямую или скачать
    // (download — имя, под которым браузер сохранит файл)
    const { path, material, download } = await req.json().catch(() => ({ path: null }))
    const asMaterial = material === true || typeof download === 'string'
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Не указан путь к файлу' }, { status: 400 })
    }

    // 3) Файл должен принадлежать теме, которую пользователю видно по RLS —
    //    иначе любой вошедший получил бы файлы закрытого класса (ЕНТ)
    //    Файлы справочника ЕНТ открыты всем вошедшим.
    const [{ data: topics }, { data: materials }] = await Promise.all([
      supabase.from('topics').select('media'),
      supabase.from('ent_materials').select('media'),
    ])
    const has = (rows: { media: unknown }[] | null) => (rows || []).some(t =>
      ((t.media || []) as { url: string }[]).some(m => extractStoragePath(m.url, BUCKET) === path)
    )
    // Скачивать можно только файлы справочника — файлы тем открываются в защищённом просмотрщике
    const allowed = asMaterial ? has(materials) : has(topics) || has(materials)
    if (!allowed) {
      return NextResponse.json({ error: 'Нет доступа к файлу' }, { status: 403 })
    }

    // 4) Генерируем короткоживущую подписанную ссылку через service role,
    //    работает даже если бакет приватный (без публичного доступа)
    const admin = createSupabaseAdmin()
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS, typeof download === 'string' ? { download: download.slice(0, 200) || true } : undefined)

    if (error || !data?.signedUrl) {
      console.error('Signed URL error:', error) // Логируем на сервере, не отдаём клиенту
      return NextResponse.json({ error: 'Не удалось получить файл' }, { status: 404 })
    }

    return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS })
  } catch (err) {
    console.error('File URL API error:', err) // Логируем на сервере, не отдаём клиенту
    return NextResponse.json({ error: 'Не удалось получить файл' }, { status: 500 })
  }
}
