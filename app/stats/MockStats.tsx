'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ENT_SUBJECTS, type EntSubject } from '@/lib/ent'
import { ENT_SPEC } from '@/lib/ent-spec'
import { mockSummary, type MockAttempt } from '@/lib/mock-result'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'

function color(x: number) { return x >= 0.7 ? 'var(--good)' : x >= 0.4 ? '#f59e0b' : 'var(--bad)' }

// Темы тренажёра раздела спецификации — для ссылки «тренировать»
function sectionHref(subject: EntSubject, section: string): string {
  const topics = ENT_SPEC[subject].filter(x => x.section === section).flatMap(x => x.ours).slice(0, 8)
  return `/ent?subject=${subject}${topics.map(x => `&topic=${encodeURIComponent(x)}`).join('')}`
}

// Итоги пробных ЕНТ: динамика баллов и средний процент по разделам спецификации
export default function MockStats({ userId }: { userId: string }) {
  const { t, dateLocale } = useT()
  const [attempts, setAttempts] = useState<MockAttempt[] | null>(null)

  useEffect(() => {
    supabase.from('ent_attempts').select('subject, score, max_score, correct, total, details, created_at')
      .eq('user_id', userId).eq('section', 'mock').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setAttempts((data || []) as MockAttempt[]))
  }, [userId])

  if (!attempts) return null
  const summaries = (Object.keys(ENT_SUBJECTS) as EntSubject[])
    .map(subject => ({ subject, s: mockSummary(attempts, subject) }))
    .filter(x => x.s)

  return (
    <>
      <div className="label" style={{ marginTop: 22 }}>{t('Пробный ЕНТ')}</div>
      {!summaries.length && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ flex: 1, color: 'var(--muted)', fontSize: 14 }}>{t('Пробных ЕНТ пока не было. Пройди вариант по спецификации НЦТ — здесь появятся баллы и слабые разделы.')}</span>
          <Link href="/ent/mock" className="btn" style={{ textDecoration: 'none' }}><Icon name="sparkles" size={18} /> {t('Начать пробный ЕНТ')}</Link>
        </div>
      )}
      {summaries.map(({ subject, s }) => {
        if (!s) return null
        const hist = s.history.slice(-12)
        return (
          <div key={subject} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontWeight: 700, flex: 1 }}>{t(ENT_SUBJECTS[subject].label)}</span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t('попыток: {n}', { n: s.count })}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 14 }}>
              {[
                { v: `${s.last} / ${s.max}`, l: t('последний'), c: color(s.last / s.max) },
                { v: String(s.best), l: t('лучший') },
                { v: String(s.avg), l: t('средний (5 последних)') },
                { v: s.delta === null ? '—' : s.delta > 0 ? `+${s.delta}` : String(s.delta), l: t('к прошлому'), c: s.delta === null ? undefined : s.delta >= 0 ? 'var(--good)' : 'var(--bad)' },
              ].map(x => (
                <div key={x.l} style={{ textAlign: 'center', padding: 10, borderRadius: 10, background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: x.c }}>{x.v}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{x.l}</div>
                </div>
              ))}
            </div>

            {hist.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 70, marginBottom: 14 }} aria-label={t('Баллы по попыткам')}>
                {hist.map((h, k) => (
                  <div key={k} title={`${new Date(h.date).toLocaleDateString(dateLocale)}: ${h.score}`}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 2 }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{h.score}</span>
                    <div style={{ width: '100%', maxWidth: 28, height: `${Math.max(4, (h.score / s.max) * 52)}px`, borderRadius: 4, background: color(h.score / s.max) }} />
                  </div>
                ))}
              </div>
            )}

            {s.sections.length > 0 && (
              <>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{t('Разделы спецификации — средний результат')}</div>
                {s.sections.map(sec => (
                  <div key={sec.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 14 }}>
                    <span style={{ flex: '0 0 40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t(sec.name)}>{t(sec.name)}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round(sec.pct * 100)}%`, height: '100%', background: color(sec.pct) }} />
                    </div>
                    <span style={{ width: 40, textAlign: 'right', color: 'var(--muted)', fontSize: 12 }}>{Math.round(sec.pct * 100)}%</span>
                    {sec.pct < 0.7
                      ? <Link href={sectionHref(subject, sec.name)} style={{ width: 90, textAlign: 'right', fontSize: 12, color: '#c4bbff' }}>{t('тренировать')}</Link>
                      : <span style={{ width: 90 }} />}
                  </div>
                ))}
              </>
            )}
            <Link href="/ent/mock" className="btn btn-ghost" style={{ marginTop: 12, textDecoration: 'none', display: 'inline-flex' }}>{t('Новый вариант')}</Link>
          </div>
        )
      })}
    </>
  )
}
