'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { sectionNames, sectionOfTopic, topicsOf } from '@/lib/ent'
import { SECTIONS as FORMULA_SECTIONS } from '@/lib/formulas'
import { logAnswers, type MistakePayload } from '@/lib/answer-log'
import {
  MIN_FOR_RANKING, SOURCE_LABEL, SUBJECT_LABEL, WEAK_THRESHOLD,
  dailyAccuracy, sectionStats, strongSections, weakSections,
  type LogRow, type SectionStat,
} from '@/lib/stats'
import Figure from '@/app/components/Figure'
import MathText, { MathLine } from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import Explain from '@/app/ent/Explain'
import PracticeTools from '@/app/ent/PracticeTools'
import MockStats from './MockStats'
import { useT } from '@/app/components/LanguageProvider'

type Mistake = { id: number; subject: 'physics' | 'math'; section: string | null; topic: string | null; created_at: string; payload: MistakePayload }
type Turn = { role: 'user' | 'assistant'; content: string }

const LETTERS = 'ABCDE'

function pct(x: number) { return `${Math.round(x * 100)}%` }
function accColor(x: number) { return x >= 0.8 ? 'var(--good)' : x >= WEAK_THRESHOLD ? 'var(--warn)' : 'var(--bad)' }

// Куда отправить ученика тренировать раздел
function practiceHref(s: SectionStat): string | null {
  if (s.source === 'ent' && sectionNames(s.subject).includes(s.section)) {
    const topic = s.topic && topicsOf(s.subject, s.section).includes(s.topic) ? `&topic=${encodeURIComponent(s.topic)}` : ''
    return `/ent?subject=${s.subject}&section=${encodeURIComponent(s.section)}${topic}`
  }
  if (s.source === 'formula' && FORMULA_SECTIONS[s.subject].includes(s.section)) {
    return `/formulas?subject=${s.subject}&section=${encodeURIComponent(s.section)}`
  }
  return null
}

