'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ENT_SUBJECTS, sectionNames, solutionSteps, topicsOf, type EntSubject } from '@/lib/ent'
import { isCorrectNumber, parseAnswer } from '@/lib/solve'
import { logAnswers } from '@/lib/answer-log'
import Figure from '@/app/components/Figure'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import ReportTask from '@/app/components/ReportTask'
import StepMode, { StepToggle, useStepMode } from '@/app/components/StepMode'
import StepTutor from '@/app/ent/StepTutor'
import { useT } from '@/app/components/LanguageProvider'

type Task = {
  question: string; figure?: string; solution: string; answer: number; unit: string
  topic: string; section?: string; key?: string; options: string[]; correct: number
}

const fmt = (v: number) => String(Number(v.toPrecision(6))).replace('.', ',')

// «Решение задач»: ответ вписывается числом, без вариантов — угадать нельзя.
// Отдельно от подготовки к ЕНТ: просто решать задачи по теме подряд.
export default function SolvePage() {
  const { t } = useT()
  const [subject, setSubject] = useState<EntSubject>('physics')
  const [section, setSection] = useState('all')
  const [topic, setTopic] = useState('all')
  const [hard, setHard] = useState(false)
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [value, setValue] = useState('')
  const [result, setResult] = useState<'ok' | 'bad' | 'skip' | null>(null)
  const [tries, setTries] = useState(0)
  const [score, setScore] = useState({ ok: 0, all: 0, streak: 0, best: 0 })
  const [stepOn, setStepOn] = useStepMode()
  const inputRef = useRef<HTMLInputElement>(null)

  // Темы с задачами-числами: по предмету, догружаются при смене предмета
  const [topicsBy, setTopicsBy] = useState<Partial<Record<EntSubject, string[]>>>({})
  const available = topicsBy[subject] ?? null
  useEffect(() => {
    if (topicsBy[subject]) return
    let alive = true
    fetch(`/api/solve?subject=${subject}`).then(r => r.json())
      .then(d => { if (alive) setTopicsBy(m => ({ ...m, [subject]: d.topics || [] })) })
      .catch(() => { if (alive) setTopicsBy(m => ({ ...m, [subject]: [] })) })
    return () => { alive = false }
  }, [subject, topicsBy])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/solve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, hard, ...(topic !== 'all' ? { topics: [topic] } : section !== 'all' ? { section } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(t(data.error || 'Ошибка'))
      setTask(data.task)
      setValue('')
      setResult(null)
      setTries(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'))
    }
    setLoading(false)
  }

  function finish(ok: boolean, skipped = false) {
    if (!task) return
    setResult(ok ? 'ok' : skipped ? 'skip' : 'bad')
    setScore(s => {
      const streak = ok ? s.streak + 1 : 0
      return { ok: s.ok + (ok ? 1 : 0), all: s.all + 1, streak, best: Math.max(s.best, streak) }
    })
    logAnswers([{
      source: 'ent', subject, section: task.section ?? null, topic: task.topic, correct: ok, task_key: task.key ?? null,
      payload: ok ? null : { question: task.question, options: task.options, correct: task.correct, chosen: null, solution: task.solution, ...(task.figure ? { figure: task.figure } : {}), ...(task.key ? { key: task.key } : {}) },
    }])
  }

  function check() {
    if (!task || result) return
    const v = parseAnswer(value)
    if (v === null) return
    if (isCorrectNumber(v, task.answer)) finish(true)
    else if (tries === 0) setTries(1) // одна попытка исправить
    else finish(false)
  }

  const topicsIn = (sec: string) => (sec === 'all' ? ENT_SUBJECTS[subject].sections.flatMap(s => s.topics) : topicsOf(subject, sec)).filter(x => !available || available.includes(x))
  const inputStyle: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', width: '100%' }

  return (
    <div className="nb-root page animate-fade-in-up">
      <h1 className="page-title">{t('Решение задач')}</h1>
      <p className="page-sub">{t('Здесь нет вариантов ответа: реши задачу и впиши число. Так видно, что ты действительно умеешь, а не угадал. Дробный ответ можно писать через запятую.')}</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(id => (
            <button key={id} className={`chip${subject === id ? ' on' : ''}`} onClick={() => { setSubject(id); setSection('all'); setTopic('all'); setTask(null) }}>{t(ENT_SUBJECTS[id].label)}</button>
          ))}
          <span style={{ flex: 1 }} />
          <button className={`chip${!hard ? ' on' : ''}`} onClick={() => setHard(false)}>{t('Уровень ЕНТ')}</button>
          <button className={`chip${hard ? ' on' : ''}`} onClick={() => setHard(true)}>{t('Сложные')}</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <select value={section} onChange={e => { setSection(e.target.value); setTopic('all') }} style={inputStyle} aria-label={t('Раздел')}>
            <option value="all">{t('Все разделы')}</option>
            {sectionNames(subject).filter(s => topicsIn(s).length).map(s => <option key={s} value={s}>{t(s)}</option>)}
          </select>
          <select value={topic} onChange={e => setTopic(e.target.value)} style={inputStyle} aria-label={t('Тема')}>
            <option value="all">{t('Все темы')}</option>
            {topicsIn(section).map(x => <option key={x} value={x}>{t(x)}</option>)}
          </select>
        </div>
        {!task && (
          <button className="btn" onClick={load} disabled={loading || available === null} style={{ width: '100%', marginTop: 14 }}>
            <Icon name="edit" size={18} /> {loading ? t('Загрузка…') : t('Начать')}
          </button>
        )}
        {error && <div style={{ color: 'var(--bad)', fontSize: 14, marginTop: 10 }}>{error}</div>}
      </div>

      {score.all > 0 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
          <span>{t('Решено верно:')} <b style={{ color: 'var(--text)' }}>{score.ok} / {score.all}</b></span>
          <span>{t('Подряд:')} <b style={{ color: 'var(--text)' }}>{score.streak}</b></span>
          <span>{t('Лучшая серия:')} <b style={{ color: 'var(--text)' }}>{score.best}</b></span>
        </div>
      )}

      {task && (
        <div className="card" style={{ padding: '20px 18px', display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, color: 'var(--muted)', fontSize: 12, fontWeight: 700 }}>{t('ЗАДАЧА')} · <span style={{ fontWeight: 500 }}>{t(task.topic)}</span></div>
            <StepToggle on={stepOn} onChange={setStepOn} />
          </div>
          <MathText text={task.question} style={{ fontSize: 16, lineHeight: 1.6 }} />
          <Figure svg={task.figure} />

          {stepOn && !result && <StepMode key={task.question} solution={task.solution} onFinish={() => inputRef.current?.focus()} />}

          {!result ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') check() }}
                  inputMode="decimal" placeholder={t('Ответ')} aria-label={t('Ответ')} style={{ ...inputStyle, width: 160, fontSize: 16, borderColor: tries ? 'var(--warn)' : 'var(--line)' }} />
                {task.unit && <span style={{ color: 'var(--muted)' }}>{t(task.unit)}</span>}
                <button className="btn" onClick={check} disabled={parseAnswer(value) === null}>{t('Проверить')}</button>
              </div>
              {tries > 0 && <div style={{ color: 'var(--warn)', fontSize: 14 }}>{t('Неверно. Проверь вычисления и попробуй ещё раз — последняя попытка.')}</div>}
              <button onClick={() => finish(false, true)} style={{ justifySelf: 'start', background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>
                {t('Не знаю, как решить')}
              </button>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: result === 'ok' ? 'var(--good)' : 'var(--bad)' }}>
                <Icon name={result === 'ok' ? 'check' : 'x'} size={20} />
                {result === 'ok' ? t('Правильно!') : t('Правильный ответ: {v}', { v: `${fmt(task.answer)}${task.unit ? ` ${t(task.unit)}` : ''}` })}
              </div>
              {task.solution && (
                <div className="card" style={{ background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{t('РЕШЕНИЕ ПО ШАГАМ')}</div>
                  <StepTutor question={task.question} steps={solutionSteps(task.solution)} />
                </div>
              )}
              <ReportTask q={{ question: task.question, options: task.options, correct: task.correct, solution: task.solution, figure: task.figure, key: task.key, topic: task.topic }} subject={subject} />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn" onClick={load} disabled={loading}>{loading ? t('Загрузка…') : t('Следующая задача')} <Icon name="arrowRight" size={18} /></button>
                <Link href={`/reference?subject=${subject}&topic=${encodeURIComponent(task.topic)}`} className="btn btn-ghost" style={{ textDecoration: 'none' }}><Icon name="book" size={18} /> {t('Теория')}</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
