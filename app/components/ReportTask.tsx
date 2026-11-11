'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { EntQuestion, EntSubject } from '@/lib/ent'
import { useT } from '@/app/components/LanguageProvider'
import Icon from '@/app/components/Icon'

export type ReportReason = 'answer' | 'condition' | 'solution' | 'translation' | 'other'
export const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: 'answer', label: 'Неверный ответ' },
  { id: 'condition', label: 'Ошибка или неясность в условии' },
  { id: 'solution', label: 'Ошибка в решении' },
  { id: 'translation', label: 'Ошибка в переводе' },
  { id: 'other', label: 'Другое' },
]

// «Ошибка в задании»: ученик отмечает, что не так, — жалоба с самим заданием
// попадает админу во вкладку «Качество заданий».
export default function ReportTask({ q, subject }: { q: EntQuestion; subject: EntSubject }) {
  const { t, locale } = useT()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('answer')
  const [comment, setComment] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error' | 'login'>('idle')

  async function send() {
    setState('sending')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setState('login'); return }
    const payload = { question: q.question, options: q.options, correct: q.correct, solution: q.solution, ...(q.figure ? { figure: q.figure } : {}), ...(q.kind ? { kind: q.kind, answers: q.answers, left: q.left, pairs: q.pairs } : {}) }
    const { error } = await supabase.from('task_reports').insert({
      user_id: user.id, task_key: q.key ?? null, subject, topic: q.topic ?? null,
      reason, comment: comment.trim().slice(0, 1000) || null, payload, locale,
    })
    setState(error ? 'error' : 'sent')
  }

  if (state === 'sent') {
    return <div style={{ fontSize: 13, color: 'var(--good)' }}><Icon name="check" size="1em" /> {t('Спасибо! Мы проверим задание.')}</div>
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ justifySelf: 'start', background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>
        <Icon name="alert" size="1em" /> {t('Ошибка в задании?')}
      </button>
    )
  }
  return (
    <div className="card animate-fade-in" style={{ display: 'grid', gap: 10, padding: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{t('Что не так с заданием?')}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {REPORT_REASONS.map(r => (
          <button key={r.id} className={`chip${reason === r.id ? ' on' : ''}`} onClick={() => setReason(r.id)}>{t(r.label)}</button>
        ))}
      </div>
      <textarea rows={2} value={comment} maxLength={1000} onChange={e => setComment(e.target.value)} placeholder={t('Коротко опиши ошибку (необязательно)')}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" onClick={send} disabled={state === 'sending'}>{state === 'sending' ? t('Отправляю…') : t('Отправить')}</button>
        <button className="btn btn-ghost" onClick={() => setOpen(false)}>{t('Отмена')}</button>
        {state === 'error' && <span style={{ color: 'var(--bad)', fontSize: 13 }}>{t('Не удалось отправить, попробуй ещё раз')}</span>}
        {state === 'login' && <span style={{ color: 'var(--bad)', fontSize: 13 }}>{t('Войди в аккаунт, чтобы сообщить об ошибке')}</span>}
      </div>
    </div>
  )
}
