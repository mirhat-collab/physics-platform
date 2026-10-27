'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ENT_SUBJECTS, MOCK, MOCK_MAX, answerErrors, answerPoints, isAnswered, mockPoints, type EntQuestion, type EntSubject, type MockAnswer } from '@/lib/ent'
import MathText, { MathLine } from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import Explain from '../Explain'
import QuestionBody, { LETTERS } from '../QuestionBody'
import { entMistakePayload, logAnswers } from '@/lib/answer-log'
import { useT } from '@/app/components/LanguageProvider'
import { mockResult } from '@/lib/mock-result'
import PracticeTools from '../PracticeTools'

type Turn = { role: 'user' | 'assistant'; content: string }
type Saved = { subject: EntSubject; questions: EntQuestion[]; answers: MockAnswer[]; endAt: number }
type Past = { subject: string; total: number; correct: number; score?: number | null; created_at: string }

// Начатый вариант храним в браузере, чтобы он не пропал при обновлении страницы
const STORE = 'ent-mock-v1'
function readSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORE)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch { return null }
}
function writeSaved(s: Saved | null) {
  try {
    if (s) localStorage.setItem(STORE, JSON.stringify(s))
    else localStorage.removeItem(STORE)
  } catch { /* приватный режим — работаем без сохранения */ }
}

function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0'), ss = String(s % 60).padStart(2, '0')
  return s >= 3600 ? `${Math.floor(s / 3600)}:${mm}:${ss}` : `${mm}:${ss}`
}

