'use client'
import { useState } from 'react'
import { CIRCUIT_R2, circuit, circuitOk, circuitTask, type CircuitTask, type Connection } from '@/lib/sim'
import { useT } from '@/app/components/LanguageProvider'
import { ModeSwitch, Readout, Slider, TaskPanel, fmt } from './parts'

const wire = { stroke: 'currentColor', strokeWidth: 2, fill: 'none' }

function Resistor({ x, y, vertical, label }: { x: number; y: number; vertical?: boolean; label: string }) {
  const w = vertical ? 18 : 52, h = vertical ? 52 : 18
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} style={{ fill: 'var(--surface-2)', stroke: 'currentColor', strokeWidth: 2 }} />
      <text x={vertical ? x + 16 : x} y={vertical ? y + 4 : y - 16} textAnchor={vertical ? 'start' : 'middle'} fontSize={13} fontStyle="italic" style={{ fill: 'currentColor' }}>{label}</text>
    </g>
  )
}

function Meter({ x, y, letter, value, below }: { x: number; y: number; letter: string; value: string; below?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={16} style={{ fill: 'var(--surface)', stroke: 'currentColor', strokeWidth: 2 }} />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={700} style={{ fill: 'currentColor' }}>{letter}</text>
      <text x={x} y={below ? y + 36 : y - 24} textAnchor="middle" fontSize={13} fontWeight={700} style={{ fill: 'var(--accent)' }}>{value}</text>
    </g>
  )
}

// Электрическая цепь: источник с внутренним сопротивлением, два резистора,
// амперметр в общей цепи и вольтметр на R2
export default function Circuit() {
  const { t, locale } = useT()
  const [E0, setE] = useState(12)
  const [r0, setR] = useState(1)
  const [R10, setR1] = useState(4)
  const [R2, setR2] = useState(6)
  const [mode0, setMode] = useState<Connection>('series')
  const [task, setTask] = useState<CircuitTask | null>(null)
  const [result, setResult] = useState<boolean | null>(null)
  const E = task?.E ?? E0, r = task?.r ?? r0, R1 = task?.R1 ?? R10, mode = task?.mode ?? mode0
  const c = circuit(E, r, R1, R2, mode)
  const hide = !!task && result === null
  const amp = hide ? '? A' : `${fmt(c.I)} A`
  const volt = hide ? `? ${t('В')}` :`${fmt(c.U2)} ${t('В')}`
  const speed = Math.max(0.3, Math.min(4, 6 / Math.max(c.I, 0.05)))

  const newTask = () => { setTask(circuitTask(locale)); setResult(null) }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <ModeSwitch task={!!task} onChange={on => (on ? newTask() : (setTask(null), setResult(null)))} />
      <svg viewBox="0 0 560 270" style={{ width: '100%', maxWidth: 640, background: 'var(--surface-2)', borderRadius: 14 }} role="img">
        <style>{`@keyframes sim-flow { to { stroke-dashoffset: -24; } } .sim-flow { stroke: var(--accent); stroke-width: 2; fill: none; stroke-dasharray: 4 8; opacity: .7; animation: sim-flow ${speed}s linear infinite; }`}</style>
        {/* источник слева */}
        <path d="M60 40 V112 M60 148 V230" style={wire} />
        <line x1={44} y1={112} x2={76} y2={112} style={{ stroke: 'currentColor', strokeWidth: 2 }} />
        <line x1={52} y1={124} x2={68} y2={124} style={{ stroke: 'currentColor', strokeWidth: 5 }} />
        <line x1={60} y1={124} x2={60} y2={148} style={wire} />
        <text x={18} y={124} fontSize={13} fontStyle="italic" style={{ fill: 'currentColor' }}>ℰ, r</text>
        {mode === 'series' ? (
          <>
            <path d="M60 40 H164 M196 40 H294 M346 40 H420 V104 M420 156 V230 H60" style={wire} />
            <path className="sim-flow" d="M60 230 V148 M60 112 V40 H420 V230 H60" />
            <Resistor x={320} y={40} label="R₁" />
            <Resistor x={420} y={130} vertical label="R₂" />
            <path d="M420 80 H500 V114 M500 146 V180 H420" style={{ ...wire, strokeWidth: 1.5 }} />
            <Meter x={500} y={130} letter="V" value={volt} below />
          </>
        ) : (
          <>
            <path d="M60 40 H164 M196 40 H420 M300 40 V104 M300 156 V230 M420 40 V104 M420 156 V230 M420 230 H60" style={wire} />
            <path className="sim-flow" d="M60 230 V148 M60 112 V40 H420 V230 H60 M300 40 V230" />
            <circle cx={300} cy={40} r={3.5} style={{ fill: 'currentColor' }} /><circle cx={300} cy={230} r={3.5} style={{ fill: 'currentColor' }} />
            <Resistor x={300} y={130} vertical label="R₁" />
            <Resistor x={420} y={130} vertical label="R₂" />
            <path d="M420 80 H500 V114 M500 146 V180 H420" style={{ ...wire, strokeWidth: 1.5 }} />
            <Meter x={500} y={130} letter="V" value={volt} below />
          </>
        )}
        <Meter x={180} y={40} letter="A" value={amp} />
      </svg>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className={`chip${mode === 'series' ? ' on' : ''}`} disabled={!!task} onClick={() => setMode('series')}>{t('Последовательно')}</button>
        <button className={`chip${mode === 'parallel' ? ' on' : ''}`} disabled={!!task} onClick={() => setMode('parallel')}>{t('Параллельно')}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <Slider label={t('ЭДС $\\mathcal{E}$')} value={E} min={1} max={24} step={1} unit={t('В')} onChange={setE} disabled={!!task} />
        <Slider label={t('Внутреннее сопротивление $r$')} value={r} min={0} max={4} step={1} unit={t('Ом')} onChange={setR} disabled={!!task} />
        <Slider label="$R_1$" value={R1} min={1} max={20} step={1} unit={t('Ом')} onChange={setR1} disabled={!!task} />
        <Slider label="$R_2$" value={R2} {...CIRCUIT_R2} unit={t('Ом')} onChange={setR2} disabled={result !== null} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Readout label={t('Сопротивление цепи $R$')} value={`${fmt(c.R)} ${t('Ом')}`} hidden={hide} />
        <Readout label="$I_1$" value={`${fmt(c.I1)} A`} hidden={hide} />
        <Readout label="$I_2$" value={`${fmt(c.I2)} A`} hidden={hide} />
        <Readout label="$U_1$" value={`${fmt(c.U1)} ${t('В')}`} hidden={hide} />
      </div>
      {task && (
        <TaskPanel question={task.question} solution={task.solution} result={result} onNext={newTask} onCheck={() => setResult(circuitOk(task, R2))}
          note={t('Показания приборов скрыты до проверки — посчитай $R_2$ по закону Ома для полной цепи.')} />
      )}
    </div>
  )
}
