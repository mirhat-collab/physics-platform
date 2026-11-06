import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ENT_SUBJECTS } from '@/lib/ent'
import { withLocale, type Template } from '@/lib/templates/helpers'
import { MATH_PLUS, PHYSICS_PLUS } from '@/lib/templates/plus'
import { withSeed } from './seed'

// Новые двуязычные шаблоны (+10 на тему): корректность и полный перевод
const RUNS = Number(process.env.RUNS || 25)
const nums = (s: string) => (s.replace(/[{},]/g, '').match(/\d+(\.\d+)?/g) || []).sort().join(' ')
// Единицы измерения одинаковы на двух языках — их словами не считаем
const UNITS = /(мкс|дптр|рад|моль|мин|кВт|МэВ|кэВ|кПа|МПа|ГПа|мкФ|пФ|нФ|мДж|кДж|МДж|мкКл|нКл|мкТл|мТл|кОм|МОм|мВб|мкм|нм|мГн|МГц|кГц|ГГц)(\/[а-яё²³]+)?/g
const words = (s: string) => /[а-яёәіңғүұқөһ]{3}/i.test(s.replace(/\$[^$]*\$/g, '').replace(UNITS, ''))

function check(t: Template, subject: string, i: number) {
  for (let r = 0; r < RUNS; r++) {
    const seed = 1000 + i * 97 + r
    for (const n of [4, 5]) {
      const ru = withSeed(seed, () => withLocale('ru', () => t.gen(n)))
      const kk = withSeed(seed, () => withLocale('kk', () => t.gen(n)))
      const where = `${subject} «${t.topic}» #${i}: ${ru.question.slice(0, 70)}`
      for (const g of [ru, kk]) {
        assert.ok(g.options.length >= Math.min(n, 4), `${where} — мало вариантов: ${g.options.join(' | ')}`)
        assert.equal(new Set(g.options).size, g.options.length, `${where} — повтор вариантов: ${g.options.join(' | ')}`)
        const text = [g.question, g.solution, ...g.options].join(' ')
        assert.ok(!/NaN|undefined|Infinity|\[object /.test(text), `${where} — NaN/undefined: ${text.slice(0, 160)}`)
        for (const s of [g.question, g.solution]) assert.equal((s.match(/\$/g) || []).length % 2, 0, `${where} — непарный $: ${s.slice(0, 80)}`)
      }
      if (words(ru.question)) assert.notEqual(kk.question, ru.question, `${where} — условие не переведено`)
      if (words(ru.solution)) assert.notEqual(kk.solution, ru.solution, `${where} — решение не переведено`)
      assert.equal(nums(kk.question), nums(ru.question), `${where} — числа в переводе не совпадают`)
      assert.equal(kk.options.length, ru.options.length)
      if (ru.num) assert.deepEqual(kk.num?.values, ru.num.values, `${where} — разные ответы`)
    }
  }
}

test('новые задания: верные варианты, перевод и одинаковые числа на двух языках', () => {
  PHYSICS_PLUS.forEach((t, i) => check(t, 'physics', i))
  MATH_PLUS.forEach((t, i) => check(t, 'math', i))
})

test('новые задания: темы существуют и на каждую — не меньше 10', () => {
  for (const [subject, list] of [['physics', PHYSICS_PLUS], ['math', MATH_PLUS]] as const) {
    const all = new Set(ENT_SUBJECTS[subject].sections.flatMap(s => s.topics))
    const count = new Map<string, number>()
    for (const t of list) {
      assert.ok(all.has(t.topic), `${subject}: нет темы «${t.topic}»`)
      count.set(t.topic, (count.get(t.topic) ?? 0) + 1)
    }
    for (const [topic, k] of count) assert.ok(k >= 10, `${subject}: «${topic}» — только ${k} новых заданий`)
  }
})
