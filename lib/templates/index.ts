import type { EntSubject } from '@/lib/ent'
import type { Generated, Template } from './helpers'
import { PHYSICS_TEMPLATES } from './physics'
import { MATH_TEMPLATES } from './math'
import { MATH_THEORY, PHYSICS_THEORY } from './theory'

const ALL: Record<EntSubject, Template[]> = {
  physics: [...PHYSICS_TEMPLATES, ...PHYSICS_THEORY],
  math: [...MATH_TEMPLATES, ...MATH_THEORY],
}

export function templatesFor(subject: EntSubject, topic: string): Template[] {
  return ALL[subject].filter(t => t.topic === topic)
}

export function hasTemplates(subject: EntSubject, topic: string): boolean {
  return ALL[subject].some(t => t.topic === topic)
}

// Задача по шаблону для темы (или null, если шаблонов нет)
export function generateFromTemplate(subject: EntSubject, topic: string, nOptions: number): Generated | null {
  const list = templatesFor(subject, topic)
  if (!list.length) return null
  return list[Math.floor(Math.random() * list.length)].gen(nOptions)
}

export function templateCount(subject: EntSubject): number {
  return ALL[subject].length
}
