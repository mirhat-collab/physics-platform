'use client'
import type { EntQuestion } from '@/lib/ent'
import MathText from '@/app/components/MathText'
import { useT } from '@/app/components/LanguageProvider'

export const LETTERS = 'ABCDE'
export const SKIPPED = -1

// Условие и варианты в разборе: верный ответ зелёным, ответ ученика красным
export default function QuestionBody({ q, chosen }: { q: EntQuestion; chosen: number | null }) {
  const { t } = useT()
  return (
    <div>
      <MathText text={q.question} style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 10 }} />
      <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
        {q.options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', color: i === q.correct ? 'var(--good)' : i === chosen ? 'var(--bad)' : 'var(--muted)', fontWeight: i === q.correct || i === chosen ? 700 : 400 }}>
            <span>{LETTERS[i]})</span>
            <MathText text={opt} />
            {i === q.correct && <span style={{ fontSize: 12 }}>{t('— верный')}</span>}
            {i === chosen && i !== q.correct && <span style={{ fontSize: 12 }}>{t('— твой ответ')}</span>}
          </div>
        ))}
      </div>
      {(chosen === SKIPPED || chosen === null) && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>{t('Ты пропустил это задание')}</div>}
    </div>
  )
}
