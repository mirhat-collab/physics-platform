'use client'
import { useEffect, useState } from 'react'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'

// Общие детали симуляций: ползунок, показание прибора, блок задания, часы

export function Slider({ label, value, min, max, step, unit, onChange, disabled }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void; disabled?: boolean
}) {
  return (
    <label style={{ display: 'grid', gap: 4, fontSize: 14, opacity: disabled ? 0.55 : 1 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <MathText text={label} style={{ display: 'inline' }} />
        <b style={{ fontVariantNumeric: 'tabular-nums' }}>{String(Number(value.toFixed(2))).replace('.', ',')}{unit ? ` ${unit}` : ''}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
    </label>
  )
}

export function Readout({ label, value, hidden }: { label: string; value: string; hidden?: boolean }) {
  return (
    <div style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--surface-2)', minWidth: 110 }}>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}><MathText text={label} style={{ display: 'inline' }} /></div>
      <div style={{ fontWeight: 800, fontSize: 17, fontVariantNumeric: 'tabular-nums' }}>{hidden ? '?' : value}</div>
    </div>
  )
}

export const fmt = (v: number, d = 2) => (Number.isFinite(v) ? String(Number(v.toFixed(d))).replace('.', ',') : '∞')

// Блок задания: условие, «Проверить», итог и решение
export function TaskPanel({ question, solution, result, onCheck, onNext, checkLabel, note }: {
  question: string; solution: string; result: boolean | null; onCheck?: () => void; onNext: () => void; checkLabel?: string; note?: string
}) {
  const { t } = useT()
  const [show, setShow] = useState(false)
  const done = result !== null || show
  return (
    <div className="card" style={{ display: 'grid', gap: 12, borderColor: 'var(--accent)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{t('ЗАДАНИЕ')}</div>
      <MathText text={question} style={{ fontSize: 15, lineHeight: 1.6 }} />
      {note && result === null && <MathText text={note} style={{ fontSize: 13, color: 'var(--muted)' }} />}
      {result !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: result ? 'var(--good)' : 'var(--bad)' }}>
          <Icon name={result ? 'check' : 'x'} size={20} /> {result ? t('Правильно!') : t('Неверно.')}
        </div>
      )}
      {done && (
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{t('РЕШЕНИЕ')}</div>
          <MathText text={solution} style={{ fontSize: 15, lineHeight: 1.6 }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {result === null && onCheck && <button className="btn" onClick={onCheck}>{checkLabel ?? t('Проверить')}</button>}
        {done ? <button className="btn" onClick={() => { setShow(false); onNext() }}>{t('Новое задание')} <Icon name="arrowRight" size={18} /></button>
          : <button onClick={() => setShow(true)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>{t('Показать решение')}</button>}
      </div>
    </div>
  )
}

// Время с момента запуска (с), обновляется каждый кадр
export function useClock(running = true): [number, () => void] {
  const [start, setStart] = useState(() => performance.now())
  const [now, setNow] = useState(start)
  useEffect(() => {
    if (!running) return
    let id = 0
    const tick = () => { setNow(performance.now()); id = requestAnimationFrame(tick) }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [running])
  const reset = () => { const n = performance.now(); setStart(n); setNow(n) }
  return [Math.max(0, (now - start) / 1000), reset]
}

export function ModeSwitch({ task, onChange }: { task: boolean; onChange: (task: boolean) => void }) {
  const { t } = useT()
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button className={`chip${!task ? ' on' : ''}`} onClick={() => onChange(false)}>{t('Свободный опыт')}</button>
      <button className={`chip${task ? ' on' : ''}`} onClick={() => onChange(true)}>{t('Задание')}</button>
    </div>
  )
}
