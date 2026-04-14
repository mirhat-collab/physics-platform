'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [topicsCount, setTopicsCount] = useState(0)
  const [classesCount, setClassesCount] = useState(0)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) { router.push('/dashboard'); return }

      const { count: tCount } = await supabase.from('topics').select('*', { count: 'exact', head: true })
      const { count: cCount } = await supabase.from('classes').select('*', { count: 'exact', head: true })
      if (tCount) setTopicsCount(tCount)
      if (cCount) setClassesCount(cCount)

      setLoading(false)
    }
    check()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', overflow: 'hidden' }}>

      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(102,126,234,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -200, left: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(118,75,162,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 1.5rem', position: 'relative' }}>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 20px' }}>
            ⚡
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.1 }}>
            Physics<br />
            <span style={{ background: 'linear-gradient(135deg, #667eea, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Platform</span>
          </h1>
          <p style={{ color: '#888', fontSize: 16, margin: 0, lineHeight: 1.6 }}>
            Учи физику с удовольствием.<br />Зарабатывай XP, соревнуйся с классом.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '2.5rem' }}>
          {[
            { icon: '📚', title: 'Темы', desc: 'Теория, формулы, практика' },
            { icon: '⭐', title: 'XP система', desc: '+10 XP за каждую тему' },
            { icon: '🏆', title: 'Рейтинг', desc: 'Соревнуйся с классом' },
            { icon: '🔥', title: 'Streak', desc: 'Заходи каждый день' },
          ].map((f, i) => (
            <div key={i} style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, padding: '16px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
              <div style={{ color: '#888', fontSize: 12 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <div style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontSize: 17, fontWeight: 700, textAlign: 'center', cursor: 'pointer', boxShadow: '0 8px 32px rgba(102,126,234,0.4)' }}>
              🚀 Начать учиться
            </div>
          </Link>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <div style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'transparent', border: '1px solid #2a2a3e', color: '#888', fontSize: 16, fontWeight: 600, textAlign: 'center', cursor: 'pointer' }}>
              Уже есть аккаунт? Войти
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #2a2a3e' }}>
          {[
            { num: classesCount.toString(), label: 'классов' },
            { num: topicsCount.toString(), label: 'тем' },
            { num: '∞', label: 'знаний' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa' }}>{s.num}</div>
              <div style={{ color: '#888', fontSize: 13 }}>{s.label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}