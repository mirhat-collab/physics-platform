'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ENT_SUBJECTS, type EntSubject } from '@/lib/ent'
import GamePlay, { type PublicTask } from '@/app/components/GamePlay'
import GameReview, { type ReviewItem } from '@/app/components/GameReview'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'

type Board = { grade: string | null; top: { place: number; name: string; score: number; me: boolean }[]; myPlace: number | null; record: number | null }
type Result = { score: number; answered: number; total: number; time: number; review: ReviewItem[] }

// Блиц: 3 минуты, задачи подряд, рейтинг недели среди одноклассников.
// Дуэль: одни и те же задания с другом по ссылке.
export default function BlitzPage() {
  const { t } = useT()
  const [subject, setSubject] = useState<EntSubject>('physics')
  const [phase, setPhase] = useState<'menu' | 'loading' | 'play' | 'sending' | 'done'>('menu')
  const [game, setGame] = useState<{ tasks: PublicTask[]; seconds: number; ticket: string } | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState('')
  const [duel, setDuel] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadBoard = useCallback(async (s: EntSubject) => {
    const r = await fetch(`/api/games?board=${s}`)
    setBoard(r.ok ? await r.json() : null)
  }, [])

  useEffect(() => {
    let alive = true
    fetch(`/api/games?board=${subject}`).then(async r => { const d = r.ok ? await r.json() : null; if (alive) setBoard(d) }).catch(() => {})
    return () => { alive = false }
  }, [subject])

  async function post(body: object) {
    const r = await fetch('/api/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(t(d.error || 'Ошибка'))
    return d
  }

  async function start() {
    setPhase('loading'); setError('')
    try { setGame(await post({ action: 'blitz', subject })); setPhase('play') } catch (e) { setError(e instanceof Error ? e.message : t('Ошибка')); setPhase('menu') }
  }

  async function finish(answers: (number | null)[]) {
    if (!game) return
    setPhase('sending')
    try { setResult(await post({ action: 'finish', ticket: game.ticket, answers })); setPhase('done'); loadBoard(subject) } catch (e) { setError(e instanceof Error ? e.message : t('Ошибка')); setPhase('menu') }
  }

  async function createDuel() {
    setError('')
    try { const d = await post({ action: 'duel', subject }); setDuel(d.code); setCopied(false) } catch (e) { setError(e instanceof Error ? e.message : t('Ошибка')) }
  }

  const duelUrl = duel ? `${typeof window !== 'undefined' ? window.location.origin : ''}/duel/${duel}` : ''

  if (phase === 'play' && game) return <div className="nb-root page"><GamePlay tasks={game.tasks} seconds={game.seconds} onFinish={finish} /></div>
  if (phase === 'sending') return <div className="nb-root page" style={{ color: 'var(--muted)' }}>{t('Считаю результат…')}</div>

  return (
    <div className="nb-root page animate-fade-in-up">
      <h1 className="page-title">{t('Блиц и дуэль')}</h1>
      <p className="page-sub">{t('Блиц — 3 минуты на простые задачи: реши как можно больше. Дуэль — одни и те же задания с другом, побеждает тот, кто решит больше и быстрее.')}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(id => (
          <button key={id} className={`chip${subject === id ? ' on' : ''}`} onClick={() => { setSubject(id); setDuel(null) }}>{t(ENT_SUBJECTS[id].label)}</button>
        ))}
      </div>

      {phase === 'done' && result && (
        <div className="card" style={{ textAlign: 'center', padding: '24px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: 'var(--accent)' }}>{result.score}</div>
          <div style={{ color: 'var(--muted)' }}>{t('верно из {a} решённых за 3 минуты', { a: result.answered })}</div>
          {board?.record !== null && board?.record !== undefined && result.score >= board.record && result.score > 0 && <div style={{ marginTop: 8, fontWeight: 700, color: 'var(--good)' }}><Icon name="trophy" size="1em" /> {t('Новый рекорд!')}</div>}
          <button className="btn" onClick={start} style={{ marginTop: 16 }}><Icon name="refresh" size={18} /> {t('Ещё раз')}</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 16 }}>
        <div className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}><Icon name="zap" size="1em" /> {t('Блиц')}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('3 минуты, задачи в одно-два действия. Ответ — сразу следующая задача, итог и разбор — в конце.')}</div>
          {board?.record !== null && board?.record !== undefined && <div style={{ fontSize: 14 }}>{t('Твой рекорд:')} <b>{board.record}</b></div>}
          <button className="btn" onClick={start} disabled={phase === 'loading'}>{phase === 'loading' ? t('Загрузка…') : t('Начать блиц')}</button>
        </div>
        <div className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}><Icon name="users" size="1em" /> {t('Дуэль с другом')}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('10 одинаковых заданий. Отправь другу ссылку и сыграй сам — результаты появятся на странице дуэли.')}</div>
          {!duel ? (
            <button className="btn btn-ghost" onClick={createDuel}>{t('Создать дуэль')}</button>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              <input readOnly value={duelUrl} onFocus={e => e.target.select()} aria-label={t('Ссылка на дуэль')}
                style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(duelUrl).then(() => setCopied(true)).catch(() => {}) }}><Icon name="link" size={16} /> {copied ? t('Скопировано') : t('Копировать')}</button>
                <Link href={`/duel/${duel}`} className="btn" style={{ textDecoration: 'none' }}>{t('Играть')}</Link>
              </div>
            </div>
          )}
        </div>
      </div>
      {error && <div style={{ color: 'var(--bad)', fontSize: 14, marginBottom: 12 }}>{error}</div>}

      {board && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="label">{board.grade ? t('Рейтинг недели: {g} класс', { g: board.grade }) : t('Рейтинг недели')}</div>
          {!board.top.length && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('На этой неделе ещё никто не играл — будь первым!')}</div>}
          <div style={{ display: 'grid', gap: 4 }}>
            {board.top.map(r => (
              <div key={r.place} style={{ display: 'flex', gap: 10, padding: '6px 8px', borderRadius: 8, background: r.me ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', fontWeight: r.me ? 700 : 400 }}>
                <span style={{ width: 24, color: 'var(--muted)' }}>{r.place}</span>
                <span style={{ flex: 1 }}>{r.name}{r.me ? ` (${t('ты')})` : ''}</span>
                <b>{r.score}</b>
              </div>
            ))}
          </div>
          {board.myPlace && board.myPlace > 10 && <div style={{ marginTop: 6, fontSize: 13, color: 'var(--muted)' }}>{t('Твоё место: {n}', { n: board.myPlace })}</div>}
        </div>
      )}

      {phase === 'done' && result && (<><div className="label">{t('Разбор')}</div><GameReview items={result.review} /></>)}
    </div>
  )
}
