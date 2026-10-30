'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useT } from '@/app/components/LanguageProvider'
import { PEN_PROBLEMS } from './pen-data'

// Лист с решением задачи ЕНТ: перо выводит решение штрих за штрихом,
// ответ обводится рамкой, затем лист уходит и пишется следующая задача.
// Штрихи — однолинейный рукописный шрифт (pen-data.ts), анимация —
// Web Animations API: её легко поставить на паузу и продолжить.

const SPEED = 0.3 // px штриха за миллисекунду — темп спокойного письма
const HOLD = 3600 // сколько готовое решение лежит перед сменой листа
const EASE = 'cubic-bezier(0.45, 0, 0.55, 1)'

export default function PenSheet() {
  const { t } = useT()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [onScreen, setOnScreen] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const animsRef = useRef<Animation[]>([])
  const problem = PEN_PROBLEMS[index]

  useEffect(() => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(calm.matches)
    sync()
    calm.addEventListener('change', sync)
    return () => calm.removeEventListener('change', sync)
  }, [])

  // Вне экрана и в фоновой вкладке перо не пишет — бережём батарею
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let visible = true
    const sync = () => setOnScreen(visible && document.visibilityState === 'visible')
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync() })
    io.observe(el)
    document.addEventListener('visibilitychange', sync)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [])

  // До первой отрисовки прячем штрихи и расписываем, когда какой рисовать
  useLayoutEffect(() => {
    const svg = svgRef.current
    const page = pageRef.current
    if (!svg || !page || reduced) return
    const anims: Animation[] = []
    anims.push(page.animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { duration: 700, easing: EASE, fill: 'both' },
    ))
    let at = 650
    svg.querySelectorAll<SVGPathElement>('path').forEach(p => {
      const len = p.getTotalLength()
      p.style.strokeDasharray = `${len} ${len}`
      at += Number(p.dataset.gap || 0) * 1000
      const duration = Math.max(60, len / SPEED)
      anims.push(p.animate(
        [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration, delay: at, easing: EASE, fill: 'both' },
      ))
      at += duration
    })
    const leave = page.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate(-6px, -14px) rotate(-0.6deg)' }],
      { duration: 700, delay: at + HOLD, easing: EASE, fill: 'forwards' },
    )
    anims.push(leave)
    animsRef.current = anims
    let cancelled = false
    leave.finished
      .then(() => { if (!cancelled) setIndex(n => (n + 1) % PEN_PROBLEMS.length) })
      .catch(() => {})
    return () => { cancelled = true; anims.forEach(a => a.cancel()) }
  }, [index, reduced])

  // Пауза: кнопкой, вне экрана или в фоне. play() — только тем, что стоят
  useEffect(() => {
    const run = !paused && onScreen
    animsRef.current.forEach(a => {
      if (run && a.playState === 'paused') a.play()
      else if (!run && a.playState === 'running') a.pause()
    })
  }, [paused, onScreen, index, reduced])

  return (
    <div ref={rootRef} className="pen">
      <div className="pen-back" aria-hidden />
      <figure className="pen-sheet">
        <div ref={pageRef} key={index} className="pen-page">
          <figcaption className="pen-head">
            <span>{t(problem.subject)}</span>
            <span>{t('Пример решения')}</span>
          </figcaption>
          <p className="pen-task">{t(problem.statement)}</p>
          <svg
            ref={svgRef}
            className="pen-svg"
            viewBox={`0 0 ${problem.width} ${problem.height}`}
            role="img"
            aria-label={t('Решение, написанное от руки')}
          >
            {problem.strokes.map((s, k) => (
              <path
                key={k}
                d={s.d}
                data-gap={s.gap}
                className={s.accent ? 'pen-accent' : s.pencil ? 'pen-pencil' : undefined}
              />
            ))}
          </svg>
        </div>
        {!reduced && (
          <button
            type="button"
            className="pen-toggle"
            aria-pressed={paused}
            aria-label={paused ? t('Запустить анимацию') : t('Остановить анимацию')}
            title={paused ? t('Запустить анимацию') : t('Остановить анимацию')}
            onClick={() => setPaused(p => !p)}
          >
            {paused ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 4.5v15l13-7.5z" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></svg>
            )}
          </button>
        )}
      </figure>
    </div>
  )
}
