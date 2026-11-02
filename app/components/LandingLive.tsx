'use client'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/app/components/LanguageProvider'

// Строка с честными цифрами на главной (данные — /api/landing).
// Пока данных нет или база недоступна, блок просто не показывается.

type LandingData = {
  stats: { students: number; mockExams: number; answers: number } | null
}

let request: Promise<LandingData> | null = null
function loadLanding(): Promise<LandingData> {
  request ??= fetch('/api/landing')
    .then(r => (r.ok ? r.json() : { stats: null }))
    .catch(() => ({ stats: null }))
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

// Число отсчитывается от нуля, когда попадает на экран
function CountUp({ value, locale }: { value: number; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(value); return } // eslint-disable-line react-hooks/set-state-in-effect
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1600)
        setN(Math.round(value * (1 - Math.pow(1 - k, 4))))
        if (k < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [value])
  return <span ref={ref} className="nb-stat-n">{n.toLocaleString(locale)}</span>
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
          <CountUp value={it.n} locale={dateLocale} />
          <span className="nb-stat-l">{it.label}</span>
        </li>
      ))}
    </ul>
  )
}
