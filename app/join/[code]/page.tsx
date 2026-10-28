'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PENDING_JOIN } from '@/lib/groups'
import { useT } from '@/app/components/LanguageProvider'

// Приглашение в группу учителя: /join/<код> (ссылка или QR-код)
export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const { t } = useT()
  const [group, setGroup] = useState<{ group_name: string; teacher_name: string } | null | undefined>(undefined)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [joined, setJoined] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.rpc('study_group_by_code', { code }).then(({ data }) => setGroup((data as { group_name: string; teacher_name: string }[] | null)?.[0] ?? null))
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user)
      // Без входа запоминаем код: после входа или регистрации вернём сюда (один раз)
      try {
        if (!user) localStorage.setItem(PENDING_JOIN, code)
        else localStorage.removeItem(PENDING_JOIN)
      } catch { /* нет доступа к storage */ }
    })
  }, [code])

  async function join() {
    setBusy(true)
    setError('')
    const { error: err } = await supabase.rpc('join_study_group', { code })
    setBusy(false)
    if (err) { setError(err.message.includes('group_not_found') ? t('Группа не найдена — проверь ссылку у учителя.') : err.message); return }
    setJoined(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card animate-scale-in" style={{ maxWidth: 440, width: '100%', padding: 32, textAlign: 'center', color: 'var(--text)' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
        {group === undefined && <p style={{ color: 'var(--muted)' }}>{t('Загрузка…')}</p>}
        {group === null && <p>{t('Группа не найдена — проверь ссылку у учителя.')}</p>}
        {group && (
          <>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px' }}>{group.group_name}</h1>
            {group.teacher_name && <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>{t('Учитель: {name}', { name: group.teacher_name })}</p>}
            {joined ? (
              <>
                <p style={{ color: 'var(--good)', fontWeight: 700 }}>✅ {t('Ты в группе! Учитель будет видеть твои задания и результаты.')}</p>
                <Link href="/homework" className="btn" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 8 }}>{t('К домашним заданиям')}</Link>
              </>
            ) : loggedIn ? (
              <button className="btn" onClick={join} disabled={busy} style={{ width: '100%' }}>{busy ? t('Загрузка…') : t('Вступить в группу')}</button>
            ) : loggedIn === false ? (
              <>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 14 }}>{t('Чтобы вступить, войди или зарегистрируйся — потом вернёшься сюда автоматически.')}</p>
                <Link href="/login" className="btn" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>{t('Войти или зарегистрироваться')}</Link>
              </>
            ) : null}
            {error && <p style={{ color: 'var(--bad)', fontSize: 14, marginTop: 12 }}>{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
