// «Подготовка к ЕНТ»: прогноз балла, что подтянуть до цели, план на день,
// серия дней занятий и недельная цель. Всё считается по журналу ответов
// (answer_log) и попыткам пробного ЕНТ — без отдельных таблиц.
import { MOCK_MAX, type EntSubject } from './ent'
import { ENT_SPEC, specSectionOf, specSections } from './ent-spec'
import { kzDate } from './streak'
import type { LogRow } from './stats'
import type { MockAttempt } from './mock-result'

const DAY = 24 * 60 * 60 * 1000
const KZ_OFFSET = 5 * 60 * 60 * 1000
const kzDay = (iso: string) => new Date(new Date(iso).getTime() + KZ_OFFSET).toISOString().slice(0, 10)

// Доля раздела в варианте ЕНТ — по числу тем спецификации
export function sectionWeights(subject: EntSubject): Record<string, number> {
  const spec = ENT_SPEC[subject], w: Record<string, number> = {}
  for (const st of spec) w[st.section] = (w[st.section] || 0) + 1 / spec.length
  return w
}

export type SectionAcc = { section: string; weight: number; accuracy: number; answers: number }

// Точность по разделам спецификации за последние 60 дней. Мало ответов —
// оценка тянется к 50% (сглаживание), чтобы три удачных ответа не давали 100%.
export function sectionAccuracy(rows: LogRow[], subject: EntSubject, now = Date.now()): SectionAcc[] {
  const since = now - 60 * DAY, w = sectionWeights(subject)
  const acc: Record<string, [number, number]> = {}
  for (const r of rows) {
    if (r.source !== 'ent' || r.subject !== subject || new Date(r.created_at).getTime() < since) continue
    const sec = specSectionOf(subject, r.topic)
    if (sec === '—') continue
    acc[sec] = acc[sec] || [0, 0]
    acc[sec][1]++
    if (r.correct) acc[sec][0]++
  }
  return specSections(subject).map(section => {
    const [c, n] = acc[section] || [0, 0]
    return { section, weight: w[section], accuracy: (c + 2) / (n + 4), answers: n }
  })
}

export type Forecast = {
  score: number // ожидаемый балл из MOCK_MAX
  confidence: 'low' | 'medium' | 'high'
  fromMocks: number | null // средний балл последних пробных
  answers: number // ответов в тренажёре за 60 дней
}

// Прогноз балла: последние пробные ЕНТ (до трёх) и точность в тренажёре по
// разделам с их долей в варианте. Пробный ЕНТ точнее — у него больший вес.
// Задания в тренажёре в среднем чуть легче ЕНТ, поэтому их оценка × 0,9.
export function forecast(rows: LogRow[], mocks: MockAttempt[], subject: EntSubject, now = Date.now()): Forecast | null {
  const secs = sectionAccuracy(rows, subject, now)
  const answers = secs.reduce((s, x) => s + x.answers, 0)
  const recent = mocks.filter(m => m.subject === subject)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3)
    .map(m => ((m.score ?? m.correct) / (m.max_score ?? m.total)) * MOCK_MAX)
  const fromMocks = recent.length ? recent.reduce((s, x) => s + x, 0) / recent.length : null
  if (fromMocks === null && answers < 20) return null
  const fromTrainer = MOCK_MAX * 0.9 * secs.reduce((s, x) => s + x.weight * x.accuracy, 0)
  const score = fromMocks === null ? fromTrainer : answers < 20 ? fromMocks : 0.65 * fromMocks + 0.35 * fromTrainer
  const confidence = recent.length >= 2 && answers >= 100 ? 'high' : recent.length >= 1 || answers >= 80 ? 'medium' : 'low'
  return { score: Math.round(Math.min(MOCK_MAX, score)), confidence, fromMocks: fromMocks === null ? null : Math.round(fromMocks), answers }
}

export type Gain = { section: string; points: number; accuracy: number }

