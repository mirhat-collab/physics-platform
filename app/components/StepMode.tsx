'use client'
import { useState, useSyncExternalStore } from 'react'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'
import { guidedSteps, isCorrectNumber, parseAnswer, type Step } from '@/lib/solve'

const KEY = 'mirha-step-mode'

// Включён ли режим «По шагам» — выбор ученика запоминается в браузере.
// useSyncExternalStore: на сервере режим выключен, в браузере читаем
// сохранённый выбор без расхождения при гидратации.
const listeners = new Set<() => void>()
function readStep(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}
function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } }
export function useStepMode(): [boolean, (v: boolean) => void] {
  const on = useSyncExternalStore(subscribe, readStep, () => false)
  const set = (v: boolean) => {
    try { localStorage.setItem(KEY, v ? '1' : '0') } catch {}
    listeners.forEach(fn => fn())
  }
  return [on, set]
}

// Переключатель справа в заголовке задания
export function StepToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const { t } = useT()
  return (
    <label title={t('Решать задачу по шагам: сначала промежуточные значения, потом ответ')}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: on ? 'var(--accent)' : 'var(--muted)', textTransform: 'none', userSelect: 'none', flexShrink: 0 }}>
      {t('По шагам')}
      <input type="checkbox" role="switch" checked={on} onChange={e => onChange(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
      <span aria-hidden="true" style={{ width: 34, height: 20, borderRadius: 999, background: on ? 'var(--accent)' : 'var(--surface-2)', border: '1px solid var(--line)', position: 'relative', transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: on ? '#fff' : 'var(--muted)', transition: 'left 0.2s' }} />
      </span>
    </label>
  )
}

const input: React.CSSProperties = { width: 120, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', fontSize: 15, fontFamily: 'inherit' }
const link: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }

// Решение по шагам: ученик сам находит промежуточные значения, шаг за шагом.
// Последний шаг (с ответом) не показываем — ответ ученик даёт в задании.
export default function StepMode({ solution, onFinish }: { solution: string; onFinish?: () => void }) {
  const { t } = useT()
  const all = guidedSteps(solution)
  const steps: Step[] = all.length > 1 ? all.slice(0, -1) : []
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)
  const [revealed, setRevealed] = useState<Record<number, 'ok' | 'shown'>>({})

  if (!steps.length) {
    return <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t('У этой задачи решение в одно действие — решай сразу.')}</div>
  }

  function next(mark: 'ok' | 'shown') {
    setRevealed(r => ({ ...r, [index]: mark }))
    setValue('')
    setWrong(false)
    if (index + 1 >= steps.length) onFinish?.()
    setIndex(index + 1)
  }

  function check() {
    const v = parseAnswer(value), s = steps[index]
    if (v === null || s.value === undefined) return
    if (isCorrectNumber(v, s.value)) next('ok')
    else setWrong(true)
  }

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'color-mix(in srgb, var(--accent) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{t('РЕШАЕМ ПО ШАГАМ')} · {Math.min(index + 1, steps.length)}/{steps.length}</div>
      {steps.slice(0, index).map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Icon name={revealed[i] === 'ok' ? 'check' : 'bulb'} size={16} style={{ color: revealed[i] === 'ok' ? 'var(--good)' : 'var(--muted)', marginTop: 3, flexShrink: 0 }} />
          <MathText text={s.text} style={{ fontSize: 14 }} />
        </div>
      ))}
      {index < steps.length ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <MathText text={steps[index].prompt ?? steps[index].text} style={{ fontSize: 14, fontWeight: 600 }} />
          {steps[index].value !== undefined ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={value} onChange={e => { setValue(e.target.value); setWrong(false) }} onKeyDown={e => { if (e.key === 'Enter') check() }}
                inputMode="decimal" placeholder={t('Число')} aria-label={t('Промежуточное значение')} style={{ ...input, borderColor: wrong ? 'var(--bad)' : 'var(--line)' }} />
              <button className="btn" onClick={check} disabled={parseAnswer(value) === null} style={{ padding: '8px 14px' }}>{t('Проверить')}</button>
              <button style={link} onClick={() => next('shown')}>{t('Показать шаг')}</button>
              {wrong && <span style={{ color: 'var(--bad)', fontSize: 13 }}>{t('Не то — попробуй ещё раз')}</span>}
            </div>
          ) : (
            <button className="btn btn-ghost" onClick={() => next('ok')} style={{ justifySelf: 'start', padding: '6px 14px' }}>{t('Понятно, дальше')}</button>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 14, color: 'var(--good)', fontWeight: 700 }}>{t('Шаги пройдены — теперь найди ответ.')}</div>
      )}
    </div>
  )
}
