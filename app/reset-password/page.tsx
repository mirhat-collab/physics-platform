'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useT } from '@/app/components/LanguageProvider'
import { PASSWORD_RULES, authErrorText, passwordOk } from '@/lib/auth-ui'

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
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) setReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function save() {
    setError('')
    if (!passwordOk(password)) { setError(t('Пароль слишком простой: нужны маленькая и большая латинские буквы, цифра и спецсимвол.')); return }
    if (password !== repeat) { setError(t('Пароли не совпадают')); return }
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (err) { setError(t(authErrorText(err.message))); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <div className="nb-root">
      <main className="join">
        <section className="auth-sheet join-sheet" aria-labelledby="reset-title">
          <p className="nb-kicker">{t('Восстановление доступа')}</p>
          <h1 id="reset-title" className="auth-title">{t('Новый пароль')}</h1>
          {ready === null && <p className="auth-sub">{t('Загрузка...')}</p>}
          {ready === false && (
            <p className="auth-sub">
              {t('Ссылка устарела или открыта в другом браузере. Запроси новую на странице входа и открой её в том же браузере.')}
              <br /><Link href="/login" className="nb-link">{t('На страницу входа')}</Link>
            </p>
          )}
          {ready && !done && (
            <form className="auth-form" noValidate onSubmit={e => { e.preventDefault(); save() }}>
              <p className="auth-sub" style={{ margin: 0 }}>{t('Придумай новый пароль для входа.')}</p>
              <label className="auth-field">
                <span>{t('Новый пароль')}</span>
                <span className="auth-pw">
                  <input className="auth-input" type={showPw ? 'text' : 'password'} autoFocus autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} aria-describedby="pw-rules" />
                  <button type="button" className="auth-pw-eye" onClick={() => setShowPw(v => !v)} aria-pressed={showPw} aria-label={showPw ? t('Скрыть пароль') : t('Показать пароль')}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
                      {showPw && <path d="M4 4l16 16" />}
                    </svg>
                  </button>
                </span>
              </label>
              <ul id="pw-rules" className="auth-rules" aria-label={t('Требования к паролю')}>
                {PASSWORD_RULES.map(r => {
                  const ok = r.ok(password)
                  return <li key={r.label} className={ok ? 'ok' : ''}><span aria-hidden="true">{ok ? '✓' : '·'}</span>{t(r.label)}<span className="sr-only">{ok ? ` — ${t('есть')}` : ''}</span></li>
                })}
              </ul>
              <label className="auth-field">
                <span>{t('Повтори пароль')}</span>
                <input className="auth-input" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={repeat} onChange={e => setRepeat(e.target.value)} />
              </label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button type="submit" className="nb-btn auth-submit" disabled={saving}>{saving ? t('Сохраняю…') : t('Сохранить пароль')}</button>
            </form>
          )}
          {done && <p className="join-ok">{t('Пароль изменён')}</p>}
        </section>
      </main>
    </div>
  )
}
