'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Profile = { id: string; full_name: string; email: string; grade: string; total_xp: number; streak: number; role: string }
type ClassStat = { name: string; students: Profile[]; avg_xp: number; completed_topics: number; total_topics: number }

export default function TeacherPage() {
  const router = useRouter()
  const [teacher, setTeacher] = useState<Profile | null>(null)
  const [students, setStudents] = useState<Profile[]>([])
  const [classStats, setClassStats] = useState<ClassStat[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'students' | 'classes'>('overview')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile || profile.role !== 'teacher') { router.push('/dashboard'); return }
    setTeacher(profile)

    const { data: allStudents } = await supabase
      .from('profiles').select('*')
      .eq('role', 'student')
      .order('total_xp', { ascending: false })
    if (allStudents) setStudents(allStudents)

    const { data: classes } = await supabase.from('classes').select('*')
    const { data: progress } = await supabase.from('progress').select('*').eq('status', 'completed')

    if (classes && allStudents && progress) {
      const stats: ClassStat[] = classes.map(cls => {
        const clsStudents = allStudents.filter(s => s.grade === cls.name)
        const studentIds = clsStudents.map(s => s.id)
        const clsProgress = progress.filter(p => studentIds.includes(p.student))
        const uniqueTopics = new Set(clsProgress.map(p => p.topic))
        const avgXp = clsStudents.length > 0
          ? Math.round(clsStudents.reduce((sum, s) => sum + s.total_xp, 0) / clsStudents.length)
          : 0
        return { name: cls.name, students: clsStudents, avg_xp: avgXp, completed_topics: uniqueTopics.size, total_topics: cls.total_topics || 0 }
      })
      setClassStats(stats)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  const selectedClassStudents = selectedClass ? students.filter(s => s.grade === selectedClass) : []

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff' }}>

      {/* Шапка */}
      <div style={{ background: 'linear-gradient(135deg, #0a2a1a, #0f0f1a)', borderBottom: '1px solid #2a2a3e', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                👨‍🏫
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Панель учителя</h1>
                <p style={{ color: '#888', margin: 0, fontSize: 13 }}>{teacher?.full_name || teacher?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#888', cursor: 'pointer', fontSize: 13 }}>
              🚪 Выйти
            </button>
          </div>

          {/* Статистика */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '14px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{students.length}</div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>учеников</div>
            </div>
            <div style={{ background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: 14, padding: '14px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#a78bfa' }}>{classStats.length}</div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>классов</div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '14px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>
                {students.length > 0 ? Math.round(students.reduce((s, p) => s + p.total_xp, 0) / students.length) : 0}
              </div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>средний XP</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 2rem' }}>

        {/* Табы */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { key: 'overview', label: '📊 Обзор' },
            { key: 'classes', label: '📚 Классы' },
            { key: 'students', label: '👤 Ученики' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              background: tab === t.key ? '#10b981' : '#1a1a2e',
              color: '#fff',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ОБЗОР */}
        {tab === 'overview' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>📈 Прогресс по классам</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {classStats.map(cls => {
                const percent = cls.total_topics > 0 ? Math.round((cls.completed_topics / cls.total_topics) * 100) : 0
                return (
                  <div key={cls.name} style={{ background: '#1a1a2e', borderRadius: 16, padding: '18px 22px', border: '1px solid #2a2a3e', cursor: 'pointer' }}
                    onClick={() => { setTab('classes'); setSelectedClass(cls.name) }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{cls.name}</div>
                        <div style={{ color: '#888', fontSize: 13 }}>{cls.students.length} учеников · ср. XP: {cls.avg_xp}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: percent >= 75 ? '#10b981' : percent >= 40 ? '#f59e0b' : '#667eea' }}>{percent}%</div>
                        <div style={{ color: '#888', fontSize: 11 }}>{cls.completed_topics}/{cls.total_topics} тем</div>
                      </div>
                    </div>
                    <div style={{ background: '#0f0f1a', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, background: percent >= 75 ? 'linear-gradient(90deg,#10b981,#059669)' : percent >= 40 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#667eea,#764ba2)', borderRadius: 999, transition: 'width 0.6s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* КЛАССЫ */}
        {tab === 'classes' && (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {classStats.map(cls => (
                <button key={cls.name} onClick={() => setSelectedClass(cls.name === selectedClass ? null : cls.name)} style={{
                  padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: selectedClass === cls.name ? '#10b981' : '#1a1a2e',
                  color: '#fff',
                }}>{cls.name} ({cls.students.length})</button>
              ))}
            </div>

            {selectedClass && (
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>👥 Ученики класса {selectedClass}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedClassStudents.length === 0 && (
                    <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>В этом классе нет учеников</div>
                  )}
                  {selectedClassStudents.map((s, i) => (
                    <div key={s.id} style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', border: '1px solid #2a2a3e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                          {(s.full_name || s.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.full_name || s.email}</div>
                          <div style={{ color: '#888', fontSize: 12 }}>{s.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#a78bfa' }}>{s.total_xp}</div>
                          <div style={{ color: '#888', fontSize: 11 }}>XP</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f59e0b' }}>🔥{s.streak}</div>
                          <div style={{ color: '#888', fontSize: 11 }}>дней</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ВСЕ УЧЕНИКИ */}
        {tab === 'students' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>👤 Все ученики ({students.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {students.map((s, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
                return (
                  <div key={s.id} style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', border: '1px solid #2a2a3e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18, minWidth: 32 }}>{medal}</span>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                        {(s.full_name || s.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.full_name || s.email}</div>
                        <div style={{ color: '#888', fontSize: 12 }}>{s.grade} класс · {s.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#a78bfa' }}>{s.total_xp}</div>
                        <div style={{ color: '#888', fontSize: 11 }}>XP</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f59e0b' }}>🔥{s.streak}</div>
                        <div style={{ color: '#888', fontSize: 11 }}>дней</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}