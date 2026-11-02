import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { esc, sendTelegram, siteLink } from '@/lib/telegram'

type Update = { message?: { chat: { id: number }; text?: string } }

// Сюда Telegram присылает сообщения боту.
// Telegram передаёт секрет в заголовке — чужие запросы отбрасываем.
export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const update = (await req.json().catch(() => ({}))) as Update
  const msg = update.message
  if (!msg?.text) return NextResponse.json({ ok: true })
  const chatId = msg.chat.id
  const text = msg.text.trim()
  const admin = createSupabaseAdmin()

  if (text.startsWith('/start')) {
    const code = text.split(/\s+/)[1] || ''
    if (!/^[a-f0-9]{24}$/.test(code)) {
      await sendTelegram(chatId, 'Привет! Чтобы получать напоминания, открой <b>Профиль</b> на сайте Mirha_Edu и нажми «Подключить Telegram».', { text: 'Открыть профиль', url: siteLink('/profile') })
      return NextResponse.json({ ok: true })
    }
    const { data: row } = await admin.from('telegram_link_codes').select('user_id, expires_at').eq('code', code).maybeSingle()
    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      await sendTelegram(chatId, 'Ссылка устарела. Открой профиль на сайте и нажми «Подключить Telegram» ещё раз.', { text: 'Открыть профиль', url: siteLink('/profile') })
      return NextResponse.json({ ok: true })
    }
    await admin.from('telegram_links').upsert({ user_id: row.user_id, chat_id: chatId }, { onConflict: 'user_id' })
    await admin.from('telegram_link_codes').delete().eq('code', code)
    const { data: p } = await admin.from('profiles').select('full_name, role').eq('id', row.user_id).maybeSingle()
    const name = p?.full_name ? `, ${esc(p.full_name)}` : ''
    const what = p?.role === 'parent'
      ? 'Каждое воскресенье буду присылать отчёт: сколько ребёнок занимался, какие темы слабые и какой прогноз балла.'
      : 'Буду напоминать вечером, если серия дней вот-вот сгорит или пора повторить ошибки.'
    await sendTelegram(chatId, `Готово${name}! Telegram подключён.\n\n${what}\n\nОтключить: /stop`)
    return NextResponse.json({ ok: true })
  }

  if (text === '/stop') {
    await admin.from('telegram_links').delete().eq('chat_id', chatId)
    await sendTelegram(chatId, 'Напоминания отключены. Включить снова можно в профиле на сайте.')
    return NextResponse.json({ ok: true })
  }

  await sendTelegram(chatId, 'Я присылаю напоминания и отчёты Mirha_Edu. Задачи решаются на сайте.', { text: 'Задача дня', url: siteLink('/daily') })
  return NextResponse.json({ ok: true })
}
