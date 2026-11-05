// Готовые варианты пробного ЕНТ в формате НЦТ (составлены вручную, с
// рисунками). В отличие от вариантов по шаблонам, задания и порядок
// вариантов ответа всегда одни и те же.
import { sectionOfTopic, type EntQuestion } from '../ent'
import { VARIANT_LIST, type EntVariantInfo } from './list'
import { PHYSICS_1 } from './physics-1'
import { MATH_1 } from './math-1'

export type EntVariant = EntVariantInfo & { questions: EntQuestion[] }

const QUESTIONS: Record<string, EntQuestion[]> = { 'physics-1': PHYSICS_1, 'math-1': MATH_1 }

export const ENT_VARIANTS: EntVariant[] = VARIANT_LIST.map(v => ({
  ...v,
  questions: (QUESTIONS[v.id] ?? []).map(q => ({ ...q, section: sectionOfTopic(v.subject, q.topic ?? '') })),
}))

export { variantsOf } from './list'
export const findVariant = (id: unknown) => ENT_VARIANTS.find(v => v.id === id)
