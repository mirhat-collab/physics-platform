'use client'
import { useEffect, useState } from 'react'
import { useT } from '@/app/components/LanguageProvider'

// Живые блоки главной: мини-рейтинг (стикер у листа с решением) и строка
// с честными цифрами. Данные — /api/landing, один запрос на оба блока.
// Пока данных нет или база недоступна, блоки просто не показываются.

type LandingData = {
  top: { name: string; grade: string; xp: number }[]
  stats: { students: number; mockExams: number; answers: number } | null
}

let request: Promise<LandingData> | null = null
function loadLanding(): Promise<LandingData> {
  request ??= fetch('/api/landing')
    .then(r => (r.ok ? r.json() : { top: [], stats: null }))
    .catch(() => ({ top: [], stats: null }))
  return request
}

function useLanding() {
  const [data, setData] = useState<LandingData | null>(null)
  useEffect(() => {
    let alive = true
    loadLanding().then(d => { if (alive) setData(d) })
    return () => { alive = false }
  }, [])
  return data
}

export function RatingSticker() {
  const { t } = useT()
  const data = useLanding()
  if (!data?.top.length) return null
  return (
    <aside className="rate" aria-label={t('Рейтинг учеников')}>
      <p className="rate-title"><span>{t('Рейтинг')}</span><span>XP</span></p>
      <ol className="rate-list" role="list">
        {data.top.map((p, i) => (
          <li key={i}>
            <span className={`rate-medal rate-m${i + 1}`} aria-label={t('{n} место', { n: i + 1 })}>{i + 1}</span>
            <span className="rate-name">{p.name}{p.grade && <small>{t(p.grade)}</small>}</span>
            <span className="rate-xp">{p.xp}</span>
          </li>
        ))}
      </ol>
    </aside>
  )
}

// Русские окончания после числа: 1 ученик, 2 ученика, 5 учеников
function plural(n: number, forms: [string, string, string]) {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return forms[0]
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return forms[1]
  return forms[2]
}

export function StatsStrip() {
  const { locale, dateLocale } = useT()
  const data = useLanding()
  const s = data?.stats
  if (!s || !s.students) return null
  const kk = locale === 'kk'
  const items = [
    { n: s.students, label: kk ? 'оқушы тіркелген' : plural(s.students, ['ученик уже с нами', 'ученика уже с нами', 'учеников уже с нами']) },
    { n: s.answers, label: kk ? 'тапсырма шығарылды' : plural(s.answers, ['задание решено', 'задания решено', 'заданий решено']) },
    { n: s.mockExams, label: kk ? 'сынақ ҰБТ тапсырылды' : plural(s.mockExams, ['пробный ЕНТ сдан', 'пробных ЕНТ сдано', 'пробных ЕНТ сдано']) },
  ]
  return (
    <ul className="nb-stats" role="list">
      {items.map(it => (
        <li key={it.label}>
          <span className="nb-stat-n">{it.n.toLocaleString(dateLocale)}</span>
          <span className="nb-stat-l">{it.label}</span>
        </li>
      ))}
    </ul>
  )
}
