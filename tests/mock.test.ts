import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ENT_SUBJECTS, MOCK, MOCK_MAX, mockLevel, mockPoints, type EntQuestion, type EntSubject } from '@/lib/ent'
import { MOCK_THEORY, buildMock, mockPlan } from '@/lib/mock-build'
import { ENT_SPEC, specSections } from '@/lib/ent-spec'
import { mockResult, mockSummary, type MockAttempt } from '@/lib/mock-result'
import { generateFromTemplate, topicKinds } from '@/lib/templates'

const SUBJECTS = Object.keys(ENT_SUBJECTS) as EntSubject[]

test('пробный ЕНТ: 30 заданий по 1 баллу и 10 по 2', () => {
  const pts = Array.from({ length: MOCK.count }, (_, i) => mockPoints(i))
  assert.equal(pts.filter(p => p === 1).length, 30)
  assert.equal(pts.filter(p => p === 2).length, 10)
  assert.equal(MOCK.minutes, 240)
})

const isTheoryQ = (q: EntQuestion) => q.options.every(o => !/\d/.test(o))

test('пробный ЕНТ: собранный вариант — количество, уровни, теория только среди простых', () => {
  for (const s of SUBJECTS) {
    let theoryTotal = 0
    const RUNS = 15
    for (let run = 0; run < RUNS; run++) {
      const plan = mockPlan(s)
      assert.equal(plan.length, MOCK.count)
      const qs = buildMock(s, run % 3 === 0 ? 'kk' : 'ru')
      assert.equal(qs.length, MOCK.count)
      assert.equal(new Set(qs.map(q => q.question)).size, MOCK.count, `${s}: повтор условия`)
      qs.forEach((q, i) => {
        const n = mockLevel(i) === 'C' ? 5 : 4
        assert.equal(q.options.length, n, `${s} №${i + 1}: вариантов ${q.options.length}`)
        assert.equal(new Set(q.options).size, n)
        assert.ok(q.correct >= 0 && q.correct < n)
        assert.ok(q.topic && q.section, `${s} №${i + 1}: нет темы`)
        if (mockPoints(i) === 2) assert.ok(!isTheoryQ(q), `${s} №${i + 1} (2 балла) — теория: ${q.question}`)
      })
      // Теория — только на местах A и не больше MOCK_THEORY
      const theoryAt = qs.map((q, i) => (isTheoryQ(q) ? i : -1)).filter(i => i >= 0)
      assert.ok(plan.filter(x => x.kind === 'theory').length <= MOCK_THEORY)
      plan.forEach((x, i) => { if (x.kind === 'theory') assert.equal(mockLevel(i), 'A') })
      // Уровень C — из тем со сложными задачами
      plan.forEach((x, i) => { if (mockLevel(i) === 'C') assert.ok(topicKinds(s, x.topic).hard, `${s}: «${x.topic}» на уровне C без сложных задач`) })
      theoryTotal += theoryAt.length
    }
    // Вопросы без чисел в ответах (теория и качественные задачи) — в среднем немного
    assert.ok(theoryTotal / RUNS <= MOCK_THEORY + 1.5, `${s}: в среднем ${theoryTotal / RUNS}`)
  }
})

test('тренажёр: теория выпадает нечасто', () => {
  let theory = 0, total = 0
  for (const sec of ENT_SUBJECTS.physics.sections) for (const topic of sec.topics) {
    for (let k = 0; k < 20; k++) {
      const g = generateFromTemplate('physics', topic, 4, 'ru', 'ent')
      if (!g) continue
      total++
      if (g.options.every(o => !/\d/.test(o))) theory++
    }
  }
  assert.ok(theory / total < 0.25, `теории ${Math.round((theory / total) * 100)}%`)
})

function fake(subject: EntSubject, topics: string[]): EntQuestion[] {
  return topics.map(topic => ({ question: topic, options: ['a', 'b', 'c', 'd'], correct: 0, solution: '', topic }))
}

test('итог пробного ЕНТ: баллы и разделы спецификации', () => {
  for (const s of SUBJECTS) {
    const qs = fake(s, mockPlan(s).map(x => x.topic))
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
