'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ENT_SUBJECTS, MOCK_MAX, type EntSubject } from '@/lib/ent'
import { ENT_SPEC } from '@/lib/ent-spec'
import { DEFAULT_GOALS, WEEKLY_GOALS, dailyPlan, forecast, gains, practiceStreak, weekProgress, type Goals } from '@/lib/coach'
import type { LogRow } from '@/lib/stats'
import type { MockAttempt } from '@/lib/mock-result'
import { useT } from '@/app/components/LanguageProvider'

const href = (subject: EntSubject, topics: string[], repair = false) =>
  `/ent?subject=${subject}${repair ? '&repair=1' : ''}${topics.slice(0, 8).map(x => `&topic=${encodeURIComponent(x)}`).join('')}`

// «Подготовка к ЕНТ»: прогноз балла и цель, план на сегодня, серия и неделя
export default function EntCoach() {
  const { t } = useT()
  const [userId, setUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<LogRow[] | null>(null)
  const [mocks, setMocks] = useState<MockAttempt[]>([])
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS)
  const [subject, setSubject] = useState<EntSubject>('physics')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      const [log, att, prof] = await Promise.all([
        supabase.from('answer_log').select('source, subject, section, topic, correct, created_at')
          .eq('user_id', user.id).gte('created_at', since).order('created_at', { ascending: false }).limit(3000),
        supabase.from('ent_attempts').select('subject, score, max_score, correct, total, details, created_at')
          .eq('user_id', user.id).eq('section', 'mock').order('created_at', { ascending: false }).limit(20),
        supabase.from('profiles').select('ent_goals').eq('id', user.id).single(),
      ])
      const r = (log.data || []) as LogRow[]
      setRows(r)
      setMocks((att.data || []) as MockAttempt[])
      const g = prof.data?.ent_goals as Partial<Goals> | null
      if (g) setGoals({ target: { ...DEFAULT_GOALS.target, ...g.target }, weekly: g.weekly || DEFAULT_GOALS.weekly })
      // Предмет, который решали больше всего
      const math = r.filter(x => x.subject === 'math').length
      if (math > r.length - math) setSubject('math')
    })
  }, [])

  function saveGoals(next: Goals) {
    setGoals(next)
    if (userId) supabase.from('profiles').update({ ent_goals: next }).eq('id', userId).then(() => {})
  }

  if (!rows) return null
  const fc = forecast(rows, mocks, subject)
  const target = goals.target[subject]
  const g = gains(rows, subject, target).slice(0, 3)
  const plan = dailyPlan(rows, subject)
  const planDone = plan.reduce((s, p) => s + p.done, 0), planTotal = plan.reduce((s, p) => s + p.count, 0)
  const streak = practiceStreak(rows)
  const week = weekProgress(rows)
  const weekPct = Math.min(100, Math.round((week.solved / goals.weekly) * 100))
  const box = { padding: 14, borderRadius: 14, background: 'var(--surface-2)', marginBottom: 12 } as const
  const label = (k: string) => k === 'repeat' ? t('Повторить ошибки') : k === 'weak' ? t('Слабая тема') : t('Новая тема')

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 17, flex: 1 }}>{t('Подготовка к ЕНТ')}</div>
        {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(s => (
          <button key={s} className={`chip${subject === s ? ' on' : ''}`} onClick={() => setSubject(s)}>{t(ENT_SUBJECTS[s].label)}</button>
        ))}
      </div>

      {/* Прогноз и цель */}
      <div style={box}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t('Прогноз балла')}</span>
          {fc ? <span style={{ fontSize: 28, fontWeight: 800 }}>≈ {fc.score} <span style={{ fontSize: 15, color: 'var(--muted)' }}>/ {MOCK_MAX}</span></span>
            : <span style={{ fontSize: 14 }}>{t('пока мало данных')}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t('Цель')}</span>
          <button className="chip" style={{ padding: '2px 10px' }} onClick={() => saveGoals({ ...goals, target: { ...goals.target, [subject]: Math.max(10, target - 5) } })} aria-label="−">−</button>
          <b style={{ minWidth: 26, textAlign: 'center' }}>{target}</b>
          <button className="chip" style={{ padding: '2px 10px' }} onClick={() => saveGoals({ ...goals, target: { ...goals.target, [subject]: Math.min(MOCK_MAX, target + 5) } })} aria-label="+">+</button>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
          {!fc ? t('Пройди пробный ЕНТ или реши хотя бы 20 заданий — появится прогноз.')
            : fc.confidence === 'low' ? t('Оценка приблизительная: данных пока немного.')
            : fc.fromMocks !== null ? t('По пробным ЕНТ (в среднем {m}) и {n} ответам в тренажёре.', { m: fc.fromMocks, n: fc.answers })
            : t('По {n} ответам в тренажёре. Пробный ЕНТ сделает прогноз точнее.', { n: fc.answers })}
        </div>
        {fc && fc.score < target && g.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, marginBottom: 6 }}>{t('До цели не хватает ≈ {n} баллов. Больше всего дадут разделы:', { n: target - fc.score })}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {g.map(x => (
                <Link key={x.section} className="chip" href={href(subject, ENT_SPEC[subject].filter(st => st.section === x.section).flatMap(st => st.ours))} style={{ textDecoration: 'none' }}>
                  {t(x.section)} · +{Math.max(1, Math.round(x.points))}
                </Link>
              ))}
            </div>
          </div>
        )}
        {fc && fc.score >= target && <div style={{ marginTop: 8, color: 'var(--good)', fontSize: 14, fontWeight: 700 }}>{t('Прогноз уже на уровне цели — подними цель!')}</div>}
        {!mocks.some(m => m.subject === subject) && <Link href="/ent/mock" style={{ display: 'inline-block', marginTop: 8, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{t('Пройти пробный ЕНТ →')}</Link>}
      </div>

      {/* План на сегодня */}
      <div style={box}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, flex: 1 }}>{t('План на сегодня')} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 13 }}>{t('≈ 15 минут')}</span></span>
          {planTotal > 0 && <span style={{ fontSize: 13, color: planDone >= planTotal ? 'var(--good)' : 'var(--muted)' }}>{planDone} / {planTotal}</span>}
        </div>
        {plan.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('Все темы уже пройдены — реши пробный ЕНТ.')}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 6 }}>
          {plan.map((p, i) => {
            const done = p.done >= p.count
            return (
              <Link key={i} href={href(subject, p.topics, p.kind === 'repeat')} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, padding: '9px 10px', borderRadius: 10, border: '1px solid var(--line)', textDecoration: 'none', color: 'var(--text)', opacity: done ? 0.6 : 1 }}>
                <span aria-hidden style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, border: `1.5px solid ${done ? 'var(--good)' : 'var(--accent)'}`, color: done ? 'var(--good)' : 'var(--accent)' }}>{done ? '✓' : i + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{label(p.kind)}</span>
                  <span style={{ display: 'block', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.topics.map(x => t(x)).join(', ')}</span>
                </span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{p.done}/{p.count}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Серия и неделя */}
      <div style={{ ...box, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>{t('{n} дн. подряд', { n: streak.days })}</span>
          <span style={{ color: streak.today ? 'var(--good)' : 'var(--muted)', fontSize: 13 }}>
            {streak.today ? t('занятие сегодня уже есть') : streak.days ? t('реши задание сегодня, чтобы не прервать серию') : t('начни серию сегодня')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, flex: 1 }}>{t('Цель на неделю: {a} из {b} заданий', { a: week.solved, b: goals.weekly })}</span>
          {WEEKLY_GOALS.map(w => (
            <button key={w} className={`chip${goals.weekly === w ? ' on' : ''}`} style={{ padding: '3px 9px', fontSize: 12 }} onClick={() => saveGoals({ ...goals, weekly: w })}>{w}</button>
          ))}
        </div>
        <div style={{ height: 8, borderRadius: 999, background: 'var(--bg)', overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ width: `${weekPct}%`, height: '100%', background: weekPct >= 100 ? 'var(--good)' : 'var(--accent)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', fontSize: 11, color: 'var(--muted)' }}>
          {[t('Пн'), t('Вт'), t('Ср'), t('Чт'), t('Пт'), t('Сб'), t('Вс')].map((d, i) => (
            <div key={d}>
              <div style={{ height: 26, borderRadius: 7, marginBottom: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text)',
                background: week.byDay[i] ? `color-mix(in srgb, var(--accent) ${Math.round(Math.min(90, 25 + week.byDay[i] * 2.5))}%, transparent)` : 'var(--bg)' }}>{week.byDay[i] || ''}</div>
              {d}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
