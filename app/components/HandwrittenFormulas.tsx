'use client'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useT } from '@/app/components/LanguageProvider'

// Фон главной: формулы и графики сами «пишутся от руки», держатся
// несколько секунд и тают, а на их месте появляются новые.
// Анимация — чистый CSS (маска для текста, stroke-dashoffset для линий),
// JS только решает, что и где показать. Когда слой не виден или включено
// «уменьшить движение» — ничего не крутится.

type Piece = { d: number; t: number }
type Item = { id: string; marker?: boolean; time: number; render: () => ReactNode }

const v = (p: Piece) => ({ '--d': `${p.d}s`, '--t': `${p.t}s` }) as CSSProperties

// Кусок текста, который проявляется слева направо, как от пера
function Ink({ d, t, children, className = '' }: Piece & { children: ReactNode; className?: string }) {
  return <span className={`hw-ink ${className}`} style={v({ d, t })}>{children}</span>
}

// Линия дроби рисуется между числителем и знаменателем
function Frac({ num, den, d }: { num: ReactNode; den: ReactNode; d: number }) {
  return (
    <span className="hw-frac">
      {num}
      <span className="hw-bar" style={v({ d, t: 0.35 })} />
      {den}
    </span>
  )
}

const ITEMS: Item[] = [
  {
    id: 'emc2', time: 1.9,
    render: () => (
      <span className="hw-row" style={{ fontSize: '1.25em' }}>
        <Ink d={0} t={1.1}>E = mc</Ink>
        <Ink d={1.1} t={0.3} className="hw-sup">2</Ink>
      </span>
    ),
  },
  {
    id: 'newton', time: 1,
    render: () => <span className="hw-row" style={{ fontSize: '1.15em' }}><Ink d={0} t={0.9}>F = ma</Ink></span>,
  },
  {
    id: 'pyth', time: 2.4,
    render: () => (
      <span className="hw-row">
        <Ink d={0} t={0.35}>a</Ink><Ink d={0.35} t={0.2} className="hw-sup">2</Ink>
        <Ink d={0.6} t={0.55}>&nbsp;+ b</Ink><Ink d={1.15} t={0.2} className="hw-sup">2</Ink>
        <Ink d={1.4} t={0.6}>&nbsp;= c</Ink><Ink d={2} t={0.2} className="hw-sup">2</Ink>
      </span>
    ),
  },
  {
    id: 'kinetic', time: 2.5,
    render: () => (
      <span className="hw-row">
        <Ink d={0} t={0.3}>E</Ink><Ink d={0.3} t={0.2} className="hw-sub">к</Ink>
        <Ink d={0.55} t={0.35}>&nbsp;=&nbsp;</Ink>
        <Frac
          d={1.4}
          num={<span className="hw-row"><Ink d={0.9} t={0.4}>mv</Ink><Ink d={1.3} t={0.15} className="hw-sup">2</Ink></span>}
          den={<Ink d={1.8} t={0.3}>2</Ink>}
        />
      </span>
    ),
  },
  {
    id: 'velocity', time: 1.8,
    render: () => (
      <span className="hw-row">
        <Ink d={0} t={0.5}>v = v</Ink><Ink d={0.5} t={0.15} className="hw-sub">0</Ink>
        <Ink d={0.7} t={0.8}>&nbsp;+ at</Ink>
      </span>
    ),
  },
  {
    id: 'quadratic', time: 3.6,
    render: () => (
      <span className="hw-row">
        <Ink d={0} t={0.45}>x =&nbsp;</Ink>
        <Frac
          d={2.4}
          num={
            <span className="hw-row">
              <Ink d={0.5} t={0.7}>-b ±&nbsp;</Ink>
              <svg width="22" height="30" viewBox="0 0 22 30" aria-hidden style={{ overflow: 'visible' }}>
                <path className="hw-path" pathLength={1} d="M1 18 L5 15 L10 28 L16 2 L40 2" style={v({ d: 1.25, t: 0.6 })} />
              </svg>
              <Ink d={1.85} t={0.3}>D</Ink>
            </span>
          }
          den={<Ink d={2.8} t={0.5}>2a</Ink>}
        />
      </span>
    ),
  },
  {
    id: 'pressure', time: 1.9, marker: true,
    render: () => (
      <span className="hw-row">
        <Ink d={0} t={0.5}>p =&nbsp;</Ink>
        <Frac d={0.95} num={<Ink d={0.55} t={0.3}>F</Ink>} den={<Ink d={1.35} t={0.3}>S</Ink>} />
      </span>
    ),
  },
  {
    id: 'ohm', time: 0.9,
    render: () => <span className="hw-row"><Ink d={0} t={0.9}>U = IR</Ink></span>,
  },
  {
    id: 'trig', time: 2.6,
    render: () => (
      <span className="hw-row">
        <Ink d={0} t={0.4}>sin</Ink><Ink d={0.4} t={0.15} className="hw-sup">2</Ink>
        <Ink d={0.6} t={0.9}>x + cos</Ink><Ink d={1.5} t={0.15} className="hw-sup">2</Ink>
        <Ink d={1.7} t={0.8}>x = 1</Ink>
      </span>
    ),
  },
  {
    id: 'line', time: 1.2, marker: true,
    render: () => <span className="hw-row"><Ink d={0} t={1.2}>y = kx + b</Ink></span>,
  },
  {
    id: 'work', time: 1,
    render: () => <span className="hw-row"><Ink d={0} t={1}>A = Fs</Ink></span>,
  },
  // Графики и чертежи
  {
    id: 'sine', time: 2.6,
    render: () => (
      <svg className="hw-graph" width="190" height="96" viewBox="0 0 190 96" aria-hidden>
        <path className="hw-path hw-pencil" pathLength={1} d="M4 48 L186 48" style={v({ d: 0, t: 0.5 })} />
        <path className="hw-path hw-pencil" pathLength={1} d="M14 92 L14 4" style={v({ d: 0.3, t: 0.4 })} />
        <path className="hw-path" pathLength={1} d="M14 48 C 30 6, 48 6, 62 48 S 96 90, 110 48 S 144 6, 158 48 S 176 76, 182 62" style={v({ d: 0.7, t: 1.5 })} />
        <text className="hw-label" x="112" y="96" style={v({ d: 2.1, t: 0.5 })}>y = sin x</text>
      </svg>
    ),
  },
  {
    id: 'parabola', time: 2.4, marker: true,
    render: () => (
      <svg className="hw-graph" width="150" height="120" viewBox="0 0 150 120" aria-hidden>
        <path className="hw-path hw-pencil" pathLength={1} d="M6 104 L146 104" style={v({ d: 0, t: 0.45 })} />
        <path className="hw-path hw-pencil" pathLength={1} d="M76 116 L76 4" style={v({ d: 0.25, t: 0.4 })} />
        <path className="hw-path hw-marker-stroke" pathLength={1} d="M22 12 Q 76 196, 130 12" style={v({ d: 0.6, t: 1.2 })} />
        <text className="hw-label" x="96" y="124" style={v({ d: 1.9, t: 0.5 })}>y = x²</text>
      </svg>
    ),
  },
  {
    id: 'triangle', time: 2.6,
    render: () => (
      <svg className="hw-graph" width="150" height="112" viewBox="0 0 150 112" aria-hidden>
        <path className="hw-path" pathLength={1} d="M16 92 L130 92 L130 14 Z" style={v({ d: 0, t: 1.3 })} />
        <path className="hw-path hw-pencil" pathLength={1} d="M118 92 L118 80 L130 80" style={v({ d: 1.3, t: 0.3 })} />
        <text className="hw-label" x="66" y="110" style={v({ d: 1.6, t: 0.4 })}>a</text>
        <text className="hw-label" x="136" y="58" style={v({ d: 1.8, t: 0.4 })}>b</text>
        <text className="hw-label" x="56" y="44" style={v({ d: 2, t: 0.4 })}>c</text>
      </svg>
    ),
  },
  {
    id: 'incline', time: 3,
    render: () => (
      <svg className="hw-graph" width="190" height="130" viewBox="0 0 190 130" aria-hidden>
        <path className="hw-path hw-pencil" pathLength={1} d="M8 118 L182 118 L182 30 Z" style={v({ d: 0, t: 0.9 })} />
        <path className="hw-path" pathLength={1} d="M96 76 L128 60 L140 84 L108 100 Z" style={v({ d: 0.9, t: 0.7 })} />
        <path className="hw-path hw-marker-stroke" pathLength={1} d="M118 80 L118 124 M112 116 L118 125 L124 116" style={v({ d: 1.6, t: 0.6 })} />
        <path className="hw-path hw-marker-stroke" pathLength={1} d="M118 80 L98 40 M96 50 L97 39 L106 45" style={v({ d: 2.1, t: 0.5 })} />
        <text className="hw-label" x="124" y="128" style={v({ d: 2.3, t: 0.4 })}>mg</text>
        <text className="hw-label" x="78" y="40" style={v({ d: 2.6, t: 0.4 })}>N</text>
      </svg>
    ),
  },
  {
    id: 'projectile', time: 2.7, marker: true,
    render: () => (
      <svg className="hw-graph" width="200" height="110" viewBox="0 0 200 110" aria-hidden>
        <path className="hw-path hw-pencil" pathLength={1} d="M6 96 L196 96" style={v({ d: 0, t: 0.5 })} />
        <path className="hw-path hw-marker-stroke" pathLength={1} d="M14 96 Q 100 -40, 186 96" style={v({ d: 0.5, t: 1.3 })} />
        <path className="hw-path" pathLength={1} d="M14 96 L50 52 M40 54 L51 51 L49 62" style={v({ d: 1.8, t: 0.5 })} />
        <text className="hw-label" x="52" y="76" style={v({ d: 2.3, t: 0.4 })}>v<tspan fontSize="14" dy="5">0</tspan></text>
      </svg>
    ),
  },
  {
    id: 'circle', time: 2.2,
    render: () => (
      <svg className="hw-graph" width="120" height="120" viewBox="0 0 120 120" aria-hidden>
        <path className="hw-path" pathLength={1} d="M60 10 C 88 10, 110 32, 110 60 C 110 88, 88 110, 60 110 C 32 110, 10 88, 10 60 C 10 32, 32 10, 60 10" style={v({ d: 0, t: 1.2 })} />
        <path className="hw-path hw-pencil" pathLength={1} d="M60 60 L104 40" style={v({ d: 1.2, t: 0.4 })} />
        <text className="hw-label" x="76" y="44" style={v({ d: 1.6, t: 0.4 })}>r</text>
        <text className="hw-label" x="26" y="92" style={v({ d: 1.8, t: 0.4 })}>S = πr²</text>
      </svg>
    ),
  },
]

