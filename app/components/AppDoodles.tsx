'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DOODLES, type Doodle } from './doodle-data'

// Фон страниц: бледные формулы и наброски, которые сами рисуются пером,
// держатся несколько секунд, тают — и в другом месте появляется новый.
// Мотивы зависят от раздела: в темах больше физики, в статистике — графиков.
// На главной свой лист с ручкой, поэтому там фона нет.

const HIDDEN_ON = ['/', '/ent/print']

function mathShare(section: string) {
  if (section === '/topics') return 0.25
  if (['/stats', '/progress', '/formulas'].includes(section)) return 0.7
  return 0.5
}

// Шесть зон экрана (3 × 2) — по наброску в каждой, чтобы они не налезали друг на друга
const ZONES = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] as const

type Shown = { doodle: Doodle; x: number; y: number; rot: number; red: boolean; n: number }

function pick(section: string, prev?: Doodle): Doodle {
  const list = Math.random() < mathShare(section) ? DOODLES.math : DOODLES.physics
  const d = list[Math.floor(Math.random() * list.length)]
  return d === prev ? pick(section, prev) : d
}

function place(zone: number, section: string, prev?: Doodle, n = 0): Shown {
  const [cx, cy] = ZONES[zone]
  return {
    doodle: pick(section, prev),
    x: (cx + 0.05 + Math.random() * 0.5) / 3,
    y: (cy + 0.08 + Math.random() * 0.45) / 2,
    rot: Math.random() * 14 - 7,
    red: Math.random() < 0.22,
    n,
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function Slot({ zone, section, delay }: { zone: number; section: string; delay: number }) {
  const [shown, setShown] = useState<Shown | null>(null)
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setShown(place(zone, section)), delay)
    return () => clearTimeout(t)
  }, [zone, section, delay])

  useEffect(() => {
    const el = svg.current
    if (!shown || !el) return
    let cancelled = false
    const run = async () => {
      const paths = Array.from(el.querySelectorAll('path'))
      for (const p of paths) {
        const len = p.getTotalLength()
        p.style.strokeDasharray = `${len}`
        p.style.strokeDashoffset = `${len}`
      }
      el.style.opacity = '1'
      for (const p of paths) {
        // Вкладка скрыта — не рисуем зря
        while (document.hidden && !cancelled) await sleep(500)
        if (cancelled) return
        const len = p.getTotalLength()
        await p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
          duration: 220 + len * 9, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards',
        }).finished.catch(() => {})
        await sleep(90)
      }
      await sleep(5000 + Math.random() * 4000)
      if (cancelled) return
      await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1600, fill: 'forwards' }).finished.catch(() => {})
      await sleep(1500 + Math.random() * 3000)
      if (!cancelled) setShown(s => place(zone, section, s?.doodle, (s?.n ?? 0) + 1))
    }
    run()
    return () => { cancelled = true; el.getAnimations({ subtree: true }).forEach(a => a.cancel()) }
  }, [shown, zone, section])

  if (!shown) return null
  const { doodle, x, y, rot, red, n } = shown
  return (
    <svg
      key={n}
      ref={svg}
      className={`doodle${red ? ' doodle-red' : ''}`}
      viewBox={`-6 -14 ${doodle.w + 12} ${doodle.h + 22}`}
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `calc(${doodle.w}px * var(--doodle-scale))`, transform: `rotate(${rot}deg)`, opacity: 0 }}
    >
      {doodle.paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

export default function AppDoodles() {
  const path = usePathname() || '/'
  const [motion, setMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setMotion(!mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (!motion || HIDDEN_ON.includes(path)) return null
  // Раздел — первая часть адреса; при переходе в другой раздел наброски меняются
  const section = '/' + (path.split('/')[1] || '')
  return (
    <div aria-hidden className="app-doodles">
      {ZONES.map((_, i) => <Slot key={section + i} zone={i} section={section} delay={300 + i * 1700} />)}
    </div>
  )
}
