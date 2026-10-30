'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useT } from '@/app/components/LanguageProvider'

// Новый пароль по ссылке из письма. Supabase сам обменивает код из адреса
// на сессию; если ссылка устарела или открыта в другом браузере — сессии нет.
export default function ResetPasswordPage() {
  const { t } = useT()
  const router = useRouter()
  const [ready, setReady] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) setReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function save() {
    setError('')
    if (password.length < 6) { setError(t('Пароль — минимум 6 символов')); return }
    if (password !== repeat) { setError(t('Пароли не совпадают')); return }
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)',
    color: 'var(--text)', fontSize: 15, marginBottom: 12, boxSizing: 'border-box', outline: 'none',
  }

  return (
    <div className="nb-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="animate-scale-in" style={{ background: 'var(--surface)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 440, border: '1px solid var(--line)' }}>
        <h1 style={{ color: 'var(--text)', fontSize: '1.6rem', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>🔑 {t('Новый пароль')}</h1>
        {ready === null && <p style={{ color: 'var(--muted)', textAlign: 'center' }}>{t('Загрузка...')}</p>}
        {ready === false && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
            {t('Ссылка устарела или открыта в другом браузере. Запроси новую на странице входа и открой её в том же браузере.')}
            <br /><Link href="/login" style={{ color: 'var(--accent)' }}>{t('На страницу входа')}</Link>
          </p>
        )}
        {ready && !done && (
          <>
            <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 20 }}>{t('Придумай новый пароль для входа.')}</p>
            <input style={input} type="password" autoFocus placeholder={t('Новый пароль (минимум 6 символов)')} value={password} onChange={e => setPassword(e.target.value)} />
            <input style={input} type="password" placeholder={t('Повтори пароль')} value={repeat} onChange={e => setRepeat(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} />
            {error && <div style={{ background: 'var(--surface)', border: '1px solid var(--bad)', borderRadius: 8, padding: '10px 14px', color: 'var(--bad)', fontSize: 14, marginBottom: 12 }}>❌ {error}</div>}
            <button onClick={save} disabled={saving} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.75 : 1 }}>
              {saving ? t('Сохраняю…') : t('Сохранить пароль')}
            </button>
          </>
        )}
        {done && <p style={{ color: 'var(--good)', textAlign: 'center', fontWeight: 700 }}>✅ {t('Пароль изменён')}</p>}
      </div>
    </div>
  )
}
