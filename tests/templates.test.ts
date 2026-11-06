import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ENT_SUBJECTS, type EntSubject } from '@/lib/ent'
import { templatesFor } from '@/lib/templates'
import { withLocale, type Template } from '@/lib/templates/helpers'
import { MATH_MORE, PHYSICS_MORE } from '@/lib/templates/more'
import { withSeed } from './seed'

const SUBJECTS = Object.keys(ENT_SUBJECTS) as EntSubject[]
const RUNS = Number(process.env.RUNS || 30)

test('на каждую тему ЕНТ есть хотя бы 10 шаблонов', () => {
  for (const subject of SUBJECTS) {
    for (const section of ENT_SUBJECTS[subject].sections) {
      for (const topic of section.topics) {
        assert.ok(templatesFor(subject, topic).length >= 10, `${subject}: «${topic}» — меньше 10 шаблонов`)
      }
    }
  }
})

function checkGenerated(t: Template, n: number, label: string) {
  const g = t.gen(n)
  const where = `${label} «${t.topic}»: ${g.question.slice(0, 80)}`
  assert.ok(g.question.trim(), `${where} — пустое условие`)
  assert.ok(g.options.length >= 4, `${where} — меньше 4 вариантов`)
  assert.equal(new Set(g.options).size, g.options.length, `${where} — повторяются варианты: ${g.options.join(' | ')}`)
  assert.ok(Number.isInteger(g.correct) && g.correct >= 0 && g.correct < g.options.length, `${where} — неверный индекс ответа`)
  const text = [g.question, g.solution ?? '', ...g.options].join(' ')
  assert.ok(!/NaN|undefined|Infinity|\[object /.test(text), `${where} — в тексте NaN/undefined: ${text.slice(0, 200)}`)
  assert.ok(g.options.every(o => o.trim() && !/^—( |$)/.test(o.trim())), `${where} — пустой или нечисловой вариант: ${g.options.join(' | ')}`)
  // Знаки доллара парные — иначе формула «съест» текст
  for (const s of [g.question, g.solution ?? '', ...g.options]) {
    assert.equal((s.match(/\$/g) || []).length % 2, 0, `${where} — непарный $ в «${s.slice(0, 100)}»`)
  }
}

test('новые шаблоны генерируют корректные задания (4 и 5 вариантов)', () => {
  for (const [label, list] of [['физика', PHYSICS_MORE], ['математика', MATH_MORE]] as const) {
    for (const t of list) {
      for (let i = 0; i < RUNS; i++) withSeed(1000 + i, () => checkGenerated(t, i % 2 ? 4 : 5, label))
    }
  }
})

test('сложные задачи помечены и есть в обоих предметах', () => {
  assert.ok(PHYSICS_MORE.filter(t => t.hard).length >= 50)
  assert.ok(MATH_MORE.filter(t => t.hard).length >= 50)
})

test('новые задания переведены на казахский', () => {
  const untranslated: string[] = []
  for (const t of [...PHYSICS_MORE, ...MATH_MORE]) {
    for (let i = 0; i < 5; i++) {
      const ru = withSeed(7 + i, () => withLocale('ru', () => t.gen(4)))
      const kk = withSeed(7 + i, () => withLocale('kk', () => t.gen(4)))
      // Условие с русскими словами должно отличаться от русского оригинала
      if (/[а-яё]{3}/i.test(ru.question.replace(/\$[^$]*\$/g, '')) && ru.question === kk.question) {
        untranslated.push(`«${t.topic}»: ${ru.question.slice(0, 100)}`)
      }
    }
  }
  assert.deepEqual(untranslated.slice(0, 10), [], `не переведено условий: ${untranslated.length}`)
})

test('сложные задачи всегда дают 5 разных вариантов (уровень C пробного ЕНТ)', () => {
  const bad: string[] = []
  for (const t of [...PHYSICS_MORE, ...MATH_MORE].filter(t => t.hard)) {
    for (let i = 0; i < 30; i++) {
      const g = withSeed(100 + i, () => withLocale('ru', () => t.gen(5)))
      if (g.options.length !== 5 || new Set(g.options).size !== 5) { bad.push(`«${t.topic}»: ${g.question.slice(0, 60)}`); break }
    }
  }
  assert.deepEqual(bad, [])
})

test('стереометрия на готовых чертежах: рисунок, перевод условия и решения', async () => {
  const { MATH_SOLIDS } = await import('@/lib/templates/more/math-solids')
  assert.ok(MATH_SOLIDS.length >= 15)
  for (const t of MATH_SOLIDS) {
    for (let i = 0; i < 20; i++) {
      const ru = withSeed(300 + i, () => withLocale('ru', () => t.gen(5)))
      const kk = withSeed(300 + i, () => withLocale('kk', () => t.gen(5)))
      const where = `«${t.topic}»: ${ru.question.slice(0, 60)}`
      assert.ok(ru.figure?.startsWith('<svg') && !/NaN|undefined/.test(ru.figure), `${where} — нет рисунка`)
      assert.notEqual(kk.question, ru.question, `${where} — условие не переведено`)
      if (/[а-яё]{3}/i.test(ru.solution.replace(/\$[^$]*\$/g, ''))) assert.notEqual(kk.solution, ru.solution, `${where} — решение не переведено`)
      assert.equal(kk.options[kk.correct], ru.options[ru.correct], `${where} — разный ответ на двух языках`)
    }
  }
})

test('текстовые задачи: по 10+ шаблонов на тему, перевод условия и решения', async () => {
  const { MATH_WORD } = await import('@/lib/templates/more/math-word')
  const topics = [...new Set(MATH_WORD.map(t => t.topic))]
  assert.equal(topics.length, 6)
  for (const topic of topics) assert.ok(MATH_WORD.filter(t => t.topic === topic).length >= 10, topic)
  for (const t of MATH_WORD) {
    for (let i = 0; i < 20; i++) {
      const ru = withSeed(500 + i, () => withLocale('ru', () => t.gen(5)))
      const kk = withSeed(500 + i, () => withLocale('kk', () => t.gen(5)))
      const where = `«${t.topic}»: ${ru.question.slice(0, 60)}`
      assert.notEqual(kk.question, ru.question, `${where} — условие не переведено`)
      assert.ok(!/\d\{,\}\d/.test(ru.question.replace(/\$[^$]*\$/g, '')), `${where} — {,} вне формулы`)
      // В переводе те же числа, что в русском условии (метки ⟪n⟫ не перепутаны)
      const nums = (x: string) => (x.match(/\d+(?:[,.]\d+)?/g) || []).sort().join(' ')
      assert.equal(nums(kk.question), nums(ru.question), `${where} — числа в переводе не совпадают`)
      if (/[а-яё]{3}| ч\b/i.test(ru.solution.replace(/\$[^$]*\$/g, ''))) assert.notEqual(kk.solution, ru.solution, `${where} — решение не переведено`)
      assert.equal(kk.options[kk.correct], ru.options[ru.correct], `${where} — разный ответ на двух языках`)
    }
  }
})

test('100 задач по векторам: верный ответ в вариантах, перевод условия и решения', async () => {
  const { MATH_VECTORS_BANK } = await import('@/lib/templates/more/math-vectors-bank')
  assert.equal(MATH_VECTORS_BANK.length, 100)
  for (const t of MATH_VECTORS_BANK) {
    assert.ok(ENT_SUBJECTS.math.sections.some(s => s.topics.includes(t.topic)), `неизвестная тема «${t.topic}»`)
    for (const n of [4, 5]) {
      const ru = withSeed(n, () => withLocale('ru', () => t.gen(n)))
      const kk = withSeed(n, () => withLocale('kk', () => t.gen(n)))
      assert.equal(ru.options.length, n)
      assert.equal(new Set(ru.options).size, n)
      assert.notEqual(kk.question, ru.question, `не переведено: ${ru.question.slice(0, 60)}`)
      if (/[а-яё]{3}/i.test(ru.solution)) assert.notEqual(kk.solution, ru.solution, `не переведено решение: ${ru.solution.slice(0, 60)}`)
    }
  }
})
