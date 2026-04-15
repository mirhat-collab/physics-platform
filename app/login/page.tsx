'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const GRADES = ['7', '8', '9', '10', '11']
const TEACHER_PASSWORD = 'Mirhateacher@dostyp'

function getActualGrade(grade: string, createdAt: string): string {
  const now = new Date()
  const created = new Date(createdAt)
  const currentYear = now.getFullYear()
  let yearsPassedSinceSep = 0
  for (let y = created.getFullYear(); y <= currentYear; y++) {
    const sep = new Date(y, 8, 1)
    if (sep > created && sep <= now) yearsPassedSinceSep++
  }
  return Math.min(parseInt(grade) + yearsPassedSinceSep, 11).toString()
}

export default function LoginPage() {
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

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (isSignUp) {
      if (!fullName) { setError('Введи своё имя!'); setLoading(false); return }
      if (role === 'student' && !grade) { setError('Выбери класс!'); setLoading(false); return }
      if (role === 'teacher' && teacherCode !== TEACHER_PASSWORD) {
        setError('Неверный код учителя!'); setLoading(false); return
      }

      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }

      if (data.user) {
        const now = new Date().toISOString()
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          grade: role === 'teacher' ? 'Учитель' : grade,
          role,
          total_xp: 0,
          streak: 0,
          created_at: now,
          last_visit: now.split('T')[0],
        })
      }
      router.push(role === 'teacher' ? '/teacher' : role === 'parent' ? '/parent' : '/dashboard')

    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const today = new Date().toISOString().split('T')[0]
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

        if (profile) {
          const lastVisit = profile.last_visit
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          const newStreak = lastVisit === yesterday
            ? (profile.streak || 0) + 1
            : lastVisit === today ? profile.streak : 1

          const actualGrade = profile.role === 'teacher'
            ? profile.grade
            : getActualGrade(profile.grade, profile.created_at || new Date().toISOString())

          await supabase.from('profiles').update({
            last_visit: today,
            streak: newStreak,
            grade: actualGrade,
          }).eq('id', user.id)

          router.push(profile.role === 'teacher' ? '/teacher' : profile.role === 'parent' ? '/parent' : '/dashboard')
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
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 40, width: '100%', maxWidth: 440, border: '1px solid #2a2a3e' }}>

        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
          {isSignUp ? '🚀 Регистрация' : '⚡ Вход'}
        </h1>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: 24 }}>
          {isSignUp ? 'Создай аккаунт и начни учиться' : 'Войди в свой аккаунт'}
        </p>

        {/* Выбор роли — только при регистрации */}
        {isSignUp && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Кто ты?</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRole('student')} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: role === 'student' ? '2px solid #667eea' : '1px solid #2a2a3e',
                background: role === 'student' ? 'rgba(102,126,234,0.15)' : '#0f0f1a',
                color: role === 'student' ? '#a78bfa' : '#888',
                fontSize: 15, fontWeight: role === 'student' ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                🎓 Ученик
              </button>
              <button onClick={() => setRole('parent')} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: role === 'parent' ? '2px solid #f59e0b' : '1px solid #2a2a3e',
                background: role === 'parent' ? 'rgba(245,158,11,0.15)' : '#0f0f1a',
                color: role === 'parent' ? '#f59e0b' : '#888',
                fontSize: 15, fontWeight: role === 'parent' ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                👨‍👩‍👧 Родитель
              </button>
              <button onClick={() => setRole('teacher')} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: role === 'teacher' ? '2px solid #10b981' : '1px solid #2a2a3e',
                background: role === 'teacher' ? 'rgba(16,185,129,0.15)' : '#0f0f1a',
                color: role === 'teacher' ? '#10b981' : '#888',
                fontSize: 15, fontWeight: role === 'teacher' ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                👨‍🏫 Учитель
              </button>
            </div>
          </div>
        )}

        {isSignUp && (
          <>
            <input style={input} placeholder="Твоё имя" value={fullName} onChange={e => setFullName(e.target.value)} />

            {/* Только для ученика — выбор класса */}
            {role === 'student' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Выбери свой класс:</div>
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
                      {g} класс
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Только для учителя — секретный код */}
            {role === 'teacher' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>🔐 Код учителя:</div>
                <input
                  style={{ ...input, marginBottom: 0, border: '1px solid #10b98144', background: '#0a1a14' }}
                  type="password"
                  placeholder="Введи секретный код учителя"
                  value={teacherCode}
                  onChange={e => setTeacherCode(e.target.value)}
                />
                <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
                  Код выдаётся администратором платформы
                </div>
              </div>
            )}
          </>
        )}

        <input style={input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={input} type="password" placeholder="Пароль (минимум 6 символов)" value={password} onChange={e => setPassword(e.target.value)} />

        {error && (
          <div style={{ background: '#2d1a1a', border: '1px solid #f5576c', borderRadius: 8, padding: '10px 14px', color: '#f5576c', fontSize: 14, marginBottom: 12 }}>
            ❌ {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', borderRadius: 10, border: 'none',
          background: role === 'teacher' && isSignUp
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #667eea, #764ba2)',
          color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 16
        }}>
          {loading ? 'Загрузка...' : isSignUp
            ? (role === 'teacher' ? '👨‍🏫 Зарегистрироваться как учитель' : '🎓 Зарегистрироваться')
            : '⚡ Войти'}
        </button>

        <p style={{ color: '#888', textAlign: 'center', fontSize: 14 }}>
          {isSignUp ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
          <span onClick={() => { setIsSignUp(!isSignUp); setRole('student'); setTeacherCode('') }}
            style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}>
            {isSignUp ? 'Войти' : 'Зарегистрироваться'}
          </span>
        </p>

      </div>
    </div>
  )
}