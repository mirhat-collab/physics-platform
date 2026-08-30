'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Topic = { id: string; name: string; theory: string; grade: string }
type ClassData = { id: string; name: string; program: string; total_topics: number }

export default function ClassPage() {
  const { id } = useParams()
  const router = useRouter()
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [completed, setCompleted] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // RLS прячет закрытые классы от учеников без доступа — cls будет null,
    // если класс закрыт и ученику доступ не выдан.
    const { data: cls } = await supabase.from('classes').select('*').eq('id', id).single()
    if (!cls) { setClassData(null); setLoading(false); return }
    setClassData(cls)

    const { data: t } = await supabase.from('topics').select('*').eq('grade', cls.name)
    if (t) setTopics(t)

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

  if (!classData) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#1a1a2e', borderRadius: 24, padding: 48, width: '100%', maxWidth: 400, border: '1px solid #2a2a3e', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Класс закрыт</h1>
        <p style={{ color: '#666', marginBottom: 32, fontSize: 14 }}>У тебя нет доступа к этому классу. Обратись к администратору.</p>
        <Link href="/classes" style={{ display: 'inline-block', width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>← Все классы</Link>
      </div>
    </div>
  )

  const percent = topics.length > 0 ? Math.round((completed.filter(c => topics.find(t => t.id === c)).length / topics.length) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', color: '#fff', padding: '2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <Link href="/classes" style={{ color: '#666', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          ← Все классы
        </Link>

        {/* Шапка класса */}
        <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 24, padding: '32px 36px', marginBottom: 28 }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>{classData?.program}</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 20px' }}>{classData?.name}</h1>

          {/* Прогресс бар */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.9, marginBottom: 8 }}>
            <span>Прогресс</span>
            <span>{completed.filter(c => topics.find(t => t.id === c)).length} / {topics.length} тем</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: '#fff', borderRadius: 999, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>{percent}% завершено</div>
        </div>

        {/* Список тем */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>📚 Темы</h2>

        {topics.length === 0 && (
          <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>Темы ещё не добавлены</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topics.map((topic, index) => {
            const isDone = completed.includes(topic.id)
            const isHov = hovered === topic.id
            return (
              <Link key={topic.id} href={`/topics/${topic.id}`} style={{ textDecoration: 'none' }}>
                <div
                  onMouseEnter={() => setHovered(topic.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: isHov ? '#20203e' : '#1a1a2e',
                    border: `1px solid ${isDone ? '#10b981' : '#2a2a3e'}`,
                    borderLeft: `4px solid ${isDone ? '#10b981' : '#667eea'}`,
                    borderRadius: 16, padding: '18px 22px',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transform: isHov ? 'translateX(4px)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isDone ? '#10b981' : '#2a2a3e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, flexShrink: 0,
                      color: isDone ? '#fff' : '#666',
                    }}>
                      {isDone ? '✓' : index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: isDone ? '#4ade80' : '#fff' }}>
                        {topic.name}
                      </div>
                      <div style={{ color: '#666', fontSize: 12, marginTop: 3 }}>
                        {topic.theory?.slice(0, 60)}...
                      </div>
                    </div>
                  </div>
                  <div style={{ color: isDone ? '#10b981' : '#444', fontSize: 20, flexShrink: 0 }}>
                    {isDone ? '✅' : '→'}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  )
}