import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { BOT_NAME, botReady } from '@/lib/telegram'

// Одноразовая ссылка t.me/<бот>?start=<код> — по ней бот узнаёт, чей это чат
export async function POST() {
  if (!botReady()) return NextResponse.json({ error: 'Бот ещё не настроен' }, { status: 503 })
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Нужно войти' }, { status: 401 })

  const code = randomBytes(12).toString('hex')
  const admin = createSupabaseAdmin()
  await admin.from('telegram_link_codes').delete().eq('user_id', user.id)
  const { error } = await admin.from('telegram_link_codes').insert({ code, user_id: user.id })
  if (error) return NextResponse.json({ error: 'Не получилось, попробуй ещё раз' }, { status: 500 })
  return NextResponse.json({ url: `https://t.me/${BOT_NAME}?start=${code}` })
}
