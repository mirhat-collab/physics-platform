import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { ENT_SUBJECTS, type EntSubject } from '@/lib/ent'
import { getLocale } from '@/lib/i18n/server'
import { GAME, elapsedOk, gameTasks, makeTicket, newDuelCode, newSeed, publicName, publicTasks, readTicket, scoreGame } from '@/lib/games'

export const maxDuration = 30
const DAY = 24 * 60 * 60 * 1000

async function currentUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Начало недели (понедельник) по времени Казахстана
function weekStart(now = Date.now()): string {
  const kz = new Date(now + 5 * 3600_000)
  const dow = (kz.getUTCDay() + 6) % 7
  const monday = Date.UTC(kz.getUTCFullYear(), kz.getUTCMonth(), kz.getUTCDate()) - dow * DAY
  return new Date(monday - 5 * 3600_000).toISOString()
}

// GET ?board=physics — рейтинг блица за неделю среди учеников того же класса
// GET ?duel=CODE — дуэль: предмет и результаты обоих
export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Войди в аккаунт' }, { status: 401 })
  const admin = createSupabaseAdmin()
  const board = req.nextUrl.searchParams.get('board') as EntSubject | null
  if (board && ENT_SUBJECTS[board]) {
    const { data: me } = await admin.from('profiles').select('grade').eq('id', user.id).maybeSingle()
    const { data: rows } = await admin.from('game_results').select('user_id, score, time_ms, created_at')
      .eq('kind', 'blitz').eq('subject', board).gte('created_at', weekStart()).order('score', { ascending: false }).limit(2000)
    const best = new Map<string, { score: number; time: number }>()
    for (const r of rows || []) {
      const b = best.get(r.user_id)
      if (!b || r.score > b.score) best.set(r.user_id, { score: r.score, time: r.time_ms })
    }
    const ids = [...best.keys()]
    const { data: profiles } = ids.length ? await admin.from('profiles').select('id, full_name, display_name, grade, role').in('id', ids) : { data: [] }
    const sameGrade = (g: string | null) => !me?.grade || g === me.grade
    const list = (profiles || []).filter(p => p.role === 'student' && sameGrade(p.grade)).map(p => ({ id: p.id, name: publicName(p.full_name, p.display_name), ...best.get(p.id)! }))
      .sort((a, b) => b.score - a.score || a.time - b.time)
    const { data: mine } = await admin.from('game_results').select('score').eq('user_id', user.id).eq('kind', 'blitz').eq('subject', board).order('score', { ascending: false }).limit(1)
    return NextResponse.json({
      grade: me?.grade || null,
      top: list.slice(0, 10).map((x, i) => ({ place: i + 1, name: x.name, score: x.score, me: x.id === user.id })),
      myPlace: list.findIndex(x => x.id === user.id) + 1 || null,
      record: mine?.[0]?.score ?? null,
    })
  }
  const code = req.nextUrl.searchParams.get('duel')?.toUpperCase()
  if (code && /^[A-Z0-9]{6}$/.test(code)) {
    const { data: duel } = await admin.from('duels').select('code, subject, creator, created_at').eq('code', code).maybeSingle()
    if (!duel) return NextResponse.json({ error: 'Дуэль не найдена' }, { status: 404 })
    const { data: results } = await admin.from('game_results').select('user_id, score, total, time_ms').eq('duel_code', code)
    const ids = (results || []).map(r => r.user_id)
    const { data: profiles } = ids.length ? await admin.from('profiles').select('id, full_name, display_name').in('id', ids) : { data: [] }
    return NextResponse.json({
      code, subject: duel.subject, mine: duel.creator === user.id,
      results: (results || []).map(r => {
        const p = profiles?.find(x => x.id === r.user_id)
        return { name: publicName(p?.full_name, p?.display_name), score: r.score, total: r.total, time: r.time_ms, me: r.user_id === user.id }
      }).sort((a, b) => b.score - a.score || a.time - b.time),
    })
  }
  return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
}

// POST { action: 'blitz', subject } — новая игра; { action: 'duel', subject } — создать дуэль;
// { action: 'play', code } — сыграть дуэль; { action: 'finish', ticket, answers } — сдать ответы
export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Войди в аккаунт, чтобы играть' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const action = String(body?.action ?? '')
  const admin = createSupabaseAdmin()
  const locale = await getLocale()

  if (action === 'blitz') {
    const subject = body?.subject as EntSubject
    if (!ENT_SUBJECTS[subject]) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
    const seed = newSeed()
    const tasks = gameTasks(subject, seed, GAME.blitz.count, locale)
    return NextResponse.json({ tasks: publicTasks(tasks), seconds: GAME.blitz.seconds, ticket: makeTicket({ kind: 'blitz', subject, seed, locale, start: Date.now(), user: user.id }) })
  }

  if (action === 'duel') {
    const subject = body?.subject as EntSubject
    if (!ENT_SUBJECTS[subject]) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
    for (let i = 0; i < 5; i++) {
      const code = newDuelCode()
      const { error } = await admin.from('duels').insert({ code, subject, seed: newSeed(), creator: user.id })
      if (!error) return NextResponse.json({ code })
    }
    return NextResponse.json({ error: 'Не удалось создать дуэль, попробуй ещё раз' }, { status: 500 })
  }

  if (action === 'play') {
    const code = String(body?.code ?? '').toUpperCase()
    const { data: duel } = await admin.from('duels').select('code, subject, seed').eq('code', code).maybeSingle()
    if (!duel) return NextResponse.json({ error: 'Дуэль не найдена' }, { status: 404 })
    const { data: done } = await admin.from('game_results').select('id').eq('duel_code', code).eq('user_id', user.id).maybeSingle()
    if (done) return NextResponse.json({ error: 'Ты уже сыграл эту дуэль' }, { status: 409 })
    const tasks = gameTasks(duel.subject, Number(duel.seed), GAME.duel.count, locale)
    return NextResponse.json({ tasks: publicTasks(tasks), seconds: null, ticket: makeTicket({ kind: 'duel', subject: duel.subject, seed: Number(duel.seed), locale, start: Date.now(), user: user.id, code }) })
  }

  if (action === 'finish') {
    const t = readTicket(body?.ticket)
    if (!t || t.user !== user.id) return NextResponse.json({ error: 'Игра не найдена, начни заново' }, { status: 400 })
    const time = elapsedOk(t)
    if (!time.ok) return NextResponse.json({ error: 'Время игры истекло' }, { status: 400 })
    const tasks = gameTasks(t.subject, t.seed, GAME[t.kind].count, t.locale)
    const { score, answered, review } = scoreGame(tasks, body?.answers)
    const row = { user_id: user.id, kind: t.kind, subject: t.subject, duel_code: t.code ?? null, score, total: t.kind === 'blitz' ? answered : tasks.length, time_ms: time.ms }
    const { error } = await admin.from('game_results').insert(row)
    if (error && t.kind === 'duel' && error.code === '23505') return NextResponse.json({ error: 'Ты уже сыграл эту дуэль' }, { status: 409 })
    if (error) console.error('game result:', error)
    // В статистику ученика и «Работу над ошибками» — как обычные ответы
    return NextResponse.json({ score, answered, total: tasks.length, time: time.ms, review })
  }

  return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
}
