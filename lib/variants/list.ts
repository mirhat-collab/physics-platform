// Список готовых вариантов — без самих заданий, чтобы страница не загружала
// их заранее (задания отдаёт /api/ent/mock)
import type { EntSubject } from '../ent'

export type EntVariantInfo = { id: string; subject: EntSubject; title: string }

export const VARIANT_LIST: EntVariantInfo[] = [
  { id: 'physics-1', subject: 'physics', title: 'Вариант 1' },
  { id: 'math-1', subject: 'math', title: 'Вариант 1' },
  { id: 'physics-2', subject: 'physics', title: 'Вариант 2' },
  { id: 'math-2', subject: 'math', title: 'Вариант 2' },
  { id: 'physics-3', subject: 'physics', title: 'Вариант 3' },
  { id: 'math-3', subject: 'math', title: 'Вариант 3' },
  { id: 'physics-4', subject: 'physics', title: 'Вариант 4 (пробник)' },
  { id: 'math-4', subject: 'math', title: 'Вариант 4 (пробник)' },
]

export const variantsOf = (subject: EntSubject) => VARIANT_LIST.filter(v => v.subject === subject)

// Сложные варианты: собираются из заданий уровня C банка (в несколько
// действий), набор заданий в каждом постоянный
export const HARD_VARIANTS = [1, 2, 3] as const
export const hardVariantId = (subject: EntSubject, no: number) => `${subject}-hard-${no}`
export function parseHardVariant(id: unknown, subject: EntSubject): number | null {
  const m = typeof id === 'string' ? /^(physics|math)-hard-(\d)$/.exec(id) : null
  const no = m && m[1] === subject ? Number(m[2]) : 0
  return (HARD_VARIANTS as readonly number[]).includes(no) ? no : null
}
