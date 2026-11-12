'use client'
import { useState } from 'react'
import QuestionBody from '@/app/ent/QuestionBody'
import MathText, { MathLine } from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'

export type ReviewItem = { question: string; options: string[]; correct: number; chosen: number | null; solution: string; figure?: string; topic: string }

// Разбор после игры: задания, на которые ученик ответил (или пропустил)
export default function GameReview({ items }: { items: ReviewItem[] }) {
  const { t } = useT()
  const [open, setOpen] = useState<number | null>(null)
  const [onlyWrong, setOnlyWrong] = useState(true)
  const list = items.map((x, i) => ({ x, i })).filter(({ x }) => x.chosen !== null || !onlyWrong).filter(({ x }) => !onlyWrong || x.chosen !== x.correct)
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className={`chip${onlyWrong ? ' on' : ''}`} onClick={() => setOnlyWrong(true)}>{t('Только ошибки')}</button>
        <button className={`chip${!onlyWrong ? ' on' : ''}`} onClick={() => setOnlyWrong(false)}>{t('Все задания')}</button>
      </div>
      {!list.length && <div className="card" style={{ color: 'var(--good)' }}>{t('Ошибок нет — отличный результат!')}</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {list.map(({ x, i }) => {
          const ok = x.chosen === x.correct
          return (
            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <Icon name={ok ? 'check' : 'x'} size={16} style={{ color: ok ? 'var(--good)' : x.chosen === null ? 'var(--muted)' : 'var(--bad)' }} />
                <MathLine text={`${i + 1}. ${x.question}`} style={{ flex: 1, minWidth: 0, fontSize: 14 }} />
              </button>
              {open === i && <div style={{ padding: '0 14px 14px' }}><QuestionBody q={{ question: x.question, options: x.options, correct: x.correct, solution: x.solution, figure: x.figure, topic: x.topic }} chosen={x.chosen} /><MathText text={x.solution} style={{ fontSize: 14, color: 'var(--muted)', marginTop: 10 }} /></div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
