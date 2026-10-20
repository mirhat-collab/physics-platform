'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ENT_BATCH, ENT_COUNTS, ENT_DIFFICULTIES, ENT_SUBJECTS, type EntDifficulty, type EntQuestion, type EntSubject } from '@/lib/ent'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import Explain from './Explain'

type Turn = { role: 'user' | 'assistant'; content: string }
type Attempt = { subject: string; total: number; correct: number; created_at: string }

const LETTERS = 'ABCDE'
const SKIPPED = -1

export default function EntPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [subject, setSubject] = useState<EntSubject>('physics')
  const [section, setSection] = useState('all')
  const [difficulty, setDifficulty] = useState<EntDifficulty>('ent')
  const [count, setCount] = useState<number>(5)
  const [attempts, setAttempts] = useState<Attempt[]>([])

  const [mode, setMode] = useState<'setup' | 'loading' | 'play' | 'done'>('setup')
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0) // сколько заданий выбрал ученик
  const [questions, setQuestions] = useState<EntQuestion[]>([]) // уже загруженные
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const fetchingRef = useRef(false)
  const testIdRef = useRef(0) // чтобы порция от старого теста не попала в новый
  const indexRef = useRef(0)
  const [answers, setAnswers] = useState<(number | null)[]>([]) // null — ещё не отвечал, -1 — «не знаю»
  const [index, setIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [dialogs, setDialogs] = useState<Record<number, Turn[]>>({})
  const [reviewOpen, setReviewOpen] = useState<number | null>(null)
  const [xpMsg, setXpMsg] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setLoggedIn(!!user)
      if (!user) return
      const { data } = await supabase
        .from('ent_attempts').select('subject, total, correct, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      if (data) setAttempts(data)
    })
  }, [])

  async function fetchBatch(n: number, exclude: number[]): Promise<EntQuestion[]> {
    const res = await fetch('/api/ent/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, section, difficulty, count: n, exclude }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Ошибка')
    return data.questions
  }

  // Догружаем следующую порцию, пока ученик решает уже загруженные задания
  async function loadMore(current: EntQuestion[], want: number) {
    if (fetchingRef.current || current.length >= want) return
    const testId = testIdRef.current
    fetchingRef.current = true
    setFetching(true)
    setFetchError('')
    try {
      const used = current.map(q => q.bankId).filter((id): id is number => id !== undefined)
      const batch = (await fetchBatch(Math.min(ENT_BATCH, want - current.length), used)).slice(0, want - current.length)
      fetchingRef.current = false
      if (testId !== testIdRef.current) return
      const next = [...current, ...batch]
      setQuestions(next)
      setAnswers(prev => [...prev, ...batch.map(() => null)])
      setFetching(false)
      // Держим в запасе пару порций вперёд, но не грузим все 100 заданий сразу
      if (next.length < want && next.length - indexRef.current < ENT_BATCH * 2) loadMore(next, want)
    } catch (e) {
      fetchingRef.current = false
      if (testId !== testIdRef.current) return
      setFetching(false)
      setFetchError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function generate() {
    testIdRef.current++
    indexRef.current = 0
    setMode('loading')
    setError('')
    setFetchError('')
    try {
      const first = await fetchBatch(Math.min(ENT_BATCH, count), [])
      setTotal(count)
      setQuestions(first)
      setAnswers(first.map(() => null))
      setDialogs({})
      setIndex(0)
      setShowSolution(false)
      setReviewOpen(null)
      setXpMsg('')
      setMode('play')
      if (first.length < count) loadMore(first, count)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
      setMode('setup')
    }
  }

  function answer(choice: number) {
    if (answers[index] !== null) return
    setAnswers(prev => prev.map((a, i) => (i === index ? choice : a)))
  }

  async function finish() {
    setMode('done')
    // Считаем только те задания, до которых ученик дошёл
    const answered = answers.filter(a => a !== null).length
    const correct = questions.filter((q, i) => answers[i] === q.correct).length
    if (!answered) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const row = { user_id: user.id, subject, section, difficulty, total: answered, correct }
    await supabase.from('ent_attempts').insert(row)
    setAttempts(prev => [{ ...row, created_at: new Date().toISOString() }, ...prev])
    // 2 XP за каждый верный ответ
    if (correct > 0) {
      const { data: p } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single()
      if (p) {
        await supabase.from('profiles').update({ total_xp: (p.total_xp || 0) + correct * 2 }).eq('id', user.id)
        setXpMsg(`+${correct * 2} XP`)
      }
    }
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1)
      indexRef.current = index + 1
      setShowSolution(false)
      if (questions.length - (index + 1) <= ENT_BATCH) loadMore(questions, total)
    } else {
      finish()
    }
  }

  // ---------- Выбор параметров ----------
  if (mode === 'setup' || mode === 'loading') {
    const totals = attempts.reduce((acc, a) => ({ q: acc.q + a.total, c: acc.c + a.correct }), { q: 0, c: 0 })
    return (
      <div className="page animate-fade-in-up">
        <h1 className="page-title">Подготовка к ЕНТ</h1>
        <p className="page-sub">ИИ составляет новые задания под выбранную тему. Не получилось решить — нажми «Объясни», и он разберёт задачу по шагам.</p>

        {loggedIn === false && (
          <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(245,158,11,0.4)' }}>
            Чтобы пользоваться тренажёром, <Link href="/login" style={{ color: '#c4bbff' }}>войди в аккаунт</Link>.
          </div>
        )}

        {totals.q > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { v: attempts.length, l: 'тестов решено' },
              { v: totals.q, l: 'заданий' },
              { v: `${Math.round((totals.c / totals.q) * 100)}%`, l: 'верных ответов' },
            ].map(s => (
              <div key={s.l} className="card" style={{ textAlign: 'center', padding: 14 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{s.v}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <div className="label">Предмет</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(id => (
              <button key={id} className={`chip${subject === id ? ' on' : ''}`} onClick={() => { setSubject(id); setSection('all') }}>
                {ENT_SUBJECTS[id].label}
              </button>
            ))}
          </div>

          <div className="label">Тема</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            <button className={`chip${section === 'all' ? ' on' : ''}`} onClick={() => setSection('all')}>Вперемешку</button>
            {ENT_SUBJECTS[subject].sections.map(s => (
              <button key={s} className={`chip${section === s ? ' on' : ''}`} onClick={() => setSection(s)}>{s}</button>
            ))}
          </div>

          <div className="label">Сложность</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {(Object.keys(ENT_DIFFICULTIES) as EntDifficulty[]).map(id => (
              <button key={id} className={`chip${difficulty === id ? ' on' : ''}`} onClick={() => setDifficulty(id)}>
                {ENT_DIFFICULTIES[id].label} <span style={{ opacity: 0.6, fontWeight: 500 }}>· {ENT_DIFFICULTIES[id].hint}</span>
              </button>
            ))}
          </div>

          <div className="label">Количество заданий</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {ENT_COUNTS.map(n => (
              <button key={n} className={`chip${count === n ? ' on' : ''}`} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>

          <button className="btn" onClick={generate} disabled={mode === 'loading' || loggedIn === false} style={{ width: '100%' }}>
            {mode === 'loading' ? (
              <>
                <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                ИИ составляет задания… это займёт до минуты
              </>
            ) : (
              <><Icon name="sparkles" size={18} /> Сгенерировать задания</>
            )}
          </button>
          {error && <div style={{ color: 'var(--bad)', fontSize: 14, marginTop: 10 }}>{error}</div>}
        </div>
      </div>
    )
  }

  // ---------- Итоги ----------
  if (mode === 'done') {
    const done = questions.map((q, i) => ({ q, a: answers[i], i })).filter(x => x.a !== null)
    const correct = done.filter(x => x.a === x.q.correct).length
    const pct = done.length ? Math.round((correct / done.length) * 100) : 0
    return (
      <div className="page animate-fade-in-up">
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px', marginBottom: 18 }}>
          <div style={{ fontSize: 46, fontWeight: 800, color: pct >= 70 ? 'var(--good)' : pct >= 40 ? '#f59e0b' : 'var(--bad)' }}>
            {correct} / {done.length}
          </div>
          <div style={{ color: 'var(--muted)', marginTop: 4 }}>{pct}% верных ответов</div>
          {xpMsg && <div style={{ marginTop: 8, color: '#c4bbff', fontWeight: 700 }}>{xpMsg}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <button className="btn" onClick={generate}><Icon name="refresh" size={18} /> Новые задания</button>
            <button className="btn btn-ghost" onClick={() => setMode('setup')}>Сменить тему</button>
          </div>
        </div>

        <div className="label">Разбор заданий</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {done.map(({ q, a, i }) => {
            const ok = a === q.correct
            const open = reviewOpen === i
            return (
              <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button onClick={() => setReviewOpen(open ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ok ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: ok ? 'var(--good)' : 'var(--bad)' }}>
                    <Icon name={ok ? 'check' : 'x'} size={16} />
                  </span>
                  <span style={{ flex: 1, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {i + 1}. {q.question.replace(/\$/g, '')}
                  </span>
                  <Icon name="arrowRight" size={16} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'var(--muted)' }} />
                </button>
                {open && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <QuestionBody q={q} chosen={a} />
                    <div style={{ marginTop: 12 }}>
                      <Explain q={q} chosen={a === SKIPPED ? null : a} turns={dialogs[i] || []} setTurns={t => setDialogs(d => ({ ...d, [i]: t }))} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------- Решение ----------
  const answeredCount = answers.filter(a => a !== null).length
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <button className="nav-icon-btn" onClick={() => setMode('setup')} aria-label="Назад"><Icon name="arrowLeft" /></button>
      {total <= 15 ? (
        <div style={{ flex: 1, display: 'flex', gap: 4 }}>
          {Array.from({ length: total }, (_, i) => {
            const qq = questions[i]
            const a = answers[i]
            return (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 999,
                background: !qq || a === null ? (i === index ? 'var(--accent)' : 'var(--surface-2)') : a === qq.correct ? 'var(--good)' : 'var(--bad)',
              }} />
            )
          })}
        </div>
      ) : (
        <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${(answeredCount / total) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#667eea,#a78bfa)', transition: 'width 0.4s ease' }} />
        </div>
      )}
      <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>{index + 1} / {total}</span>
      {answeredCount > 0 && index + 1 < total && (
        <button onClick={finish} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
          Завершить
        </button>
      )}
    </div>
  )

  const q = questions[index]
  if (!q) {
    // Ученик решает быстрее, чем подгружаются задания
    return (
      <div className="page animate-fade-in">
        {header}
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          {fetchError ? (
            <>
              <div style={{ color: 'var(--bad)', marginBottom: 14 }}>{fetchError}</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn" onClick={() => loadMore(questions, total)}><Icon name="refresh" size={18} /> Попробовать снова</button>
                <button className="btn btn-ghost" onClick={finish}>Завершить тест</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--muted)' }}>
              <span className="spin" style={{ width: 18, height: 18, border: '2px solid var(--line)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
              {fetching ? 'Готовлю следующие задания…' : 'Загрузка…'}
            </div>
          )}
        </div>
      </div>
    )
  }
  const chosen = answers[index]
  const answered = chosen !== null
  const isRight = chosen === q.correct

  return (
    <div className="page animate-fade-in">
      {header}

      <div className="card" style={{ padding: '20px 18px' }}>
        <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>ЗАДАНИЕ {index + 1}</div>
        <MathText text={q.question} style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 18 }} />

        <div style={{ display: 'grid', gap: 8 }}>
          {q.options.map((opt, i) => {
            let border = 'var(--line)', bg = 'var(--surface-2)'
            if (answered && i === q.correct) { border = 'var(--good)'; bg = 'rgba(52,211,153,0.1)' }
            else if (answered && i === chosen) { border = 'var(--bad)'; bg = 'rgba(248,113,113,0.1)' }
            return (
              <button key={i} onClick={() => answer(i)} disabled={answered}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${border}`, background: bg, color: 'var(--text)', cursor: answered ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 15 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontWeight: 800, fontSize: 13, color: 'var(--muted)' }}>{LETTERS[i]}</span>
                <MathText text={opt} style={{ flex: 1 }} />
              </button>
            )
          })}
        </div>

        {!answered && (
          <button onClick={() => answer(SKIPPED)} style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
            Не знаю, как решить
          </button>
        )}
      </div>

      {answered && (
        <div className="animate-fade-in" style={{ marginTop: 14, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: isRight ? 'var(--good)' : 'var(--bad)' }}>
            <Icon name={isRight ? 'check' : 'x'} size={20} />
            {isRight ? 'Правильно!' : chosen === SKIPPED ? `Правильный ответ: ${LETTERS[q.correct]}` : `Неверно. Правильный ответ: ${LETTERS[q.correct]}`}
          </div>

          {isRight ? (
            showSolution
              ? <div className="card"><MathText text={q.solution} /></div>
              : <button className="btn btn-ghost" onClick={() => setShowSolution(true)}>Показать решение</button>
          ) : (
            <Explain q={q} chosen={chosen === SKIPPED ? null : chosen} turns={dialogs[index] || []} setTurns={t => setDialogs(d => ({ ...d, [index]: t }))} />
          )}

          <button className="btn" onClick={next}>
            {index + 1 < total ? 'Следующее задание' : 'Завершить'} <Icon name="arrowRight" size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

function QuestionBody({ q, chosen }: { q: EntQuestion; chosen: number | null }) {
  return (
    <div>
      <MathText text={q.question} style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 10 }} />
      <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
        {q.options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', color: i === q.correct ? 'var(--good)' : i === chosen ? 'var(--bad)' : 'var(--muted)', fontWeight: i === q.correct || i === chosen ? 700 : 400 }}>
            <span>{LETTERS[i]})</span>
            <MathText text={opt} />
            {i === q.correct && <span style={{ fontSize: 12 }}>— верный</span>}
            {i === chosen && i !== q.correct && <span style={{ fontSize: 12 }}>— твой ответ</span>}
          </div>
        ))}
      </div>
      {chosen === SKIPPED && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Ты пропустил это задание</div>}
    </div>
  )
}
