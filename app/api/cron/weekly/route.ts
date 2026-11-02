import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { cronAllowed, esc, sendTelegram, siteLink } from '@/lib/telegram'

export const maxDuration = 60
const DAY = 24 * 60 * 60 * 1000

type Answer = { user_id: string; correct: boolean; section: string | null; created_at: string }

// Каждое воскресенье: родителям — короткий отчёт по каждому ребёнку за неделю
export async function GET(req: NextRequest) {
  if (!cronAllowed(req)) return NextResponse.json({ error: 'forbidden' }, { status: 401 })
  const admin = createSupabaseAdmin()
  const since = new Date(Date.now() - 7 * DAY).toISOString()

  const { data: links } = await admin.from('telegram_links').select('user_id, chat_id')
  if (!links?.length) return NextResponse.json({ sent: 0 })
  const { data: pl } = await admin.from('parent_links').select('parent_id, student_id').in('parent_id', links.map(l => l.user_id))
  if (!pl?.length) return NextResponse.json({ sent: 0 })
  const kids = [...new Set(pl.map(x => x.student_id))]

  const [{ data: profiles }, { data: answers }, { data: mocks }] = await Promise.all([
    admin.from('profiles').select('id, full_name, streak').in('id', kids),
    admin.from('answer_log').select('user_id, correct, section, created_at').in('user_id', kids).gte('created_at', since).limit(20000),
    admin.from('ent_attempts').select('user_id, score, max_score, created_at').in('user_id', kids).not('score', 'is', null).order('created_at', { ascending: false }).limit(500),
  ])

  function report(id: string): string {
    const p = profiles?.find(x => x.id === id)
    const a = ((answers || []) as Answer[]).filter(x => x.user_id === id)
    const name = esc(p?.full_name || 'Ученик')
    if (!a.length) return `<b>${name}</b>\nНа этой неделе не занимался(ась). Небольшое напоминание от вас может помочь.`
    const days = new Set(a.map(x => new Date(new Date(x.created_at).getTime() + 5 * 3600_000).toISOString().slice(0, 10))).size
    const acc = Math.round((a.filter(x => x.correct).length / a.length) * 100)
    const bySec = new Map<string, { n: number; ok: number }>()
    for (const x of a) {
      if (!x.section) continue
      const s = bySec.get(x.section) || { n: 0, ok: 0 }
      s.n++; if (x.correct) s.ok++
      bySec.set(x.section, s)
    }
    const weak = [...bySec.entries()].filter(([, s]) => s.n >= 3).sort((x, y) => x[1].ok / x[1].n - y[1].ok / y[1].n)[0]
    const mock = mocks?.find(m => m.user_id === id)
    return [
      `<b>${name}</b>`,
      `Занимался(ась) дней: <b>${days} из 7</b>`,
      `Решено заданий: <b>${a.length}</b>, верно <b>${acc}%</b>`,
      weak ? `Слабая тема: ${esc(weak[0])} (${Math.round((weak[1].ok / weak[1].n) * 100)}%)` : '',
      mock ? `Последний пробный ЕНТ: <b>${mock.score} из ${mock.max_score}</b>` : '',
      p?.streak ? `Серия: ${p.streak} дн.` : '',
    ].filter(Boolean).join('\n')
  }

  let sent = 0
  for (const l of links) {
    const mine = pl.filter(x => x.parent_id === l.user_id).map(x => x.student_id)
    if (!mine.length) continue
    const text = `Отчёт Mirha_Edu за неделю\n\n${mine.map(report).join('\n\n')}`
    if (await sendTelegram(l.chat_id, text, { text: 'Подробнее на сайте', url: siteLink('/parent') })) sent++
  }
  return NextResponse.json({ sent })
}
