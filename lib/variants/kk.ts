// Казахский текст готового варианта: по одной записи на задание, в том же
// порядке. Рисунки, ответы и числовые варианты берутся из русского варианта.
import type { EntQuestion } from '../ent'

export type VariantKk = { question: string; solution: string; options?: string[]; left?: string[] }[]

export function applyKk(qs: EntQuestion[], kk: VariantKk | undefined): EntQuestion[] {
  if (!kk || kk.length !== qs.length) return qs
  return qs.map((q, i) => ({
    ...q,
    question: kk[i].question,
    solution: kk[i].solution,
    ...(kk[i].options?.length === q.options.length ? { options: kk[i].options } : {}),
    ...(q.left && kk[i].left?.length === q.left.length ? { left: kk[i].left } : {}),
  }))
}
