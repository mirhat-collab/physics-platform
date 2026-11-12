'use client'
import { useState } from 'react'
import { PENDULUM_L, PLANET_G, PLANET_NAME, pendulumOk, pendulumPeriod, pendulumTask, type PendulumTask, type Planet } from '@/lib/sim'
import { useT } from '@/app/components/LanguageProvider'
import { ModeSwitch, Readout, Slider, TaskPanel, fmt, useClock } from './parts'

// Математический маятник: длина нити и планета → период
export default function Pendulum() {
  const { t, locale } = useT()
  const [planet, setPlanet] = useState<Planet>('earth')
  const [l, setL] = useState(1)
  const [task, setTask] = useState<PendulumTask | null>(null)
  const [result, setResult] = useState<boolean | null>(null)
  const [time, resetClock] = useClock()

  const g = PLANET_G[task?.planet ?? planet]
  const T = pendulumPeriod(l, g)
  const theta = (14 * Math.PI / 180) * Math.cos((2 * Math.PI * time) / T)
  const len = 40 + (l / PENDULUM_L.max) * 210
  const bob = { x: 170 + len * Math.sin(theta), y: 24 + len * Math.cos(theta) }
  const hide = !!task && result === null

  const newTask = () => { setTask(pendulumTask(locale)); setResult(null); resetClock() }
  const change = (v: number) => { setL(v); resetClock() }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <ModeSwitch task={!!task} onChange={on => (on ? newTask() : (setTask(null), setResult(null)))} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'start' }}>
        <svg viewBox="0 0 340 300" style={{ width: '100%', maxWidth: 380, background: 'var(--surface-2)', borderRadius: 14 }} role="img">
          <rect x={110} y={14} width={120} height={10} rx={2} style={{ fill: 'var(--muted)' }} />
          {Array.from({ length: 8 }, (_, i) => <line key={i} x1={116 + i * 15} y1={14} x2={108 + i * 15} y2={6} style={{ stroke: 'var(--muted)' }} strokeWidth={1.5} />)}
          <line x1={170} y1={24} x2={170} y2={24 + len + 14} style={{ stroke: 'var(--line)' }} strokeDasharray="4 4" />
          <line x1={170} y1={24} x2={bob.x} y2={bob.y} style={{ stroke: 'currentColor' }} strokeWidth={1.8} />
          <circle cx={bob.x} cy={bob.y} r={13} style={{ fill: 'var(--accent)' }} />
          <text x={180} y={24 + len / 2} fontSize={13} fontStyle="italic" style={{ fill: 'currentColor' }}>l</text>
        </svg>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(Object.keys(PLANET_G) as Planet[]).map(p => (
              <button key={p} className={`chip${(task?.planet ?? planet) === p ? ' on' : ''}`} disabled={!!task} onClick={() => { setPlanet(p); resetClock() }}>
                {PLANET_NAME[p][locale === 'kk' ? 1 : 0]} · {fmt(PLANET_G[p], 1)}
              </button>
            ))}
          </div>
          <Slider label={t('Длина нити $l$')} value={l} {...PENDULUM_L} unit={t('м')} onChange={change} disabled={result !== null} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Readout label={t('Период $T$')} value={`${fmt(T)} ${t('с')}`} hidden={hide} />
            <Readout label={t('Секундомер')} value={`${fmt(time, 1)} ${t('с')}`} />
            <Readout label={t('Полных колебаний')} value={String(Math.floor(time / T))} hidden={hide} />
          </div>
          <button className="btn btn-ghost" onClick={resetClock} style={{ justifySelf: 'start' }}>{t('Секундомер с нуля')}</button>
        </div>
      </div>
      {task && (
        <TaskPanel question={task.question} solution={task.solution} result={result} onNext={newTask}
          onCheck={() => setResult(pendulumOk(task, l))}
          note={t('Период скрыт: посчитай длину по формуле, поставь ползунок и нажми «Проверить». Можно и измерить — секундомером.')} />
      )}
    </div>
  )
}
