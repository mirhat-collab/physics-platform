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
