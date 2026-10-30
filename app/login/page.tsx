'use client'
import { useState } from 'react'
import { getActualGrade } from '@/lib/grade-match'
import { supabase } from '@/lib/supabase'
import { kzDate, nextStreak } from '@/lib/streak'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useT } from '@/app/components/LanguageProvider'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import { PENDING_JOIN, joinPath } from '@/lib/groups'

const GRADES = ['7', '8', '9', '10', '11']

const PENDING_TEACHER_CODE = 'pendingTeacherCode'

// Пришёл по приглашению в группу (/join/<код>) — после входа возвращаем туда
function afterLogin(path: string): string {
  try {
    const code = localStorage.getItem(PENDING_JOIN)
    if (code) return joinPath(code)
  } catch { /* нет доступа к storage */ }
  return path
}

export default function LoginPage() {
  const { t } = useT()
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [role, setRole] = useState<'student' | 'teacher' | 'parent'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [grade, setGrade] = useState('')
  const [teacherCode, setTeacherCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgot, setForgot] = useState(false) // «Забыли пароль?»: отправляем ссылку на почту
  const [sent, setSent] = useState(false)

  // Код учителя, сохранённый при регистрации с подтверждением почты
  async function applyPendingTeacherCode() {
    let code: string | null = null
    try { code = localStorage.getItem(PENDING_TEACHER_CODE) } catch { return }
    if (!code) return
    const res = await fetch('/api/register-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).catch(() => null)
    // Неверный код повторять бессмысленно; сетевую ошибку — попробуем при следующем входе
    if (res && (res.ok || res.status === 403)) {
      try { localStorage.removeItem(PENDING_TEACHER_CODE) } catch { /* нет доступа к storage */ }
    }
  }

  async function sendReset() {
    setError('')
    if (!email.trim()) { setError(t('Введи почту, на которую зарегистрирован аккаунт')); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (isSignUp) {
      if (!fullName) { setError(t('Введи своё имя!')); setLoading(false); return }
      if (role === 'student' && !grade) { setError(t('Выбери класс!')); setLoading(false); return }
      if (role === 'teacher') {
        const res = await fetch('/api/check-teacher-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: teacherCode })
        })
        const { valid } = await res.json()
        if (!valid) { setError(t('Неверный код учителя!')); setLoading(false); return }
      }

      // Имя, класс и роль ученика/родителя сохраняет триггер handle_new_user
      // из данных регистрации. Роль клиент сам менять не может.
      const profileGrade = role === 'student' ? grade : ''
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, grade: profileGrade, role: role === 'parent' ? 'parent' : 'student' } },
      })
      if (error) { setError(error.message); setLoading(false); return }

      if (data.user && data.session) {
        await supabase.from('profiles').update({
          full_name: fullName,
          grade: profileGrade,
          last_visit: kzDate(),
        }).eq('id', data.user.id)

        if (role === 'teacher') {
          const res = await fetch('/api/register-teacher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: teacherCode }),
          })
          if (!res.ok) {
            const d = await res.json().catch(() => null)
            setError(t(d?.error || 'Не удалось подтвердить код учителя. Войди и попробуй снова.'))
            setLoading(false)
            return
          }
        }
      } else if (data.user) {
        // Без подтверждённой почты сессии ещё нет, и роль учителя выдать нельзя.
        // Запоминаем код в этом браузере — роль применится при первом входе.
        if (role === 'teacher') {
          try { localStorage.setItem(PENDING_TEACHER_CODE, teacherCode) } catch { /* нет доступа к storage */ }
          setError(t('Проверь почту и подтверди регистрацию, затем войди — роль учителя включится автоматически. Если войдёшь с другого устройства, введи код учителя в профиле.'))
        } else {
          setError(t('Проверь почту и подтверди регистрацию, затем войди.'))
        }
        setLoading(false)
        return
      }
      router.push(afterLogin(role === 'teacher' ? '/teacher' : role === 'parent' ? '/parent' : '/dashboard'))

    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await applyPendingTeacherCode()
        const today = kzDate()
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

        if (profile) {
          const newStreak = nextStreak(profile.last_visit, profile.streak)

          // Класс «переводим» только ученикам — у учителя/админа/родителя
          // в grade не номер класса (раньше так у админа появился grade = "NaN")
          await supabase.from('profiles').update({
            last_visit: today,
            streak: newStreak,
            ...(profile.role === 'student' ? { grade: getActualGrade(profile.grade || '', profile.last_visit) } : {}),
          }).eq('id', user.id)

          router.push(afterLogin(
            profile.role === 'admin' ? '/admin'
            : profile.role === 'teacher' ? '/teacher'
            : profile.role === 'parent' ? '/parent'
            : '/dashboard'
          ))
        } else {
          router.push(afterLogin('/dashboard'))
        }
      }
    }
    setLoading(false)
  }

  const roles = [
    { key: 'student' as const, label: t('Ученик') },
    { key: 'parent' as const, label: t('Родитель') },
    { key: 'teacher' as const, label: t('Учитель') },
  ]

  return (
    <div className="nb-root">
      <div className="nb-wrap">
        <header className="nb-top">
          <Link href="/" className="nb-brand" aria-label={t('На главную')}>
            <img src="/logo-mark.png" alt="" />
            Mirha_Edu
          </Link>
          <LanguageSwitcher compact tone="paper" />
        </header>

        <main className="auth">
          {/* Слева на компьютере — зачем входить */}
          <section className="auth-side">
            <h2 className="auth-side-title">{t('Подготовка к ЕНТ')}<br /><em>{t('каждый день')}</em></h2>
            <ul className="auth-perks" role="list">
              {[t('Задачи ЕНТ с подробным решением'), t('Пробный ЕНТ и прогноз балла'), t('ИИ объяснит непонятный шаг')].map(p => (
                <li key={p}>
                  <svg viewBox="0 0 30 30" aria-hidden><path d="M4 15 C 7 18, 9 21, 11 25 C 15 15, 20 8, 27 3" /></svg>
                  {p}
                </li>
              ))}
            </ul>
          </section>

          <section className="auth-sheet" aria-labelledby="auth-title">
            {!forgot && (
              <div className="auth-tabs" role="tablist" aria-label={t('Вход или регистрация')}>
                {[false, true].map(up => (
                  <button
                    key={String(up)} type="button" role="tab" aria-selected={isSignUp === up}
                    className={isSignUp === up ? 'on' : ''}
                    onClick={() => { setIsSignUp(up); setRole('student'); setTeacherCode(''); setError('') }}
                  >
                    {up ? t('Регистрация') : t('Вход')}
                  </button>
                ))}
              </div>
            )}

            <h1 id="auth-title" className="auth-title">
              {forgot ? t('Новый пароль') : isSignUp ? t('Создай аккаунт') : t('С возвращением')}
            </h1>
            <p className="auth-sub">
              {forgot
                ? (sent
                  ? t('✅ Письмо отправлено на {email}. Открой ссылку из письма в этом же браузере и придумай новый пароль. Если письма нет — проверь «Спам».', { email })
                  : t('Введи почту аккаунта — пришлём ссылку, по которой можно задать новый пароль.'))
                : isSignUp ? t('Это бесплатно и займёт минуту') : t('Войди в свой аккаунт')}
            </p>

            <form className="auth-form" noValidate onSubmit={e => { e.preventDefault(); if (forgot) sendReset(); else handleSubmit() }}>
              {!forgot && isSignUp && (
                <>
                  <fieldset className="auth-field">
                    <legend>{t('Кто ты?')}</legend>
                    <div className="auth-seg">
                      {roles.map(r => (
                        <button key={r.key} type="button" aria-pressed={role === r.key} className={role === r.key ? 'on' : ''} onClick={() => setRole(r.key)}>{r.label}</button>
                      ))}
                    </div>
                  </fieldset>

                  <label className="auth-field">
                    <span>{t('Твоё имя')}</span>
                    <input className="auth-input" autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} />
                  </label>

                  {role === 'student' && (
                    <fieldset className="auth-field">
                      <legend>{t('Класс')}</legend>
                      <div className="auth-seg auth-seg-grades">
                        {GRADES.map(g => (
                          <button key={g} type="button" aria-pressed={grade === g} aria-label={t('{g} класс', { g })} className={grade === g ? 'on' : ''} onClick={() => setGrade(g)}>{g}</button>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {role === 'teacher' && (
                    <label className="auth-field">
                      <span>{t('Код учителя')}</span>
                      <input className="auth-input" type="password" placeholder={t('Введи секретный код учителя')} value={teacherCode} onChange={e => setTeacherCode(e.target.value)} />
                      <small>{t('Код выдаётся администратором платформы')}</small>
                    </label>
                  )}
                </>
              )}

              {!(forgot && sent) && (
                <label className="auth-field">
                  <span>{t('Почта')}</span>
                  <input className="auth-input" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
                </label>
              )}

              {!forgot && (
                <label className="auth-field">
                  <span className="auth-label-row">
                    {t('Пароль')}
                    {!isSignUp && <button type="button" className="auth-text-btn" onClick={() => { setForgot(true); setError('') }}>{t('Забыли пароль?')}</button>}
                  </span>
                  <input className="auth-input" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} />
                  {isSignUp && <small>{t('Минимум 6 символов')}</small>}
                </label>
              )}

              {error && <p className="auth-error" role="alert">{error}</p>}

              {!(forgot && sent) && (
                <button type="submit" className="nb-btn auth-submit" disabled={loading}>
                  {loading && <span className="spin auth-spin" aria-hidden />}
                  {loading ? t('Загрузка...')
                    : forgot ? t('Отправить ссылку')
                    : isSignUp ? (role === 'teacher' ? t('Зарегистрироваться как учитель') : t('Зарегистрироваться'))
                    : t('Войти')}
                </button>
              )}
            </form>

            {forgot && (
              <button type="button" className="auth-text-btn auth-back" onClick={() => { setForgot(false); setSent(false); setError('') }}>{t('← Назад ко входу')}</button>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
