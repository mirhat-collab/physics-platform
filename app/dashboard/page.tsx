'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Profile = { id: string; full_name: string; email: string; grade: string; total_xp: number; streak: number }
type Topic = { id: string; name: string; grade: string }

const VALID_GRADES = ['7', '8', '9', '10', '11']

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [completed, setCompleted] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (p) setProfile(p)

    const safeGrade = p?.grade && VALID_GRADES.includes(p.grade) ? p.grade : null
    if (safeGrade) {
      const { data: t } = await supabase.from('topics').select('*').eq('grade', safeGrade)
      if (t) setTopics(t)
    }

    const { data: prog } = await supabase
      .from('progress').select('topic')
      .eq('student', user.id).eq('status', 'completed')
    if (prog) setCompleted(prog.map(p => p.topic))

    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  const gradeDisplay = profile?.grade && VALID_GRADES.includes(profile.grade) ? `${profile.grade} класс` : 'Класс не указан'
  const percent = topics.length > 0 ? Math.round((completed.filter(c => topics.find(t => t.id === c)).length / topics.length) * 100) : 0
  const nextTopic = topics.find(t => !completed.includes(t.id))
  const level = Math.floor((profile?.total_xp || 0) / 100) + 1
  const xpInLevel = (profile?.total_xp || 0) % 100

  return (
    <div style={{ minHeight: '100vh', color: '#fff', padding: '1.5rem' }}>
      <div className="animate-fade-in-up" style={{ maxWidth: 800, margin: '0 auto' }}>

        <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 24, padding: '28px 32px', marginBottom: 20, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>Добро пожаловать 👋</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px' }}>
            {profile?.full_name || profile?.email}
          </h1>
          <div style={{ opacity: 0.8, fontSize: 14 }}>{gradeDisplay} · Уровень {level}</div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
              <span>XP до следующего уровня</span>
              <span>{xpInLevel} / 100</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 8 }}>
              <div style={{ height: '100%', width: `${xpInLevel}%`, background: '#fff', borderRadius: 999, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        </div>

        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <div className="hover-lift" style={{ background: '#1a1a2e', borderRadius: 16, padding: '16px', border: '1px solid #2a2a3e', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#a78bfa' }}>{profile?.total_xp}</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>Всего XP</div>
          </div>
          <div className="hover-lift" style={{ background: '#1a1a2e', borderRadius: 16, padding: '16px', border: '1px solid #2a2a3e', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>🔥{profile?.streak}</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>Дней подряд</div>
          </div>
          <div className="hover-lift" style={{ background: '#1a1a2e', borderRadius: 16, padding: '16px', border: '1px solid #2a2a3e', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{percent}%</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>Прогресс</div>
          </div>
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '20px 24px', marginBottom: 20, border: '1px solid #2a2a3e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>📚 Прогресс класса</span>
            <span style={{ color: '#888', fontSize: 13 }}>{completed.filter(c => topics.find(t => t.id === c)).length} / {topics.length} тем</span>
          </div>
          <div style={{ background: '#0f0f1a', borderRadius: 999, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 999, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {nextTopic && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#888' }}>▶ СЛЕДУЮЩАЯ ТЕМА</h2>
            <Link href={`/topics/${nextTopic.id}`} style={{ textDecoration: 'none' }}>
              <div className="hover-lift animate-pulse-glow" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid #667eea', borderRadius: 16, padding: '20px 24px', cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{nextTopic.name}</div>
                <div style={{ color: '#667eea', fontSize: 13, fontWeight: 600 }}>Начать → +10 XP</div>
              </div>
            </Link>
          </div>
        )}

        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Link href="/topics" style={{ textDecoration: 'none' }}>
            <div className="hover-lift" style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, padding: '18px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 28 }}>📚</div>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Все темы</div>
            </div>
          </Link>
          <Link href="/progress" style={{ textDecoration: 'none' }}>
            <div className="hover-lift" style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, padding: '18px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 28 }}>🏆</div>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Рейтинг</div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  )
}