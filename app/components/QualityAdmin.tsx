'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { EntQuestion } from '@/lib/ent'
import type { TaskFlag } from '@/lib/task-quality'
import QuestionBody from '@/app/ent/QuestionBody'
import { REPORT_REASONS } from '@/app/components/ReportTask'
import { useT } from '@/app/components/LanguageProvider'
import Icon from '@/app/components/Icon'

type Report = {
  id: number; task_key: string | null; subject: 'physics' | 'math'; topic: string | null
  reason: string; comment: string | null; payload: EntQuestion; locale: string
  status: 'new' | 'fixed' | 'rejected'; created_at: string
}
type Task = {
  key: string; subject: string; topic: string | null; answers: number; accuracy: number
  topicAccuracy: number | null; flags: TaskFlag[]; source: 'bank' | 'template'; reports: number
  sample: EntQuestion | null
}
type Data = { reports: Report[]; tasks: Task[]; checked: number; answers: number }

const FLAG_LABEL: Record<TaskFlag, string> = {
  hard: 'почти все ошибаются',
  below_topic: 'намного хуже других заданий темы',
  easy: 'все решают верно',
}
const SUBJECT: Record<string, string> = { physics: 'Физика', math: 'Математика' }
const pct = (x: number) => `${Math.round(x * 100)}%`

// Вкладка админки «Качество заданий»: жалобы учеников и подозрительные задания
export default function QualityAdmin() {
  const { t, dateLocale } = useT()
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [view, setView] = useState<'reports' | 'tasks'>('reports')
  const [status, setStatus] = useState<'new' | 'all'>('new')
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/quality').then(async r => {
      const d = await r.json().catch(() => null)
      if (!r.ok || !d) setError(t(d?.error || 'Не удалось загрузить статистику'))
      else setData(d)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function mark(id: number, next: Report['status']) {
    const r = await fetch('/api/admin/quality', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: next }) })
    if (r.ok) setData(d => d && { ...d, reports: d.reports.map(x => (x.id === id ? { ...x, status: next } : x)) })
  }

  if (error) return <div style={{ color: 'var(--bad)' }}>{error}</div>
  if (!data) return <div style={{ color: 'var(--muted)' }}>{t('Загрузка…')}</div>

  const fresh = data.reports.filter(r => r.status === 'new')
  const reports = status === 'new' ? fresh : data.reports
  const reasonLabel = (id: string) => t(REPORT_REASONS.find(r => r.id === id)?.label ?? id)
  const bankLink = (key: string | null) => key?.startsWith('b:') ? <Link href={`/bank?edit=${key.slice(2)}`} style={{ fontSize: 13, color: 'var(--accent)' }}><Icon name="edit" size="1em" /> {t('Исправить в банке')}</Link> : null

  return (
    <div>
      <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 14 }}>
        {t('Жалобы учеников на задания и задания, которые решают подозрительно плохо или легко. Задания из шаблонов исправляются в коде — пришлите их разработчику, задачи банка можно исправить сразу.')}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className={`chip${view === 'reports' ? ' on' : ''}`} onClick={() => setView('reports')}>{t('Жалобы')} ({fresh.length})</button>
        <button className={`chip${view === 'tasks' ? ' on' : ''}`} onClick={() => setView('tasks')}>{t('Подозрительные задания')} ({data.tasks.length})</button>
      </div>

      {view === 'reports' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className={`chip${status === 'new' ? ' on' : ''}`} onClick={() => setStatus('new')}>{t('Новые')}</button>
            <button className={`chip${status === 'all' ? ' on' : ''}`} onClick={() => setStatus('all')}>{t('Все')}</button>
          </div>
          {!reports.length && <div className="card" style={{ color: 'var(--muted)' }}>{t('Жалоб пока нет.')}</div>}
          <div style={{ display: 'grid', gap: 10 }}>
            {reports.map(r => {
              const id = `r${r.id}`
              return (
                <div key={r.id} className="card" style={{ padding: 14, opacity: r.status === 'new' ? 1 : 0.65 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                    <b style={{ color: 'var(--bad)' }}>{reasonLabel(r.reason)}</b>
                    <span>· {t(SUBJECT[r.subject])}{r.topic ? ` → ${t(r.topic)}` : ''}</span>
                    <span>· {r.locale === 'kk' ? 'қаз' : 'рус'}</span>
                    <span>· {new Date(r.created_at).toLocaleDateString(dateLocale)}</span>
                    {r.status !== 'new' && <span>· {r.status === 'fixed' ? t('исправлено') : t('отклонено')}</span>}
                  </div>
                  {r.comment && <div style={{ fontSize: 14, marginBottom: 8 }}>«{r.comment}»</div>}
                  <button onClick={() => setOpen(open === id ? null : id)} className="chip" style={{ marginBottom: open === id ? 10 : 0 }}>{open === id ? t('Скрыть задание') : t('Показать задание')}</button>
                  {open === id && <QuestionBody q={r.payload} chosen={null} />}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
                    {r.status === 'new' ? (
                      <>
                        <button className="btn" onClick={() => mark(r.id, 'fixed')}><Icon name="check" size={16} /> {t('Исправлено')}</button>
                        <button className="btn btn-ghost" onClick={() => mark(r.id, 'rejected')}>{t('Ошибки нет')}</button>
                      </>
                    ) : (
                      <button className="btn btn-ghost" onClick={() => mark(r.id, 'new')}>{t('Вернуть в новые')}</button>
                    )}
                    {bankLink(r.task_key)}
                    {r.task_key && !r.task_key.startsWith('b:') && <code style={{ fontSize: 12, color: 'var(--muted)' }}>{r.task_key}</code>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {view === 'tasks' && (
        <>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
            {t('За 90 дней: {a} ответов, хватает данных по {b} заданиям (от 8 ответов на задание).', { a: data.answers, b: data.checked })}
          </div>
          {!data.tasks.length && <div className="card" style={{ color: 'var(--muted)' }}>{t('Подозрительных заданий нет — или пока мало ответов.')}</div>}
          <div style={{ display: 'grid', gap: 10 }}>
            {data.tasks.map(x => (
              <div key={x.key} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                  <b style={{ fontSize: 18, color: x.accuracy < 0.5 ? 'var(--bad)' : 'var(--good)' }}>{pct(x.accuracy)}</b>
                  <span>{t('верных из {n} ответов', { n: x.answers })}</span>
                  {x.topicAccuracy !== null && <span>· {t('в теме: {p}', { p: pct(x.topicAccuracy) })}</span>}
                  {x.reports > 0 && <b style={{ color: 'var(--bad)' }}>· {t('жалоб: {n}', { n: x.reports })}</b>}
                </div>
                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  {t(SUBJECT[x.subject])}{x.topic ? ` → ${t(x.topic)}` : ''} · {x.source === 'bank' ? t('банк задач') : t('шаблон')} · {x.flags.map(f => t(FLAG_LABEL[f])).join(', ')}
                </div>
                {x.sample && (
                  <>
                    <button onClick={() => setOpen(open === x.key ? null : x.key)} className="chip" style={{ marginBottom: open === x.key ? 10 : 0 }}>{open === x.key ? t('Скрыть задание') : t('Показать пример')}</button>
                    {open === x.key && <QuestionBody q={x.sample} chosen={null} />}
                  </>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center' }}>
                  {bankLink(x.key)}
                  {x.source === 'template' && <code style={{ fontSize: 12, color: 'var(--muted)' }}>{x.key}</code>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
