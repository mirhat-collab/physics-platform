import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { cronAllowed, esc, sendTelegram, siteLink } from '@/lib/telegram'
import { kzDate } from '@/lib/streak'

export const maxDuration = 60

// Каждый вечер (19:00 по Казахстану): тем, кто сегодня не заходил,
// напоминаем про серию дней и про задачи на повтор. Остальных не беспокоим.
export async function GET(req: NextRequest) {
  if (!cronAllowed(req)) return NextResponse.json({ error: 'forbidden' }, { status: 401 })
  const admin = createSupabaseAdmin()
  const today = kzDate(), yesterday = kzDate(1)

  const { data: links } = await admin.from('telegram_links').select('user_id, chat_id')
  if (!links?.length) return NextResponse.json({ sent: 0 })
  const ids = links.map(l => l.user_id)
  const [{ data: profiles }, { data: due }] = await Promise.all([
    admin.from('profiles').select('id, full_name, role, streak, last_visit').in('id', ids),
    admin.from('review_queue').select('user_id').in('user_id', ids).eq('done', false).lte('due_at', new Date().toISOString()),
  ])
  const dueBy = new Map<string, number>()
  for (const r of due || []) dueBy.set(r.user_id, (dueBy.get(r.user_id) || 0) + 1)

  let sent = 0
  for (const l of links) {
    const p = profiles?.find(x => x.id === l.user_id)
    if (!p || (p.role && p.role !== 'student') || p.last_visit === today) continue
    const streakAlive = p.last_visit === yesterday && (p.streak || 0) > 0
    const n = dueBy.get(l.user_id) || 0
    if (!streakAlive && !n) continue
    const hi = p.full_name ? `${esc(p.full_name.split(' ')[0])}, ` : ''
    const lines = [
      streakAlive ? `${hi}серия <b>${p.streak} дн.</b> сгорит в полночь! Реши одну задачу — и она продолжится.` : `${hi}пора немного позаниматься.`,
      n ? `На повтор ждут задачи: <b>${n}</b>.` : '',
    ].filter(Boolean)
    const ok = await sendTelegram(l.chat_id, lines.join('\n'), n ? { text: 'Повторить ошибки', url: siteLink('/review') } : { text: 'Задача дня', url: siteLink('/daily') })
    if (ok) sent++
  }
  return NextResponse.json({ sent })
}
