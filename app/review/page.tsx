'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { logAnswers } from '@/lib/answer-log'
import ReportTask from '@/app/components/ReportTask'
import { answerReview, REVIEW_INTERVALS, type ReviewItem } from '@/lib/review'
import { SUBJECT_LABEL } from '@/lib/stats'
import Figure from '@/app/components/Figure'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import Explain from '@/app/ent/Explain'
import { LETTERS } from '@/app/ent/QuestionBody'
import { useT } from '@/app/components/LanguageProvider'

type Turn = { role: 'user' | 'assistant'; content: string }
// Варианты перемешиваем при каждом повторе, чтобы не запоминать «ответ — B»
type Card = ReviewItem & { order: number[] }

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ReviewPage() {
  const { t, dateLocale } = useT()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<Card[]>([])
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [score, setScore] = useState({ ok: 0, bad: 0 })
  const [pending, setPending] = useState(0)
  const [nextDue, setNextDue] = useState<string | null>(null)
  const [learned, setLearned] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const now = new Date().toISOString()
      const [due, later, done] = await Promise.all([
        supabase.from('review_queue').select('id, subject, section, topic, payload, stage, due_at')
          .eq('user_id', user.id).eq('done', false).lte('due_at', now).order('due_at').limit(40),
        supabase.from('review_queue').select('due_at', { count: 'exact' })
          .eq('user_id', user.id).eq('done', false).gt('due_at', now).order('due_at').limit(1),
        supabase.from('review_queue').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('done', true),
      ])
      const list = ((due.data || []) as ReviewItem[]).filter(c => Array.isArray(c.payload?.options))
      setCards(list.map(c => ({ ...c, order: shuffled(c.payload.options.length) })))
      setPending(later.count || 0)
      setNextDue(later.data?.[0]?.due_at ?? null)
      setLearned(done.count || 0)
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="nb-root page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--muted)' }}>{t('Загрузка…')}</div>
  )

  const card = cards[idx]
  const finished = idx >= cards.length

  function choose(shownIndex: number) {
    if (!card || chosen !== null) return
    setChosen(shownIndex)
    const real = card.order[shownIndex]
    const ok = real === card.payload.correct
    setScore(s => ok ? { ...s, ok: s.ok + 1 } : { ...s, bad: s.bad + 1 })
    answerReview(card, ok).then(upd => { if (upd.done) setLearned(n => n + 1) })
    // В статистику — тоже, но очередь мы уже обновили сами
    logAnswers([{ source: 'ent', subject: card.subject, section: card.section, topic: card.topic, correct: ok, task_key: card.payload.key ?? null, payload: ok ? null : { ...card.payload, chosen: real } }], { queue: false })
  }

  function next() {
    setIdx(i => i + 1)
    setChosen(null)
    setTurns([])
  }

  return (
    <div className="nb-root page animate-fade-in-up">
      <p className="nb-eyebrow">{t('Интервальные повторы')}</p>
      <h1 className="page-title">{t('Работа над ошибками')}</h1>
      <p className="page-sub">{t('Задачи, в которых ты ошибся, возвращаются через 1, 3 и 7 дней. Три верных ответа подряд — задача выучена.')}</p>

      <ul className="nb-stats dash-stats" role="list" style={{ marginBottom: 18 }}>
        <li><span className="nb-stat-n">{Math.max(0, cards.length - idx)}</span><span className="nb-stat-l">{t('На сегодня')}</span></li>
        <li><span className="nb-stat-n">{pending}</span><span className="nb-stat-l">{t('Ждут повтора')}</span></li>
        <li><span className="nb-stat-n">{learned}</span><span className="nb-stat-l">{t('Выучено')}</span></li>
      </ul>

      {finished ? (
        <div className="card review-done" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <span className="review-done-i"><Icon name={cards.length ? 'trophy' : 'check'} size={30} /></span>
          <h2 style={{ fontSize: 20, margin: '14px 0 6px' }}>
            {cards.length ? t('На сегодня всё повторено!') : t('Сегодня повторять нечего')}
          </h2>
          {cards.length > 0 && (
            <p style={{ color: 'var(--muted)', margin: '0 0 6px' }}>{t('Верно: {ok} · Ошибок: {bad}', { ok: score.ok, bad: score.bad })}</p>
          )}
          <p style={{ color: 'var(--muted)', margin: '0 0 18px', fontSize: 14 }}>
            {nextDue
              ? t('Следующий повтор: {date}', { date: new Date(nextDue).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' }) })
              : t('Ошибки из заданий ЕНТ будут появляться здесь сами.')}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/ent" className="btn" style={{ textDecoration: 'none' }}><Icon name="target" size={18} /> {t('Задания ЕНТ')}</Link>
            <Link href="/dashboard" className="btn btn-ghost" style={{ textDecoration: 'none' }}>{t('На главную')}</Link>
          </div>
        </div>
      ) : (
        <div className="card" key={card.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {t(SUBJECT_LABEL[card.subject])}{card.section ? ` · ${t(card.section)}` : ''}
            </span>
            <span className="review-steps" aria-label={t('Ступень {n} из {m}', { n: card.stage + 1, m: REVIEW_INTERVALS.length })}>
              {REVIEW_INTERVALS.map((d, i) => <i key={d} className={i < card.stage ? 'on' : ''} />)}
            </span>
          </div>
          <div className="app-bar" style={{ marginBottom: 16 }} aria-hidden><span style={{ width: `${(idx / cards.length) * 100}%` }} /></div>

          <MathText text={card.payload.question} style={{ fontSize: 16, marginBottom: 12 }} />
          <Figure svg={card.payload.figure} />

          <div style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
            {card.order.map((real, i) => {
              let cls = 'review-opt'
              if (chosen !== null && real === card.payload.correct) cls += ' good'
              else if (chosen === i) cls += ' bad'
              return (
                <button key={i} type="button" className={cls} onClick={() => choose(i)} disabled={chosen !== null}>
                  <span className="review-opt-l">{LETTERS[i]}</span>
                  <MathText text={card.payload.options[real]} style={{ flex: 1 }} />
                </button>
              )
            })}
          </div>

          {chosen !== null && (() => {
            const real = card.order[chosen]
            const ok = real === card.payload.correct
            const nextStage = ok ? card.stage + 1 : 0
            return (
              <div style={{ display: 'grid', gap: 12 }}>
                <div className={`review-verdict ${ok ? 'good' : 'bad'}`}>
                  <Icon name={ok ? 'check' : 'refresh'} size={18} />
                  <span>
                    {ok
                      ? nextStage >= REVIEW_INTERVALS.length
                        ? t('Верно! Задача выучена.')
                        : t('Верно! Вернётся через {n} дн.', { n: REVIEW_INTERVALS[nextStage] })
                      : t('Пока неверно — вернётся завтра. Посмотри разбор.')}
                  </span>
                </div>
                {!ok && (
                  <Explain
                    q={{ question: card.payload.question, options: card.payload.options, correct: card.payload.correct, solution: card.payload.solution, figure: card.payload.figure }}
                    chosen={real} turns={turns} setTurns={setTurns}
                  />
                )}
                <ReportTask
                  q={{ question: card.payload.question, options: card.payload.options, correct: card.payload.correct, solution: card.payload.solution, figure: card.payload.figure, key: card.payload.key, topic: card.topic ?? undefined }}
                  subject={card.subject}
                />
                <button type="button" className="btn" onClick={next} style={{ justifySelf: 'start' }}>
                  {idx + 1 < cards.length ? t('Следующая задача') : t('Завершить')} <Icon name="arrowRight" size={18} />
                </button>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
