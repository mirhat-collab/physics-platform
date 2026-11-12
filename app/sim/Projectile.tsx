'use client'
import { useEffect, useState } from 'react'
import { G_THROW, projectileHeight, projectileOk, projectileRange, projectileTask, projectileTime, type ProjectileTask } from '@/lib/sim'
import { useT } from '@/app/components/LanguageProvider'
import { ModeSwitch, Readout, Slider, TaskPanel, fmt } from './parts'

const W = 680, H = 300, X0 = 34, GY = 262
type Shot = { v0: number; deg: number; range: number }

// Бросок под углом к горизонту: траектория, дальность, высота
export default function Projectile() {
  const { t, locale } = useT()
  const [v00, setV0] = useState(15)
  const [deg, setDeg] = useState(30)
  const [task, setTask] = useState<ProjectileTask | null>(null)
  const [shots, setShots] = useState<Shot[]>([])
  const [flight, setFlight] = useState<{ shot: Shot; start: number; now: number } | null>(null)
  const [hit, setHit] = useState<boolean | null>(null)
  const v0 = task?.v0 ?? v00

  // Масштаб: чтобы влезли самая дальняя траектория и мишень
  const maxRange = Math.max(task ? task.distance * 1.35 : 0, (v0 * v0) / G_THROW, 10)
  const S = Math.min((W - X0 - 20) / maxRange, (GY - 30) / Math.max(projectileHeight(v0, 85), 4))
  const path = (s: Shot, upTo = Infinity) => {
    const T = projectileTime(s.v0, s.deg), n = 60, pts: string[] = []
    const rad = (s.deg * Math.PI) / 180
    for (let i = 0; i <= n; i++) {
      const tt = Math.min((T * i) / n, upTo)
      pts.push(`${X0 + s.v0 * Math.cos(rad) * tt * S},${GY - (s.v0 * Math.sin(rad) * tt - (G_THROW * tt * tt) / 2) * S}`)
      if (tt >= upTo) break
    }
    return pts.join(' ')
  }

  // Полёт мяча: быстрее реального, но не дольше 2 с
  const speedUp = (T: number) => Math.max(1, T / 2)
  useEffect(() => {
    if (!flight) return
    const { shot, start } = flight
    const T = projectileTime(shot.v0, shot.deg)
    let id = 0
    const tick = () => {
      const now = performance.now()
      if (((now - start) / 1000) * speedUp(T) >= T) {
        // мяч упал
        setShots(list => [shot, ...list].slice(0, 4))
        if (task) setHit(h => h || projectileOk(task, shot.deg))
        setFlight(null)
        return
      }
      setFlight(f => (f ? { ...f, now } : f))
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [flight?.start]) // eslint-disable-line react-hooks/exhaustive-deps

  const T = flight ? projectileTime(flight.shot.v0, flight.shot.deg) : 0
  const tf = flight ? Math.min(((flight.now - flight.start) / 1000) * speedUp(T), T) : 0

  const fire = () => { if (!flight) { const now = performance.now(); setFlight({ shot: { v0, deg, range: projectileRange(v0, deg) }, start: now, now }) } }
  const newTask = () => { setTask(projectileTask(locale)); setShots([]); setHit(null); setFlight(null) }
  const ball = flight ? (() => {
    const rad = (flight.shot.deg * Math.PI) / 180
    return { x: X0 + flight.shot.v0 * Math.cos(rad) * tf * S, y: GY - (flight.shot.v0 * Math.sin(rad) * tf - (G_THROW * tf * tf) / 2) * S }
  })() : null
  const last = shots[0]
  const ticks = Array.from({ length: Math.floor(maxRange / 5) + 1 }, (_, i) => i * 5)

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <ModeSwitch task={!!task} onChange={on => (on ? newTask() : (setTask(null), setShots([]), setHit(null)))} />
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 14 }} role="img">
        <line x1={0} y1={GY} x2={W} y2={GY} style={{ stroke: 'currentColor' }} strokeWidth={2} />
        {ticks.map(m => (
          <g key={m}>
            <line x1={X0 + m * S} y1={GY} x2={X0 + m * S} y2={GY + 6} style={{ stroke: 'var(--muted)' }} />
            <text x={X0 + m * S} y={GY + 20} textAnchor="middle" fontSize={11} style={{ fill: 'var(--muted)' }}>{m}</text>
          </g>
        ))}
        <text x={W - 8} y={GY + 34} textAnchor="end" fontSize={11} style={{ fill: 'var(--muted)' }}>{t('м')}</text>
        {task && (
          <g>
            <rect x={X0 + (task.distance - task.tolerance) * S} y={GY - 6} width={2 * task.tolerance * S} height={6} style={{ fill: hit ? 'var(--good)' : 'var(--bad)' }} />
            <line x1={X0 + task.distance * S} y1={GY - 6} x2={X0 + task.distance * S} y2={GY - 46} style={{ stroke: 'currentColor' }} strokeWidth={2} />
            <polygon points={`${X0 + task.distance * S},${GY - 46} ${X0 + task.distance * S + 20},${GY - 39} ${X0 + task.distance * S},${GY - 32}`} style={{ fill: hit ? 'var(--good)' : 'var(--bad)' }} />
          </g>
        )}
        {shots.map((s, i) => <polyline key={i} points={path(s)} style={{ fill: 'none', stroke: 'var(--accent)', opacity: i === 0 ? 0.9 : 0.3 }} strokeWidth={2} strokeDasharray={i === 0 ? undefined : '5 5'} />)}
        {flight && <polyline points={path(flight.shot, tf)} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2} />}
        {/* пушка */}
        <g transform={`rotate(${-deg} ${X0} ${GY})`}><rect x={X0 - 4} y={GY - 6} width={34} height={12} rx={4} style={{ fill: 'currentColor' }} /></g>
        <circle cx={X0} cy={GY} r={9} style={{ fill: 'var(--muted)' }} />
        {ball && <circle cx={ball.x} cy={ball.y} r={7} style={{ fill: 'var(--warn)' }} />}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <Slider label={t('Угол к горизонту $\\alpha$')} value={deg} min={5} max={85} step={1} unit="°" onChange={setDeg} />
        <Slider label={t('Начальная скорость $v_0$')} value={v0} min={5} max={25} step={1} unit={t('м/с')} onChange={setV0} disabled={!!task} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn" onClick={fire} disabled={!!flight}>{t('Бросить')}</button>
        {last && <span style={{ fontSize: 14, color: 'var(--muted)' }}>{t('Мяч упал на расстоянии {s} м', { s: fmt(last.range, 1) })}</span>}
      </div>
      {!task && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Readout label={t('Дальность $s$')} value={`${fmt(projectileRange(v0, deg), 1)} ${t('м')}`} />
          <Readout label={t('Наибольшая высота $h$')} value={`${fmt(projectileHeight(v0, deg), 1)} ${t('м')}`} />
          <Readout label={t('Время полёта $t$')} value={`${fmt(projectileTime(v0, deg))} ${t('с')}`} />
        </div>
      )}
      {task && (
        <TaskPanel question={task.question} solution={task.solution} result={hit ? true : null} onNext={newTask}
          note={shots.length ? t('Бросков: {n}. Посчитай угол по формуле дальности — так попадёшь с первого раза.', { n: shots.length }) : t('Посчитай угол, поставь его и нажми «Бросить».')} />
      )}
    </div>
  )
}
