'use client'
import { useState } from 'react'
import { LENS_D, lensImage, lensOk, lensTask, type LensTask } from '@/lib/sim'
import { useT } from '@/app/components/LanguageProvider'
import { ModeSwitch, Readout, Slider, TaskPanel, fmt } from './parts'

const W = 680, H = 280, CX = 340, AX = 140, S = 5, OBJ = 46 // S — пикселей на сантиметр

// Луч от (x1, y1) через (x2, y2) до края рисунка
function ray(x1: number, y1: number, x2: number, y2: number, toX: number) {
  const k = (y2 - y1) / (x2 - x1)
  return { x: toX, y: y1 + k * (toX - x1) }
}

// Собирающая линза: построение изображения тремя лучами
export default function Lens() {
  const { t, locale } = useT()
  const [d, setD] = useState(30)
  const [F0, setF] = useState(12)
  const [task, setTask] = useState<LensTask | null>(null)
  const [result, setResult] = useState<boolean | null>(null)
  const F = task?.F ?? F0
  const im = lensImage(d, F)
  const hide = !!task && result === null

  const ox = CX - d * S, top = AX - OBJ
  const lines: React.ReactNode[] = []
  let image: React.ReactNode = null
  const solid = { stroke: 'var(--warn)', strokeWidth: 1.6 }
  const dashed = { ...solid, strokeDasharray: '5 4', opacity: 0.8 }
  // луч 1: параллельно оси, после линзы — через фокус
  const r1 = ray(CX, top, CX + F * S, AX, W)
  lines.push(<line key="1a" x1={ox} y1={top} x2={CX} y2={top} style={solid} />, <line key="1b" x1={CX} y1={top} x2={r1.x} y2={r1.y} style={solid} />)
  // луч 2: через оптический центр
  const r2 = ray(ox, top, CX, AX, W)
  lines.push(<line key="2" x1={ox} y1={top} x2={r2.x} y2={r2.y} style={solid} />)
  if (im) {
    const ix = CX + im.f * S, iy = AX + (im.f / d) * OBJ
    // луч 3: через передний фокус, после линзы — параллельно оси
    if (d > F) {
      const hitY = ray(ox, top, CX - F * S, AX, CX).y
      lines.push(<line key="3a" x1={ox} y1={top} x2={CX} y2={hitY} style={solid} />, <line key="3b" x1={CX} y1={hitY} x2={W} y2={hitY} style={solid} />)
    } else {
      lines.push(<line key="3v1" x1={CX} y1={top} x2={ix} y2={iy} style={dashed} />, <line key="3v2" x1={ox} y1={top} x2={ix} y2={iy} style={dashed} />)
    }
    if (Math.abs(ix) < 4 * W) {
      const c = im.real ? 'var(--good)' : 'var(--accent)'
      image = (
        <g style={{ opacity: im.real ? 1 : 0.85 }}>
          <line x1={ix} y1={AX} x2={ix} y2={iy} style={{ stroke: c, strokeWidth: 3, strokeDasharray: im.real ? undefined : '6 4' }} />
          <polygon points={`${ix},${iy} ${ix - 6},${iy + (iy > AX ? -10 : 10)} ${ix + 6},${iy + (iy > AX ? -10 : 10)}`} style={{ fill: c }} />
        </g>
      )
    }
  }

  const newTask = () => { setTask(lensTask(locale)); setResult(null) }
  const marks = [-2, -1, 1, 2].map(k => ({ x: CX + k * F * S, label: `${Math.abs(k) === 2 ? '2' : ''}F` }))

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <ModeSwitch task={!!task} onChange={on => (on ? newTask() : (setTask(null), setResult(null)))} />
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 14 }} role="img">
        <defs><clipPath id="lens-clip"><rect x={0} y={0} width={W} height={H} /></clipPath></defs>
        <g clipPath="url(#lens-clip)">
          <line x1={0} y1={AX} x2={W} y2={AX} style={{ stroke: 'var(--muted)' }} strokeWidth={1.2} />
          {marks.map(m => (
            <g key={m.x}>
              <line x1={m.x} y1={AX - 5} x2={m.x} y2={AX + 5} style={{ stroke: 'currentColor' }} strokeWidth={1.5} />
              <text x={m.x} y={AX + 20} textAnchor="middle" fontSize={12} style={{ fill: 'currentColor' }}>{m.label}</text>
            </g>
          ))}
          <line x1={CX} y1={AX - 110} x2={CX} y2={AX + 110} style={{ stroke: 'var(--accent)' }} strokeWidth={3} />
          <polygon points={`${CX},${AX - 118} ${CX - 8},${AX - 104} ${CX + 8},${AX - 104}`} style={{ fill: 'var(--accent)' }} />
          <polygon points={`${CX},${AX + 118} ${CX - 8},${AX + 104} ${CX + 8},${AX + 104}`} style={{ fill: 'var(--accent)' }} />
          {lines}
          {image}
          <line x1={ox} y1={AX} x2={ox} y2={top} style={{ stroke: 'currentColor', strokeWidth: 3 }} />
          <polygon points={`${ox},${top - 2} ${ox - 6},${top + 9} ${ox + 6},${top + 9}`} style={{ fill: 'currentColor' }} />
        </g>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <Slider label={t('Расстояние до предмета $d$')} value={d} {...LENS_D} unit={t('см')} onChange={setD} disabled={result !== null} />
        <Slider label={t('Фокусное расстояние $F$')} value={F} min={5} max={25} step={1} unit={t('см')} onChange={setF} disabled={!!task} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Readout label={t('Расстояние до изображения $f$')} value={im ? `${fmt(Math.abs(im.f), 1)} ${t('см')}` : '∞'} hidden={hide} />
        <Readout label={t('Увеличение $\\Gamma$')} value={im ? fmt(im.gamma) : '∞'} hidden={hide} />
        <Readout label={t('Изображение')} value={!im ? t('нет (предмет в фокусе)') : im.real ? t('действительное, перевёрнутое') : t('мнимое, прямое')} />
      </div>
      {task && (
        <TaskPanel question={task.question} solution={task.solution} result={result} onNext={newTask} onCheck={() => setResult(lensOk(task, d))}
          note={t('Расстояние до изображения и увеличение скрыты до проверки — посчитай $d$ по формуле линзы.')} />
      )}
    </div>
  )
}
