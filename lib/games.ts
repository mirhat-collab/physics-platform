// Блиц и дуэль (на сервере: нужны шаблоны заданий).
//
// Задания собираются из шаблонов по номеру (seed): один и тот же номер даёт
// один и тот же набор заданий, поэтому в дуэли у соперников задачи общие.
// Верные ответы клиент не получает: он присылает свои ответы и подписанный
// сервером билет игры, а сервер пересобирает задания по номеру и считает
// баллы сам. Так результат в рейтинге нельзя подделать.
import { createHmac, randomInt, timingSafeEqual } from 'crypto'
import { ENT_SUBJECTS, type EntSubject } from './ent'
import { generateFromTemplate, topicKinds } from './templates'
import { withSeed } from './seeded'
import type { Locale } from './i18n'

export type GameKind = 'blitz' | 'duel'
export const GAME = {
  blitz: { count: 40, seconds: 180 },
  duel: { count: 10, seconds: 600 },
} as const

export type GameTask = { question: string; options: string[]; correct: number; solution: string; topic: string; figure?: string }

// Темы с расчётными задачами (теорию в блиц не берём — её легко угадать)
const topicCache = new Map<EntSubject, string[]>()
function calcTopics(subject: EntSubject): string[] {
  let list = topicCache.get(subject)
  if (!list) {
    list = ENT_SUBJECTS[subject].sections.flatMap(s => s.topics).filter(t => topicKinds(subject, t).calc)
    topicCache.set(subject, list)
  }
  return list
}

// Набор заданий по номеру. Простые задачи (уровень A): в блице важна скорость.
export function gameTasks(subject: EntSubject, seed: number, count: number, locale: Locale): GameTask[] {
  const topics = calcTopics(subject)
  return withSeed(seed, () => {
    const out: GameTask[] = []
    const seen = new Set<string>()
    for (let attempt = 0; out.length < count && attempt < count * 6; attempt++) {
      const topic = topics[Math.floor(Math.random() * topics.length)]
      const g = generateFromTemplate(subject, topic, 4, locale, 'base', 'calc')
      if (!g || g.options.length !== 4 || seen.has(g.question)) continue
      seen.add(g.question)
      const order = [0, 1, 2, 3]
      for (let i = 3; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]] }
      out.push({ question: g.question, options: order.map(i => g.options[i]), correct: order.indexOf(g.correct), solution: g.solution, topic, ...(g.figure ? { figure: g.figure } : {}) })
    }
    return out
  })
}

// Задания для клиента — без верных ответов и решений
export const publicTasks = (tasks: GameTask[]) => tasks.map(({ question, options, topic, figure }) => ({ question, options, topic, ...(figure ? { figure } : {}) }))

export function newSeed(): number {
  return randomInt(1, 2_000_000_000)
}

const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function newDuelCode(): string {
  return Array.from({ length: 6 }, () => CODE_ABC[randomInt(0, CODE_ABC.length)]).join('')
}

// ---------- Билет игры ----------
export type Ticket = { kind: GameKind; subject: EntSubject; seed: number; locale: Locale; start: number; user: string; code?: string }

function secret(): string {
  const s = process.env.GAME_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('Не задан секрет для игр (GAME_SECRET или SUPABASE_SERVICE_ROLE_KEY)')
  return s
}
const sign = (body: string, key = secret()) => createHmac('sha256', key).update(body).digest('base64url')

export function makeTicket(t: Ticket, key?: string): string {
  const body = Buffer.from(JSON.stringify(t)).toString('base64url')
  return `${body}.${sign(body, key)}`
}

export function readTicket(token: unknown, key?: string): Ticket | null {
  if (typeof token !== 'string' || token.length > 2000) return null
  const [body, mac] = token.split('.')
  if (!body || !mac) return null
  const expected = Buffer.from(sign(body, key)), got = Buffer.from(mac)
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()) as Ticket } catch { return null }
}

// ---------- Подсчёт ----------
export type GameReview = { question: string; options: string[]; correct: number; chosen: number | null; solution: string; figure?: string; topic: string }

// answers[i] — номер выбранного варианта или null (пропуск/не дошёл)
export function scoreGame(tasks: GameTask[], answers: unknown): { score: number; answered: number; review: GameReview[] } {
  const list = Array.isArray(answers) ? answers.slice(0, tasks.length) : []
  let score = 0, answered = 0
  const review = tasks.map((t, i) => {
    const a = list[i]
    const chosen = Number.isInteger(a) && a >= 0 && a < t.options.length ? (a as number) : null
    if (chosen !== null) { answered++; if (chosen === t.correct) score++ }
    return { question: t.question, options: t.options, correct: t.correct, chosen, solution: t.solution, topic: t.topic, ...(t.figure ? { figure: t.figure } : {}) }
  })
  return { score, answered, review }
}

// Время игры: блиц не дольше лимита (с запасом на сеть), дуэль — до часа
export function elapsedOk(t: Ticket, now = Date.now()): { ok: boolean; ms: number } {
  const ms = now - t.start
  const limit = t.kind === 'blitz' ? (GAME.blitz.seconds + 20) * 1000 : 3600_000
  return { ok: ms >= 0 && ms <= limit, ms: Math.min(ms, t.kind === 'blitz' ? GAME.blitz.seconds * 1000 : ms) }
}

// Имя для рейтинга: только имя (первое слово), без фамилии и почты
export function publicName(fullName: string | null | undefined, displayName?: string | null): string {
  const n = (displayName || fullName || '').trim().split(/\s+/)[0]
  return n ? n.slice(0, 20) : 'Ученик'
}
