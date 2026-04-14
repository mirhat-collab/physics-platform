'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  full_name: string
  email: string
  grade: string
  total_xp: number
  streak: number
}

type ClassStat = {
  name: string
  total_topics: number
  completed_topics: number
  avg_xp: number
  student_count: number
}

export default function ProgressPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [classStats, setClassStats] = useState<ClassStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()

    // Загружаем профили
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('total_xp', { ascending: false })

    if (profilesData) setProfiles(profilesData)
    if (user && profilesData) {
      const me = profilesData.find(p => p.id === user.id)
      if (me) setCurrentUser(me)
    }

    // Загружаем классы
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, total_topics')

    // Загружаем прогресс (только completed)
    const { data: progress } = await supabase
      .from('progress')
      .select('student, topic, status')
      .eq('status', 'completed')

    if (classes && profilesData && progress) {
      const stats: ClassStat[] = classes.map(cls => {
        // Ученики этого класса
        const students = profilesData.filter(p => p.grade === cls.name)
        const studentIds = students.map(s => s.id)

        // Уникальные пройденные темы учениками этого класса
        const completedByClass = progress.filter(p => studentIds.includes(p.student))
        const uniqueTopics = new Set(completedByClass.map(p => p.topic))

        const avgXp = students.length > 0
          ? Math.round(students.reduce((sum, s) => sum + s.total_xp, 0) / students.length)
          : 0

        return {
          name: cls.name,
          total_topics: cls.total_topics || 0,
          completed_topics: uniqueTopics.size,
          avg_xp: avgXp,
          student_count: students.length,
        }
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
    <div style={{ minHeight: '100vh', background: '#0f0f1a', padding: '2rem', color: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>🏆 Рейтинг</h1>
        <p style={{ color: '#888', marginBottom: 32 }}>Кто набрал больше всего XP</p>

        {/* Карточка текущего пользователя */}
        {currentUser && (
          <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 20, padding: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: 4 }}>Твой профиль</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentUser.full_name || currentUser.email}</div>
                <div style={{ opacity: 0.8, marginTop: 4 }}>{currentUser.grade}</div>
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{currentUser.total_xp}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>XP</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>🔥{currentUser.streak}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>дней подряд</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                    #{profiles.findIndex(p => p.id === currentUser.id) + 1}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>место</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ НОВАЯ СЕКЦИЯ — Прогресс по классам */}
        {classStats.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>📚 Прогресс по классам</h2>
            <p style={{ color: '#888', marginBottom: 20, fontSize: 14 }}>Сколько тем пройдено и средний XP по каждому классу</p>

            <div style={{ display: 'grid', gap: 16 }}>
              {classStats.map((cls) => {
                const percent = cls.total_topics > 0
                  ? Math.round((cls.completed_topics / cls.total_topics) * 100)
                  : 0

                const barColor = percent >= 75
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : percent >= 40
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #667eea, #764ba2)'

                return (
                  <div key={cls.name} style={{
                    background: '#1a1a2e',
                    borderRadius: 16,
                    padding: '20px 24px',
                    border: '1px solid #2a2a3e',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{cls.name}</div>
                        <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>
                          {cls.student_count} {cls.student_count === 1 ? 'ученик' : cls.student_count < 5 ? 'ученика' : 'учеников'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa' }}>{cls.avg_xp}</div>
                          <div style={{ color: '#888', fontSize: 11 }}>ср. XP</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>
                            {cls.completed_topics}/{cls.total_topics}
                          </div>
                          <div style={{ color: '#888', fontSize: 11 }}>тем пройдено</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: percent >= 75 ? '#10b981' : percent >= 40 ? '#f59e0b' : '#667eea' }}>
                            {percent}%
                          </div>
                          <div style={{ color: '#888', fontSize: 11 }}>прогресс</div>
                        </div>
                      </div>
                    </div>

                    {/* Прогресс бар */}
                    <div style={{ background: '#0f0f1a', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: barColor,
                        borderRadius: 999,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Таблица лидеров */}
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 20 }}>👤 Рейтинг учеников</h2>
        <div style={{ background: '#1a1a2e', borderRadius: 20, border: '1px solid #2a2a3e', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #2a2a3e', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888', fontSize: 14 }}>Ученик</span>
            <span style={{ color: '#888', fontSize: 14 }}>XP</span>
          </div>

          {profiles.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
              Пока нет данных. Зарегистрируйся и начни учиться!
            </div>
          )}

          {profiles.map((profile, index) => {
            const isMe = profile.id === currentUser?.id
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
            const barWidth = maxXp > 0 ? (profile.total_xp / maxXp) * 100 : 0

            return (
              <div key={profile.id} style={{
                padding: '16px 24px',
                borderBottom: '1px solid #2a2a3e',
                background: isMe ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                borderLeft: isMe ? '3px solid #667eea' : '3px solid transparent',
              }}>
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
                  <div style={{
                    height: '100%',
                    width: `${barWidth}%`,
                    background: isMe ? 'linear-gradient(90deg, #667eea, #764ba2)' : 'linear-gradient(90deg, #2a2a3e, #3a3a5e)',
                    borderRadius: 999,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}