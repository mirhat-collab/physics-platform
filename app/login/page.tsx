'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const GRADES = ['7', '8', '9', '10', '11']

// Функция автоматического перехода класса
function getActualGrade(grade: string, createdAt: string): string {
  const now = new Date()
  const created = new Date(createdAt)
  const currentYear = now.getFullYear()
  
  // Сентябрь 1 текущего года
  const sep1 = new Date(currentYear, 8, 1)
  
  // Сколько учебных лет прошло с регистрации
  let yearsPassedSinceSep = 0
  
  // Считаем сколько раз прошло 1 сентября после регистрации
  for (let y = created.getFullYear(); y <= currentYear; y++) {
    const sep = new Date(y, 8, 1)
    if (sep > created && sep <= now) {
      yearsPassedSinceSep++
    }
  }
  
  const newGrade = Math.min(parseInt(grade) + yearsPassedSinceSep, 11)
  return newGrade.toString()
}

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
      if (!fullName || !grade) {
        setError('Заполни имя и выбери класс!')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }

      if (data.user) {
        const now = new Date().toISOString()
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          grade,                    // сохраняем оригинальный класс
          total_xp: 0,
          streak: 0,
          created_at: now,
          last_visit: now.split('T')[0],
        })
      }
      router.push('/classes')

    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const today = new Date().toISOString().split('T')[0]
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', user.id).single()

        if (profile) {
          const lastVisit = profile.last_visit
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          const newStreak = lastVisit === yesterday
            ? (profile.streak || 0) + 1
            : lastVisit === today ? profile.streak : 1

          // Автоматически обновляем класс если прошло 1 сентября
          const actualGrade = getActualGrade(
            profile.grade,
            profile.created_at || new Date().toISOString()
          )

          await supabase.from('profiles').update({
            last_visit: today,
            streak: newStreak,
            grade: actualGrade,   // обновляем класс автоматически
          }).eq('id', user.id)
        }
      }
      router.push('/classes')
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

            {/* Выбор класса кнопками */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Выбери свой класс:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {GRADES.map(g => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: grade === g ? '2px solid #a78bfa' : '1px solid #2a2a3e',
                      background: grade === g ? 'rgba(167,139,250,0.2)' : '#0f0f1a',
                      color: grade === g ? '#a78bfa' : '#888',
                      fontSize: 15,
                      fontWeight: grade === g ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {g} класс
                  </button>
                ))}
              </div>
            </div>
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