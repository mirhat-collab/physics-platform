'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ENT_BATCH, ENT_DIFFICULTIES, ENT_SUBJECTS, sectionNames, topicsOf, type EntDifficulty, type EntQuestion, type EntSubject } from '@/lib/ent'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import { LETTERS } from '../QuestionBody'
import { useT } from '@/app/components/LanguageProvider'

const VARIANTS = [1, 2, 3, 4] as const
const SIZES = [5, 10, 15, 20, 30] as const

// Темы варианта: выбранные разделы по кругу, внутри раздела — случайная тема.
// У каждого варианта свой порядок, поэтому варианты различаются и темами, и числами.
function planTopics(subject: EntSubject, sections: string[], n: number): string[] {
  const secs = (sections.length ? sections : sectionNames(subject)).slice().sort(() => Math.random() - 0.5)
  const pools = secs.map(s => topicsOf(subject, s).slice().sort(() => Math.random() - 0.5))
  return Array.from({ length: n }, (_, i) => {
    const pool = pools[i % pools.length]
    return pool[Math.floor(i / pools.length) % pool.length]
  })
}

export default function PrintPage() {
  const { t } = useT()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [subject, setSubject] = useState<EntSubject>('physics')
  const [sections, setSections] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<EntDifficulty>('ent')
  const [variants, setVariants] = useState(2)
  const [size, setSize] = useState(10)
  const [title, setTitle] = useState('')
  const [withSolutions, setWithSolutions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<EntQuestion[][]>([])

  useEffect(() => {
    // Переход из отчёта по классу: /ent/print?subject=math&section=…&section=…
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const params = new URLSearchParams(window.location.search)
      const subj = params.get('subject') as EntSubject | null
      if (subj && ENT_SUBJECTS[subj]) {
        setSubject(subj)
        setSections(params.getAll('section').filter(x => sectionNames(subj).includes(x)))
      }
      if (!user) { setAllowed(false); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setAllowed(p?.role === 'teacher' || p?.role === 'admin')
    })
  }, [])

  function toggleSection(name: string) {
    setSections(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name])
  }

  async function build() {
    setLoading(true)
    setError('')
    try {
      const out = await Promise.all(Array.from({ length: variants }, async () => {
        const topics = planTopics(subject, sections, size)
        const batches: string[][] = []
        for (let i = 0; i < topics.length; i += ENT_BATCH) batches.push(topics.slice(i, i + ENT_BATCH))
        const parts = await Promise.all(batches.map(async batch => {
          const res = await fetch('/api/ent/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, section: 'all', topics: batch, difficulty, count: batch.length, templatesOnly: true }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(t(data.error || 'Ошибка'))
          return data.questions as EntQuestion[]
        }))
        return parts.flat()
      }))
      setResult(out)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'))
    }
    setLoading(false)
  }

  if (allowed === null) return <div className="page" style={{ color: 'var(--muted)' }}>{t('Загрузка…')}</div>
  if (!allowed) {
    return (
      <div className="page">
        <h1 className="page-title">{t('Варианты для печати')}</h1>
        <div className="card">{t('Эта страница для учителей. Войди под аккаунтом учителя.')}</div>
      </div>
    )
  }

  const heading = title.trim() || t('Проверочная работа · {subject}', { subject: t(ENT_SUBJECTS[subject].label) })

  return (
    <div className="page animate-fade-in-up print-root">
      <div className="no-print">
        <Link href="/teacher" style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none' }}>← {t('Панель учителя')}</Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{t('Варианты для печати')}</h1>
        <p className="page-sub">{t('Несколько разных вариантов с ответами в конце. Нажми «Печать» и выбери «Сохранить как PDF», чтобы получить файл.')}</p>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="label">{t('Предмет')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(id => (
              <button key={id} className={`chip${subject === id ? ' on' : ''}`} onClick={() => { setSubject(id); setSections([]); setResult([]) }}>{t(ENT_SUBJECTS[id].label)}</button>
            ))}
          </div>

          <div className="label">{t('Разделы')} <span style={{ opacity: 0.6, fontWeight: 500, textTransform: 'none' }}>· {t('не выбрано — весь предмет')}</span></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {sectionNames(subject).map(s => (
              <button key={s} className={`chip${sections.includes(s) ? ' on' : ''}`} onClick={() => toggleSection(s)}>{t(s)}</button>
            ))}
          </div>

          <div className="label">{t('Сложность')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {(Object.keys(ENT_DIFFICULTIES) as EntDifficulty[]).map(id => (
              <button key={id} className={`chip${difficulty === id ? ' on' : ''}`} onClick={() => setDifficulty(id)}>{t(ENT_DIFFICULTIES[id].label)}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 18 }}>
            <div>
              <div className="label">{t('Вариантов')}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {VARIANTS.map(n => <button key={n} className={`chip${variants === n ? ' on' : ''}`} onClick={() => setVariants(n)}>{n}</button>)}
              </div>
            </div>
            <div>
              <div className="label">{t('Заданий в варианте')}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {SIZES.map(n => <button key={n} className={`chip${size === n ? ' on' : ''}`} onClick={() => setSize(n)}>{n}</button>)}
              </div>
            </div>
          </div>

          <div className="label">{t('Заголовок')}</div>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder={heading} style={{ width: '100%', marginBottom: 12 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 18, cursor: 'pointer' }}>
            <input type="checkbox" checked={withSolutions} onChange={e => setWithSolutions(e.target.checked)} />
            {t('Добавить решения к ответам')}
          </label>

          <button className="btn" onClick={build} disabled={loading} style={{ width: '100%' }}>
            {loading ? t('Собираю варианты…') : <><Icon name="sparkles" size={18} /> {result.length ? t('Собрать заново') : t('Собрать варианты')}</>}
          </button>
          {error && <div style={{ color: 'var(--bad)', fontSize: 14, marginTop: 10 }}>{error}</div>}
        </div>

        {result.length > 0 && (
          <button className="btn" onClick={() => window.print()} style={{ width: '100%', marginBottom: 18 }}>
            🖨 {t('Печать / сохранить в PDF')}
          </button>
        )}
      </div>

      {result.length > 0 && (
        <div className="print-sheet">
          {result.map((qs, v) => (
            <section key={v} className="print-break" style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid #111', paddingBottom: 6, marginBottom: 10 }}>
                <b style={{ fontSize: 17 }}>{heading}</b>
                <b style={{ fontSize: 17 }}>{t('Вариант {n}', { n: v + 1 })}</b>
              </div>
              <div style={{ fontSize: 14, marginBottom: 16 }}>{t('Фамилия, имя')}: ________________________________ {t('Класс')}: ______</div>
              {qs.map((q, i) => (
                <div key={i} className="print-avoid" style={{ marginBottom: 14, fontSize: 14, lineHeight: 1.5 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <b>{i + 1}.</b>
                    <MathText text={q.question} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 22px', paddingLeft: 20, marginTop: 4 }}>
                    {q.options.map((o, k) => (
                      <span key={k} style={{ display: 'inline-flex', gap: 4 }}>{LETTERS[k]})<MathText text={o} style={{ display: 'inline' }} /></span>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}

          <section>
            <div style={{ borderBottom: '2px solid #111', paddingBottom: 6, marginBottom: 12 }}>
              <b style={{ fontSize: 17 }}>{t('Ответы')} · {heading}</b>
            </div>
            {result.map((qs, v) => (
              <div key={v} className="print-avoid" style={{ marginBottom: 16, fontSize: 14 }}>
                <b>{t('Вариант {n}', { n: v + 1 })}:</b>{' '}
                {qs.map((q, i) => `${i + 1}${LETTERS[q.correct]}`).join(', ')}
                {withSolutions && (
                  <ol style={{ margin: '8px 0 0', paddingLeft: 22 }}>
                    {qs.map((q, i) => (
                      <li key={i} className="print-avoid" style={{ marginBottom: 4 }}>
                        <b>{LETTERS[q.correct]}.</b> <MathText text={q.solution} style={{ display: 'inline' }} />
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  )
}