// Места на листе: x, y — в процентах слоя; s — масштаб; o — насыщенность
type Slot = { x: number; y: number; s: number; o: number }
const DESKTOP_SLOTS: Slot[] = [
  { x: 10, y: 8, s: 1.15, o: 0.9 },
  { x: 52, y: 20, s: 1, o: 0.8 },
  { x: 14, y: 36, s: 1.25, o: 1 },
  { x: 58, y: 50, s: 1, o: 0.85 },
  { x: 8, y: 66, s: 1.05, o: 0.85 },
  { x: 50, y: 78, s: 0.95, o: 0.7 },
]
const MOBILE_SLOTS: Slot[] = [
  { x: 2, y: 4, s: 0.85, o: 0.9 },
  { x: 40, y: 37, s: 0.8, o: 0.8 },
  { x: 4, y: 70, s: 0.85, o: 0.85 },
]

type Shown = { item: number; key: number; out: boolean; rot: number }

const HOLD = 4.6 // секунд формула стоит на листе целиком
const FADE = 0.9

export default function HandwrittenFormulas() {
  const { t } = useT()
  const rootRef = useRef<HTMLDivElement>(null)
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [shown, setShown] = useState<(Shown | null)[]>([])
  const [running, setRunning] = useState(false)
  const [reduced, setReduced] = useState(false)
  // Кнопка «Остановить анимацию» — для тех, кому движение мешает читать
  const [paused, setPaused] = useState(false)
  const still = reduced || paused

  // Раскладка под ширину экрана и настройку «уменьшить движение»
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 900px)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      setSlots(wide.matches ? DESKTOP_SLOTS : MOBILE_SLOTS)
      setReduced(calm.matches)
    }
    sync()
    wide.addEventListener('change', sync)
    calm.addEventListener('change', sync)
    return () => { wide.removeEventListener('change', sync); calm.removeEventListener('change', sync) }
  }, [])

  // Крутим, только пока слой на экране и вкладка открыта — бережём батарею
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let onScreen = false
    const sync = () => setRunning(onScreen && document.visibilityState === 'visible')
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync() })
    io.observe(el)
    document.addEventListener('visibilitychange', sync)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [])

  // Без анимации — просто аккуратно разложенные формулы
  useEffect(() => {
    if (!slots || !still) return
    setShown(slots.map((_, i) => ({ item: (i * 3) % ITEMS.length, key: -1 - i, out: false, rot: 0 })))
  }, [slots, still])

  useEffect(() => {
    if (!slots || still || !running) return
    const timers: number[] = []
    const later = (fn: () => void, sec: number) => { timers.push(window.setTimeout(fn, sec * 1000)) }
    let current: (Shown | null)[] = slots.map(() => null)
    let counter = 0

    const pick = () => {
      const busy = new Set(current.filter(Boolean).map(s => s!.item))
      const free = ITEMS.map((_, i) => i).filter(i => !busy.has(i))
      return free[Math.floor(Math.random() * free.length)]
    }
    const update = (i: number, next: Shown | null) => {
      current = current.map((s, j) => (j === i ? next : s))
      setShown(current)
    }
    const cycle = (i: number) => {
      const item = pick()
      const rot = Math.round((Math.random() * 7 - 4) * 10) / 10
      const key = ++counter
      update(i, { item, key, out: false, rot })
      later(() => update(i, { item, key, out: true, rot }), ITEMS[item].time + HOLD)
      later(() => { update(i, null); later(() => cycle(i), 0.3 + Math.random() * 1.2) }, ITEMS[item].time + HOLD + FADE)
    }
    // Первые формулы появляются по очереди, а не все разом
    slots.forEach((_, i) => later(() => cycle(i), 0.4 + i * 0.85))
    return () => { timers.forEach(clearTimeout); setShown([]) }
  }, [slots, still, running])

  return (
    <>
    <div ref={rootRef} className={`hw-layer${still ? ' hw-static' : ''}`} aria-hidden>
      {slots && shown.map((s, i) => {
        if (!s) return null
        const slot = slots[i]
        const item = ITEMS[s.item]
        return (
          <div
            key={s.key}
            className={`hw-item${item.marker ? ' hw-marker' : ''}${s.out ? ' hw-out' : ''}`}
            style={{
              left: `${slot.x}%`, top: `${slot.y}%`, opacity: s.out ? 0 : slot.o,
              fontSize: `calc(${slot.s} * clamp(24px, 1.2vw + 16px, 34px))`,
              '--rot': `${s.rot}deg`,
            } as CSSProperties}
          >
            {item.render()}
          </div>
        )
      })}
    </div>
    {!reduced && (
      <button
        type="button"
        className="hw-toggle"
        aria-pressed={paused}
        aria-label={paused ? t('Запустить анимацию') : t('Остановить анимацию')}
        title={paused ? t('Запустить анимацию') : t('Остановить анимацию')}
        onClick={() => setPaused(p => !p)}
      >
        {paused ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 4.5v15l13-7.5z" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></svg>
        )}
      </button>
    )}
    </>
  )
}
