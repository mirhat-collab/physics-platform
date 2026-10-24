'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { sectionNames, sectionOfTopic, solutionHints, topicsOf, ENT_BATCH, ENT_COUNTS, ENT_DIFFICULTIES, ENT_SUBJECTS, type EntDifficulty, type EntQuestion, type EntSubject } from '@/lib/ent'
import { sectionStats, type LogRow } from '@/lib/stats'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import Explain from './Explain'
import QuestionBody, { LETTERS, SKIPPED } from './QuestionBody'
import { entMistakePayload, logAnswers } from '@/lib/answer-log'
import { useT } from '@/app/components/LanguageProvider'

type Turn = { role: 'user' | 'assistant'; content: string }
type Attempt = { subject: string; total: number; correct: number; created_at: string }

// Работа над ошибками: тема считается отработанной после 2 верных ответов подряд
const REPAIR_STREAK = 2
const REPAIR_MAX = 40

// Ссылка на справочник по теме задания
function referenceHref(subject: EntSubject, q: EntQuestion): string {
  return `/reference?subject=${subject}&topic=${encodeURIComponent(q.topic || q.section || '')}`
}

export default function EntPage() {
  const { t } = useT()
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [subject, setSubject] = useState<EntSubject>('physics')
  const [section, setSection] = useState('all')
  const [topics, setTopics] = useState<string[]>([]) // выбранные темы, можно из разных разделов; пусто — весь раздел
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
  const [repair, setRepair] = useState(false)
  const [need, setNeed] = useState<Record<string, number>>({}) // сколько ещё верных подряд нужно по теме
  const needRef = useRef<Record<string, number>>({})
  const [hints, setHints] = useState<Record<number, number>>({}) // сколько шагов подсказки открыто
  const [pickNote, setPickNote] = useState('')
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      // Переход со страницы статистики: /ent?subject=math&section=…
      const params = new URLSearchParams(window.location.search)
      const subj = params.get('subject') as EntSubject | null
      if (subj && ENT_SUBJECTS[subj]) {
        setSubject(subj)
        const sec = params.get('section')
        if (sec && sectionNames(subj).includes(sec)) setSection(sec)
        // Одна или несколько тем: /ent?subject=math&topic=…&topic=…
        const tops = params.getAll('topic').filter(x => sectionOfTopic(subj, x))
        if (tops.length) {
          setTopics([...new Set(tops)])
          if (!sec) setSection(sectionOfTopic(subj, tops[0])!)
          if (params.get('repair') === '1') setRepair(true)
        }
      }
      setLoggedIn(!!user)
      if (!user) return
      const { data } = await supabase
        .from('ent_attempts').select('subject, total, correct, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      if (data) setAttempts(data)
    })
  }, [])

  // Раздел для статистики попыток: общий раздел выбранных тем или «вперемешку»
  const topicSections = [...new Set(topics.map(name => sectionOfTopic(subject, name)))]
  const testSection = topics.length ? (topicSections.length === 1 ? topicSections[0]! : 'all') : section

  function toggleTopic(name: string) {
    setTopics(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name])
  }

  // «Все темы раздела»: добавить все темы раздела к выбору или убрать их
  function toggleSectionTopics(sec: string) {
    const list = topicsOf(subject, sec)
    setTopics(prev => list.every(x => prev.includes(x))
      ? prev.filter(x => !list.includes(x))
      : [...prev, ...list.filter(x => !prev.includes(x))])
  }

  // В работе над ошибками задания берём только по ещё не отработанным темам
  function batchTopics(): string[] {
    if (!repair) return topics
    const open = topics.filter(x => (needRef.current[x] ?? 0) > 0)
    return open.length ? open : topics
  }

  async function fetchBatch(n: number, exclude: number[]): Promise<EntQuestion[]> {
    const res = await fetch('/api/ent/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, section: testSection, topics: batchTopics(), difficulty, count: n, exclude }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(t(data.error || 'Ошибка'))
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
      // В работе над ошибками не забегаем вперёд: темы отрабатываются по ходу решения
      if (!repair && next.length < want && next.length - indexRef.current < ENT_BATCH * 2) loadMore(next, want)
    } catch (e) {
      fetchingRef.current = false
      if (testId !== testIdRef.current) return
      setFetching(false)
      setFetchError(e instanceof Error ? e.message : t('Ошибка'))
    }
  }

  // Подбор тем по статистике: сначала самые слабые, затем ещё не решённые.
  // Если ученик почти не ошибается — предлагаем уровень «Выше ЕНТ».
  async function pickWeak() {
    setPicking(true)
    setPickNote('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setPicking(false); setPickNote(t('Войди в аккаунт, чтобы подобрать темы по статистике.')); return }
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase.from('answer_log').select('source, subject, section, topic, correct, created_at')
      .eq('user_id', user.id).eq('source', 'ent').eq('subject', subject).gte('created_at', since)
      .order('created_at', { ascending: false }).limit(1000)
    const rows = (data || []) as LogRow[]
    const stats = sectionStats(rows).filter(x => x.topic && sectionOfTopic(subject, x.topic))
    const weak = stats.filter(x => x.total >= 2 && x.accuracy < 0.7)
      .sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong).slice(0, 6).map(x => x.topic!)
    const seen = new Set(stats.map(x => x.topic))
    const fresh = ENT_SUBJECTS[subject].sections.flatMap(x => x.topics).filter(x => !seen.has(x))
      .sort(() => Math.random() - 0.5).slice(0, Math.max(0, 5 - weak.length))
    const picked = [...weak, ...fresh]
    setTopics(picked)
    if (picked.length) setSection(sectionOfTopic(subject, picked[0])!)
    setRepair(false)
    const recent = rows.slice(0, 30)
    const acc = recent.length ? recent.filter(r => r.correct).length / recent.length : 0
    const harder = recent.length >= 20 && acc >= 0.85
    if (harder) setDifficulty('hard')
    setPickNote([
      weak.length ? t('Слабых тем: {n}', { n: weak.length }) : t('Слабых тем пока нет'),
      fresh.length ? t('новых тем: {n}', { n: fresh.length }) : '',
      harder ? t('ты отвечаешь верно в {p}% — включил уровень «Выше ЕНТ»', { p: Math.round(acc * 100) }) : '',
    ].filter(Boolean).join(' · '))
    setPicking(false)
  }

  async function generate() {
    testIdRef.current++
    indexRef.current = 0
    setMode('loading')
    setError('')
    setFetchError('')
    const isRepair = repair && topics.length > 0
    const want = isRepair ? Math.min(REPAIR_MAX, topics.length * REPAIR_STREAK) : count
    if (isRepair) {
      const init = Object.fromEntries(topics.map(x => [x, REPAIR_STREAK]))
      needRef.current = init
      setNeed(init)
    }
    try {
      const first = await fetchBatch(Math.min(ENT_BATCH, want), [])
      setTotal(want)
      setHints({})
      setQuestions(first)
      setAnswers(first.map(() => null))
      setDialogs({})
      setIndex(0)
      setShowSolution(false)
      setReviewOpen(null)
      setXpMsg('')
      setMode('play')
      if (!isRepair && first.length < want) loadMore(first, want)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'))
      setMode('setup')
    }
  }

  function answer(choice: number) {
    if (answers[index] !== null) return
    setAnswers(prev => prev.map((a, i) => (i === index ? choice : a)))
    const q = questions[index]
    const ok = choice === q.correct
    logAnswers([{
      source: 'ent', subject,
      section: q.section ?? (testSection !== 'all' ? testSection : null),
      topic: q.topic ?? (topics.length === 1 ? topics[0] : null),
      correct: ok,
      payload: ok ? null : { ...entMistakePayload(q, choice === SKIPPED ? null : choice) },
    }])
    if (repair && q.topic && q.topic in needRef.current) {
      const upd = { ...needRef.current, [q.topic]: ok ? Math.max(0, needRef.current[q.topic] - 1) : REPAIR_STREAK }
      needRef.current = upd
      setNeed(upd)
      // Сколько заданий ещё нужно: текущее уже решено, плюс недостающие верные ответы
      const rest = Object.values(upd).reduce((a, b) => a + b, 0)
      setTotal(Math.min(REPAIR_MAX, index + 1 + rest))
    }
  }

  async function finish() {
    setMode('done')
    // Считаем только те задания, до которых ученик дошёл
    const answered = answers.filter(a => a !== null).length
    const correct = questions.filter((q, i) => answers[i] === q.correct).length
    if (!answered) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const row = { user_id: user.id, subject, section: testSection, difficulty, total: answered, correct }
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
    if (repair) {
      // Уже загруженные задания по отработанным темам больше не нужны
      const keep = questions.filter((qq, i) => i <= index || !qq.topic || (needRef.current[qq.topic] ?? 0) > 0)
      if (keep.length !== questions.length) {
        const ans = answers.filter((_, i) => i <= index || !questions[i].topic || (needRef.current[questions[i].topic!] ?? 0) > 0)
        setQuestions(keep)
        setAnswers(ans)
        if (index + 1 < total) {
          setIndex(index + 1)
          indexRef.current = index + 1
          setShowSolution(false)
          if (keep.length <= index + 1) loadMore(keep, total)
          return
        }
      }
    }
    if (index + 1 < total) {
      setIndex(index + 1)
      indexRef.current = index + 1
      setShowSolution(false)
      if (questions.length - (index + 1) <= (repair ? 0 : ENT_BATCH)) loadMore(questions, total)
    } else {
      finish()
    }
  }

  // ---------- Выбор параметров ----------
  if (mode === 'setup' || mode === 'loading') {
    const totals = attempts.reduce((acc, a) => ({ q: acc.q + a.total, c: acc.c + a.correct }), { q: 0, c: 0 })
    return (
      <div className="page animate-fade-in-up">
        <h1 className="page-title">{t('Подготовка к ЕНТ')}</h1>
        <p className="page-sub">{t('Каждый раз новые задания по выбранной теме: числа и варианты меняются, так что задачи не повторяются. Не получилось решить — нажми «Объясни», и ИИ разберёт задачу по шагам.')}</p>
        <Link href="/reference" className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 16px', color: 'var(--text)', textDecoration: 'none' }}>
          <Icon name="book" size={18} /> <span style={{ flex: 1 }}>{t('Справочник ЕНТ: формулы и важные материалы')}</span> <Icon name="arrowRight" size={16} />
        </Link>
        <Link href="/ent/mock" className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 16px', color: 'var(--text)', textDecoration: 'none', borderColor: 'rgba(124,108,255,0.5)' }}>
          <span style={{ fontSize: 18 }}>⏱</span>
          <span style={{ flex: 1 }}>
            <b>{t('Пробный ЕНТ')}</b>
            <span style={{ display: 'block', color: 'var(--muted)', fontSize: 13 }}>{t('Полный вариант на время с баллами и разбором по разделам')}</span>
          </span>
          <Icon name="arrowRight" size={16} />
        </Link>

        {repair && topics.length > 0 && (
          <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(245,158,11,0.5)' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('Работа над ошибками')}</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 10 }}>
              {t('Темы с ошибками: {n}. Каждую нужно решить верно {k} раза подряд — ошибка начинает отсчёт заново.', { n: topics.length, k: REPAIR_STREAK })}
            </div>
            <button onClick={() => setRepair(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>
              {t('Обычная тренировка по этим темам')}
            </button>
          </div>
        )}

        {loggedIn === false && (
          <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(245,158,11,0.4)' }}>
            <Link href="/login" style={{ color: '#c4bbff' }}>{t('Войди в аккаунт')}</Link>{t(', чтобы сохранялась статистика и работали объяснения от ИИ.')}
          </div>
        )}

        {totals.q > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { v: attempts.length, l: t('тестов решено') },
              { v: totals.q, l: t('заданий') },
              { v: `${Math.round((totals.c / totals.q) * 100)}%`, l: t('верных ответов') },
            ].map(s => (
              <div key={s.l} className="card" style={{ textAlign: 'center', padding: 14 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{s.v}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          {loggedIn && (
            <div style={{ marginBottom: 18 }}>
              <button className="btn btn-ghost" onClick={pickWeak} disabled={picking} style={{ width: '100%' }}>
                <Icon name="sparkles" size={18} /> {picking ? t('Смотрю статистику…') : t('Подобрать задания по моим слабым темам')}
              </button>
              {pickNote && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>{pickNote}</div>}
            </div>
          )}
          <div className="label">{t('Предмет')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(id => (
              <button key={id} className={`chip${subject === id ? ' on' : ''}`} onClick={() => { setSubject(id); setSection('all'); setTopics([]); setRepair(false); setPickNote('') }}>
                {t(ENT_SUBJECTS[id].label)}
              </button>
            ))}
          </div>

          <div className="label">{t('Раздел')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            <button className={`chip${section === 'all' && !topics.length ? ' on' : ''}`} onClick={() => { setSection('all'); setTopics([]) }}>{t('Вперемешку')}</button>
            {sectionNames(subject).map(s => {
              const picked = topicsOf(subject, s).filter(x => topics.includes(x)).length
              return (
                <button key={s} className={`chip${section === s ? ' on' : ''}`} onClick={() => setSection(s)}>
                  {t(s)}{picked > 0 && <span style={{ opacity: 0.7, fontWeight: 500 }}> · {picked}</span>}
                </button>
              )
            })}
          </div>

          {section !== 'all' && (
            <>
              <div className="label">{t('Темы')} <span style={{ opacity: 0.6, fontWeight: 500, textTransform: 'none' }}>· {t('можно выбрать несколько, в том числе из разных разделов')}</span></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                <button className={`chip${!topics.length || topicsOf(subject, section).every(x => topics.includes(x)) ? ' on' : ''}`} onClick={() => toggleSectionTopics(section)}>{t('Все темы раздела')}</button>
                {topicsOf(subject, section).map(name => (
                  <button key={name} className={`chip${topics.includes(name) ? ' on' : ''}`} onClick={() => toggleTopic(name)}>{t(name)}</button>
                ))}
              </div>
            </>
          )}

          {topics.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: -6, marginBottom: 18, fontSize: 13, color: 'var(--muted)' }}>
              <span>{t('Выбрано тем: {n}', { n: topics.length })}{topicSections.length > 1 ? ` · ${t('разделов: {n}', { n: topicSections.length })}` : ''}</span>
              <button onClick={() => { setTopics([]); setRepair(false) }} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>
                {t('Сбросить выбор')}
              </button>
            </div>
          )}

          <div className="label">{t('Сложность')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {(Object.keys(ENT_DIFFICULTIES) as EntDifficulty[]).map(id => (
              <button key={id} className={`chip${difficulty === id ? ' on' : ''}`} onClick={() => setDifficulty(id)}>
                {t(ENT_DIFFICULTIES[id].label)} <span style={{ opacity: 0.6, fontWeight: 500 }}>· {t(ENT_DIFFICULTIES[id].hint)}</span>
              </button>
            ))}
          </div>

          {!(repair && topics.length) && (
            <>
              <div className="label">{t('Количество заданий')}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
                {ENT_COUNTS.map(n => (
                  <button key={n} className={`chip${count === n ? ' on' : ''}`} onClick={() => setCount(n)}>{n}</button>
                ))}
              </div>
            </>
          )}

          <button className="btn" onClick={generate} disabled={mode === 'loading'} style={{ width: '100%' }}>
            {mode === 'loading' ? (
              <>
                <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                {t('Готовлю задания…')}
              </>
            ) : (
              <><Icon name="sparkles" size={18} /> {t('Начать')}</>
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
          <div style={{ color: 'var(--muted)', marginTop: 4 }}>{pct}{t('% верных ответов')}</div>
          {xpMsg && <div style={{ marginTop: 8, color: '#c4bbff', fontWeight: 700 }}>{xpMsg}</div>}
          {repair && topics.length > 0 && (() => {
            const left = topics.filter(x => (need[x] ?? 0) > 0)
            return (
              <div style={{ marginTop: 12, fontSize: 14, color: left.length ? '#f59e0b' : 'var(--good)' }}>
                {left.length
                  ? t('Отработано тем: {a} из {b}. Остались: {list}', { a: topics.length - left.length, b: topics.length, list: left.map(x => t(x)).join(', ') })
                  : t('Все темы с ошибками отработаны!')}
              </div>
            )
          })()}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <button className="btn" onClick={generate}><Icon name="refresh" size={18} /> {t('Новые задания')}</button>
            <button className="btn btn-ghost" onClick={() => setMode('setup')}>{t('Сменить тему')}</button>
          </div>
        </div>

        <div className="label">{t('Разбор заданий')}</div>
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
                    <Link href={referenceHref(subject, q)} style={{ display: 'inline-block', marginTop: 10, fontSize: 13, color: '#c4bbff' }}>📘 {t('Повторить теорию в справочнике')}</Link>
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
      <button className="nav-icon-btn" onClick={() => setMode('setup')} aria-label={t('Назад')}><Icon name="arrowLeft" /></button>
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
          {t('Завершить')}
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
                <button className="btn" onClick={() => loadMore(questions, total)}><Icon name="refresh" size={18} /> {t('Попробовать снова')}</button>
                <button className="btn btn-ghost" onClick={finish}>{t('Завершить тест')}</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--muted)' }}>
              <span className="spin" style={{ width: 18, height: 18, border: '2px solid var(--line)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
              {fetching ? t('Готовлю следующие задания…') : t('Загрузка…')}
            </div>
          )}
        </div>
      </div>
    )
  }
  const chosen = answers[index]
  const answered = chosen !== null
  const isRight = chosen === q.correct
  // Подсказки — шаги решения, но без самого ответа
  const steps = solutionHints(q.solution || '')
  const hintMax = steps.length
  const hintShown = Math.min(hints[index] ?? 0, hintMax)

  return (
    <div className="page animate-fade-in">
      {header}

      <div className="card" style={{ padding: '20px 18px' }}>
        <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{t('ЗАДАНИЕ')} {index + 1}</div>
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

        {!answered && hintShown > 0 && (
          <div className="animate-fade-in" style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(124,108,255,0.08)', border: '1px solid rgba(124,108,255,0.3)', display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#c4bbff' }}>{t('ПОДСКАЗКА')}</div>
            {steps.slice(0, hintShown).map((step, k) => <MathText key={k} text={`${k + 1}. ${step}`} style={{ fontSize: 14 }} />)}
          </div>
        )}

        {!answered && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
            {hintShown < hintMax && (
              <button onClick={() => setHints(h => ({ ...h, [index]: hintShown + 1 }))} style={{ background: 'none', border: 'none', color: '#c4bbff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>
                💡 {hintShown ? t('Следующий шаг ({a}/{b})', { a: hintShown + 1, b: hintMax }) : t('Подсказка')}
              </button>
            )}
            <button onClick={() => answer(SKIPPED)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>
              {t('Не знаю, как решить')}
            </button>
          </div>
        )}
      </div>

      {answered && (
        <div className="animate-fade-in" style={{ marginTop: 14, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: isRight ? 'var(--good)' : 'var(--bad)' }}>
            <Icon name={isRight ? 'check' : 'x'} size={20} />
            {isRight ? t('Правильно!') : chosen === SKIPPED ? t('Правильный ответ: {v0}', { v0: LETTERS[q.correct] }) : t('Неверно. Правильный ответ: {v0}', { v0: LETTERS[q.correct] })}
          </div>

          {isRight ? (
            showSolution
              ? <div className="card"><MathText text={q.solution} /></div>
              : <button className="btn btn-ghost" onClick={() => setShowSolution(true)}>{t('Показать решение')}</button>
          ) : (
            <Explain q={q} chosen={chosen === SKIPPED ? null : chosen} turns={dialogs[index] || []} setTurns={t => setDialogs(d => ({ ...d, [index]: t }))} />
          )}

          <Link href={referenceHref(subject, q)} target="_blank" style={{ fontSize: 14, color: '#c4bbff' }}>📘 {t('Повторить теорию по теме «{topic}»', { topic: t(q.topic || q.section || '') })}</Link>

          <button className="btn" onClick={next}>
            {index + 1 < total ? t('Следующее задание') : t('Завершить')} <Icon name="arrowRight" size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
