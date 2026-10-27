// Сводка для вкладки «Статистика» в админке: пользователи, активность,
// решённые задания по дням, пробные ЕНТ и самые трудные темы.
// Дни — по времени Казахстана (UTC+5).

const DAY = 24 * 60 * 60 * 1000
const KZ_OFFSET = 5 * 60 * 60 * 1000
const kzDay = (t: number) => new Date(t + KZ_OFFSET).toISOString().slice(0, 10)

export type StatProfile = { id: string; role: string | null; full_name: string | null; email: string | null; grade: string | null; created_at: string }
export type StatAnswer = { user_id: string; subject: string | null; topic: string | null; correct: boolean; created_at: string }
export type StatMock = { user_id: string; subject: string; score: number | null; max_score: number | null; correct: number; total: number; created_at: string }

export type AdminStats = {
  roles: Record<string, number>
  newUsers: { d7: number; d30: number }
  active: { d1: number; d7: number; d30: number }
  answers: { d7: number; d30: number; accuracy30: number }
  byDay: { date: string; answers: number; users: number; signups: number }[] // 30 дней
  mocks: { total: number; d30: number; avg: number | null }
  hardTopics: { topic: string; subject: string | null; answers: number; accuracy: number }[]
  topStudents: { name: string; grade: string | null; answers: number; accuracy: number }[] // за 7 дней
}

export function adminStats(profiles: StatProfile[], answers: StatAnswer[], mocks: StatMock[], now = Date.now()): AdminStats {
  const since = (days: number) => now - days * DAY
  const at = (iso: string) => new Date(iso).getTime()

  const roles: Record<string, number> = {}
  for (const p of profiles) roles[p.role || 'student'] = (roles[p.role || 'student'] || 0) + 1

  const inLast = <T extends { created_at: string }>(rows: T[], days: number) => rows.filter(r => at(r.created_at) >= since(days))
  const usersIn = (days: number) => new Set(inLast(answers, days).map(a => a.user_id)).size
  const a30 = inLast(answers, 30)

  const days = Array.from({ length: 30 }, (_, i) => kzDay(now - (29 - i) * DAY))
  const byDay = days.map(date => {
    const rows = a30.filter(a => kzDay(at(a.created_at)) === date)
    return {
      date,
      answers: rows.length,
      users: new Set(rows.map(r => r.user_id)).size,
      signups: profiles.filter(p => kzDay(at(p.created_at)) === date).length,
    }
  })

  const m30 = inLast(mocks, 30)
  const pct = (m: StatMock) => (m.score ?? m.correct) / ((m.max_score ?? m.total) || 1)
  const avg = mocks.length ? Math.round((mocks.reduce((s, m) => s + pct(m), 0) / mocks.length) * 100) : null

  // Трудные темы: минимум 10 ответов за 30 дней, по возрастанию точности
  const byTopic = new Map<string, { subject: string | null; n: number; c: number }>()
  for (const a of a30) {
    if (!a.topic) continue
    const x = byTopic.get(a.topic) ?? { subject: a.subject, n: 0, c: 0 }
    x.n++
    if (a.correct) x.c++
    byTopic.set(a.topic, x)
  }
  const hardTopics = [...byTopic.entries()].filter(([, x]) => x.n >= 10)
    .map(([topic, x]) => ({ topic, subject: x.subject, answers: x.n, accuracy: x.c / x.n }))
    .sort((a, b) => a.accuracy - b.accuracy).slice(0, 8)

  const byUser = new Map<string, { n: number; c: number }>()
  for (const a of inLast(answers, 7)) {
    const x = byUser.get(a.user_id) ?? { n: 0, c: 0 }
    x.n++
    if (a.correct) x.c++
    byUser.set(a.user_id, x)
  }
  const prof = new Map(profiles.map(p => [p.id, p]))
  const topStudents = [...byUser.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 10).map(([id, x]) => {
    const p = prof.get(id)
    return { name: p?.full_name || p?.email || '—', grade: p?.grade ?? null, answers: x.n, accuracy: x.c / x.n }
  })

  return {
    roles,
    newUsers: { d7: inLast(profiles, 7).length, d30: inLast(profiles, 30).length },
    active: { d1: usersIn(1), d7: usersIn(7), d30: usersIn(30) },
    answers: { d7: inLast(answers, 7).length, d30: a30.length, accuracy30: a30.length ? a30.filter(a => a.correct).length / a30.length : 0 },
    byDay,
    mocks: { total: mocks.length, d30: m30.length, avg },
    hardTopics,
    topStudents,
  }
}
