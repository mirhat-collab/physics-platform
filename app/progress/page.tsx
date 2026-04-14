'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Profile = { id: string; full_name: string; email: string; grade: string; total_xp: number; streak: number }
type ClassStat = { name: string; total_topics: number; completed_topics: number; avg_xp: number; student_count: number }

export default function ProgressPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [classStats, setClassStats] = useState<ClassStat[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'leaderboard' | 'classes'>('leaderboard')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profilesData } = await supabase.from('profiles').select('*').order('total_xp', { ascending: false })
    if (profilesData) setProfiles(profilesData)
    if (user && profilesData) {
      const me = profilesData.find(p => p.id === user.id)
      if (me) setCurrentUser(me)
    }
    const { data: classes } = await supabase.from('classes').select('id, name, total_topics')
    const { data: progress } = await supabase.from('progress').select('student, topic, status').eq('status', 'completed')
    if (classes && profilesData && progress) {
      const stats: ClassStat[] = classes.map(cls => {
        const students = profilesData.filter(p => p.grade === cls.name)
        const studentIds = students.map(s => s.id)
        const completedByClass = progress.filter(p => studentIds.includes(p.student))
        const uniqueTopics = new Set(completedByClass.map(p => p.topic))
        const avgXp = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.total_xp, 0) / students.length) : 0
        return { name: cls.name, total_topics: cls.total_topics || 0, completed_topics: uniqueTopics.size, avg_xp: avgXp, student_count: students.length }
      })
      setClassStats(stats)
    }
    setLoading(false)
  }

  const maxXp = profiles[0]?.total_xp || 1

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff' }}>

      {/* Красивая шапка */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #0f0f1a 100%)', borderBottom: '1px solid #2a2a3e', padding: '2rem 2rem 1.5rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              🏆
            </div>
            <div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0 }}>Рейтинг</h1>
              <p style={{ color: '#888', margin: 0, fontSize: 14 }}>Кто набрал больше всего XP</p>
            </div>
          </div>

          {/* Карточка текущего пользователя */}
          {currentUser && (
            <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 2 }}>Твой профиль</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currentUser.full_name || currentUser.email}</div>
                  <div style={{ opacity: 0.8, fontSize: 13, marginTop: 2 }}>{currentUser.grade}</div>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{currentUser.total_xp}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>XP</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>🔥{currentUser.streak}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>дней</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>#{profiles.findIndex(p => p.id === currentUser.id) + 1}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>место</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Табы */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setTab('leaderboard')} style={{ padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === 'leaderboard' ? '#667eea' : '#1a1a2e', color: '#fff', transition: 'all 0.2s' }}>
              👤 Ученики
            </button>
            <button onClick={() => setTab('classes')} style={{ padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === 'classes' ? '#667eea' : '#1a1a2e', color: '#fff', transition: 'all 0.2s' }}>
              📚 Классы
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 2rem' }}>

        {/* Рейтинг учеников */}
        {tab === 'leaderboard' && (
          <div style={{ background: '#1a1a2e', borderRadius: 20, border: '1px solid #2a2a3e', overflow: 'hidden' }}>
            {profiles.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Пока нет данных!</div>
            )}
            {profiles.map((profile, index) => {
              const isMe = profile.id === currentUser?.id
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
              const barWidth = maxXp > 0 ? (profile.total_xp / maxXp) * 100 : 0
              return (
                <div key={profile.id} style={{ padding: '16px 24px', borderBottom: '1px solid #2a2a3e', background: isMe ? 'rgba(102,126,234,0.1)' : 'transparent', borderLeft: isMe ? '3px solid #667eea' : '3px solid transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18, minWidth: 32 }}>{medal}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{profile.full_name || profile.email}</div>
                        <div style={{ color: '#888', fontSize: 12 }}>{profile.grade} {profile.streak > 0 && `🔥 ${profile.streak} дней`}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: '#a78bfa', fontSize: 18 }}>{profile.total_xp} XP</div>
                  </div>
                  <div style={{ background: '#0f0f1a', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barWidth}%`, background: isMe ? 'linear-gradient(90deg, #667eea, #764ba2)' : 'linear-gradient(90deg, #2a2a3e, #3a3a5e)', borderRadius: 999, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Прогресс по классам */}
        {tab === 'classes' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {classStats.map((cls) => {
              const percent = cls.total_topics > 0 ? Math.round((cls.completed_topics / cls.total_topics) * 100) : 0
              const barColor = percent >= 75 ? 'linear-gradient(90deg, #10b981, #059669)' : percent >= 40 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #667eea, #764ba2)'
              return (
                <div key={cls.name} style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px 24px', border: '1px solid #2a2a3e' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>{cls.name}</div>
                      <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{cls.student_count} учеников</div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa' }}>{cls.avg_xp}</div>
                        <div style={{ color: '#888', fontSize: 11 }}>ср. XP</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>{cls.completed_topics}/{cls.total_topics}</div>
                        <div style={{ color: '#888', fontSize: 11 }}>тем</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: percent >= 75 ? '#10b981' : percent >= 40 ? '#f59e0b' : '#667eea' }}>{percent}%</div>
                        <div style={{ color: '#888', fontSize: 11 }}>прогресс</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#0f0f1a', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: barColor, borderRadius: 999, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}