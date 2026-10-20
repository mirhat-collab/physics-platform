'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ENT_SUBJECTS } from '@/lib/ent'
import { SECTIONS as FORMULA_SECTIONS } from '@/lib/formulas'
import { logAnswers, type MistakePayload } from '@/lib/answer-log'
import {
  MIN_FOR_RANKING, SOURCE_LABEL, SUBJECT_LABEL, WEAK_THRESHOLD,
  dailyAccuracy, sectionStats, strongSections, weakSections,
  type LogRow, type SectionStat,
} from '@/lib/stats'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import Explain from '@/app/ent/Explain'

type Mistake = { id: number; subject: 'physics' | 'math'; section: string | null; created_at: string; payload: MistakePayload }
type Turn = { role: 'user' | 'assistant'; content: string }

const LETTERS = 'ABCDE'

function pct(x: number) { return `${Math.round(x * 100)}%` }
function accColor(x: number) { return x >= 0.8 ? 'var(--good)' : x >= WEAK_THRESHOLD ? '#f59e0b' : 'var(--bad)' }

// Куда отправить ученика тренировать раздел
function practiceHref(s: SectionStat): string | null {
  if (s.source === 'ent' && ENT_SUBJECTS[s.subject].sections.includes(s.section)) {
    return `/ent?subject=${s.subject}&section=${encodeURIComponent(s.section)}`
  }
  if (s.source === 'formula' && FORMULA_SECTIONS[s.subject].includes(s.section)) {
    return `/formulas?subject=${s.subject}&section=${encodeURIComponent(s.section)}`
  }
  return null
}

