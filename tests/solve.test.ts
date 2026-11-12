import test from 'node:test'
import assert from 'node:assert/strict'
import { guidedSteps, isCorrectNumber, latexNumber, parseAnswer } from '@/lib/solve'
import { numericTask, numericTopics } from '@/lib/solve-server'

test('ввод ответа числом', () => {
  assert.equal(parseAnswer('2,5'), 2.5)
  assert.equal(parseAnswer(' -3 '), -3)
  assert.equal(parseAnswer('1/4'), 0.25)
  assert.equal(parseAnswer('1 200'), 1200)
  assert.equal(parseAnswer('abc'), null)
  assert.equal(parseAnswer(''), null)
  assert.ok(isCorrectNumber(7.2, 7.22))
  assert.ok(!isCorrectNumber(7, 7.22))
  assert.ok(isCorrectNumber(15, 15) && !isCorrectNumber(15.1, 15))
})

test('числа из LaTeX и шаги решения', () => {
  assert.equal(latexNumber('2{,}5'), 2.5)
  assert.equal(latexNumber('-\\frac{3}{4}'), -0.75)
  assert.equal(latexNumber('1{,}2 \\cdot 10^{5}'), 120000)
  assert.equal(latexNumber('x + 1'), null)
  const steps = guidedSteps('Путь — площадь трапеции: $\\frac{2 + 8}{2} \\cdot 4 = 20$ м. Средняя скорость $v = \\frac{20}{5} = 4$ м/с.')
  assert.equal(steps.length, 2)
  assert.equal(steps[0].value, 20)
  assert.equal(steps[1].value, 4)
  assert.match(steps[1].prompt!, /\\ldots\$ м\/с\.$/)
  assert.equal(guidedSteps('Синус отрицателен в III и IV четвертях.')[0].value, undefined)
})

test('задачи с ответом-числом есть по большинству тем', () => {
  for (const subject of ['physics', 'math'] as const) {
    const topics = numericTopics(subject)
    assert.ok(topics.length > 40, `${subject}: тем ${topics.length}`)
    for (const topic of topics.slice(0, 15)) {
      const t = numericTask(subject, topic, 'ru')
      assert.ok(t, `${subject} «${topic}»: нет задачи`)
      assert.ok(Number.isFinite(t!.answer), topic)
      assert.ok(t!.question && !/NaN|undefined/.test(t!.question), topic)
    }
  }
})
