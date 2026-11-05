// Готовые варианты пробного ЕНТ в формате НЦТ (составлены вручную, с
// рисунками). В отличие от вариантов по шаблонам, задания и порядок
// вариантов ответа всегда одни и те же.
import { sectionOfTopic, type EntQuestion } from '../ent'
import { VARIANT_LIST, type EntVariantInfo } from './list'
import { PHYSICS_1 } from './physics-1'
import { MATH_1 } from './math-1'
import { PHYSICS_1_KK } from './physics-1.kk'
import { MATH_1_KK } from './math-1.kk'
import { applyKk, type VariantKk } from './kk'
import type { Locale } from '../i18n'

export type EntVariant = EntVariantInfo & { questions: EntQuestion[]; kk: EntQuestion[] }

const QUESTIONS: Record<string, EntQuestion[]> = { 'physics-1': PHYSICS_1, 'math-1': MATH_1 }
const KK: Record<string, VariantKk> = { 'physics-1': PHYSICS_1_KK, 'math-1': MATH_1_KK }

export const ENT_VARIANTS: EntVariant[] = VARIANT_LIST.map(v => {
  const questions = (QUESTIONS[v.id] ?? []).map(q => ({ ...q, section: sectionOfTopic(v.subject, q.topic ?? '') }))
  return { ...v, questions, kk: applyKk(questions, KK[v.id]) }
})

export { variantsOf } from './list'
export const findVariant = (id: unknown) => ENT_VARIANTS.find(v => v.id === id)
// Задания варианта на языке сайта
export const variantQuestions = (v: EntVariant, locale: Locale) => (locale === 'kk' ? v.kk : v.questions)
