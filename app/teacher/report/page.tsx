'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ENT_SUBJECTS, MOCK_MAX, sectionOfTopic, type EntSubject } from '@/lib/ent'
import { useT } from '@/app/components/LanguageProvider'

type Student = { id: string; full_name: string | null; grade: string | null }
type Row = { user_id: string; section: string | null; topic: string | null; correct: boolean }
type Mock = { user_id: string; correct: number; total: number; score?: number | null; created_at: string }

const PERIODS = [7, 30, 90] as const
const MIN_TOPIC = 5 // меньше ответов по теме — выводы делать рано
const WEAK = 0.6

function pct(x: number) { return `${Math.round(x * 100)}%` }
function color(x: number) { return x >= 0.8 ? 'var(--good)' : x >= WEAK ? '#f59e0b' : 'var(--bad)' }

export default function ClassReportPage() {
  const { t } = useT()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [grade, setGrade] = useState('all')
  const [subject, setSubject] = useState<EntSubject>('physics')
  const [days, setDays] = useState<number>(30)
  const [rows, setRows] = useState<Row[]>([])
  const [mocks, setMocks] = useState<Mock[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (p?.role !== 'teacher' && p?.role !== 'admin') { router.push('/dashboard'); return }
      const { data } = await supabase.from('profiles').select('id, full_name, grade').eq('role', 'student').order('full_name')
      setStudents((data || []) as Student[])
      setReady(true)
    })
  }, [router])

  const grades = useMemo(() => [...new Set(students.map(s => s.grade).filter((g): g is string => !!g))].sort((a, b) => a.localeCompare(b, 'ru', { numeric: true })), [students])
  const group = useMemo(() => students.filter(s => grade === 'all' || s.grade === grade), [students, grade])

  useEffect(() => {
    if (!ready) return
    const ids = group.map(s => s.id)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    let cancelled = false
    const empty = { data: [] }
    Promise.all(!ids.length ? [empty, empty] : [
      supabase.from('answer_log').select('user_id, section, topic, correct')
        .eq('source', 'ent').eq('subject', subject).in('user_id', ids).gte('created_at', since).limit(10000),
      supabase.from('ent_attempts').select('*')
        .eq('section', 'mock').eq('subject', subject).in('user_id', ids).order('created_at', { ascending: false }).limit(500),
    ]).then(([log, att]) => {
      if (cancelled) return
      setRows((log.data || []) as Row[])
      setMocks((att.data || []) as Mock[])
    })
    return () => { cancelled = true }
  }, [ready, group, subject, days])

  if (!ready) return <div className="page" style={{ color: 'var(--muted)' }}>{t('Загрузка…')}</div>

  // По темам: точность класса и сколько учеников «проседают»
  const topicMap = new Map<string, { total: number; correct: number; per: Map<string, { t: number; c: number }> }>()
  for (const r of rows) {
    const key = r.topic || r.section || '—'
    const e = topicMap.get(key) || { total: 0, correct: 0, per: new Map() }
    e.total++
    if (r.correct) e.correct++
    const s = e.per.get(r.user_id) || { t: 0, c: 0 }
    s.t++
    if (r.correct) s.c++
    e.per.set(r.user_id, s)
    topicMap.set(key, e)
  }
  const topics = [...topicMap.entries()]
    .filter(([, e]) => e.total >= MIN_TOPIC)
    .map(([name, e]) => ({
      name, total: e.total, acc: e.correct / e.total, students: e.per.size,
      weak: [...e.per.values()].filter(s => s.t >= 2 && s.c / s.t < WEAK).length,
    }))
    .sort((a, b) => a.acc - b.acc)

  // По ученикам
  const byStudent = group.map(s => {
    const mine = rows.filter(r => r.user_id === s.id)
    const correct = mine.filter(r => r.correct).length
    const perTopic = new Map<string, { t: number; c: number }>()
    for (const r of mine) {
      const k = r.topic || r.section || '—'
      const e = perTopic.get(k) || { t: 0, c: 0 }
      e.t++
      if (r.correct) e.c++
      perTopic.set(k, e)
    }
    const weakest = [...perTopic.entries()].filter(([, e]) => e.t >= 2).sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t)[0]
    const mock = mocks.find(m => m.user_id === s.id)
    return { s, total: mine.length, acc: mine.length ? correct / mine.length : 0, weakest, mock }
  }).sort((a, b) => (b.total ? 1 : 0) - (a.total ? 1 : 0) || a.acc - b.acc)

  const active = byStudent.filter(x => x.total > 0).length
  const total = rows.length
  const acc = total ? rows.filter(r => r.correct).length / total : 0
  const weakTopics = topics.filter(x => x.acc < WEAK).map(x => x.name).filter(x => sectionOfTopic(subject, x))
  const printHref = `/ent/print?subject=${subject}${[...new Set(weakTopics.map(x => sectionOfTopic(subject, x)!))].slice(0, 6).map(x => `&section=${encodeURIComponent(x)}`).join('')}`

  return (
    <div className="page animate-fade-in-up">
      <Link href="/teacher" style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none' }}>← {t('Панель учителя')}</Link>
      <h1 className="page-title" style={{ marginTop: 8 }}>{t('Отчёт по классу (ЕНТ)')}</h1>
      <p className="page-sub">{t('Какие темы класс решает хуже всего и кому нужна помощь — по ответам в тренажёре ЕНТ и пробных ЕНТ.')}</p>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="label">{t('Класс')}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <button className={`chip${grade === 'all' ? ' on' : ''}`} onClick={() => setGrade('all')}>{t('Все ученики')}</button>
          {grades.map(g => <button key={g} className={`chip${grade === g ? ' on' : ''}`} onClick={() => setGrade(g)}>{g}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="label">{t('Предмет')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(id => (
                <button key={id} className={`chip${subject === id ? ' on' : ''}`} onClick={() => setSubject(id)}>{t(ENT_SUBJECTS[id].label)}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="label">{t('Период')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {PERIODS.map(d => <button key={d} className={`chip${days === d ? ' on' : ''}`} onClick={() => setDays(d)}>{t('{n} дн.', { n: d })}</button>)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { v: `${active} / ${group.length}`, l: t('решали задания') },
          { v: total, l: t('ответов') },
          { v: total ? pct(acc) : '—', l: t('верных ответов') },
        ].map(x => (
          <div key={x.l} className="card" style={{ textAlign: 'center', padding: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{x.v}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{x.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="label" style={{ margin: 0, flex: 1 }}>{t('Темы: от самых слабых')}</div>
        {weakTopics.length > 0 && <Link href={printHref} className="chip">🖨 {t('Вариант по слабым разделам')}</Link>}
      </div>
      <div className="card" style={{ padding: 0, marginBottom: 18 }}>
        {topics.length === 0 && <div style={{ padding: 16, color: 'var(--muted)', fontSize: 14 }}>{t('Пока мало данных: нужно хотя бы {n} ответов по теме.', { n: MIN_TOPIC })}</div>}
        {topics.map((x, k) => (
          <div key={x.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: k ? '1px solid var(--line)' : 'none' }}>
            <span style={{ flex: 1, fontSize: 14 }}>{t(x.name)}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
              {t('{n} отв.', { n: x.total })}{x.weak > 0 && <> · <span style={{ color: 'var(--bad)' }}>{t('слабо у {a} из {b}', { a: x.weak, b: x.students })}</span></>}
            </span>
            <b style={{ color: color(x.acc), minWidth: 44, textAlign: 'right' }}>{pct(x.acc)}</b>
          </div>
        ))}
      </div>

      <div className="label">{t('Ученики')}</div>
      <div className="card" style={{ padding: 0 }}>
        {byStudent.map(({ s, total: n, acc: a, weakest, mock }, k) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: k ? '1px solid var(--line)' : 'none', opacity: n ? 1 : 0.55 }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{s.full_name || t('Без имени')} {s.grade && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {s.grade}</span>}</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>
                {n ? t('{n} отв.', { n }) : t('не решал за период')}
                {weakest && ` · ${t('слабее всего')}: ${t(weakest[0])}`}
                {mock && ` · ${t('пробный ЕНТ')}: ${mock.score != null ? `${mock.score}/${MOCK_MAX}` : `${mock.correct}/${mock.total}`}`}
              </span>
            </span>
            <b style={{ color: n ? color(a) : 'var(--muted)', minWidth: 44, textAlign: 'right' }}>{n ? pct(a) : '—'}</b>
          </div>
        ))}
        {!byStudent.length && <div style={{ padding: 16, color: 'var(--muted)', fontSize: 14 }}>{t('В этом классе пока нет учеников.')}</div>}
      </div>
    </div>
  )
}
