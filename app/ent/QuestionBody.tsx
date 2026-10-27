'use client'
import type { EntQuestion, MockAnswer } from '@/lib/ent'
import Figure from '@/app/components/Figure'
import MathText from '@/app/components/MathText'
import { useT } from '@/app/components/LanguageProvider'

export const LETTERS = 'ABCDEF'
export const SKIPPED = -1

const mark = (good: boolean, bad: boolean) => ({
  color: good ? 'var(--good)' : bad ? 'var(--bad)' : 'var(--muted)',
  fontWeight: good || bad ? 700 : 400,
})

// Условие и варианты в разборе: верный ответ зелёным, ответ ученика красным
export default function QuestionBody({ q, chosen }: { q: EntQuestion; chosen: MockAnswer }) {
  const { t } = useT()
  const none = chosen === null || chosen === SKIPPED || (Array.isArray(chosen) && !chosen.some(x => x >= 0))

  if (q.kind === 'match') {
    const sel = Array.isArray(chosen) ? chosen : []
    return (
      <div>
        <MathText text={q.question} style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }} />
        <div style={{ display: 'grid', gap: 10 }}>
          {q.left!.map((l, k) => {
            const ok = sel[k] === q.pairs![k]
            return (
              <div key={k} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)' }}>
                <MathText text={`${k + 1}) ${l}`} style={{ fontSize: 14, lineHeight: 1.55 }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, fontSize: 14, alignItems: 'baseline' }}>
                  <span style={mark(true, false)}>{t('Верно:')} {LETTERS[q.pairs![k]]})</span>
                  <MathText text={q.options[q.pairs![k]]} style={mark(true, false)} />
                  {sel[k] >= 0 && !ok && (
                    <span style={{ display: 'flex', gap: 6, alignItems: 'baseline', ...mark(false, true) }}>
                      · {t('твой ответ')} {LETTERS[sel[k]]}) <MathText text={q.options[sel[k]]} />
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {none && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>{t('Ты пропустил это задание')}</div>}
        <MathText text={q.solution} style={{ fontSize: 14, color: 'var(--muted)', marginTop: 10 }} />
      </div>
    )
  }

  const multi = q.kind === 'multi'
  const right = (i: number) => (multi ? q.answers!.includes(i) : i === q.correct)
  const picked = (i: number) => (Array.isArray(chosen) ? chosen.includes(i) : i === chosen)
  return (
    <div>
      <MathText text={q.question} style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 10 }} />
      <Figure svg={q.figure} />
      {multi && <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>{t('Один или несколько правильных ответов')}</div>}
      <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
        {q.options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', ...mark(right(i), picked(i) && !right(i)) }}>
            <span>{LETTERS[i]})</span>
            <MathText text={opt} />
            {right(i) && <span style={{ fontSize: 12 }}>{multi && !picked(i) && !none ? t('— верный, ты не выбрал') : t('— верный')}</span>}
            {picked(i) && !right(i) && <span style={{ fontSize: 12 }}>{t('— твой ответ')}</span>}
          </div>
        ))}
      </div>
      {none && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>{t('Ты пропустил это задание')}</div>}
      {multi && <MathText text={q.solution} style={{ fontSize: 14, color: 'var(--muted)', marginTop: 10 }} />}
    </div>
  )
}
