import test from 'node:test'
import assert from 'node:assert/strict'
import { withSeed } from './seed'
import { MARK_GENS, checkMark, emptyLine, lineFrom, lineToTex, markTask, radTex, type MarkKind } from '@/lib/mark'

test('mark: запись множества промежутками', () => {
  assert.equal(lineToTex(lineFrom(x => x > 2)), '(2; +\\infty)')
  assert.equal(lineToTex(lineFrom(x => x <= -1 || x >= 3)), '(-\\infty; -1] \\cup [3; +\\infty)')
  assert.equal(lineToTex(lineFrom(x => x === 0)), '\\{0\\}')
  assert.equal(lineToTex(lineFrom(x => x >= -2 && x < 4)), '[-2; 4)')
  assert.equal(lineToTex(lineFrom(x => x !== 1)), '(-\\infty; 1) \\cup (1; +\\infty)')
  assert.equal(lineToTex(emptyLine()), '\\varnothing')
  assert.equal(radTex(150), '\\frac{5\\pi}{6}')
  assert.equal(radTex(-60), '-\\frac{\\pi}{3}')
  assert.equal(radTex(180), '\\pi')
})

test('mark: каждый вид заданий на двух языках, ответы совпадают и проверка работает', () => {
  for (const kind of Object.keys(MARK_GENS) as MarkKind[]) {
    for (let seed = 1; seed <= 150; seed++) {
      const ru = withSeed(seed, () => markTask(kind, 'ru'))
      const kk = withSeed(seed, () => markTask(kind, 'kk'))
      assert.equal(ru.kind, kind)
      assert.deepEqual(kk.answer, ru.answer, `${kind} ${seed}: ответы ru/kk`)
      assert.notEqual(kk.question, ru.question, `${kind} ${seed}: нет перевода условия`)
      assert.ok(!/Отметь|Ответ|решени/.test(kk.question + kk.solution), `${kind} ${seed}: русский текст в kk: ${kk.question} ${kk.solution}`)
      assert.ok(!/undefined|NaN|\+ -|- -/.test(ru.question + ru.solution), `${kind} ${seed}: ${ru.question} | ${ru.solution}`)
      const a = ru.kind === 'line' ? { line: ru.answer } : ru.kind === 'plane' ? { points: ru.answer } : { degrees: ru.answer }
      assert.ok(checkMark(ru, a))
      if (ru.kind === 'line') assert.ok(ru.answer.points.some(Boolean) || ru.answer.gaps.some(Boolean) || ru.answer.left || ru.answer.right)
      if (ru.kind === 'plane') assert.ok(ru.answer.length && ru.answer.every(p => Math.abs(p.x) <= 6 && Math.abs(p.y) <= 6 && Number.isInteger(p.x) && Number.isInteger(p.y)), `${seed}: ${JSON.stringify(ru.answer)}`)
      assert.ok(!checkMark(ru, ru.kind === 'line' ? { line: emptyLine() } : ru.kind === 'plane' ? { points: [] } : { degrees: [] }))
    }
  }
})