export default function MockEntPage() {
  const { t } = useT()
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [subject, setSubject] = useState<EntSubject>('physics')
  const [phase, setPhase] = useState<'setup' | 'loading' | 'exam' | 'done'>('setup')
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState<EntQuestion[]>([])
  const [answers, setAnswers] = useState<MockAnswer[]>([])
  const [index, setIndex] = useState(0)
  const [endAt, setEndAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [saved, setSaved] = useState<Saved | null>(null)
  const [past, setPast] = useState<Past[]>([])
  const [xpMsg, setXpMsg] = useState('')
  const [onlyWrong, setOnlyWrong] = useState(true)
  const [reviewOpen, setReviewOpen] = useState<number | null>(null)
  const [dialogs, setDialogs] = useState<Record<number, Turn[]>>({})
  const finishing = useRef(false)

  useEffect(() => {
    setSaved(readSaved())
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setLoggedIn(!!user)
      if (!user) return
      const { data } = await supabase.from('ent_attempts').select('*')
        .eq('user_id', user.id).eq('section', 'mock').order('created_at', { ascending: false }).limit(5)
      if (data) setPast(data as Past[])
    })
  }, [])

  const finish = useCallback(async (qs: EntQuestion[], ans: MockAnswer[], subj: EntSubject) => {
    if (finishing.current) return
    finishing.current = true
    writeSaved(null)
    setSaved(null)
    setPhase('done')
    setReviewOpen(null)
    const { correct, score, sections } = mockResult(subj, qs, ans)
    // В статистику и «работу над ошибками» — все задания, на которые ученик ответил
    // Задания «несколько ответов» и «соответствие» в работу над ошибками не попадают:
    // там повторное решение рассчитано на один ответ
    logAnswers(qs.flatMap((q, i) => !isAnswered(ans[i]) ? [] : [{
      source: 'ent' as const, subject: subj, section: q.section ?? null, topic: q.topic ?? null,
      correct: answerErrors(q, ans[i]) === 0,
      payload: answerErrors(q, ans[i]) === 0 || q.kind ? null : { ...entMistakePayload(q, ans[i] as number) },
    }]))
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const row = { user_id: user.id, subject: subj, section: 'mock', difficulty: 'ent', total: qs.length, correct }
    // Колонки score может не быть, если миграция ещё не применена — тогда без неё
    // Разделы без заданий в этом варианте в статистику не пишем
    const details = Object.fromEntries(Object.entries(sections).filter(([, v]) => v[1] > 0))
    const withScore = await supabase.from('ent_attempts').insert({ ...row, score, max_score: MOCK_MAX, details })
    if (withScore.error) await supabase.from('ent_attempts').insert(row)
    setPast(prev => [{ ...row, score, created_at: new Date().toISOString() }, ...prev].slice(0, 5))
    if (correct > 0) {
      const { data: p } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single()
      if (p) {
        await supabase.from('profiles').update({ total_xp: (p.total_xp || 0) + correct * 2 }).eq('id', user.id)
        setXpMsg(`+${correct * 2} XP`)
      }
    }
  }, [])

  // Таймер: по истечении времени вариант сдаётся сам
  useEffect(() => {
    if (phase !== 'exam') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [phase])
  useEffect(() => {
    if (phase === 'exam' && now >= endAt) finish(questions, answers, subject)
  }, [phase, now, endAt, questions, answers, subject, finish])

  async function start() {
    setPhase('loading')
    setError('')
    try {
      const res = await fetch('/api/ent/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(t(data.error || 'Ошибка'))
      const qs = (data.questions || []) as EntQuestion[]
      if (qs.length < MOCK.count) throw new Error(t('Не удалось подготовить задания, попробуй ещё раз'))
      const end = Date.now() + MOCK.minutes * 60 * 1000
      const ans = qs.map(() => null)
      finishing.current = false
      setQuestions(qs)
      setAnswers(ans)
      setIndex(0)
      setEndAt(end)
      setNow(Date.now())
      setDialogs({})
      setXpMsg('')
      writeSaved({ subject, questions: qs, answers: ans, endAt: end })
      setPhase('exam')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'))
      setPhase('setup')
    }
  }

  function resume(s: Saved) {
    finishing.current = false
    setSubject(s.subject)
    setQuestions(s.questions)
    setAnswers(s.answers)
    setIndex(Math.max(0, s.answers.findIndex(a => a === null)))
    setEndAt(s.endAt)
    setNow(Date.now())
    setDialogs({})
    setXpMsg('')
    if (Date.now() >= s.endAt) finish(s.questions, s.answers, s.subject)
    else setPhase('exam')
  }

  // Выбор варианта: в обычном задании — один, в «нескольких ответах» —
  // отметка вкл/выкл, в соответствии — вариант для пункта item
  function choose(i: number, item = 0) {
    const q = questions[index], cur = answers[index]
    let value: MockAnswer
    if (q.kind === 'multi') {
      const sel = Array.isArray(cur) ? cur : []
      value = sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i].sort((a, b) => a - b)
      if (!value.length) value = null
    } else if (q.kind === 'match') {
      const sel = Array.isArray(cur) ? [...cur] : q.left!.map(() => -1)
      sel[item] = sel[item] === i ? -1 : i
      value = sel.some(x => x >= 0) ? sel : null
    } else value = cur === i ? null : i
    const next = answers.map((a, k) => (k === index ? value : a))
    setAnswers(next)
    writeSaved({ subject, questions, answers: next, endAt })
  }

  function submit() {
    const left = answers.filter(a => !isAnswered(a)).length
    if (left && !confirm(t('Без ответа осталось заданий: {n}. Завершить тест?', { n: left }))) return
    finish(questions, answers, subject)
  }

  // ---------- Начало ----------
  if (phase === 'setup' || phase === 'loading') {
    return (
      <div className="page animate-fade-in-up">
        <Link href="/ent" style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none' }}>← {t('Подготовка к ЕНТ')}</Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{t('Пробный ЕНТ')}</h1>
        <p className="page-sub">{t('Вариант по спецификации НЦТ: {count} заданий по всем темам предмета, {hours} часа, до {max} баллов. Трудность как на ЕНТ: 50% базовых, 30% средних, 20% сложных. Последние {hard} заданий стоят по 2 балла. Правильные ответы — только после сдачи.', { count: MOCK.count, hours: MOCK.minutes / 60, max: MOCK_MAX, hard: MOCK.count - MOCK.hardFrom })}
          <span style={{ display: 'block', marginTop: 6, fontSize: 13 }}>{t('Задания {a}–{b} — «один или несколько правильных ответов», {c}–{d} — «на соответствие». За одну ошибку в них ставится 1 балл из 2.', { a: MOCK.multiFrom + 1, b: MOCK.matchFrom, c: MOCK.matchFrom + 1, d: MOCK.count })}</span></p>

        {loggedIn === false && (
          <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(245,158,11,0.4)' }}>
            <Link href="/login" style={{ color: '#c4bbff' }}>{t('Войди в аккаунт')}</Link>{t(', чтобы сохранялись результаты пробных ЕНТ.')}
          </div>
        )}

        {saved && (
          <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(124,108,255,0.5)' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('У тебя есть начатый вариант')} · {t(ENT_SUBJECTS[saved.subject].label)}</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
              {t('Отвечено: {a} из {b}', { a: saved.answers.filter(isAnswered).length, b: saved.questions.length })}
              {' · '}{saved.endAt > Date.now() ? t('осталось {time}', { time: clock(saved.endAt - Date.now()) }) : t('время вышло')}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => resume(saved)}>{saved.endAt > Date.now() ? t('Продолжить') : t('Посмотреть результат')}</button>
              <button className="btn btn-ghost" onClick={() => { writeSaved(null); setSaved(null) }}>{t('Удалить')}</button>
            </div>
          </div>
        )}

        <div className="card">
          <div className="label">{t('Предмет')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(id => (
              <button key={id} className={`chip${subject === id ? ' on' : ''}`} onClick={() => setSubject(id)}>{t(ENT_SUBJECTS[id].label)}</button>
            ))}
          </div>
          <button className="btn" onClick={start} disabled={phase === 'loading'} style={{ width: '100%' }}>
            {phase === 'loading' ? (
              <>
                <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                {t('Собираю вариант…')}
              </>
            ) : <><Icon name="sparkles" size={18} /> {t('Начать пробный ЕНТ')}</>}
          </button>
          {error && <div style={{ color: 'var(--bad)', fontSize: 14, marginTop: 10 }}>{error}</div>}
        </div>

        {past.length > 0 && (
          <>
            <div className="label" style={{ marginTop: 22 }}>{t('Мои пробные ЕНТ')}</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {past.map((p, i) => (
                <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  <span style={{ flex: 1 }}>{t(ENT_SUBJECTS[p.subject as EntSubject]?.label ?? p.subject)}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{new Date(p.created_at).toLocaleDateString()}</span>
                  <span style={{ fontWeight: 800 }}>
                    {p.score != null ? `${p.score} / ${MOCK_MAX} ${t('б.')}` : `${p.correct} / ${p.total}`}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // ---------- Результат ----------
  if (phase === 'done') {
    const result = mockResult(subject, questions, answers)
    const { score, max } = result
    const pct = max ? Math.round((score / max) * 100) : 0
    // Сколько баллов потеряно в каждом разделе спецификации — сначала самые большие потери
    const sections = Object.entries(result.sections).filter(([, [, m]]) => m > 0)
      .map(([name, [got, m]]) => [name, { got, max: m, topics: result.wrongTopics[name] }] as const)
      .sort((a, b) => (b[1].max - b[1].got) - (a[1].max - a[1].got))
    const wrongTopics = [...new Set(questions.filter((q, i) => answerErrors(q, answers[i]) > 0 && q.topic).map(q => q.topic!))]
    const practice = (topics: string[], repair = false) =>
      `/ent?subject=${subject}${repair ? '&repair=1' : ''}${topics.slice(0, 8).map(x => `&topic=${encodeURIComponent(x)}`).join('')}`
    const list = questions.map((q, i) => ({ q, a: answers[i], i })).filter(x => !onlyWrong || answerErrors(x.q, x.a) > 0)
    return (
      <div className="page animate-fade-in-up">
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px', marginBottom: 18 }}>
          <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{t('Пробный ЕНТ')} · {t(ENT_SUBJECTS[subject].label)}</div>
          <div style={{ fontSize: 46, fontWeight: 800, color: pct >= 70 ? 'var(--good)' : pct >= 40 ? '#f59e0b' : 'var(--bad)' }}>
            {score} / {max}
          </div>
          <div style={{ color: 'var(--muted)', marginTop: 4 }}>
            {t('баллов')} · {t('верных ответов: {a} из {b}', { a: result.correct, b: questions.length })}
          </div>
          {xpMsg && <div style={{ marginTop: 8, color: '#c4bbff', fontWeight: 700 }}>{xpMsg}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            {wrongTopics.length > 0 && <Link className="btn" href={practice(wrongTopics, true)}><Icon name="refresh" size={18} /> {t('Отработать ошибки')}</Link>}
            <button className="btn btn-ghost" onClick={() => setPhase('setup')}>{t('Новый вариант')}</button>
          </div>
        </div>

        <div className="label">{t('Где потеряны баллы')}</div>
        <div className="card" style={{ padding: 0, marginBottom: 18 }}>
          {sections.map(([name, s], k) => {
            const lost = s.max - s.got
            return (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: k ? '1px solid var(--line)' : 'none' }}>
                <span style={{ flex: 1, fontSize: 14 }}>{t(name)}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{s.got} / {s.max}</span>
                {lost > 0 ? (
                  <Link href={practice(s.topics)} style={{ fontSize: 13, color: 'var(--bad)', fontWeight: 700, textDecoration: 'none', minWidth: 110, textAlign: 'right' }}>
                    −{lost} · {t('тренировать')}
                  </Link>
                ) : <span style={{ fontSize: 13, color: 'var(--good)', fontWeight: 700, minWidth: 110, textAlign: 'right' }}>{t('без потерь')}</span>}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div className="label" style={{ margin: 0, flex: 1 }}>{t('Разбор заданий')}</div>
          <button className={`chip${onlyWrong ? ' on' : ''}`} onClick={() => setOnlyWrong(!onlyWrong)}>{t('Только ошибки')}</button>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {list.map(({ q, a, i }) => {
            const ok = answerErrors(q, a) === 0
            const got = answerPoints(q, a, mockPoints(i))
            const open = reviewOpen === i
            return (
              <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button onClick={() => setReviewOpen(open ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ok ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: ok ? 'var(--good)' : 'var(--bad)' }}>
                    <Icon name={ok ? 'check' : 'x'} size={16} />
                  </span>
                  <MathLine text={`${i + 1}. ${q.question}`} style={{ flex: 1, minWidth: 0, fontSize: 14 }} />
                  <span style={{ fontSize: 12, color: got && !ok ? '#f59e0b' : 'var(--muted)', flexShrink: 0 }}>{got}/{mockPoints(i)} {t('б.')}</span>
                </button>
                {open && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <QuestionBody q={q} chosen={a} />
                    {!q.kind && (
                      <div style={{ marginTop: 12 }}>
                        <Explain q={q} chosen={a as number | null} turns={dialogs[i] || []} setTurns={v => setDialogs(d => ({ ...d, [i]: v }))} />
                      </div>
                    )}
                    {!ok && <PracticeTools q={q} subject={subject} retry={!q.kind} />}
                  </div>
                )}
              </div>
            )
          })}
          {!list.length && <div className="card" style={{ textAlign: 'center', color: 'var(--good)' }}>{t('Ошибок нет — отличный результат!')}</div>}
        </div>
      </div>
    )
  }

  // ---------- Экзамен ----------
  const q = questions[index]
  const left = endAt - now
  const answered = answers.filter(isAnswered).length
  return (
    <div className="page animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{ fontWeight: 800, fontSize: 20, fontVariantNumeric: 'tabular-nums', color: left < 5 * 60 * 1000 ? 'var(--bad)' : 'var(--text)' }}>
          ⏱ {clock(left)}
        </span>
        <span style={{ flex: 1, color: 'var(--muted)', fontSize: 13 }}>{t('Отвечено: {a} из {b}', { a: answered, b: questions.length })}</span>
        <button className="btn" onClick={submit} style={{ padding: '8px 14px' }}>{t('Сдать')}</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
        {questions.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} aria-label={`${i + 1}`}
            style={{
              width: 30, height: 30, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              border: i === index ? '2px solid var(--accent)' : '1px solid var(--line)',
              background: isAnswered(answers[i]) ? 'rgba(124,108,255,0.25)' : i >= MOCK.hardFrom ? 'rgba(245,158,11,0.08)' : 'var(--surface-2)',
              color: 'var(--text)',
            }}>
            {i + 1}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '20px 18px' }}>
        <div style={{ display: 'flex', color: 'var(--muted)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          <span style={{ flex: 1 }}>{t('ЗАДАНИЕ')} {index + 1}</span>
          <span>{mockPoints(index) === 2 ? t('2 балла') : t('1 балл')}</span>
        </div>
        <MathText text={q.question} style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 12 }} />
        {q.kind === 'multi' && <div style={{ color: '#c4bbff', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{t('Выберите один или несколько правильных ответов')}</div>}
        {q.kind === 'match' ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {q.left!.map((l, k) => {
              const sel = Array.isArray(answers[index]) ? (answers[index] as number[])[k] : -1
              return (
                <div key={k} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  <MathText text={`${k + 1}) ${l}`} style={{ fontSize: 15, lineHeight: 1.55, marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {q.options.map((_, i) => (
                      <button key={i} onClick={() => choose(i, k)} aria-label={`${k + 1} — ${LETTERS[i]}`}
                        style={{ width: 40, height: 36, borderRadius: 8, border: `1.5px solid ${sel === i ? 'var(--accent)' : 'var(--line)'}`, background: sel === i ? 'var(--accent)' : 'var(--bg)', color: sel === i ? '#fff' : 'var(--text)', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {LETTERS[i]}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'grid', gap: 6 }}>
              {q.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 15 }}>
                  <b style={{ color: 'var(--muted)', width: 22 }}>{LETTERS[i]})</b>
                  <MathText text={opt} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {q.options.map((opt, i) => {
              const a = answers[index]
              const on = Array.isArray(a) ? a.includes(i) : a === i
              return (
                <button key={i} onClick={() => choose(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${on ? 'var(--accent)' : 'var(--line)'}`, background: on ? 'rgba(124,108,255,0.15)' : 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 15 }}>
                  <span style={{ width: 28, height: 28, borderRadius: q.kind === 'multi' ? 6 : 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--accent)' : 'var(--bg)', fontWeight: 800, fontSize: 13, color: on ? '#fff' : 'var(--muted)' }}>{q.kind === 'multi' && on ? '✓' : LETTERS[i]}</span>
                  <MathText text={opt} style={{ flex: 1 }} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0} style={{ flex: 1 }}>
          <Icon name="arrowLeft" size={18} /> {t('Назад')}
        </button>
        {index + 1 < questions.length ? (
          <button className="btn" onClick={() => setIndex(index + 1)} style={{ flex: 1 }}>{t('Дальше')} <Icon name="arrowRight" size={18} /></button>
        ) : (
          <button className="btn" onClick={submit} style={{ flex: 1 }}>{t('Сдать')}</button>
        )}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>{t('Ответ можно поменять до сдачи. Повторное нажатие снимает выбор.')}</p>
    </div>
  )
}
