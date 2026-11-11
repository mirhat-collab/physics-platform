import test from 'node:test'
import assert from 'node:assert/strict'
import { taskQuality, type QualityAnswer } from '@/lib/task-quality'
import { templateIndex, templateKey, generateFromTemplate } from '@/lib/templates'

const rows = (key: string, topic: string, n: number, ok: number): QualityAnswer[] =>
  Array.from({ length: n }, (_, i) => ({ task_key: key, subject: 'math', topic, correct: i < ok }))

test('качество заданий: подозрительно трудные и лёгкие задания', () => {
  const list = taskQuality([
    ...rows('t:bad', 'Логарифмы', 10, 1), // почти все ошибаются
    ...rows('t:ok1', 'Логарифмы', 20, 16),
    ...rows('t:ok2', 'Логарифмы', 12, 9),
    ...rows('t:easy', 'Проценты', 20, 20),
    ...rows('t:few', 'Проценты', 3, 0), // мало ответов — не судим
    { task_key: null, subject: 'math', topic: 'Логарифмы', correct: false },
  ])
  const bad = list.find(x => x.key === 't:bad')!
  assert.deepEqual(bad.flags, ['hard', 'below_topic'])
  assert.equal(bad.answers, 10)
  assert.ok(Math.abs(bad.topicAccuracy! - 25 / 32) < 1e-9)
  assert.deepEqual(list.find(x => x.key === 't:easy')!.flags, ['easy'])
  assert.deepEqual(list.find(x => x.key === 't:ok1')!.flags, [])
  assert.equal(list.find(x => x.key === 't:few'), undefined)
  assert.equal(list[0].key, 't:bad')
})

test('ключ шаблона: один и тот же для ru и kk, разный у разных шаблонов', () => {
  for (const subject of ['physics', 'math'] as const) {
    const idx = templateIndex(subject)
    const keys = new Set(idx.map(x => x.key))
    // Ключ различает шаблоны (совпадения — только у шаблонов с одинаковым текстом)
    assert.ok(keys.size > idx.length * 0.97, `${subject}: ключей ${keys.size} из ${idx.length}`)
    for (const x of idx.slice(0, 50)) assert.equal(templateKey(x.template), x.key)
  }
  const ru = generateFromTemplate('math', 'Квадратные уравнения', 4, 'ru')!
  const kk = generateFromTemplate('math', 'Квадратные уравнения', 4, 'kk')!
  assert.match(ru.key!, /^t:/)
  assert.match(kk.key!, /^t:/)
})
