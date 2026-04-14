'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const GRADES = ['7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade']

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [grade, setGrade] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }

      // Сохраняем имя и класс в профиль
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          grade,
          total_xp: 0,
          streak: 0,
        })
      }
      router.push('/classes')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }

      // Обновляем серию при входе
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const today = new Date().toISOString().split('T')[0]
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (profile) {
          const lastVisit = profile.last_visit
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          const newStreak = lastVisit === yesterday ? (profile.streak || 0) + 1 : lastVisit === today ? profile.streak : 1
          await supabase.from('profiles').update({ last_visit: today, streak: newStreak }).eq('id', user.id)
        }
      }
      router.push('/classes')
    }
    setLoading(false)
  }

  const input = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1px solid #2a2a3e', background: '#1a1a2e',
    color: '#fff', fontSize: 15, marginBottom: 12,
    boxSizing: 'border-box' as const, outline: 'none'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 40, width: '100%', maxWidth: 420, border: '1px solid #2a2a3e' }}>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
          {isSignUp ? '🚀 Регистрация' : '⚡ Вход'}
        </h1>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: 28 }}>
          {isSignUp ? 'Создай аккаунт и начни учиться' : 'Войди в свой аккаунт'}
        </p>

        {isSignUp && (
          <>
            <input
              style={input}
              placeholder="Твоё имя"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
            <select
              style={{ ...input, marginBottom: 12 }}
              value={grade}
              onChange={e => setGrade(e.target.value)}
            >
              <option value="">Выбери свой класс</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </>
        )}

        <input
          style={input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          style={input}
          type="password"
          placeholder="Пароль (минимум 6 символов)"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && (
          <div style={{ background: '#2d1a1a', border: '1px solid #f5576c', borderRadius: 8, padding: '10px 14px', color: '#f5576c', fontSize: 14, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}
        >
          {loading ? 'Загрузка...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
        </button>

        <p style={{ color: '#888', textAlign: 'center', fontSize: 14 }}>
          {isSignUp ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
          <span
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}
          >
            {isSignUp ? 'Войти' : 'Зарегистрироваться'}
          </span>
        </p>
      </div>
    </div>
  )
}