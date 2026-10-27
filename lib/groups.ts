// Группы учителя: домашние задания группе хранятся с class_name = 'group:<id>'
// (как задания параллели — по названию класса), поэтому вся остальная логика ДЗ
// работает без изменений.

export type StudyGroup = { id: number; name: string; join_code: string; teacher_id: string; created_at: string }

export const GROUP_PREFIX = 'group:'
export const groupClass = (id: number) => `${GROUP_PREFIX}${id}`
export const groupIdOf = (className: string): number | null =>
  className.startsWith(GROUP_PREFIX) ? Number(className.slice(GROUP_PREFIX.length)) || null : null

// Код без похожих символов (0/O, 1/I/L) — его диктуют вслух и набирают с доски
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export function makeJoinCode(length = 6, random = Math.random): string {
  return Array.from({ length }, () => ALPHABET[Math.floor(random() * ALPHABET.length)]).join('')
}

export const PENDING_JOIN = 'pendingJoinCode'
export const joinPath = (code: string) => `/join/${code}`
