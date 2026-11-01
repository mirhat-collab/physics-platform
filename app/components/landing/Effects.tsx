'use client'
import { useEffect, useRef, useState } from 'react'
import { scroll } from './scroll-state'

// Мелкие эффекты главной: свечение за курсором, «магнитные» кнопки, заголовок
// по буквам, навигация по главам, печатающиеся формулы, наклон карточек.
// Всё отключается при «уменьшить движение» (там, где это движение, а не смысл).

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

// Мягкое синее свечение, плывущее за курсором (только мышь, не тач)
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!finePointer() || reduced()) return
    const el = ref.current
    if (!el) return
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0
    const move = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; el.style.opacity = '1' }
    const tick = () => {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', move)
    raf = requestAnimationFrame(tick)
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf) }
  }, [])
  return <div ref={ref} className="lx-cursor" aria-hidden />
}

// Кнопка чуть тянется за курсором, пока он рядом
export function Magnetic({ children, strength = 0.28 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !finePointer() || reduced()) return
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * strength}px, ${(e.clientY - (r.top + r.height / 2)) * strength}px)`
    }
    const leave = () => { el.style.transform = '' }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [strength])
  return <span ref={ref} className="lx-magnet">{children}</span>
}

// Заголовок по буквам: каждая выплывает из размытия с небольшой задержкой.
// Для читалок экрана — обычный текст (буквы скрыты от них).
export function SplitText({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  let i = 0
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="lx-split">
        {text.split(' ').map((word, w) => (
          <span key={w}>
            {w > 0 && ' '}
            <span className="lx-word">
              {Array.from(word).map(ch => <span key={i} className="lx-char" style={{ animationDelay: `${delay + (i++) * 0.035}s` }}>{ch}</span>)}
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}

// Полоса прогресса сверху и точки глав справа (как у United Carriers)
export function ChapterNav({ labels, label }: { labels: string[]; label: string }) {
  const bar = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)
  useEffect(() => {
    let raf = 0, last = -2
    const tick = () => {
      const h = document.documentElement.scrollHeight - innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`
      const a = scroll.s > 0.5 && scroll.s < labels.length + 0.6 ? Math.min(labels.length - 1, Math.round(scroll.s) - 1) : -1
      if (a !== last) { last = a; setActive(a) }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [labels.length])
  const go = (i: number) => document.querySelector(`[data-scene="${i + 1}"]`)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' })
  return (
    <>
      <div className="lx-progress" aria-hidden><div ref={bar} /></div>
      <nav className={`lx-chapters${active >= 0 ? ' on' : ''}`} aria-label={label}>
        {labels.map((l, i) => (
          <button key={l} type="button" className={i === active ? 'is-active' : ''} onClick={() => go(i)} aria-current={i === active ? 'step' : undefined}>
            <span className="lx-chapters-n">0{i + 1}</span>
            <span className="lx-chapters-l">{l}</span>
          </button>
        ))}
      </nav>
    </>
  )
}

// Формула «печатается» с мигающим курсором, когда попадает на экран
export function TypeFormula({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced()) { setN(text.length); return } // eslint-disable-line react-hooks/set-state-in-effect
    let timer = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      let k = 0
      const step = () => { k++; setN(k); if (k < text.length) timer = window.setTimeout(step, 55 + Math.random() * 60) }
      timer = window.setTimeout(step, 350)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => { io.disconnect(); clearTimeout(timer) }
  }, [text])
  return (
    <p ref={ref} className="lx-formula" aria-label={text}>
      <span aria-hidden>{text.slice(0, n)}</span><span className="lx-caret" aria-hidden />
    </p>
  )
}

// Карточка слегка наклоняется в 3D за курсором, по ней скользит блик
export function Tilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !finePointer() || reduced()) return
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateY(-4px)`
      el.style.setProperty('--mx', `${px * 100}%`)
      el.style.setProperty('--my', `${py * 100}%`)
    }
    const leave = () => { el.style.transform = '' }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [])
  return <div ref={ref} className={`lx-tilt ${className ?? ''}`}>{children}</div>
}

// Бегущая строка из формул между разделами
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items]
  return (
    <div className="lx-marquee" aria-hidden>
      <div className="lx-marquee-track">
        {row.map((f, i) => <span key={i}>{f}<i>✦</i></span>)}
      </div>
    </div>
  )
}
