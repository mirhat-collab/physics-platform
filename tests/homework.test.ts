import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hwHref, hwProgress, type EntHomework } from '@/lib/ent-homework'

test('ДЗ из тренажёра: считаются только ответы по темам задания после выдачи', () => {
  const hw: EntHomework = { subject: 'physics', topics: ['Сила Архимеда', 'Маятники'], count: 3 }
  const since = '2026-10-20T10:00:00Z'
  const rows = [
    { subject: 'physics', topic: 'Сила Архимеда', correct: true, created_at: '2026-10-21T10:00:00Z' },
    { subject: 'physics', topic: 'Маятники', correct: false, created_at: '2026-10-21T11:00:00Z' },
    { subject: 'physics', topic: 'Сила Архимеда', correct: true, created_at: '2026-10-19T10:00:00Z' }, // до выдачи
    { subject: 'physics', topic: 'Линзы и зеркала. Оптические приборы', correct: true, created_at: '2026-10-21T10:00:00Z' }, // не та тема
    { subject: 'math', topic: 'Маятники', correct: true, created_at: '2026-10-21T10:00:00Z' }, // не тот предмет
  ]
  const p = hwProgress(rows, hw, since)
  assert.deepEqual(p, { solved: 2, correct: 1, done: false, accuracy: 0.5 })
  const p2 = hwProgress([...rows, { subject: 'physics', topic: 'Маятники', correct: true, created_at: '2026-10-22T10:00:00Z' }], hw, since)
  assert.equal(p2.done, true)
  assert.equal(hwHref(hw), '/ent?subject=physics&topic=%D0%A1%D0%B8%D0%BB%D0%B0%20%D0%90%D1%80%D1%85%D0%B8%D0%BC%D0%B5%D0%B4%D0%B0&topic=%D0%9C%D0%B0%D1%8F%D1%82%D0%BD%D0%B8%D0%BA%D0%B8')
})
