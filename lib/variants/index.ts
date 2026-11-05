// Готовые варианты пробного ЕНТ в формате НЦТ (составлены вручную, с
// рисунками). В отличие от вариантов по шаблонам, задания и порядок
// вариантов ответа всегда одни и те же. В своих вариантах верный ответ
// записан первым — порядок перемешивается здесь, постоянно и одинаково
// на обоих языках.
import { sectionOfTopic, type EntQuestion } from '../ent'
import { VARIANT_LIST, type EntVariantInfo } from './list'
import { PHYSICS_1 } from './physics-1'
import { MATH_1 } from './math-1'
import { PHYSICS_2 } from './physics-2'
import { PHYSICS_2_KK } from './physics-2.kk'
import { MATH_2 } from './math-2'
import { MATH_2_KK } from './math-2.kk'
import { PHYSICS_1_KK } from './physics-1.kk'
import { MATH_1_KK } from './math-1.kk'
import { applyKk, type VariantKk } from './kk'
import type { Locale } from '../i18n'

export type EntVariant = EntVariantInfo & { questions: EntQuestion[]; kk: EntQuestion[] }

const QUESTIONS: Record<string, EntQuestion[]> = { 'physics-1': PHYSICS_1, 'math-1': MATH_1, 'physics-2': PHYSICS_2, 'math-2': MATH_2 }
const KK: Record<string, VariantKk> = { 'physics-1': PHYSICS_1_KK, 'math-1': MATH_1_KK, 'physics-2': PHYSICS_2_KK, 'math-2': MATH_2_KK }
// Варианты, где порядок ответов нужно перемешать (верный записан первым)
const SHUFFLE = new Set(['physics-2', 'math-2'])

// Простой генератор случайных чисел с начальным значением: порядок
// одинаковый при каждой сборке
function seeded(seed: string): () => number {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

// Новый порядок вариантов: options[k] нового задания — старый options[order[k]]
function reorder(q: EntQuestion, order: number[]): EntQuestion {
  const pos = (i: number) => order.indexOf(i)
  return {
    ...q,
    options: order.map(i => q.options[i]),
    correct: pos(q.correct),
    ...(q.answers ? { answers: q.answers.map(pos).sort((a, b) => a - b) } : {}),
    ...(q.pairs ? { pairs: q.pairs.map(pos) } : {}),
  }
}

export const ENT_VARIANTS: EntVariant[] = VARIANT_LIST.map(v => {
  let questions: EntQuestion[] = (QUESTIONS[v.id] ?? []).map(q => ({ ...q, section: sectionOfTopic(v.subject, q.topic ?? '') }))
  let kk = applyKk(questions, KK[v.id])
  if (SHUFFLE.has(v.id)) {
    const rnd = seeded(v.id)
    const orders = questions.map(q => {
      const o = q.options.map((_, i) => i)
      for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]] }
      return o
    })
    questions = questions.map((q, i) => reorder(q, orders[i]))
    kk = kk.map((q, i) => reorder(q, orders[i]))
  }
  return { ...v, questions, kk }
})

export { variantsOf } from './list'
export const findVariant = (id: unknown) => ENT_VARIANTS.find(v => v.id === id)
// Задания варианта на языке сайта
export const variantQuestions = (v: EntVariant, locale: Locale) => (locale === 'kk' ? v.kk : v.questions)