export default function StatsPage() {
  const { t, dateLocale } = useT()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<LogRow[]>([])
  const [tests, setTests] = useState(0)
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [tab, setTab] = useState<'ent' | 'formula'>('ent')
  const [advice, setAdvice] = useState('')
  const [adviceLoading, setAdviceLoading] = useState(false)
  const [adviceError, setAdviceError] = useState('')
  const [openMistake, setOpenMistake] = useState<number | null>(null)
  const [retry, setRetry] = useState<Record<number, number>>({})
  const [dialogs, setDialogs] = useState<Record<number, Turn[]>>({})
  const [userId, setUserId] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      const [log, attempts, wrong] = await Promise.all([
        supabase.from('answer_log').select('source, subject, section, topic, correct, created_at')
          .eq('user_id', user.id).gte('created_at', since).order('created_at', { ascending: false }).limit(1000),
        supabase.from('ent_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('answer_log').select('id, subject, section, topic, created_at, payload')
          .eq('user_id', user.id).eq('source', 'ent').eq('correct', false).not('payload', 'is', null)
          .order('created_at', { ascending: false }).limit(30),
      ])
      setRows((log.data || []) as LogRow[])
      setTests(attempts.count || 0)
      setMistakes((wrong.data || []) as Mistake[])
      setLoading(false)
    })
  }, [router])

  async function getAdvice() {
    setAdviceLoading(true)
    setAdviceError('')
    try {
      const res = await fetch('/api/stats/advice', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(t(data.error || 'Ошибка'))
      setAdvice(data.text)
    } catch (e) {
      setAdviceError(e instanceof Error ? e.message : t('Ошибка'))
    }
    setAdviceLoading(false)
  }

  function retryAnswer(m: Mistake, choice: number) {
    if (retry[m.id] !== undefined) return
    setRetry(r => ({ ...r, [m.id]: choice }))
    // Повторное решение тоже идёт в статистику — так видно, что ученик исправился
    const ok = choice === m.payload.correct
    logAnswers([{ source: 'ent', subject: m.subject, section: m.section, topic: m.topic, correct: ok, payload: ok ? null : { ...m.payload, chosen: choice } }])
  }

  if (loading) return (
    <div className="nb-root page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--muted)' }}>{t('Загрузка…')}</div>
  )

  const stats = sectionStats(rows)
  const weak = weakSections(stats)
  const strong = strongSections(stats)
  const total = rows.length
  const correct = rows.filter(r => r.correct).length
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const weekRows = rows.filter(r => new Date(r.created_at).getTime() >= weekAgo)
  const weekAcc = weekRows.length ? weekRows.filter(r => r.correct).length / weekRows.length : 0
  const days = dailyAccuracy(rows, 14)
  const maxDay = Math.max(1, ...days.map(d => d.total))
  const tabStats = stats.filter(s => s.source === tab)

  if (!total) {
    return (
      <div className="nb-root page animate-fade-in-up">
        <h1 className="page-title">{t('Моя статистика')}</h1>
        <p className="page-sub">{t('Здесь будет видно, какие темы получаются хорошо, а какие стоит подтянуть.')}</p>
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ fontSize: 15, marginBottom: 18 }}>{t('Пока нет данных. Реши несколько заданий — и статистика появится.')}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/ent" className="btn" style={{ textDecoration: 'none' }}><Icon name="target" size={18} /> {t('Задания ЕНТ')}</Link>
            <Link href="/formulas" className="btn btn-ghost" style={{ textDecoration: 'none' }}><Icon name="formula" size={18} /> {t('Тренажёр формул')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="nb-root page animate-fade-in-up">
      <h1 className="page-title">{t('Моя статистика')}</h1>
      <p className="page-sub">{t('По последним ответам (до 1000 за 90 дней): где получается хорошо, где ошибаешься чаще и что делать дальше.')}</p>

      {/* Итоги */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        {[
          { v: total, l: t('ответов всего') },
          { v: pct(correct / total), l: t('верных ответов'), c: accColor(correct / total) },
          { v: weekRows.length ? pct(weekAcc) : '—', l: t('точность за неделю'), c: weekRows.length ? accColor(weekAcc) : undefined },
          { v: tests, l: t('тестов ЕНТ') },
        ].map(s => (
          <div key={s.l} className="card" style={{ textAlign: 'center', padding: 14 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Активность за 2 недели */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label">{t('Активность за 2 недели')}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
          {days.map(d => {
            const acc = d.total ? d.correct / d.total : 0
            return (
              <div key={d.date} title={t('{date}: {correct} из {total}', { date: new Date(d.date).toLocaleDateString(dateLocale), correct: d.correct, total: d.total })}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', maxWidth: 28, height: `${(d.total / maxDay) * 90}%`, minHeight: d.total ? 4 : 2, borderRadius: 6, background: d.total ? accColor(acc) : 'var(--surface-2)', opacity: d.total ? 0.85 : 1 }} />
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(d.date).getDate()}</span>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
          <span>{t('Высота — сколько заданий решено')}</span>
          <span><span style={{ color: 'var(--good)' }}>■</span> 80%+</span>
          <span><span style={{ color: 'var(--warn)' }}>■</span> 60–80%</span>
          <span><span style={{ color: 'var(--bad)' }}>■</span> {t('меньше 60%')}</span>
        </div>
      </div>

      {/* Слабые места */}
      <div className="label" style={{ marginTop: 22 }}>{t('Что подтянуть')}</div>
      {weak.length ? (
        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          {weak.slice(0, 5).map(s => {
            const href = practiceHref(s)
            return (
              <div key={`${s.source}${s.subject}${s.section}${s.topic}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', borderColor: 'color-mix(in srgb, var(--bad) 30%, transparent)' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700 }}>{t(s.label)}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                    {t(SUBJECT_LABEL[s.subject])} · {s.topic ? `${t(s.section)} · ` : ''}{t(SOURCE_LABEL[s.source])} {t('· ошибся {wrong} раз из {total}', { wrong: s.wrong, total: s.total })}
                    {s.recentWrong >= 3 && <span style={{ color: 'var(--bad)' }}> · {s.recentWrong} {t('ошибок за 2 недели')}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: accColor(s.accuracy) }}>{pct(s.accuracy)}</div>
                {href && <Link href={href} className="btn" style={{ textDecoration: 'none', padding: '9px 14px', fontSize: 14 }}>{t('Тренировать')}</Link>}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 16, color: 'var(--muted)', fontSize: 14 }}>
          {stats.some(s => s.total >= MIN_FOR_RANKING)
            ? t('Явно слабых тем нет — так держать! Попробуй сложность «Выше ЕНТ».')
            : t('Чтобы найти слабые темы, реши хотя бы по {MIN_FOR_RANKING} задания в нескольких разделах.', { MIN_FOR_RANKING: MIN_FOR_RANKING })}
        </div>
      )}

      {strong.length > 0 && (
        <>
          <div className="label">{t('Сильные стороны')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {strong.slice(0, 8).map(s => (
              <span key={`${s.source}${s.subject}${s.section}${s.topic}`} className="chip on" style={{ cursor: 'default', borderColor: 'color-mix(in srgb, var(--good) 40%, transparent)', background: 'color-mix(in srgb, var(--good) 10%, transparent)', color: 'var(--good)' }}>
                {t(s.label)} · {pct(s.accuracy)}
              </span>
            ))}
          </div>
        </>
      )}

      {userId && <MockStats userId={userId} />}

      {/* Совет от ИИ */}
      <div className="card" style={{ marginBottom: 16, background: 'color-mix(in srgb, var(--accent) 6%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--accent)', marginBottom: advice ? 12 : 6 }}>
          <Icon name="sparkles" size={18} /> {t('Как поднять балл')}
        </div>
        {advice ? (
          <MathText text={advice} />
        ) : (
          <>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>{t('ИИ посмотрит на твою статистику и составит личный план подготовки на неделю.')}</div>
            <button className="btn" onClick={getAdvice} disabled={adviceLoading}>
              {adviceLoading ? t('ИИ анализирует…') : t('Получить план')}
            </button>
          </>
        )}
        {adviceError && <div style={{ color: 'var(--bad)', fontSize: 13, marginTop: 8 }}>{adviceError}</div>}
      </div>

      {/* Все разделы */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 0 10px', flexWrap: 'wrap', gap: 8 }}>
        <div className="label" style={{ margin: 0 }}>{t('Все разделы')}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ent', 'formula'] as const).map(item => (
            <button key={item} className={`chip${tab === item ? ' on' : ''}`} onClick={() => setTab(item)}>{item === 'ent' ? t('Задания ЕНТ') : t('Формулы')}</button>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        {tabStats.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('Здесь пока пусто.')}</div>}
        {(['physics', 'math'] as const).map(subj => {
          const list = tabStats.filter(s => s.subject === subj).sort((a, b) => a.accuracy - b.accuracy)
          if (!list.length) return null
          return (
            <div key={subj} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{t(SUBJECT_LABEL[subj])}</div>
              {list.map(s => (
                <div key={s.section + s.topic} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 14 }}>
                  <span style={{ flex: '0 0 42%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.topic ? `${t(s.section)} → ${t(s.topic)}` : t(s.section)}>{t(s.label)}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div style={{ width: pct(s.accuracy), height: '100%', background: accColor(s.accuracy) }} />
                  </div>
                  <span style={{ width: 70, textAlign: 'right', color: 'var(--muted)', fontSize: 12 }}>{s.correct}/{s.total}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Работа над ошибками */}
      <div className="label" style={{ marginTop: 22 }}>{t('Работа над ошибками')}</div>
      {mistakes.length > 0 && (() => {
        // Новые похожие задания по темам ошибок — по каждому предмету отдельно
        const links = (['physics', 'math'] as const).map(subj => {
          const tops = [...new Set(mistakes.filter(m => m.subject === subj && m.topic && sectionOfTopic(subj, m.topic)).map(m => m.topic!))].slice(0, 8)
          return { subj, tops }
        }).filter(x => x.tops.length)
        return links.length > 0 && (
          <div className="card" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 10 }}>
              {t('Реши похожие задания по темам, где были ошибки. Тема засчитывается после 2 верных ответов подряд.')}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {links.map(({ subj, tops }) => (
                <Link key={subj} className="btn" href={`/ent?subject=${subj}&repair=1${tops.map(x => `&topic=${encodeURIComponent(x)}`).join('')}`}>
                  <Icon name="refresh" size={18} /> {t('Отработать ошибки')} · {t(SUBJECT_LABEL[subj])} ({tops.length})
                </Link>
              ))}
            </div>
          </div>
        )
      })()}
      {mistakes.length === 0 ? (
        <div className="card" style={{ color: 'var(--muted)', fontSize: 14 }}>{t('Ошибок в заданиях ЕНТ пока нет.')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {mistakes.map(m => {
            const open = openMistake === m.id
            const tried = retry[m.id]
            const q = { question: m.payload.question, options: m.payload.options, correct: m.payload.correct, solution: m.payload.solution, figure: m.payload.figure }
            return (
              <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button onClick={() => setOpenMistake(open ? null : m.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tried === m.payload.correct ? 'color-mix(in srgb, var(--good) 15%, transparent)' : 'color-mix(in srgb, var(--bad) 15%, transparent)', color: tried === m.payload.correct ? 'var(--good)' : 'var(--bad)' }}>
                    <Icon name={tried === m.payload.correct ? 'check' : 'x'} size={16} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <MathLine text={m.payload.question} style={{ fontSize: 14 }} />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t(SUBJECT_LABEL[m.subject])}{m.section ? ` · ${t(m.section)}` : ''} · {new Date(m.created_at).toLocaleDateString(dateLocale)}</span>
                  </span>
                  <Icon name="arrowRight" size={16} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'var(--muted)' }} />
                </button>
                {open && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <MathText text={m.payload.question} style={{ fontSize: 15, marginBottom: 12 }} />
                    <Figure svg={m.payload.figure} />
                    <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                      {tried === undefined ? t('Попробуй решить ещё раз:') : tried === m.payload.correct ? t('Теперь верно!') : t('Снова неверно — посмотри разбор ниже.')}
                    </div>
                    <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                      {m.payload.options.map((opt, i) => {
                        let border = 'var(--line)', bg = 'var(--surface-2)'
                        if (tried !== undefined && i === m.payload.correct) { border = 'var(--good)'; bg = 'color-mix(in srgb, var(--good) 10%, transparent)' }
                        else if (tried === i) { border = 'var(--bad)'; bg = 'color-mix(in srgb, var(--bad) 10%, transparent)' }
                        return (
                          <button key={i} onClick={() => retryAnswer(m, i)} disabled={tried !== undefined}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${border}`, background: bg, color: 'var(--text)', cursor: tried === undefined ? 'pointer' : 'default', textAlign: 'left', fontFamily: 'inherit', fontSize: 14 }}>
                            <span style={{ fontWeight: 800, color: 'var(--muted)' }}>{LETTERS[i]}</span>
                            <MathText text={opt} style={{ flex: 1 }} />
                          </button>
                        )
                      })}
                    </div>
                    {tried !== undefined && tried !== m.payload.correct && (
                      <Explain q={q} chosen={tried} turns={dialogs[m.id] || []} setTurns={t => setDialogs(d => ({ ...d, [m.id]: t }))} />
                    )}
                    {tried !== undefined && m.topic && (
                      <PracticeTools q={{ ...q, topic: m.topic, section: m.section ?? undefined }} subject={m.subject} retry={false} />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
