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

const GRADE_ORDER = ['7', '8', '9', '10', '11']

const gradeColors: Record<string, string> = {
  '7': '#667eea', '8': '#f59e0b', '9': '#10b981', '10': '#ec4899', '11': '#06b6d4',
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'recent' | 'bookmarked'>('all')
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
    try {
      const recent = JSON.parse(localStorage.getItem('recentTopics') || '[]')
      setRecentIds(Array.isArray(recent) ? recent : [])
    } catch { setRecentIds([]) }
    try {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
      setBookmarkIds(new Set(Array.isArray(bookmarks) ? bookmarks : []))
    } catch { setBookmarkIds(new Set()) }
  }, [])

  async function load() {
    const { data } = await supabase.from('topics').select('*')
    if (data) setTopics(data)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: progress } = await supabase
        .from('progress').select('topic')
        .eq('student', user.id).eq('status', 'completed')
      if (progress && data) {
        const progressTopics = new Set(progress.map(p => String(p.topic)))
        const ids = new Set(
          data.filter(t => progressTopics.has(String(t.id)) || progressTopics.has(t.name)).map(t => t.id)
        )
        setCompletedIds(ids)
      }
    }
    setLoading(false)
  }

  const grades = ['all', ...GRADE_ORDER.filter(g =>
    topics.some(t => t.grade === g || t.grade === `${g}th Grade`)
  )]

  let filtered = gradeFilter === 'all'
    ? topics
    : topics.filter(t => t.grade === gradeFilter || t.grade === `${gradeFilter}th Grade`)

  if (statusFilter === 'completed') {
    filtered = filtered.filter(t => completedIds.has(t.id) || completedIds.has(String(t.id)))
  } else if (statusFilter === 'bookmarked') {
    filtered = filtered.filter(t => bookmarkIds.has(String(t.id)))
  } else if (statusFilter === 'recent') {
    const recentSet = new Set(recentIds)
    filtered = filtered.filter(t => recentSet.has(t.id) || recentSet.has(String(t.id)))
    filtered = [...filtered].sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id))
  }

  // Поиск по названию темы
  if (search.trim()) {
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase())
    )
  }

  const progressPercent = topics.length > 0 ? Math.round((completedIds.size / topics.length) * 100) : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff' }}>

      {/* Шапка */}
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
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>{topics.length}</span>
              <span style={{ color: '#888', marginLeft: 6 }}>тем всего</span>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{completedIds.size}</span>
              <span style={{ color: '#888', marginLeft: 6 }}>изучено</span>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>{grades.length - 1}</span>
              <span style={{ color: '#888', marginLeft: 6 }}>классов</span>
            </div>
          </div>

          {/* Прогресс-бар */}
          <div style={{ marginTop: 16, background: '#1a1a2e', borderRadius: 12, padding: '12px 16px', border: '1px solid #2a2a3e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>Твой прогресс</span>
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>{completedIds.size} / {topics.length} тем ({progressPercent}%)</span>
            </div>
            <div style={{ background: '#0f0f1a', borderRadius: 999, height: 8 }}>
              <div style={{
                height: '100%', width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #667eea, #10b981)',
                borderRadius: 999, transition: 'width 0.6s ease'
              }} />
            </div>
          </div>

          {/* Поиск */}
          <div style={{ marginTop: 12, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#555' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск темы..."
              style={{
                width: '100%', padding: '10px 16px 10px 40px',
                borderRadius: 12, border: '1px solid #2a2a3e',
                background: '#1a1a2e', color: '#fff', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Фильтр по классам */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {grades.map(g => (
              <button key={g} onClick={() => setGradeFilter(g)} style={{
                padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                background: gradeFilter === g ? (gradeColors[g] || '#667eea') : '#1a1a2e',
                color: gradeFilter === g ? '#fff' : '#888',
                boxShadow: gradeFilter === g ? `0 0 12px ${gradeColors[g] || '#667eea'}44` : 'none',
              }}>
                {g === 'all' ? '✦ Все' : `${g} класс`}
              </button>
            ))}
          </div>

          {/* Фильтр по статусу */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {[
              { key: 'all', label: '📋 Все темы' },
              { key: 'completed', label: '✅ Изученные' },
              { key: 'bookmarked', label: '🔖 Закладки' },
              { key: 'recent', label: '🕐 Недавние' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setStatusFilter(key as typeof statusFilter)} style={{
                padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                background: statusFilter === key ? '#2a2a4e' : 'transparent',
                color: statusFilter === key ? '#a78bfa' : '#555',
                border: statusFilter === key ? '1px solid #667eea55' : '1px solid transparent',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Список тем */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 2rem' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', padding: '60px 0', fontSize: 15 }}>
            {search ? `😕 Ничего не найдено по запросу "${search}"` : statusFilter === 'completed' ? '😅 Ты ещё не изучил ни одной темы' : statusFilter === 'bookmarked' ? '🔖 Нет сохранённых тем — нажми 📌 на странице темы' : '😅 Нет недавно открытых тем'}
          </div>
        )}
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((topic) => {
            const grade = topic.grade.replace('th Grade', '')
            const color = gradeColors[grade] || '#667eea'
            const isHovered = hovered === topic.id
            const isDone = completedIds.has(topic.id) || completedIds.has(String(topic.id))
            return (
              <Link key={topic.id} href={`/topics/${topic.id}`} style={{ textDecoration: 'none' }}
                onClick={() => {
                  try {
                    const recent: string[] = JSON.parse(localStorage.getItem('recentTopics') || '[]')
                    const updated = [topic.id, ...(Array.isArray(recent) ? recent : []).filter(id => id !== topic.id)].slice(0, 20)
                    localStorage.setItem('recentTopics', JSON.stringify(updated))
                  } catch {}
                }}
              >
                <div
                  onMouseEnter={() => setHovered(topic.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: isHovered ? '#20203e' : '#1a1a2e',
                    border: '1px solid #2a2a3e',
                    borderLeft: `4px solid ${isDone ? '#10b981' : color}`,
                    borderRadius: 16, padding: '18px 22px',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                    transform: isHovered ? 'translateX(6px)' : 'translateX(0)',
                    boxShadow: isHovered ? `0 0 20px ${color}22` : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{topic.name}</h2>
                      <span style={{ background: `${color}22`, color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, border: `1px solid ${color}44`, whiteSpace: 'nowrap' }}>
                        {grade} класс
                      </span>
                      {isDone && (
                        <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(16,185,129,0.3)', whiteSpace: 'nowrap' }}>
                          ✅ Изучено
                        </span>
                      )}
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
