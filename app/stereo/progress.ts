// Прогресс по урокам стереометрии — в браузере ученика (удобство, не учёт):
// до какого шага дошёл и результат проверки себя.
import { useSyncExternalStore } from 'react'

export type LessonProgress = { step: number; quiz: number | null }
const KEY = 'stereo-progress-v1'
const EVENT = 'stereo-progress'

function raw(): string {
  try { return localStorage.getItem(KEY) || '{}' } catch { return '{}' }
}

export function readProgress(): Record<string, LessonProgress> {
  try { return JSON.parse(raw()) as Record<string, LessonProgress> } catch { return {} }
}

export function saveProgress(id: string, p: LessonProgress) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readProgress(), [id]: p }))
    window.dispatchEvent(new Event(EVENT))
  } catch { /* приватный режим — без сохранения */ }
}

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener(EVENT, cb)
  return () => { window.removeEventListener('storage', cb); window.removeEventListener(EVENT, cb) }
}

// Прогресс как состояние React: на сервере — пусто, в браузере — из localStorage
export function useProgress(): Record<string, LessonProgress> {
  const s = useSyncExternalStore(subscribe, raw, () => '{}')
  try { return JSON.parse(s) as Record<string, LessonProgress> } catch { return {} }
}
