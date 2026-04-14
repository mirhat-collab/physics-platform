'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Profile = { total_xp: number; streak: number }

const ACHIEVEMENTS = [
  { id: 'first_topic', icon: '🥇', title: 'Первые шаги', desc: 'Пройди первую тему', check: (p: Profile, topics: number) => topics >= 1 },
  { id: 'five_topics', icon: '📚', title: 'Книгочей', desc: 'Пройди 5 тем', check: (p: Profile, topics: number) => topics >= 5 },
  { id: 'ten_topics', icon: '🚀', title: 'Мастер', desc: 'Пройди 10 тем', check: (p: Profile, topics: number) => topics >= 10 },
  { id: 'xp_100', icon: '⭐', title: 'Отличник', desc: 'Набери 100 XP', check: (p: Profile) => p.total_xp >= 100 },
  { id: 'xp_500', icon: '💎', title: 'Эксперт', desc: 'Набери 500 XP', check: (p: Profile) => p.total_xp >= 500 },
  { id: 'streak_3', icon: '🔥', title: '3 дня подряд', desc: 'Заходи 3 дня подряд', check: (p: Profile) => p.streak >= 3 },
  { id: 'streak_7', icon: '⚡', title: 'Неделя подряд', desc: 'Заходи 7 дней подряд', check: (p: Profile) => p.streak >= 7 },
  { id: 'streak_30', icon: '👑', title: 'Легенда', desc: 'Заходи 30 дней подряд', check: (p: Profile) => p.streak >= 30 },
]

export default function AchievementsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [completedTopics, setCompletedTopics] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (p) setProfile(p)

    const { data: prog } = await supabase
      .from('progress').select('topic')
      .eq('student', user.id).eq('status', 'completed')
    if (prog) setCompletedTopics(prog.length)

    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  const unlocked = ACHIEVEMENTS.filter(a => profile && a.check(profile, completedTopics))
  const locked = ACHIEVEMENTS.filter(a => !profile || !a.check(profile, completedTopics))

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: '1.5rem' }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>🏅 Достижения</h1>
        <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
          {unlocked.length} из {ACHIEVEMENTS.length} получено
        </p>

        {/* Прогресс */}
        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '16px 20px', marginBottom: 28, border: '1px solid #2a2a3e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: '#888' }}>Прогресс</span>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>{unlocked.length} / {ACHIEVEMENTS.length}</span>
          </div>
          <div style={{ background: '#0f0f1a', borderRadius: 999, height: 8 }}>
            <div style={{ height: '100%', width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%`, background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 999, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Полученные */}
        {unlocked.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#4ade80', marginBottom: 12 }}>✅ ПОЛУЧЕНО</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {unlocked.map(a => (
                <div key={a.id} style={{ background: 'linear-gradient(135deg, #1a2e1a, #1a2a1a)', border: '1px solid #4ade8033', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 36, flexShrink: 0 }}>{a.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#4ade80' }}>{a.title}</div>
                    <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{a.desc}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#4ade80', fontSize: 20 }}>✓</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Не получены */}
        {locked.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#555', marginBottom: 12 }}>🔒 НЕ ПОЛУЧЕНО</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {locked.map(a => (
                <div key={a.id} style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: 0.5 }}>
                  <div style={{ fontSize: 36, flexShrink: 0, filter: 'grayscale(1)' }}>{a.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{a.title}</div>
                    <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{a.desc}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 20 }}>🔒</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}