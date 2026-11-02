'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { solutionSteps, type EntQuestion, type EntSubject } from '@/lib/ent'
import { entMistakePayload, logAnswers } from '@/lib/answer-log'
import { kzDate } from '@/lib/streak'
import Figure from '@/app/components/Figure'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import { LETTERS } from '@/app/ent/QuestionBody'
import { useT } from '@/app/components/LanguageProvider'

const SUBJECTS: { id: EntSubject; label: string; icon: string }[] = [
  { id: 'physics', label: 'Физика', icon: 'zap' },
  { id: 'math', label: 'Математика', icon: 'formula' },
]

// Что ученик выбрал сегодня — запоминаем в браузере, чтобы задача не решалась дважды
const key = (subject: EntSubject) => `daily:${kzDate()}:${subject}`
function readChoice(subject: EntSubject): number | null {
  try { const v = localStorage.getItem(key(subject)); return v === null ? null : Number(v) } catch { return null }
}

export default function DailyPage() {
  const { t, dateLocale } = useT()
  const [subject, setSubject] = useState<EntSubject>('physics')
  const [q, setQ] = useState<EntQuestion | null>(null)
  const [error, setError] = useState('')
  const [chosen, setChosen] = useState<number | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('subject')
    if (p === 'math') setSubject('math') // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  useEffect(() => {
    let alive = true
    setQ(null); setError(''); setChosen(readChoice(subject)) // eslint-disable-line react-hooks/set-state-in-effect
    fetch(`/api/daily?subject=${subject}`).then(r => r.json()).then(d => {
      if (!alive) return
      if (d.question) setQ(d.question); else setError(t(d.error || 'Ошибка'))
    }).catch(() => alive && setError(t('Нет связи. Попробуй ещё раз.')))
    return () => { alive = false }
  }, [subject, t])

  function choose(i: number) {
    if (!q || chosen !== null) return
    setChosen(i)
    try { localStorage.setItem(key(subject), String(i)) } catch {}
    const ok = i === q.correct
    logAnswers([{ source: 'ent', subject, section: q.section ?? null, topic: q.topic ?? null, correct: ok, payload: ok ? null : { ...entMistakePayload(q, i) } }])
  }

  const ok = q && chosen !== null && chosen === q.correct
  const steps = q && chosen !== null ? solutionSteps(q.solution || '') : []

  return (
    <div className="nb-root page animate-fade-in-up">
      <p className="nb-eyebrow">{new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' })}</p>
      <h1 className="page-title">{t('Задача дня')}</h1>
      <p className="page-sub">{t('Каждый день — новая задача уровня ЕНТ. Одна и та же для всех учеников.')}</p>

      <div className="tc-tabs" role="tablist" style={{ marginBottom: 16 }}>
        {SUBJECTS.map(s => (
          <button key={s.id} type="button" role="tab" aria-selected={subject === s.id} className={subject === s.id ? 'on' : ''} onClick={() => setSubject(s.id)}>
            <Icon name={s.icon} size={16} /> {t(s.label)}
          </button>
        ))}
      </div>

      <div className="card daily-card">
        {error ? (
          <p style={{ color: 'var(--bad)' }}>{error}</p>
        ) : !q ? (
          <div className="daily-skeleton" aria-busy="true"><i /><i /><i /><span className="sr-only">{t('Загрузка…')}</span></div>
        ) : (
          <>
            {q.topic && <span className="daily-topic">{t(q.topic)}</span>}
            <MathText text={q.question} style={{ fontSize: 17, margin: '10px 0 12px' }} />
            <Figure svg={q.figure} />
            <div style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
              {q.options.map((opt, i) => {
                let cls = 'review-opt'
                if (chosen !== null && i === q.correct) cls += ' good'
                else if (chosen === i) cls += ' bad'
                return (
                  <button key={i} type="button" className={cls} onClick={() => choose(i)} disabled={chosen !== null}>
                    <span className="review-opt-l">{LETTERS[i]}</span>
                    <MathText text={opt} style={{ flex: 1 }} />
                  </button>
                )
              })}
            </div>
            {chosen !== null && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div className={`review-verdict ${ok ? 'good' : 'bad'}`}>
                  <Icon name={ok ? 'trophy' : 'refresh'} size={18} />
                  <span>{ok ? t('Верно! Приходи завтра за новой задачей.') : t('Не страшно — задача попадёт в «Работу над ошибками».')}</span>
                </div>
                {steps.length > 0 && (
                  <div className="daily-solution">
                    <b>{t('Решение')}</b>
                    <ol>{steps.map((s, i) => <li key={i}><MathText text={s} /></li>)}</ol>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {!ok && <Link href="/review" className="btn" style={{ textDecoration: 'none' }}><Icon name="repeat" size={18} /> {t('Работа над ошибками')}</Link>}
                  <Link href={`/ent?subject=${subject}`} className={ok ? 'btn' : 'btn btn-ghost'} style={{ textDecoration: 'none' }}><Icon name="target" size={18} /> {t('Ещё задания')}</Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
