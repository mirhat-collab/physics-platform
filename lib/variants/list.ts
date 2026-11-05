// Список готовых вариантов — без самих заданий, чтобы страница не загружала
// их заранее (задания отдаёт /api/ent/mock)
import type { EntSubject } from '../ent'

export type EntVariantInfo = { id: string; subject: EntSubject; title: string }

export const VARIANT_LIST: EntVariantInfo[] = [
  { id: 'physics-1', subject: 'physics', title: 'Вариант 1' },
  { id: 'math-1', subject: 'math', title: 'Вариант 1' },
  { id: 'physics-2', subject: 'physics', title: 'Вариант 2' },
  { id: 'math-2', subject: 'math', title: 'Вариант 2' },
]

export const variantsOf = (subject: EntSubject) => VARIANT_LIST.filter(v => v.subject === subject)
