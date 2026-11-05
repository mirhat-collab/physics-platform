'use client'
import Link from 'next/link'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'
import { LESSONS, UPCOMING, type Txt } from '@/lib/stereo/lessons'
import { useProgress } from './progress'

// Список уроков «Стереометрия в 3D»
export default function StereoPage() {
  const { t, locale } = useT()
  const tx = (x: Txt) => (locale === 'kk' ? x.kk : x.ru)
  const progress = useProgress()

  return (
    <div className="nb-root page animate-fade-in-up">
      <h1 className="page-title">{t('Стереометрия в 3D')}</h1>
      <p className="page-sub">{t('Теория по шагам с объёмными фигурами: их можно вращать и приближать, чтобы увидеть, как всё устроено в пространстве.')}</p>

      <div style={{ display: 'grid', gap: 12 }}>
        {LESSONS.map((l, i) => {
          const p = progress[l.id], pct = p ? Math.round((Math.min(p.step, l.steps.length) / l.steps.length) * 100) : 0
          return (
            <Link key={l.id} href={`/stereo/${l.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'var(--text)' }}>
              <span style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)', fontWeight: 800 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 800, fontSize: 16 }}>{tx(l.title)}</span>
                <span style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{tx(l.summary)}</span>
                <span style={{ display: 'block', height: 5, borderRadius: 3, background: 'var(--line)', marginTop: 8, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'var(--accent)' }} />
                </span>
                <span style={{ display: 'block', color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                  {pct === 100 ? (p?.quiz != null ? t('Пройден · проверка {a} из {b}', { a: p.quiz, b: l.quiz.length }) : t('Пройден')) : pct ? `${pct}%` : t('Не начат')}
                </span>
              </span>
              <Icon name="arrowRight" size={18} />
            </Link>
          )
        })}
        {UPCOMING.map((u, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: 0.55 }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', fontWeight: 800 }}>{LESSONS.length + i + 1}</span>
            <span style={{ flex: 1, fontWeight: 700 }}>{tx(u)}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('Скоро')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
