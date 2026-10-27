import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dailyPlan, forecast, gains, practiceStreak, sectionWeights, weekProgress } from '@/lib/coach'
import { ENT_SPEC } from '@/lib/ent-spec'
import { kzDate } from '@/lib/streak'
import type { LogRow } from '@/lib/stats'
import type { MockAttempt } from '@/lib/mock-result'

const DAY = 24 * 60 * 60 * 1000
// Полдень по Казахстану daysAgo дней назад
const at = (daysAgo: number) => new Date(`${kzDate(daysAgo)}T07:00:00Z`).toISOString()
const row = (topic: string, correct: boolean, daysAgo = 0): LogRow => ({ source: 'ent', subject: 'physics', section: null, topic, correct, created_at: at(daysAgo) })
const topics = ENT_SPEC.physics.flatMap(st => st.ours)

test('доли разделов спецификации дают в сумме 1', () => {
  for (const s of ['physics', 'math'] as const) {
    const w = Object.values(sectionWeights(s)).reduce((a, b) => a + b, 0)
    assert.ok(Math.abs(w - 1) < 1e-9)
  }
})

test('прогноз: нет данных — нет прогноза; всё верно — высокий балл; пробные ЕНТ весят больше', () => {
  assert.equal(forecast([], [], 'physics'), null)
  const good = topics.flatMap(t => [row(t, true, 1), row(t, true, 2)])
  const f = forecast(good, [], 'physics')!
  assert.ok(f.score >= 38 && f.score <= 45, `всё верно → ${f.score}`)
  const bad = topics.flatMap(t => [row(t, false, 1), row(t, false, 2)])
  assert.ok(forecast(bad, [], 'physics')!.score <= 10)
  const mock: MockAttempt = { subject: 'physics', score: 20, max_score: 50, correct: 16, total: 40, details: null, created_at: at(1) }
  const mixed = forecast(good, [mock], 'physics')!
  assert.ok(mixed.score < f.score && mixed.score > 20, `пробный 20 + тренажёр → ${mixed.score}`)
  assert.equal(mixed.fromMocks, 20)
})

test('до цели: сначала разделы, где больше всего баллов', () => {
  const rows = [...topics.slice(0, 20).flatMap(t => [row(t, true), row(t, true), row(t, true)]),
    ...ENT_SPEC.physics.filter(st => st.section === 'Оптика').flatMap(st => st.ours).flatMap(t => [row(t, false), row(t, false), row(t, false), row(t, false)])]
  const g = gains(rows, 'physics', 45)
  assert.ok(g.length > 0)
  assert.ok(g.findIndex(x => x.section === 'Оптика') < g.findIndex(x => x.section === 'Механика') || !g.some(x => x.section === 'Механика'))
})

test('план на день: повторение вчерашних ошибок, слабые темы, новая тема; сделанное сегодня засчитывается', () => {
  const [a, b, c] = topics
  const rows = [row(a, false, 1), row(a, true, 3),
    row(b, false, 2), row(b, false, 3), row(b, true, 4),
    row(c, true, 1), row(c, true, 1), row(c, true, 1)]
  const plan = dailyPlan(rows, 'physics')
  assert.equal(plan[0].kind, 'repeat')
  assert.ok(plan[0].topics.includes(a) && plan[0].topics.includes(b))
  assert.ok(plan.some(p => p.kind === 'new' && !rows.some(r => r.topic === p.topics[0])))
  const today = [...rows, row(a, true), row(a, true), row(b, true)]
  assert.equal(dailyPlan(today, 'physics')[0].done, 3)
})

test('серия дней и неделя', () => {
  assert.deepEqual(practiceStreak([]), { days: 0, today: false })
  assert.deepEqual(practiceStreak([row('x', true, 1), row('x', true, 2), row('x', true, 4)]), { days: 2, today: false })
  assert.deepEqual(practiceStreak([row('x', true, 0), row('x', true, 1)]), { days: 2, today: true })
  const w = weekProgress([row('x', true, 0), row('x', false, 0), row('x', true, 30)])
  assert.equal(w.solved, 2)
  assert.equal(w.byDay.length, 7)
  assert.ok(Date.now() - new Date(at(0)).getTime() < DAY * 2)
})
