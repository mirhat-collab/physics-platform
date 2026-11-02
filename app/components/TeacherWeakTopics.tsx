'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useT } from '@/app/components/LanguageProvider'
import Icon from '@/app/components/Icon'

type Row = { user_id: string; subject: string; topic: string | null; section: string | null; correct: boolean }
type Weak = { name: string; subject: string; acc: number; total: number; students: number; erred: number }

const MIN = 5 // меньше ответов — выводы делать рано

// На вкладке «Обзор»: три темы, где ученики ошибаются чаще всего за 30 дней
export default function TeacherWeakTopics({ studentIds }: { studentIds: string[] }) {
  const { t } = useT()
  const [weak, setWeak] = useState<Weak[] | null>(null)
  const key = studentIds.join(',')

  useEffect(() => {
    const ids = key ? key.split(',') : []
    if (!ids.length) { setWeak([]); return } // eslint-disable-line react-hooks/set-state-in-effect
    const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString()
    supabase.from('answer_log').select('user_id, subject, topic, section, correct')
      .in('user_id', ids).eq('source', 'ent').gte('created_at', since).limit(20000)
      .then(({ data }) => {
        const by = new Map<string, { subject: string; name: string; t: number; c: number; users: Set<string>; bad: Set<string> }>()
        for (const r of (data || []) as Row[]) {
          const name = r.topic || r.section
          if (!name) continue
          const k = `${r.subject}|${name}`
          const e = by.get(k) || { subject: r.subject, name, t: 0, c: 0, users: new Set<string>(), bad: new Set<string>() }
          e.t++; if (r.correct) e.c++; else e.bad.add(r.user_id)
          e.users.add(r.user_id)
          by.set(k, e)
        }
        setWeak([...by.values()].filter(e => e.t >= MIN)
          .map(e => ({ name: e.name, subject: e.subject, acc: e.c / e.t, total: e.t, students: e.users.size, erred: e.bad.size }))
          .sort((a, b) => a.acc - b.acc).slice(0, 3))
      })
  }, [key])

  if (!weak || !weak.length) return null

  return (
    <section className="card tw-card" aria-labelledby="tw-title">
      <div className="tw-head">
        <div>
          <p className="nb-eyebrow" style={{ margin: 0 }}>{t('За 30 дней')}</p>
          <h2 id="tw-title" style={{ margin: '2px 0 0', fontSize: 18 }}>{t('Что повторить на уроке')}</h2>
        </div>
        <Link href="/teacher/report" className="nb-link">{t('Весь отчёт')} →</Link>
      </div>
      <ol className="tw-list">
        {weak.map(w => (
          <li key={`${w.subject}${w.name}`}>
            <span className="tw-name">{t(w.name)}<small>{t(w.subject === 'math' ? 'Математика' : 'Физика')} · {t('ошибались {a} из {b} учеников', { a: w.erred, b: w.students })}</small></span>
            <span className="tw-bar" aria-hidden><span style={{ width: `${Math.round(w.acc * 100)}%` }} /></span>
            <b className="tw-pct">{Math.round(w.acc * 100)}%</b>
            <Link className="tw-go" href={`/ent?subject=${w.subject}&topic=${encodeURIComponent(w.name)}`} aria-label={t('Открыть задания по теме')}><Icon name="arrowRight" size={16} /></Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
