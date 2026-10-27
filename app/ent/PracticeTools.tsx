'use client'
import { useState } from 'react'
import { solutionHints, type EntQuestion, type EntSubject } from '@/lib/ent'
import { entMistakePayload, logAnswers } from '@/lib/answer-log'
import Figure from '@/app/components/Figure'
import MathText from '@/app/components/MathText'
import { LETTERS } from './QuestionBody'
import { useT } from '@/app/components/LanguageProvider'

// Решить задачу ещё раз: варианты без подсказки, где верный, затем проверка,
// подсказки по шагам и решение. Ответ идёт в статистику.
export function RetryCard({ q, subject, onDone }: { q: EntQuestion; subject: EntSubject; onDone?: (ok: boolean) => void }) {
  const { t } = useT()
  const [chosen, setChosen] = useState<number | null>(null)
  const [hints, setHints] = useState(0)
  const steps = solutionHints(q.solution || '')
  const answered = chosen !== null

  function choose(i: number) {
    if (answered) return
    setChosen(i)
    const ok = i === q.correct
    logAnswers([{ source: 'ent', subject, section: q.section ?? null, topic: q.topic ?? null, correct: ok, payload: ok ? null : { ...entMistakePayload(q, i) } }])
    onDone?.(ok)
  }

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 14, display: 'grid', gap: 8 }}>
      <MathText text={q.question} style={{ fontSize: 15, lineHeight: 1.6 }} />
      <Figure svg={q.figure} />
      {q.options.map((opt, i) => {
        let border = 'var(--line)', bg = 'var(--surface-2)'
        if (answered && i === q.correct) { border = 'var(--good)'; bg = 'rgba(52,211,153,0.1)' }
        else if (answered && i === chosen) { border = 'var(--bad)'; bg = 'rgba(248,113,113,0.1)' }
        return (
          <button key={i} onClick={() => choose(i)} disabled={answered}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${border}`, background: bg, color: 'var(--text)', cursor: answered ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 14 }}>
            <b style={{ color: 'var(--muted)', width: 18 }}>{LETTERS[i]}</b>
            <MathText text={opt} style={{ flex: 1 }} />
          </button>
        )
      })}
      {!answered && hints > 0 && (
        <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(124,108,255,0.08)', border: '1px solid rgba(124,108,255,0.3)', display: 'grid', gap: 4 }}>
          {steps.slice(0, hints).map((s, k) => <MathText key={k} text={`${k + 1}. ${s}`} style={{ fontSize: 14 }} />)}
        </div>
      )}
      {!answered && hints < steps.length && (
        <button onClick={() => setHints(hints + 1)} style={{ justifySelf: 'start', background: 'none', border: 'none', color: '#c4bbff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>
          💡 {hints ? t('Следующий шаг ({a}/{b})', { a: hints + 1, b: steps.length }) : t('Подсказка')}
        </button>
      )}
      {answered && (
        <>
          <div style={{ fontWeight: 700, color: chosen === q.correct ? 'var(--good)' : 'var(--bad)' }}>
            {chosen === q.correct ? t('Теперь верно!') : t('Неверно. Правильный ответ: {v0}', { v0: LETTERS[q.correct] })}
          </div>
          {q.solution && <MathText text={q.solution} style={{ fontSize: 14, color: 'var(--muted)' }} />}
        </>
      )}
    </div>
  )
}

// Под разбором ошибки: «Решить ещё раз» (то же задание, ответ скрыт)
// и «Похожая задача» (новое задание той же темы)
export default function PracticeTools({ q, subject, retry = true }: { q: EntQuestion; subject: EntSubject; retry?: boolean }) {
  const { t } = useT()
  const [mode, setMode] = useState<'none' | 'retry' | 'similar'>('none')
  const [similar, setSimilar] = useState<EntQuestion | null>(null)
  const [round, setRound] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [streak, setStreak] = useState(0)

  async function loadSimilar() {
    if (!q.topic) return
    setMode('similar')
    setLoading(true)
    setError('')
    try {
      // У теоретических тем шаблонов немного — не показываем то же условие повторно
      let next: EntQuestion | null = null
      for (let attempt = 0; attempt < 4; attempt++) {
        const res = await fetch('/api/ent/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, section: 'all', topics: [q.topic], count: 1, difficulty: q.options.length > 4 ? 'hard' : 'ent', templatesOnly: true }),
        })
        const data = await res.json()
        if (!res.ok || !data.questions?.length) throw new Error(t(data.error || 'Ошибка'))
        next = data.questions[0] as EntQuestion
        if (next.question !== q.question && next.question !== similar?.question) break
      }
      setSimilar(next)
      setRound(r => r + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'))
    }
    setLoading(false)
  }

  const btn = { background: 'none', border: '1px solid var(--line)', borderRadius: 999, padding: '6px 12px', color: 'var(--text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' } as const

  return (
    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {retry && <button style={btn} onClick={() => setMode(mode === 'retry' ? 'none' : 'retry')}>🔁 {t('Решить ещё раз')}</button>}
        {q.topic && <button style={btn} onClick={loadSimilar} disabled={loading}>🎲 {loading ? t('Загрузка…') : similar ? t('Ещё похожую') : t('Похожая задача')}</button>}
        {streak > 0 && <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--good)' }}>{t('Верно подряд: {n}', { n: streak })}</span>}
      </div>
      {mode === 'retry' && <RetryCard key="retry" q={q} subject={subject} />}
      {mode === 'similar' && error && <div style={{ color: 'var(--bad)', fontSize: 14 }}>{error}</div>}
      {mode === 'similar' && similar && !loading && (
        <RetryCard key={round} q={similar} subject={subject} onDone={ok => setStreak(s => (ok ? s + 1 : 0))} />
      )}
    </div>
  )
}
