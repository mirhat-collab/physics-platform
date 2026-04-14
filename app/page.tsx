'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Topic = {
  id: string
  name: string
  theory: string
  formulas: string
  grade: string
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('topics').select('*')
      if (data) setTopics(data)
      setLoading(false)
    }
    load()
  }, [])

  const gradeColors: Record<string, string> = {
    '7th Grade':  '#667eea',
    '8th Grade':  '#f59e0b',
    '9th Grade':  '#10b981',
    '10th Grade': '#ec4899',
    '11th Grade': '#06b6d4',
    '7':  '#667eea',
    '8':  '#f59e0b',
    '9':  '#10b981',
    '10': '#ec4899',
    '11': '#06b6d4',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#0f0f1a', padding: '2rem', color: '#fff' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>⚡ Темы</h1>
        <p style={{ color: '#888', marginBottom: 36 }}>Выбери тему и начни изучать</p>

        <div style={{ display: 'grid', gap: 16 }}>
          {topics.map((topic) => {
            const color = gradeColors[topic.grade] || '#667eea'
            const isHovered = hovered === topic.id

            return (
              <Link
                key={topic.id}
                href={`/topics/${topic.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  onMouseEnter={() => setHovered(topic.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: isHovered ? '#20203e' : '#1a1a2e',
                    border: '1px solid #2a2a3e',
                    borderLeft: `4px solid ${color}`,
                    borderRadius: 16,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    transform: isHovered ? 'translateX(6px)' : 'translateX(0)',
                    boxShadow: isHovered ? `0 0 20px ${color}22` : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                        {topic.name}
                      </h2>
                      <span style={{
                        background: `${color}22`,
                        color: color,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 999,
                        border: `1px solid ${color}44`,
                        whiteSpace: 'nowrap',
                      }}>
                        {topic.grade}
                      </span>
                    </div>
                    <p style={{
                      margin: 0, color: '#888', fontSize: 13,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {topic.theory}
                    </p>
                  </div>

                  <div style={{ color: isHovered ? '#fff' : '#444', fontSize: 22, flexShrink: 0, transition: 'color 0.2s' }}>
                    →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}