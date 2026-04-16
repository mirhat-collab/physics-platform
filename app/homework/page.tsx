'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Homework = { id: number; title: string; description: string; class_name: string; due_date: string; created_at: string }
type Submission = { id: number; homework_id: number; answer: string; grade: string }

export default function HomeworkPage() {
  const router = useRouter()
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [userGrade, setUserGrade] = useState('')
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [sending, setSending] = useState<number | null>(null)
  const [sent, setSent] = useState<Record<number, boolean>>({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('full_name, email, grade, role').eq('id', user.id).single()
    if (profile) { setUserName(profile.full_name || profile.email); setUserGrade(profile.grade) }

    // Учителей перенаправляем на панель учителя
    if (profile?.role === 'teacher') { router.push('/teacher'); return }

    const { data: hw } = await supabase.from('homework').select('*').eq('class_name', profile?.grade || '').order('created_at', { ascending: false })
    if (hw) setHomeworks(hw)

    const { data: subs } = await supabase.from('homework_submissions').select('*').eq('student_id', user.id)
    if (subs) {
      setSubmissions(subs)
      const s: Record<number, boolean> = {}
      subs.forEach(sub => { s[sub.homework_id] = true })
      setSent(s)
    }
    setLoading(false)
  }

  async function submitAnswer(hwId: number) {
    const answer = answers[hwId]
    if (!answer?.trim()) return
    setSending(hwId)
    await supabase.from('homework_submissions').insert({
      homework_id: hwId, student_id: userId, student_name: userName, answer: answer.trim()
    })
    setSent({ ...sent, [hwId]: true })
    setSending(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff' }}>Загрузка...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: '2rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a3e, #0f0f1a)', borderBottom: '1px solid #2a2a3e', borderRadius: 20, padding: '24px', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px' }}>📝 Домашние задания</h1>
          <p style={{ color: '#888', margin: 0, fontSize: 14 }}>{userGrade} класс</p>
        </div>

        {homeworks.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            Заданий пока нет
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {homeworks.map(hw => {
            const mySub = submissions.find(s => s.homework_id === hw.id)
            const isSent = sent[hw.id]
            const isOverdue = hw.due_date && new Date(hw.due_date) < new Date()
            return (
              <div key={hw.id} style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', border: `1px solid ${isSent ? '#10b98144' : isOverdue ? '#f5576c33' : '#2a2a3e'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{hw.title}</div>
                    <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                      {hw.due_date ? `До ${new Date(hw.due_date).toLocaleDateString('ru-RU')}` : 'Без срока'}
                      {isOverdue && !isSent && <span style={{ color: '#f5576c', marginLeft: 8 }}>⚠️ Просрочено</span>}
                    </div>
                  </div>
                  {isSent && (
                    <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                      {mySub?.grade ? `Оценка: ${mySub.grade}` : '✅ Сдано'}
                    </span>
                  )}
                </div>

                {hw.description && <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{hw.description}</p>}

                {isSent ? (
                  <div style={{ background: '#0f0f1a', borderRadius: 10, padding: '12px 16px', border: '1px solid #2a2a3e' }}>
                    <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Твой ответ:</div>
                    <div style={{ color: '#ccc', fontSize: 14 }}>{mySub?.answer}</div>
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={3} value={answers[hw.id] || ''}
                      onChange={e => setAnswers({ ...answers, [hw.id]: e.target.value })}
                      placeholder="Напиши свой ответ..."
                      style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #2a2a3e', background: '#0f0f1a', color: '#fff', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'sans-serif' }}
                    />
                    <button onClick={() => submitAnswer(hw.id)} disabled={sending === hw.id || !answers[hw.id]?.trim()}
                      style={{ marginTop: 8, padding: '10px 24px', borderRadius: 10, border: 'none', background: answers[hw.id]?.trim() ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#2a2a3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                      {sending === hw.id ? 'Отправляем...' : '📨 Сдать'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
