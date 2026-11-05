import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MATCH_ITEMS, MATCH_OPTIONS, MOCK, MULTI_MIN, MULTI_OPTIONS, answerPoints, mockFormat, mockPoints } from '@/lib/ent'
import { ENT_VARIANTS, findVariant, variantsOf } from '@/lib/variants'
import { mockResult } from '@/lib/mock-result'

test('готовые варианты: 40 заданий в формате НЦТ, темы из тренажёра', () => {
  assert.ok(variantsOf('physics').length >= 1 && variantsOf('math').length >= 1)
  for (const v of ENT_VARIANTS) {
    assert.equal(v.questions.length, MOCK.count, v.id)
    assert.equal(findVariant(v.id), v)
    v.questions.forEach((q, i) => {
      const where = `${v.id} №${i + 1}`
      assert.equal(q.kind ?? 'single', mockFormat(i), `${where}: формат`)
      assert.ok(q.section, `${where}: тема «${q.topic}» не найдена в тренажёре`)
      assert.equal(new Set(q.options).size, q.options.length, `${where}: одинаковые варианты`)
      for (const s of [q.question, q.solution, ...q.options, ...(q.left ?? [])]) {
        assert.equal((s.match(/\$/g) || []).length % 2, 0, `${where}: непарный $ в «${s.slice(0, 60)}»`)
      }
      if (q.kind === 'multi') {
        assert.equal(q.options.length, MULTI_OPTIONS, where)
        assert.ok(q.answers!.length >= MULTI_MIN && q.answers!.every(x => x >= 0 && x < MULTI_OPTIONS), where)
      } else if (q.kind === 'match') {
        assert.equal(q.left!.length, MATCH_ITEMS, where)
        assert.equal(q.options.length, MATCH_OPTIONS, where)
        assert.equal(new Set(q.pairs).size, MATCH_ITEMS, where)
      } else {
        assert.equal(q.options.length, 4, where)
        assert.ok(q.correct >= 0 && q.correct < 4, where)
      }
    })
    // Все верные ответы — максимум баллов
    const right = v.questions.map(q => (q.kind === 'multi' ? q.answers! : q.kind === 'match' ? q.pairs! : q.correct))
    assert.equal(mockResult(v.subject, v.questions, right).score, 50)
    // Один пропущенный верный вариант — 1 балл из 2
    assert.equal(answerPoints(v.questions[35], v.questions[35].answers!.slice(1), mockPoints(35)), 1)
  }
})

// Слова в вариантах (не только числа с единицами) должны быть переведены;
// единицы (мкДж, моль) короче пяти букв
const hasWords = (s: string) => (s.replace(/\$[^$]*\$/g, '').match(/[а-яёәғқңөұүһі]{5,}/gi) || []).length > 0

test('готовые варианты переведены на казахский целиком', () => {
  for (const v of ENT_VARIANTS) {
    assert.equal(v.kk.length, v.questions.length, v.id)
    v.kk.forEach((q, i) => {
      const ru = v.questions[i], where = `${v.id} №${i + 1}`
      assert.notEqual(q.question, ru.question, `${where}: условие не переведено`)
      if (hasWords(ru.solution)) assert.notEqual(q.solution, ru.solution, `${where}: решение не переведено`)
      assert.equal(q.options.length, ru.options.length, where)
      for (const s of [q.question, q.solution, ...q.options, ...(q.left ?? [])]) {
        assert.equal((s.match(/\$/g) || []).length % 2, 0, `${where}: непарный $ в «${s.slice(0, 60)}»`)
      }
      if (ru.options.some(hasWords)) assert.notDeepEqual(q.options, ru.options, `${where}: варианты не переведены`)
      if (ru.left?.some(hasWords)) assert.notDeepEqual(q.left, ru.left, `${where}: пункты не переведены`)
      assert.deepEqual([q.correct, q.answers, q.pairs, q.figure], [ru.correct, ru.answers, ru.pairs, ru.figure], where)
    })
  }
})

test('готовые варианты: верный ответ стоит на разных местах', () => {
  for (const v of ENT_VARIANTS) {
    const at = v.questions.filter(q => !q.kind).map(q => q.correct)
    assert.ok(new Set(at).size >= 3, `${v.id}: верный ответ почти всегда на одном месте`)
    assert.ok(at.filter(x => x === 0).length <= at.length / 2, `${v.id}: слишком часто вариант A`)
  }
})
