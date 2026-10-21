'use client'
import { useState } from 'react'
import { getActualGrade } from '@/lib/grade-match'
import { supabase } from '@/lib/supabase'
import { kzDate, nextStreak } from '@/lib/streak'
import { useRouter } from 'next/navigation'
import { useT } from '@/app/components/LanguageProvider'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'

const GRADES = ['7', '8', '9', '10', '11']

const PENDING_TEACHER_CODE = 'pendingTeacherCode'

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
      router.push(role === 'teacher' ? '/teacher' : role === 'parent' ? '/parent' : '/dashboard')

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

          router.push(
            profile.role === 'admin' ? '/admin'
            : profile.role === 'teacher' ? '/teacher'
            : profile.role === 'parent' ? '/parent'
            : '/dashboard'
          )
        } else {
          router.push('/dashboard')
        }
      }
    }
    setLoading(false)
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1px solid #2a2a3e', background: '#1a1a2e',
    color: '#fff', fontSize: 15, marginBottom: 12,
    boxSizing: 'border-box', outline: 'none'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(102,126,234,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="animate-scale-in" style={{ background: '#1a1a2e', borderRadius: 20, padding: 40, width: '100%', maxWidth: 440, border: '1px solid #2a2a3e', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}><LanguageSwitcher compact /></div>
        <img src="/logo-mark.png" alt="Mirha_Edu" style={{ width: 56, height: 56, objectFit: 'contain', display: 'block', margin: '0 auto 12px' }} />

        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
          {isSignUp ? t('🚀 Регистрация') : t('⚡ Вход')}
        </h1>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: 24 }}>
          {isSignUp ? t('Создай аккаунт и начни учиться') : t('Войди в свой аккаунт')}
        </p>

        {/* Выбор роли — только при регистрации */}
        {isSignUp && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{t('Кто ты?')}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRole('student')} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: role === 'student' ? '2px solid #667eea' : '1px solid #2a2a3e',
                background: role === 'student' ? 'rgba(102,126,234,0.15)' : '#0f0f1a',
                color: role === 'student' ? '#a78bfa' : '#888',
                fontSize: 15, fontWeight: role === 'student' ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {t('🎓 Ученик')}
              </button>
              <button onClick={() => setRole('parent')} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: role === 'parent' ? '2px solid #f59e0b' : '1px solid #2a2a3e',
                background: role === 'parent' ? 'rgba(245,158,11,0.15)' : '#0f0f1a',
                color: role === 'parent' ? '#f59e0b' : '#888',
                fontSize: 15, fontWeight: role === 'parent' ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {t('👨‍👩‍👧 Родитель')}
              </button>
              <button onClick={() => setRole('teacher')} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: role === 'teacher' ? '2px solid #10b981' : '1px solid #2a2a3e',
                background: role === 'teacher' ? 'rgba(16,185,129,0.15)' : '#0f0f1a',
                color: role === 'teacher' ? '#10b981' : '#888',
                fontSize: 15, fontWeight: role === 'teacher' ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {t('👨‍🏫 Учитель')}
              </button>
            </div>
          </div>
        )}

        {isSignUp && (
          <>
            <input style={input} placeholder={t('Твоё имя')} value={fullName} onChange={e => setFullName(e.target.value)} />

            {/* Только для ученика — выбор класса */}
            {role === 'student' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{t('Выбери свой класс:')}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {GRADES.map(g => (
                    <button key={g} onClick={() => setGrade(g)} style={{
                      padding: '10px 18px', borderRadius: 10,
                      border: grade === g ? '2px solid #a78bfa' : '1px solid #2a2a3e',
                      background: grade === g ? 'rgba(167,139,250,0.2)' : '#0f0f1a',
                      color: grade === g ? '#a78bfa' : '#888',
                      fontSize: 15, fontWeight: grade === g ? 700 : 400,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {t('{g} класс', { g: g })}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Только для учителя — секретный код */}
            {role === 'teacher' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{t('🔐 Код учителя:')}</div>
                <input
                  style={{ ...input, marginBottom: 0, border: '1px solid #10b98144', background: '#0a1a14' }}
                  type="password"
                  placeholder={t('Введи секретный код учителя')}
                  value={teacherCode}
                  onChange={e => setTeacherCode(e.target.value)}
                />
                <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
                  {t('Код выдаётся администратором платформы')}
                </div>
              </div>
            )}
          </>
        )}

        <input style={input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={input} type="password" placeholder={t('Пароль (минимум 6 символов)')} value={password} onChange={e => setPassword(e.target.value)} />

        {error && (
          <div className="animate-scale-in" style={{ background: '#2d1a1a', border: '1px solid #f5576c', borderRadius: 8, padding: '10px 14px', color: '#f5576c', fontSize: 14, marginBottom: 12 }}>
            ❌ {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} className="btn-glow" style={{
          width: '100%', padding: '14px', borderRadius: 10, border: 'none',
          background: role === 'teacher' && isSignUp
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #667eea, #764ba2)',
          color: '#fff', fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer', marginBottom: 16,
          opacity: loading ? 0.75 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {loading && <span className="spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', display: 'inline-block' }} />}
          {loading ? t('Загрузка...') : isSignUp
            ? (role === 'teacher' ? t('👨‍🏫 Зарегистрироваться как учитель') : t('🎓 Зарегистрироваться'))
            : t('⚡ Войти')}
        </button>

        <p style={{ color: '#888', textAlign: 'center', fontSize: 14 }}>
          {isSignUp ? t('Уже есть аккаунт? ') : t('Нет аккаунта? ')}
          <span onClick={() => { setIsSignUp(!isSignUp); setRole('student'); setTeacherCode('') }}
            style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}>
            {isSignUp ? t('Войти') : t('Зарегистрироваться')}
          </span>
        </p>

      </div>
    </div>
  )
}