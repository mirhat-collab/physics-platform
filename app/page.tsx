'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LobbyPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

      <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 24, boxShadow: '0 8px 32px rgba(102,126,234,0.4)' }}>
        ⚡
      </div>

      <h1 style={{ fontSize: '2.6rem', fontWeight: 900, margin: '0 0 12px', textAlign: 'center', background: 'linear-gradient(135deg, #a78bfa, #667eea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Физика с нуля
      </h1>
      <p style={{ color: '#888', fontSize: 16, textAlign: 'center', maxWidth: 380, marginBottom: 48, lineHeight: 1.6 }}>
        Изучай физику через задачи, зарабатывай XP и соревнуйся с одноклассниками
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 500, width: '100%', marginBottom: 40 }}>
        {[
          { icon: '📚', label: 'Темы по классам' },
          { icon: '🏆', label: 'Рейтинг и XP' },
          { icon: '🔥', label: 'Стрики побед' },
        ].map(f => (
          <div key={f.label} style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 12px', textAlign: 'center', border: '1px solid #2a2a3e' }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{f.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <Link href="/login" style={{ textDecoration: 'none' }}>
          <button style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            ⚡ Войти
          </button>
        </Link>
        <Link href="/login" style={{ textDecoration: 'none' }}>
          <button style={{ width: '100%', padding: '16px', borderRadius: 14, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#a78bfa', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            🚀 Зарегистрироваться
          </button>
        </Link>
      </div>

    </div>
  )
}