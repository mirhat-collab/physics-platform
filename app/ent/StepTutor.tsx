'use client'
import { useState } from 'react'
import MathText from '@/app/components/MathText'
import { useT } from '@/app/components/LanguageProvider'

// Шаги решения с кнопкой «Не понимаю этот шаг» у каждого: ИИ объясняет
// только выбранный шаг (и ещё проще, если снова непонятно).
// hideAnswer — ученик ещё решает (это подсказки): ИИ не называет ответ.
export default function StepTutor({ question, steps, shown, hideAnswer = false, numbered = true }: {
  question: string
  steps: string[]
  shown?: number // сколько шагов показано (для подсказок); по умолчанию все
  hideAnswer?: boolean
  numbered?: boolean
}) {
  const { t } = useT()
  const [open, setOpen] = useState<number | null>(null)
  const [texts, setTexts] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState<Record<number, string>>({})

  async function explain(i: number, previous?: string) {
    setOpen(i)
    if (texts[i] && !previous) return
    setLoading(i)
    setError(e => ({ ...e, [i]: '' }))
    try {
      const res = await fetch('/api/ent/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, steps, index: i, hideAnswer, previous }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(t(data.error || 'Ошибка'))
      setTexts(x => ({ ...x, [i]: data.text }))
    } catch (e) {
      setError(x => ({ ...x, [i]: e instanceof Error ? e.message : t('Ошибка') }))
    }
    setLoading(null)
  }

  const link = { background: 'none', border: 'none', color: '#c4bbff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' } as const
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {steps.slice(0, shown ?? steps.length).map((s, i) => (
        <div key={i}>
          <MathText text={numbered ? `${i + 1}. ${s}` : s} style={{ fontSize: 14 }} />
          {open !== i && <button style={link} onClick={() => explain(i)}>🤔 {t('Не понимаю этот шаг')}</button>}
          {open === i && (
            <div className="animate-fade-in" style={{ margin: '6px 0 4px', padding: '10px 12px', borderRadius: 10, background: 'rgba(124,108,255,0.08)', borderLeft: '3px solid #8b7cf6' }}>
              {loading === i && <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t('Объясняю…')}</div>}
              {error[i] && <div style={{ color: 'var(--bad)', fontSize: 13 }}>{error[i]}</div>}
              {texts[i] && loading !== i && (
                <>
                  <MathText text={texts[i]} style={{ fontSize: 14, lineHeight: 1.6 }} />
                  <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                    <button style={link} onClick={() => explain(i, texts[i])}>{t('Всё ещё непонятно — объясни проще')}</button>
                    <button style={{ ...link, color: 'var(--muted)' }} onClick={() => setOpen(null)}>{t('Понятно')}</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