// Где больше всего баллов до цели: доля раздела × (цель − точность)
export function gains(rows: LogRow[], subject: EntSubject, target: number, now = Date.now()): Gain[] {
  const goal = Math.min(0.98, target / MOCK_MAX / 0.9)
  return sectionAccuracy(rows, subject, now)
    .map(s => ({ section: s.section, accuracy: s.accuracy, points: Math.max(0, MOCK_MAX * s.weight * (goal - s.accuracy)) }))
    .filter(g => g.points >= 0.5)
    .sort((a, b) => b.points - a.points)
}

export type PlanItem = {
  kind: 'repeat' | 'weak' | 'new'
  topics: string[]
  count: number // сколько заданий решить
  done: number // сколько уже решено сегодня
}

// План на день (≈ 15 минут): повторить вчерашние и недавние ошибки, две
// слабые темы, одна тема, которую ещё не решали. Темы — темы тренажёра.
export function dailyPlan(rows: LogRow[], subject: EntSubject, now = Date.now()): PlanItem[] {
  const today = kzDate(0)
  const ent = rows.filter(r => r.source === 'ent' && r.subject === subject && r.topic)
  const todayRows = ent.filter(r => kzDay(r.created_at) === today)
  const doneIn = (topics: string[]) => todayRows.filter(r => topics.includes(r.topic!)).length
  const plan: PlanItem[] = []

  // Повторение: ошибки 1–7 дней назад (интервальное повторение — не в тот же день)
  const repeat = [...new Set(ent.filter(r => !r.correct && now - new Date(r.created_at).getTime() < 7 * DAY && kzDay(r.created_at) !== today).map(r => r.topic!))].slice(0, 4)
  if (repeat.length) plan.push({ kind: 'repeat', topics: repeat, count: 5, done: Math.min(5, doneIn(repeat)) })

  // Слабые темы: точность по темам за 30 дней, минимум 3 ответа
  const by: Record<string, [number, number]> = {}
  for (const r of ent) if (now - new Date(r.created_at).getTime() < 30 * DAY) {
    by[r.topic!] = by[r.topic!] || [0, 0]
    by[r.topic!][1]++
    if (r.correct) by[r.topic!][0]++
  }
  const weak = Object.entries(by).filter(([t, [, n]]) => n >= 3 && !repeat.includes(t))
    .map(([t, [c, n]]) => ({ t, a: c / n })).filter(x => x.a < 0.7).sort((a, b) => a.a - b.a).slice(0, 2)
  for (const w of weak) plan.push({ kind: 'weak', topics: [w.t], count: 5, done: Math.min(5, doneIn([w.t])) })

  // Новая тема — первая по порядку спецификации, которую ещё не решали
  const seen = new Set(ent.map(r => r.topic!))
  const fresh = ENT_SPEC[subject].flatMap(st => st.ours).find(t => !seen.has(t))
  if (fresh) plan.push({ kind: 'new', topics: [fresh], count: 5, done: Math.min(5, doneIn([fresh])) })
  return plan
}

// Серия дней подряд, в которые решено хотя бы одно задание (по времени Казахстана).
// Сегодня ещё можно успеть — серия не сгорает до конца дня.
export function practiceStreak(rows: LogRow[]): { days: number; today: boolean } {
  const days = new Set(rows.map(r => kzDay(r.created_at)))
  const today = days.has(kzDate(0))
  let n = 0
  for (let i = today ? 0 : 1; days.has(kzDate(i)); i++) n++
  return { days: n, today }
}

// Неделя с понедельника: решено заданий и активность по дням (пн..вс)
export function weekProgress(rows: LogRow[]): { solved: number; byDay: number[] } {
  const now = new Date(Date.now() + KZ_OFFSET)
  const dow = (now.getUTCDay() + 6) % 7 // 0 — понедельник
  const byDay = Array(7).fill(0)
  for (const r of rows) {
    const d = kzDay(r.created_at)
    for (let i = 0; i <= dow; i++) if (d === kzDate(dow - i)) byDay[i]++
  }
  return { solved: byDay.reduce((s, x) => s + x, 0), byDay }
}

export const WEEKLY_GOALS = [50, 100, 200, 300] as const
export const DEFAULT_GOALS = { target: { physics: 40, math: 40 } as Record<EntSubject, number>, weekly: 100 }
export type Goals = typeof DEFAULT_GOALS
