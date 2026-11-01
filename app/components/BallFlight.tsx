'use client'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/app/components/LanguageProvider'

// История при прокрутке на главной: мяч летит по параболе, ручка дописывает
// решение (v₀, h, t), а в конце график превращается в линию роста балла ЕНТ.
// Кадры считаются прямо из положения прокрутки — без видео и библиотек.
// При «уменьшить движение» сразу показываем итоговую картинку.

const clamp = (x: number) => Math.min(1, Math.max(0, x))
// Мягкий старт и финиш каждого кусочка анимации
const ease = (x: number) => x * x * (3 - 2 * x)

// Парабола: старт (60, 340), вершина (300, 90), падение (540, 340)
const FLIGHT = 'M60 340 Q300 -160 540 340'
const SCORE = 'M60 318 C130 300 160 280 210 262 S300 230 340 198 S430 150 470 128 S520 104 540 98'
const SCORE_DOTS = [[60, 318, '62'], [340, 198, '84'], [540, 98, '108']] as const

export default function BallFlight() {
  const { t } = useT()
  const root = useRef<HTMLElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const el = root.current, s = svg.current
    if (!el || !s) return
    const q = <T extends Element>(sel: string) => s.querySelector(sel) as T
    const flight = q<SVGPathElement>('.bf-flight')
    const reveal = q<SVGPathElement>('.bf-reveal') // маска: пунктир «дорисовывается» за мячом
    const score = q<SVGPathElement>('.bf-score')
    const ball = q<SVGGElement>('.bf-ball')
    const shadow = q<SVGEllipseElement>('.bf-shadow')
    const fLen = flight.getTotalLength()
    const sLen = score.getTotalLength()
    reveal.style.strokeDasharray = `${fLen}`
    score.style.strokeDasharray = `${sLen}`
    const show = (sel: string, v: number) => s.querySelectorAll<SVGElement>(sel).forEach(n => { n.style.opacity = String(v) })

    let last = -1
    const render = (p: number) => {
      const f = ease(clamp(p / 0.6))
      const sc = ease(clamp((p - 0.66) / 0.3))
      reveal.style.strokeDashoffset = String(fLen * (1 - f))
      const pt = flight.getPointAtLength(fLen * f)
      ball.setAttribute('transform', `translate(${pt.x} ${pt.y})`)
      shadow.setAttribute('cx', String(pt.x))
      shadow.setAttribute('rx', String(6 + (pt.y / 340) * 10))
      ball.style.opacity = String(1 - sc)
      shadow.style.opacity = String((1 - sc) * 0.5)
      show('.bf-v0', clamp(p / 0.06) * (1 - sc * 0.85))
      show('.bf-apex', clamp((f - 0.48) / 0.08) * (1 - sc * 0.85))
      show('.bf-answer', clamp((f - 0.56) / 0.1) * (1 - sc * 0.9))
      show('.bf-land', clamp((f - 0.94) / 0.06) * (1 - sc * 0.85))
      flight.style.opacity = String(1 - sc * 0.8)
      score.style.strokeDashoffset = String(sLen * (1 - sc))
      show('.bf-score-axis', clamp(sc / 0.2))
      SCORE_DOTS.forEach((_, i) => show(`.bf-dot-${i}`, clamp((sc - i * 0.45) / 0.1)))
      show('.bf-check', clamp((sc - 0.92) / 0.08))
      const st = p < 0.3 ? 0 : p < 0.66 ? 1 : 2
      if (st !== last) { last = st; setStep(st) }
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('bf-static')
      render(1)
      return
    }

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const total = r.height - window.innerHeight
        render(total > 0 ? clamp(-r.top / total) : 1)
      })
    }
    // Слушаем прокрутку, только пока блок рядом с экраном
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { window.addEventListener('scroll', onScroll, { passive: true }); onScroll() }
      else window.removeEventListener('scroll', onScroll)
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    window.addEventListener('resize', onScroll)
    render(0)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const steps = [
    { k: t('Задача из ЕНТ'), title: t('Мяч бросили вверх со скоростью 20 м/с'), text: t('Какой высоты он достигнет? Листай — и смотри, как решение появляется само.') },
    { k: t('Разбор'), title: t('Наверху скорость равна нулю'), text: t('Значит, h = v₀² / 2g = 400 / 20 = 20 м. Так разбирается каждая задача: шаг за шагом, без зубрёжки.') },
    { k: t('Результат'), title: t('Так же растёт твой балл'), text: t('Каждая разобранная задача приближает к цели. Прогноз балла покажет, сколько осталось.') },
  ]

  return (
    <section ref={root} className="bf" aria-label={t('Как мы разбираем задачи')}>
      <div className="bf-sticky">
        <ol className="bf-steps" role="list">
          {steps.map((st, i) => (
            <li key={i} className={i === step ? 'on' : ''} aria-current={i === step ? 'step' : undefined}>
              <p className="bf-k">{st.k}</p>
              <h3>{st.title}</h3>
              <p>{st.text}</p>
            </li>
          ))}
        </ol>

        <div className="bf-sheet">
          <svg ref={svg} viewBox="0 0 600 400" role="img" aria-label={t('Мяч летит по параболе: высота подъёма 20 метров')}>
            {/* Оси */}
            <path className="bf-axis" d="M40 340 C200 339 400 341 572 340" />
            <path className="bf-axis" d="M566 335 L574 340 L566 345" />
            <path className="bf-axis" d="M40 362 C41 260 39 120 40 24" />
            <path className="bf-axis" d="M35 32 L40 22 L45 32" />
            <text className="bf-hand bf-muted" x="56" y="34">h</text>
            <text className="bf-hand bf-muted" x="560" y="372">x</text>

            {/* Траектория и мяч */}
            <defs>
              <mask id="bf-trail" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="400">
                <path className="bf-reveal" d={FLIGHT} stroke="#fff" strokeWidth="10" fill="none" />
              </mask>
            </defs>
            <path className="bf-flight" d={FLIGHT} mask="url(#bf-trail)" />
            <ellipse className="bf-shadow" cx="60" cy="343" rx="10" ry="3" />
            <g className="bf-ball" transform="translate(60 340)">
              <circle r="11" />
              <path d="M-11 0 C-4 -4 4 -4 11 0 M-6 -9 C-1 -3 -1 3 -6 9" />
            </g>

            {/* v₀ у старта */}
            <g className="bf-v0" style={{ opacity: 0 }}>
              <path className="bf-ink" d="M72 326 C84 300 96 276 108 254" />
              <path className="bf-ink" d="M100 258 L109 252 L110 263" />
              <text className="bf-hand" x="114" y="262">v₀ = 20 м/с</text>
            </g>

            {/* Вершина: пунктир до земли и высота */}
            <g className="bf-apex" style={{ opacity: 0 }}>
              <path className="bf-dash" d="M300 92 L300 338" />
              <path className="bf-ink" d="M288 90 C296 91 304 89 312 90" />
              <text className="bf-hand" x="308" y="222">h</text>
              <text className="bf-hand bf-small" x="318" y="84">v = 0</text>
            </g>

            {/* Ответ в красной рамке */}
            <g className="bf-answer" style={{ opacity: 0 }}>
              <text className="bf-hand" x="432" y="40">h = v₀² / 2g</text>
              <path className="bf-red" d="M428 56 C466 53 520 57 568 55 C570 70 569 86 570 96 C520 98 466 95 426 97 C424 84 426 68 432 53" />
              <text className="bf-hand bf-red-text" x="446" y="86">h = 20 м</text>
            </g>

            {/* Падение */}
            <g className="bf-land" style={{ opacity: 0 }}>
              <text className="bf-hand bf-small" x="516" y="326">t = 4 с</text>
            </g>

            {/* Линия балла ЕНТ */}
            <g className="bf-score-axis" style={{ opacity: 0 }}>
              <text className="bf-hand bf-score-label" x="70" y="60">{t('твой балл ЕНТ')}</text>
            </g>
            <path className="bf-score" d={SCORE} />
            {SCORE_DOTS.map(([x, y, label], i) => (
              <g key={label} className={`bf-dot bf-dot-${i}`} style={{ opacity: 0 }}>
                <circle cx={x} cy={y} r="5" />
                <text className="bf-hand" x={x - 10} y={y - 14}>{label}</text>
              </g>
            ))}
            <path className="bf-red bf-check" style={{ opacity: 0 }} d="M552 74 C556 78 559 84 561 90 C567 74 576 58 590 46" />
          </svg>
        </div>
      </div>
    </section>
  )
}
