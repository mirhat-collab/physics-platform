'use client'
import { useEffect, useState } from 'react'
import type { AdminStats as Stats } from '@/lib/admin-stats'
import { useT } from '@/app/components/LanguageProvider'

const ROLE_LABEL: Record<string, string> = { student: 'Ученики', teacher: 'Учителя', parent: 'Родители', admin: 'Админы' }
const pct = (x: number) => `${Math.round(x * 100)}%`
const accColor = (a: number) => (a >= 0.8 ? 'var(--good)' : a >= 0.6 ? 'var(--warn)' : 'var(--bad)')

// Вкладка админки «Статистика»
export default function AdminStats() {
  const { t, dateLocale } = useT()
  const [s, setS] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats').then(async r => {
      const data = await r.json().catch(() => null)
      if (!r.ok || !data) setError(t(data?.error || 'Не удалось загрузить статистику'))
      else setS(data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) return <div style={{ color: 'var(--bad)' }}>{error}</div>
  if (!s) return <div style={{ color: 'var(--muted)' }}>{t('Загрузка…')}</div>

  const max = Math.max(1, ...s.byDay.map(d => d.answers))
  const tile = (label: string, value: string | number, sub?: string) => (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>{value}</div>
      {sub && <div style={{ color: 'var(--muted)', fontSize: 12 }}>{sub}</div>}
    </div>
  )
  const totalUsers = Object.values(s.roles).reduce((a, b) => a + b, 0)
  const day = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 16 }}>
        {tile(t('Пользователей'), totalUsers, Object.entries(s.roles).map(([r, n]) => `${t(ROLE_LABEL[r] || r)}: ${n}`).join(' · '))}
        {tile(t('Новых за 7 дней'), s.newUsers.d7, t('за 30 дней: {n}', { n: s.newUsers.d30 }))}
        {tile(t('Активных за 7 дней'), s.active.d7, t('сегодня: {a} · за 30 дней: {b}', { a: s.active.d1, b: s.active.d30 }))}
        {tile(t('Решено заданий за 7 дней'), s.answers.d7, t('за 30 дней: {n} · верно {p}', { n: s.answers.d30, p: pct(s.answers.accuracy30) }))}
        {tile(t('Пробных ЕНТ'), s.mocks.total, s.mocks.avg !== null ? t('за 30 дней: {n} · средний результат {p}%', { n: s.mocks.d30, p: s.mocks.avg }) : t('пока никто не проходил'))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('Решено заданий по дням (30 дней)')}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140 }}>
          {s.byDay.map(d => (
            <div key={d.date} title={t('{date}: заданий {a}, учеников {u}, регистраций {r}', { date: day(d.date), a: d.answers, u: d.users, r: d.signups })}
              style={{ flex: 1, minWidth: 0, height: `${Math.max(2, (d.answers / max) * 100)}%`, borderRadius: 4, background: d.answers ? 'var(--accent)' : 'var(--line)', position: 'relative' }}>
              {d.signups > 0 && <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'var(--good)' }}>+{d.signups}</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
          <span>{day(s.byDay[0].date)}</span><span>{t('зелёным — новые регистрации')}</span><span>{day(s.byDay[s.byDay.length - 1].date)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{t('Самые активные за 7 дней')}</div>
          {s.topStudents.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('Пока никто не решал.')}</div>}
          {s.topStudents.map((x, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i + 1}. {x.name}{x.grade ? <span style={{ color: 'var(--muted)' }}> · {x.grade}</span> : null}</span>
              <span>{x.answers}</span>
              <span style={{ color: accColor(x.accuracy), width: 44, textAlign: 'right' }}>{pct(x.accuracy)}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{t('Самые трудные темы (30 дней)')}</div>
          {s.hardTopics.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('Мало данных: нужно хотя бы 10 ответов по теме.')}</div>}
          {s.hardTopics.map(x => (
            <div key={x.topic} style={{ display: 'flex', gap: 10, fontSize: 14, padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t(x.topic)}</span>
              <span style={{ color: 'var(--muted)' }}>{x.answers}</span>
              <span style={{ color: accColor(x.accuracy), width: 44, textAlign: 'right' }}>{pct(x.accuracy)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ fontSize: 14, color: 'var(--muted)' }}>
        {t('Посещаемость (сколько людей заходит на сайт, какие страницы смотрят, с телефона или компьютера) — на')}{' '}
        <a href="https://vercel.com/mirhat-collabs-projects/mirha-edu./analytics" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>vercel.com → Analytics</a>.
      </div>
    </div>
  )
}
