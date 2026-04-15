'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Student = { id: string; full_name: string; email: string; grade: string; total_xp: number; streak: number }
type Progress = { topic: string; completed_at: string }

export default function ParentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [progress, setProgress] = useState<Progress[]>([])
  const [linkEmail, setLinkEmail] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkMsg, setLinkMsg] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const { data: links } = await supabase.from('parent_links').select('student_id').eq('parent_id', user.id)
    if (links && links.length > 0) {
      const ids = links.map(l => l.student_id)
      const { data: studs } = await supabase.from('profiles').select('*').in('id', ids)
      if (studs) setStudents(studs)
    }
    setLoading(false)
  }

  async function linkStudent() {
    if (!linkEmail.trim()) return
    setLinking(true)
    setLinkMsg('')
    const { data: student } = await supabase.from('profiles').select('*').eq('email', linkEmail.trim()).eq('role', 'student').single()
    if (!student) { setLinkMsg('❌ Ученик с таким email не найден'); setLinking(false); return }
    const { data: existing } = await supabase.from('parent_links').select('id').eq('parent_id', userId).eq('student_id', student.id).maybeSingle()
    if (existing) { setLinkMsg('Этот ученик уже привязан'); setLinking(false); return }
    await supabase.from('parent_links').insert({ parent_id: userId, student_id: student.id })
    setStudents([...students, student])
    setLinkEmail('')
    setLinkMsg('✅ Ученик успешно привязан!')
    setLinking(false)
    setTimeout(() => setLinkMsg(''), 3000)
  }

  async function loadProgress(student: Student) {
    setSelectedStudent(student)
    const { data } = await supabase.from('progress').select('topic, completed_at').eq('student', student.id).eq('status', 'completed').order('completed_at', { ascending: false })
    if (data) setProgress(data)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff' }}>Загрузка...</div>
    </div>
  )

  const level = (xp: number) => Math.floor(xp / 100) + 1

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: '2rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a3e, #0f0f1a)', borderRadius: 20, padding: '24px', marginBottom: 24, border: '1px solid #2a2a3e' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px' }}>👨‍👩‍👧 Родительский доступ</h1>
          <p style={{ color: '#888', margin: 0 }}>Следи за успехами своего ребёнка</p>
        </div>

        {/* Привязать ученика */}
        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', border: '1px solid #2a2a3e', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 14px', fontWeight: 700 }}>🔗 Привязать ученика</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={linkEmail} onChange={e => setLinkEmail(e.target.value)}
              placeholder="Email ученика"
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #2a2a3e', background: '#0f0f1a', color: '#fff', fontSize: 14, outline: 'none' }}
            />
            <button onClick={linkStudent} disabled={linking || !linkEmail.trim()}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}>
              {linking ? '...' : 'Привязать'}
            </button>
          </div>
          {linkMsg && <div style={{ marginTop: 10, fontSize: 13, color: linkMsg.startsWith('✅') ? '#10b981' : '#f5576c' }}>{linkMsg}</div>}
          <p style={{ color: '#555', fontSize: 12, marginTop: 10 }}>Введи email который ученик использовал при регистрации</p>
        </div>

        {/* Список привязанных учеников */}
        {students.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#555', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👶</div>
            Привяжи ученика чтобы видеть его прогресс
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {students.map(s => (
              <div key={s.id}>
                <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '18px 20px', border: `1px solid ${selectedStudent?.id === s.id ? '#667eea55' : '#2a2a3e'}`, cursor: 'pointer' }}
                  onClick={() => selectedStudent?.id === s.id ? setSelectedStudent(null) : loadProgress(s)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {(s.full_name || s.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{s.full_name || s.email}</div>
                        <div style={{ color: '#888', fontSize: 13 }}>{s.grade} класс · {s.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                      <div><div style={{ fontWeight: 800, color: '#a78bfa', fontSize: 18 }}>{s.total_xp}</div><div style={{ color: '#888', fontSize: 11 }}>XP</div></div>
                      <div><div style={{ fontWeight: 800, color: '#10b981', fontSize: 18 }}>{level(s.total_xp)}</div><div style={{ color: '#888', fontSize: 11 }}>Уровень</div></div>
                      <div><div style={{ fontWeight: 800, color: '#f59e0b', fontSize: 18 }}>🔥{s.streak}</div><div style={{ color: '#888', fontSize: 11 }}>дней</div></div>
                    </div>
                  </div>
                </div>

                {selectedStudent?.id === s.id && (
                  <div style={{ background: '#1a1a2e', borderRadius: '0 0 16px 16px', padding: '16px 20px', border: '1px solid #667eea33', borderTop: 'none', marginTop: -4 }}>
                    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, color: '#888' }}>Пройденные темы ({progress.length}):</div>
                    {progress.length === 0 ? (
                      <div style={{ color: '#555', fontSize: 14 }}>Пока не прошёл ни одной темы</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {progress.slice(0, 10).map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 12px', background: '#0f0f1a', borderRadius: 8 }}>
                            <span style={{ color: '#ccc' }}>✅ Тема #{p.topic}</span>
                            <span style={{ color: '#555' }}>{new Date(p.completed_at).toLocaleDateString('ru-RU')}</span>
                          </div>
                        ))}
                        {progress.length > 10 && <div style={{ color: '#555', fontSize: 12, textAlign: 'center' }}>и ещё {progress.length - 10} тем...</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ marginTop: 32, width: '100%', padding: '14px', borderRadius: 14, border: '1px solid #f5576c33', background: '#2d1a1a', color: '#f5576c', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          🚪 Выйти
        </button>
      </div>
    </div>
  )
}
