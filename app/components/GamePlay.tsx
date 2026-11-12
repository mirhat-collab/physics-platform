'use client'
import { useEffect, useRef, useState } from 'react'
import MathText from '@/app/components/MathText'
import Figure from '@/app/components/Figure'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'

export type PublicTask = { question: string; options: string[]; topic: string; figure?: string }
const LETTERS = 'ABCD'

// Игра: задания подряд, нажал вариант — сразу следующее. Верные ответы
// придут только после сдачи (их проверяет сервер). seconds — лимит времени
// (блиц) или null (дуэль: время просто идёт).
export default function GamePlay({ tasks, seconds, onFinish }: { tasks: PublicTask[]; seconds: number | null; onFinish: (answers: (number | null)[], ms: number) => void }) {
  const { t } = useT()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => tasks.map(() => null))
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(start)
  const done = useRef(false)

  const elapsed = now - start
  const left = seconds === null ? null : Math.max(0, seconds * 1000 - elapsed)

  function finish(list = answers) {
    if (done.current) return
    done.current = true
    onFinish(list, Date.now() - start)
  }

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (left === 0) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])

  function choose(i: number | null) {
    const next = answers.map((a, k) => (k === index ? i : a))
    setAnswers(next)
    if (index + 1 >= tasks.length) finish(next)
    else setIndex(index + 1)
  }

  const q = tasks[index]
  const secs = Math.ceil((left ?? elapsed) / 1000)
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  return (
    <div className="animate-fade-in" style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${left === null ? ((index) / tasks.length) * 100 : (left / (seconds! * 1000)) * 100}%`, background: left !== null && left < 20000 ? 'var(--bad)' : 'var(--accent)', transition: 'width 0.25s linear' }} />
        </div>
        <b style={{ fontVariantNumeric: 'tabular-nums', color: left !== null && left < 20000 ? 'var(--bad)' : 'var(--text)' }}><Icon name="clock" size="1em" /> {clock}</b>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{index + 1} / {tasks.length}</span>
      </div>
      <div className="card" style={{ padding: '18px 16px' }}>
        <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{t(q.topic)}</div>
        <MathText text={q.question} style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 14 }} />
        <Figure svg={q.figure} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {q.options.map((o, i) => (
            <button key={i} onClick={() => choose(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 15 }}>
              <b style={{ color: 'var(--muted)', width: 18 }}>{LETTERS[i]}</b>
              <MathText text={o} style={{ flex: 1 }} />
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={() => choose(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>{t('Пропустить')}</button>
          <button onClick={() => finish()} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>{t('Завершить')}</button>
        </div>
      </div>
    </div>
  )
}
