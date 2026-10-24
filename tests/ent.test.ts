import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ENT_SUBJECTS, MOCK, MOCK_MAX, mockLevel, mockPlan, mockPoints, sectionOfTopic, solutionHints, type EntSubject } from '@/lib/ent'
import { ENT_SPEC } from '@/lib/ent-spec'
import { contentFormat } from '@/lib/i18n/content'

const SUBJECTS = Object.keys(ENT_SUBJECTS) as EntSubject[]

test('пробный ЕНТ: 40 заданий, 50 баллов, трудность 50/30/20', () => {
  assert.equal(MOCK_MAX, 50)
  assert.equal(Array.from({ length: MOCK.count }, (_, i) => mockPoints(i)).reduce((a, b) => a + b, 0), MOCK_MAX)
  const levels = Array.from({ length: MOCK.count }, (_, i) => mockLevel(i))
  assert.deepEqual(['A', 'B', 'C'].map(l => levels.filter(x => x === l).length), [20, 12, 8])
})

test('спецификация НЦТ: все темы тренажёра распределены, вариант покрывает все темы спецификации', () => {
  for (const s of SUBJECTS) {
    const spec = ENT_SPEC[s]
    assert.equal(spec.length, s === 'physics' ? 25 : 18)
    const mapped = spec.flatMap(x => x.ours)
    for (const topic of mapped) assert.ok(sectionOfTopic(s, topic), `${s}: неизвестная тема «${topic}»`)
    for (const sec of ENT_SUBJECTS[s].sections) {
      for (const topic of sec.topics) assert.ok(mapped.includes(topic), `${s}: тема «${topic}» не привязана к спецификации`)
    }
    for (let run = 0; run < 20; run++) {
      const plan = mockPlan(s)
      assert.equal(plan.length, MOCK.count)
      for (const st of spec) assert.ok(plan.some(t => st.ours.includes(t)), `${s}: в варианте нет темы спецификации «${st.topic}»`)
    }
  }
})

test('подсказки не выдают ответ', () => {
  const hints = solutionHints('Скорости складываются: $t = \\frac{30 \\cdot 60}{90} = 20$ с.')
  assert.equal(hints.length, 1)
  assert.ok(!hints[0].includes('20$'), hints[0])
  assert.ok(hints[0].endsWith('\\ldots$'), hints[0])
  const multi = solutionHints('$x + y = 5$, $xy = 6$. Корни $2$ и $3$, сумма $5$.')
  assert.ok(multi.length >= 2)
  assert.deepEqual(solutionHints(''), [])
})

test('перевод: подстановки и падежи по шаблону', () => {
  assert.equal(contentFormat('ru', 'Масса ⟪0⟫ кг', [5]), 'Масса 5 кг')
  // Слово «алюминия» в атомной задаче ставится в нужный падеж
  const key = 'Сколько электронов в нейтральном атоме ⟪0⟫, если его порядковый номер ⟪1⟫?'
  assert.match(contentFormat('kk', key, ['алюминия', 13]), /алюминийдің бейтарап атомында/)
})
