import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ENT_DIFFICULTIES, ENT_BATCH, ENT_SUBJECTS, MOCK, MOCK_MAX, mockBatches, mockLevel, mockPlan, mockPoints, mockRequest, type EntQuestion, type EntSubject } from '@/lib/ent'
import { ENT_SPEC, specSections } from '@/lib/ent-spec'
import { mockResult, mockSummary, type MockAttempt } from '@/lib/mock-result'
import { HARD_SHARE, generateFromTemplate } from '@/lib/templates'

const SUBJECTS = Object.keys(ENT_SUBJECTS) as EntSubject[]

test('пробный ЕНТ: 30 заданий по 1 баллу и 10 по 2', () => {
  const pts = Array.from({ length: MOCK.count }, (_, i) => mockPoints(i))
  assert.equal(pts.filter(p => p === 1).length, 30)
  assert.equal(pts.filter(p => p === 2).length, 10)
  assert.equal(MOCK.minutes, 240)
})

test('пробный ЕНТ: порции к генератору — 40 заданий, уровни и баллы не смешиваются', () => {
  for (const s of SUBJECTS) {
    for (let run = 0; run < 20; run++) {
      const plan = mockPlan(s)
      const batches = mockBatches(plan)
      assert.deepEqual(batches.flatMap(b => b.topics), plan)
      let i = 0
      for (const b of batches) {
        assert.ok(b.topics.length >= 1 && b.topics.length <= ENT_BATCH)
        const idx = b.topics.map(() => i++)
        assert.ok(idx.every(k => mockLevel(k) === b.level), 'уровень внутри порции один')
        assert.ok(idx.every(k => mockPoints(k) === mockPoints(idx[0])), 'цена внутри порции одна')
      }
      const count = (l: string) => batches.filter(b => b.level === l).reduce((n, b) => n + b.topics.length, 0)
      assert.deepEqual([count('A'), count('B'), count('C')], [20, 12, 8])
    }
  }
  // Уровень A — без сложных шаблонов, C — с пятью вариантами
  assert.equal(HARD_SHARE[mockRequest('A').base ? 'base' : 'ent'], 0)
  assert.equal(ENT_DIFFICULTIES[mockRequest('B').difficulty].options, 4)
  assert.equal(ENT_DIFFICULTIES[mockRequest('C').difficulty].options, 5)
})

test('пробный ЕНТ: по каждой теме плана генерируется корректное задание', () => {
  for (const s of SUBJECTS) {
    for (let run = 0; run < 5; run++) {
      const plan = mockPlan(s)
      plan.forEach((topic, i) => {
        const { difficulty, base } = mockRequest(mockLevel(i))
        const n = ENT_DIFFICULTIES[difficulty].options
        const g = generateFromTemplate(s, topic, n, 'ru', base ? 'base' : difficulty)
        assert.ok(g, `${s}: нет шаблона для «${topic}»`)
        assert.equal(g.options.length, n, `${s} «${topic}»: вариантов ${g.options.length}`)
        assert.equal(new Set(g.options).size, n, `${s} «${topic}»: повтор вариантов`)
        assert.ok(g.correct >= 0 && g.correct < n)
      })
    }
  }
})

function fake(subject: EntSubject, topics: string[]): EntQuestion[] {
  return topics.map(topic => ({ question: topic, options: ['a', 'b', 'c', 'd'], correct: 0, solution: '', topic }))
}

test('итог пробного ЕНТ: баллы и разделы спецификации', () => {
  for (const s of SUBJECTS) {
    const qs = fake(s, mockPlan(s))
    const all = mockResult(s, qs, qs.map(() => 0))
    assert.equal(all.score, MOCK_MAX)
    assert.equal(all.max, MOCK_MAX)
    assert.equal(all.correct, 40)
    assert.equal(Object.values(all.sections).reduce((n, [, m]) => n + m, 0), MOCK_MAX)
    assert.deepEqual(Object.keys(all.sections), specSections(s))
    assert.ok(!('—' in all.sections), 'все темы попали в разделы спецификации')
    for (const name of specSections(s)) assert.ok(all.sections[name][1] > 0, `${s}: раздел «${name}» без заданий`)

    // Последние 10 (по 2 балла) неверны, ещё 2 без ответа
    const ans = qs.map((_, i) => (i >= MOCK.hardFrom ? 1 : i < 2 ? null : 0))
    const r = mockResult(s, qs, ans)
    assert.equal(r.score, 28)
    assert.equal(r.correct, 28)
    assert.equal(r.answered, 38)
    const lostTopics = Object.values(r.wrongTopics).flat()
    for (let i = MOCK.hardFrom; i < 40; i++) assert.ok(lostTopics.includes(qs[i].topic!))
  }
})

test('статистика пробных ЕНТ: последний, лучший, средний, разделы', () => {
  const sec = ENT_SPEC.physics.map(x => x.section)
  const a = (score: number, day: number, details: MockAttempt['details']): MockAttempt =>
    ({ subject: 'physics', score, max_score: 50, correct: score, total: 40, details, created_at: `2026-10-${String(day).padStart(2, '0')}T10:00:00Z` })
  const list = [
    a(30, 3, { [sec[0]]: [6, 10], [sec[5]]: [2, 8] }),
    a(20, 1, { [sec[0]]: [4, 10], [sec[5]]: [6, 8] }),
    { ...a(0, 2, null), score: null, correct: 25 }, // попытка до миграции
    { ...a(45, 4, null), subject: 'math' },
  ]
  const s = mockSummary(list, 'physics')!
  assert.equal(s.count, 3)
  assert.deepEqual(s.history.map(h => h.score), [20, 25, 30])
  assert.equal(s.last, 30)
  assert.equal(s.best, 30)
  assert.equal(s.avg, 25)
  assert.equal(s.delta, 5)
  assert.equal(s.max, 50)
  assert.deepEqual(s.sections.map(x => [x.name, x.pct]), [[sec[0], 0.5], [sec[5], 0.5]])
  assert.equal(mockSummary(list, 'math')!.count, 1)
  assert.equal(mockSummary([], 'physics'), null)
})
