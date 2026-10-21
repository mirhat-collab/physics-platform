// Дни для стрика считаем по времени Казахстана (UTC+5), а не по UTC:
// иначе заход с 00:00 до 05:00 засчитывался предыдущим днём.
const KZ_OFFSET = 5 * 60 * 60 * 1000
const DAY = 24 * 60 * 60 * 1000

// Дата 'YYYY-MM-DD' по Казахстану; daysAgo = 1 — вчера
export function kzDate(daysAgo = 0): string {
  return new Date(Date.now() + KZ_OFFSET - daysAgo * DAY).toISOString().slice(0, 10)
}

// Новый стрик при заходе: продолжаем, если были вчера, сбрасываем, если пропустили
export function nextStreak(lastVisit: string | null, streak: number | null): number {
  if (lastVisit === kzDate()) return streak || 1
  return lastVisit === kzDate(1) ? (streak || 0) + 1 : 1
}
