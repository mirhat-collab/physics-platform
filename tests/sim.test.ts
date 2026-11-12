import test from 'node:test'
import assert from 'node:assert/strict'
import { withSeed } from './seed'
import {
  CIRCUIT_R2, LENS_D, PENDULUM_L, circuit, circuitOk, circuitTask, lensImage, lensOk, lensTask,
  pendulumOk, pendulumPeriod, pendulumTask, projectileOk, projectileRange, projectileTask,
} from '@/lib/sim'

const slider = (r: { min: number; max: number; step: number }) => {
  const out: number[] = []
  for (let v = r.min; v <= r.max + 1e-9; v += r.step) out.push(Math.round(v * 100) / 100)
  return out
}

test('sim: формулы', () => {
  assert.ok(Math.abs(pendulumPeriod(1, 9.8) - 2.007) < 0.001)
  const im = lensImage(30, 10)!
  assert.ok(Math.abs(im.f - 15) < 1e-9 && Math.abs(im.gamma - 0.5) < 1e-9 && im.real)
  assert.equal(lensImage(10, 10), null)
  assert.ok(!lensImage(5, 10)!.real)
  const s = circuit(12, 1, 2, 3, 'series')
  assert.ok(Math.abs(s.I - 2) < 1e-9 && Math.abs(s.U2 - 6) < 1e-9)
  const p = circuit(12, 0, 3, 6, 'parallel')
  assert.ok(Math.abs(p.I - 6) < 1e-9 && Math.abs(p.I1 - 4) < 1e-9)
  assert.ok(Math.abs(projectileRange(10, 45) - 10) < 1e-9)
})

// Каждое задание решаемо ползунком, верное значение проходит проверку,
// а заметно другое — нет; русский и казахский тексты различаются
test('sim: задания решаемы ползунком и переведены', () => {
  const tasks = [
    { gen: pendulumTask, ok: pendulumOk, values: slider(PENDULUM_L), answer: (t: ReturnType<typeof pendulumTask>) => t.answer },
    { gen: lensTask, ok: lensOk, values: slider(LENS_D), answer: (t: ReturnType<typeof lensTask>) => t.answer },
    { gen: circuitTask, ok: circuitOk, values: slider(CIRCUIT_R2), answer: (t: ReturnType<typeof circuitTask>) => t.answer },
    { gen: projectileTask, ok: projectileOk, values: slider({ min: 5, max: 85, step: 1 }), answer: (t: ReturnType<typeof projectileTask>) => t.angles[0] },
  ] as const
  for (const { gen, ok, values, answer } of tasks) {
    for (let seed = 1; seed <= 200; seed++) {
      const ru = withSeed(seed, () => gen('ru')), kk = withSeed(seed, () => gen('kk'))
      assert.notEqual(ru.question, kk.question)
      assert.ok(!/Подбери|Поставь|бросают|или/.test(kk.question + kk.solution), kk.question + kk.solution)
      assert.ok(!/undefined|NaN/.test(ru.question + ru.solution + kk.question + kk.solution))
      const check = ok as (t: typeof ru, v: number) => boolean
      assert.ok(values.some(v => check(ru, v)), `${gen.name} ${seed}: ползунком не решить`)
      assert.ok(check(ru, (answer as (t: typeof ru) => number)(ru)), `${gen.name} ${seed}: ответ не проходит`)
      assert.ok(!values.every(v => check(ru, v)))
    }
  }
})
