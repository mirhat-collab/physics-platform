'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ENT_SUBJECTS, type EntSubject } from '@/lib/ent'
import GamePlay, { type PublicTask } from '@/app/components/GamePlay'
import GameReview, { type ReviewItem } from '@/app/components/GameReview'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'

type Info = { code: string; subject: EntSubject; mine: boolean; results: { name: string; score: number; total: number; time: number; me: boolean }[] }
const clock = (ms: number) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

// Дуэль по ссылке: оба игрока решают одни и те же 10 заданий
export default function DuelPage() {
  const { t } = useT()
  const code = String(useParams().code || '').toUpperCase()
  const [info, setInfo] = useState<Info | null>(null)
  const [error, setError] = useState('')
  const [game, setGame] = useState<{ tasks: PublicTask[]; ticket: string } | null>(null)
  const [review, setReview] = useState<ReviewItem[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const r = await fetch(`/api/games?duel=${code}`)
    const d = await r.json().catch(() => ({}))
    if (!r.ok) setError(t(d.error || 'Ошибка')); else setInfo(d)
  }, [code, t])

  useEffect(() => {
    let alive = true
    fetch(`/api/games?duel=${code}`).then(async r => {
      const d = await r.json().catch(() => ({}))
      if (!alive) return
      if (!r.ok) setError(t(d.error || 'Ошибка')); else setInfo(d)
    })
    return () => { alive = false }
  }, [code, t])

  async function post(body: object) {
    const r = await fetch('/api/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(t(d.error || 'Ошибка'))
    return d
  }

  async function play() {
    setBusy(true); setError('')
    try { setGame(await post({ action: 'play', code })) } catch (e) { setError(e instanceof Error ? e.message : t('Ошибка')) }
    setBusy(false)
  }

  async function finish(answers: (number | null)[]) {
    if (!game) return
    setBusy(true)
    try { const d = await post({ action: 'finish', ticket: game.ticket, answers }); setReview(d.review); setGame(null); await load() } catch (e) { setError(e instanceof Error ? e.message : t('Ошибка')); setGame(null) }
    setBusy(false)
  }

  if (game) return <div className="nb-root page"><GamePlay tasks={game.tasks} seconds={null} onFinish={finish} /></div>

  const played = info?.results.some(r => r.me)
  const url = typeof window !== 'undefined' ? window.location.href : ''
  return (
    <div className="nb-root page animate-fade-in-up">
      <h1 className="page-title">{t('Дуэль')} {info && `· ${t(ENT_SUBJECTS[info.subject].label)}`}</h1>
      {error && <div className="card" style={{ color: 'var(--bad)', marginBottom: 14 }}>{error} {error.includes('Войди') && <Link href="/login" style={{ color: 'var(--accent)' }}>{t('Войти')}</Link>}</div>}
      {!info && !error && <div style={{ color: 'var(--muted)' }}>{t('Загрузка…')}</div>}
      {info && (
        <>
          <p className="page-sub">{t('10 одинаковых заданий. Побеждает тот, кто решит больше; при равенстве — кто быстрее.')}</p>
          {!played && (
            <div className="card" style={{ marginBottom: 14, display: 'grid', gap: 10 }}>
              <div>{info.results.length ? t('Соперник уже сыграл. Твоя очередь!') : t('Ты играешь первым — после игры отправь ссылку другу.')}</div>
              <button className="btn" onClick={play} disabled={busy} style={{ justifySelf: 'start' }}><Icon name="zap" size={18} /> {busy ? t('Загрузка…') : t('Начать дуэль')}</button>
            </div>
          )}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="label">{t('Результаты')}</div>
            {!info.results.length && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('Пока никто не сыграл.')}</div>}
            {info.results.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 6px', fontWeight: r.me ? 700 : 400 }}>
                <span style={{ width: 22 }}>{i === 0 && info.results.length > 1 ? <Icon name="trophy" size={16} style={{ color: 'var(--warn)' }} /> : i + 1}</span>
                <span style={{ flex: 1 }}>{r.name}{r.me ? ` (${t('ты')})` : ''}</span>
                <span>{r.score} / {r.total}</span>
                <span style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{clock(r.time)}</span>
              </div>
            ))}
            {played && info.results.length < 2 && <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>{t('Ждём соперника. Отправь ему ссылку на эту страницу.')}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {}) }}><Icon name="link" size={16} /> {copied ? t('Скопировано') : t('Копировать ссылку')}</button>
            <button className="btn btn-ghost" onClick={load}><Icon name="refresh" size={16} /> {t('Обновить')}</button>
            <Link href="/blitz" className="btn btn-ghost" style={{ textDecoration: 'none' }}>{t('Новая дуэль')}</Link>
          </div>
          {review && (<><div className="label">{t('Разбор')}</div><GameReview items={review} /></>)}
        </>
      )}
    </div>
  )
}