export default function StatsPage() {
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

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      const [log, attempts, wrong] = await Promise.all([
        supabase.from('answer_log').select('source, subject, section, correct, created_at')
          .eq('user_id', user.id).gte('created_at', since).order('created_at', { ascending: false }).limit(5000),
        supabase.from('ent_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('answer_log').select('id, subject, section, created_at, payload')
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
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      setAdvice(data.text)
    } catch (e) {
      setAdviceError(e instanceof Error ? e.message : 'Ошибка')
    }
    setAdviceLoading(false)
  }

  function retryAnswer(m: Mistake, choice: number) {
    if (retry[m.id] !== undefined) return
    setRetry(r => ({ ...r, [m.id]: choice }))
    // Повторное решение тоже идёт в статистику — так видно, что ученик исправился
    const ok = choice === m.payload.correct
    logAnswers([{ source: 'ent', subject: m.subject, section: m.section, correct: ok, payload: ok ? null : { ...m.payload, chosen: choice } }])
  }

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--muted)' }}>Загрузка…</div>
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
      <div className="page animate-fade-in-up">
        <h1 className="page-title">Моя статистика</h1>
        <p className="page-sub">Здесь будет видно, какие темы получаются хорошо, а какие стоит подтянуть.</p>
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ fontSize: 15, marginBottom: 18 }}>Пока нет данных. Реши несколько заданий — и статистика появится.</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/ent" className="btn" style={{ textDecoration: 'none' }}><Icon name="target" size={18} /> Задания ЕНТ</Link>
            <Link href="/formulas" className="btn btn-ghost" style={{ textDecoration: 'none' }}><Icon name="formula" size={18} /> Тренажёр формул</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page animate-fade-in-up">
      <h1 className="page-title">Моя статистика</h1>
      <p className="page-sub">За последние 90 дней: где получается хорошо, где ошибаешься чаще и что делать дальше.</p>

      {/* Итоги */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        {[
          { v: total, l: 'ответов всего' },
          { v: pct(correct / total), l: 'верных ответов', c: accColor(correct / total) },
          { v: weekRows.length ? pct(weekAcc) : '—', l: 'точность за неделю', c: weekRows.length ? accColor(weekAcc) : undefined },
          { v: tests, l: 'тестов ЕНТ' },
        ].map(s => (
          <div key={s.l} className="card" style={{ textAlign: 'center', padding: 14 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Активность за 2 недели */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label">Активность за 2 недели</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
          {days.map(d => {
            const acc = d.total ? d.correct / d.total : 0
            return (
              <div key={d.date} title={`${new Date(d.date).toLocaleDateString('ru-RU')}: ${d.correct} из ${d.total}`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', maxWidth: 28, height: `${(d.total / maxDay) * 90}%`, minHeight: d.total ? 4 : 2, borderRadius: 6, background: d.total ? accColor(acc) : 'var(--surface-2)', opacity: d.total ? 0.85 : 1 }} />
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(d.date).getDate()}</span>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
          <span>Высота — сколько заданий решено</span>
          <span><span style={{ color: 'var(--good)' }}>■</span> 80%+</span>
          <span><span style={{ color: '#f59e0b' }}>■</span> 60–80%</span>
          <span><span style={{ color: 'var(--bad)' }}>■</span> меньше 60%</span>
        </div>
      </div>

      {/* Слабые места */}
      <div className="label" style={{ marginTop: 22 }}>Что подтянуть</div>
      {weak.length ? (
        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          {weak.slice(0, 5).map(s => {
            const href = practiceHref(s)
            return (
              <div key={`${s.source}${s.subject}${s.section}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', borderColor: 'rgba(248,113,113,0.3)' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700 }}>{s.section}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                    {SUBJECT_LABEL[s.subject]} · {SOURCE_LABEL[s.source]} · ошибся {s.wrong} раз из {s.total}
                    {s.recentWrong >= 3 && <span style={{ color: 'var(--bad)' }}> · {s.recentWrong} ошибок за 2 недели</span>}
                  </div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: accColor(s.accuracy) }}>{pct(s.accuracy)}</div>
                {href && <Link href={href} className="btn" style={{ textDecoration: 'none', padding: '9px 14px', fontSize: 14 }}>Тренировать</Link>}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 16, color: 'var(--muted)', fontSize: 14 }}>
          {stats.some(s => s.total >= MIN_FOR_RANKING)
            ? 'Явно слабых тем нет — так держать! Попробуй сложность «Выше ЕНТ».'
            : `Чтобы найти слабые темы, реши хотя бы по ${MIN_FOR_RANKING} задания в нескольких разделах.`}
        </div>
      )}

      {strong.length > 0 && (
        <>
          <div className="label">Сильные стороны</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {strong.slice(0, 8).map(s => (
              <span key={`${s.source}${s.subject}${s.section}`} className="chip on" style={{ cursor: 'default', borderColor: 'rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.1)', color: 'var(--good)' }}>
                {s.section} · {pct(s.accuracy)}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Совет от ИИ */}
      <div className="card" style={{ marginBottom: 16, background: 'rgba(139,124,246,0.06)', borderColor: 'rgba(139,124,246,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#c4bbff', marginBottom: advice ? 12 : 6 }}>
          <Icon name="sparkles" size={18} /> Как поднять балл
        </div>
        {advice ? (
          <MathText text={advice} />
        ) : (
          <>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>ИИ посмотрит на твою статистику и составит личный план подготовки на неделю.</div>
            <button className="btn" onClick={getAdvice} disabled={adviceLoading}>
              {adviceLoading ? 'ИИ анализирует…' : 'Получить план'}
            </button>
          </>
        )}
        {adviceError && <div style={{ color: 'var(--bad)', fontSize: 13, marginTop: 8 }}>{adviceError}</div>}
      </div>

      {/* Все разделы */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 0 10px', flexWrap: 'wrap', gap: 8 }}>
        <div className="label" style={{ margin: 0 }}>Все разделы</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ent', 'formula'] as const).map(t => (
            <button key={t} className={`chip${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>{t === 'ent' ? 'Задания ЕНТ' : 'Формулы'}</button>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        {tabStats.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Здесь пока пусто.</div>}
        {(['physics', 'math'] as const).map(subj => {
          const list = tabStats.filter(s => s.subject === subj).sort((a, b) => a.accuracy - b.accuracy)
          if (!list.length) return null
          return (
            <div key={subj} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{SUBJECT_LABEL[subj]}</div>
              {list.map(s => (
                <div key={s.section} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 14 }}>
                  <span style={{ flex: '0 0 42%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.section}>{s.section}</span>
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
      <div className="label" style={{ marginTop: 22 }}>Работа над ошибками</div>
      {mistakes.length === 0 ? (
        <div className="card" style={{ color: 'var(--muted)', fontSize: 14 }}>Ошибок в заданиях ЕНТ пока нет.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {mistakes.map(m => {
            const open = openMistake === m.id
            const tried = retry[m.id]
            const q = { question: m.payload.question, options: m.payload.options, correct: m.payload.correct, solution: m.payload.solution }
            return (
              <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button onClick={() => setOpenMistake(open ? null : m.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tried === m.payload.correct ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: tried === m.payload.correct ? 'var(--good)' : 'var(--bad)' }}>
                    <Icon name={tried === m.payload.correct ? 'check' : 'x'} size={16} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.payload.question.replace(/\$/g, '')}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{SUBJECT_LABEL[m.subject]}{m.section ? ` · ${m.section}` : ''} · {new Date(m.created_at).toLocaleDateString('ru-RU')}</span>
                  </span>
                  <Icon name="arrowRight" size={16} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'var(--muted)' }} />
                </button>
                {open && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <MathText text={m.payload.question} style={{ fontSize: 15, marginBottom: 12 }} />
                    <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                      {tried === undefined ? 'Попробуй решить ещё раз:' : tried === m.payload.correct ? 'Теперь верно!' : 'Снова неверно — посмотри разбор ниже.'}
                    </div>
                    <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                      {m.payload.options.map((opt, i) => {
                        let border = 'var(--line)', bg = 'var(--surface-2)'
                        if (tried !== undefined && i === m.payload.correct) { border = 'var(--good)'; bg = 'rgba(52,211,153,0.1)' }
                        else if (tried === i) { border = 'var(--bad)'; bg = 'rgba(248,113,113,0.1)' }
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
