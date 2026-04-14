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
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('topics').select('*')
      if (data) setTopics(data)
      setLoading(false)
    }
    load()
  }, [])

  const gradeColors: Record<string, string> = {
    '7th Grade': '#667eea', '8th Grade': '#f59e0b',
    '9th Grade': '#10b981', '10th Grade': '#ec4899', '11th Grade': '#06b6d4',
    '7': '#667eea', '8': '#f59e0b', '9': '#10b981', '10': '#ec4899', '11': '#06b6d4',
  }

  const grades = ['all', ...Array.from(new Set(topics.map(t => t.grade)))]
  const filtered = filter === 'all' ? topics : topics.filter(t => t.grade === filter)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff' }}>

      {/* Красивая шапка */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #0f0f1a 100%)', borderBottom: '1px solid #2a2a3e', padding: '2rem 2rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              📚
            </div>
            <div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0 }}>Темы</h1>
              <p style={{ color: '#888', margin: 0, fontSize: 14 }}>Выбери тему и начни изучать</p>
            </div>
          </div>

          {/* Статистика */}
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div style={{ background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>{topics.length}</span>
              <span style={{ color: '#888', marginLeft: 6 }}>тем всего</span>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{grades.length - 1}</span>
              <span style={{ color: '#888', marginLeft: 6 }}>классов</span>
            </div>
          </div>

          {/* Фильтр по классам */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {grades.map(g => (
              <button key={g} onClick={() => setFilter(g)} style={{
                padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                background: filter === g ? (gradeColors[g] || '#667eea') : '#1a1a2e',
                color: filter === g ? '#fff' : '#888',
                boxShadow: filter === g ? `0 0 12px ${gradeColors[g] || '#667eea'}44` : 'none',
              }}>
                {g === 'all' ? '✦ Все' : g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Список тем */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((topic) => {
            const color = gradeColors[topic.grade] || '#667eea'
            const isHovered = hovered === topic.id
            return (
              <Link key={topic.id} href={`/topics/${topic.id}`} style={{ textDecoration: 'none' }}>
                <div
                  onMouseEnter={() => setHovered(topic.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: isHovered ? '#20203e' : '#1a1a2e',
                    border: '1px solid #2a2a3e',
                    borderLeft: `4px solid ${color}`,
                    borderRadius: 16, padding: '18px 22px',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                    transform: isHovered ? 'translateX(6px)' : 'translateX(0)',
                    boxShadow: isHovered ? `0 0 20px ${color}22` : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{topic.name}</h2>
                      <span style={{ background: `${color}22`, color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, border: `1px solid ${color}44`, whiteSpace: 'nowrap' }}>
                        {topic.grade}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{topic.theory?.slice(0, 100)}...</p>
                  </div>
                  <div style={{ color: isHovered ? '#fff' : '#444', fontSize: 20, flexShrink: 0, transition: 'color 0.2s' }}>→</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}