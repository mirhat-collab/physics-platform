'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import katex from 'katex'
import 'katex/dist/katex.min.css'

type MediaItem = { url: string; type: 'image' | 'video'; name: string }

type Topic = {
  id: string
  name: string
  theory: string
  formulas: string
  examples: string
  tasks: string
  resource: string
  grade: string
  media: MediaItem[]
}

function FormulaBlock({ text }: { text: string }) {
  const lines = text.split('\n').filter(l => l.trim() !== '')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {lines.map((line, i) => {
        let html = ''
        try {
          html = katex.renderToString(line.trim(), { throwOnError: false, displayMode: true })
        } catch {
          html = `<span style="color:#fcd34d;font-family:monospace">${line}</span>`
        }
        return (
          <div key={i} style={{ background: '#0a0a14', borderRadius: 12, padding: '16px 24px', border: '1px solid rgba(245,158,11,0.2)', overflowX: 'auto' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </div>
  )
}

export default function TopicPage() {
  const { id } = useParams()
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [marking, setMarking] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    const { data: topicData } = await supabase.from('topics').select('*').eq('id', id).single()
    if (topicData) setTopic(topicData)
    const { data: prog } = await supabase
      .from('progress').select('id')
      .eq('student', user.id).eq('topic', id).eq('status', 'completed').maybeSingle()
    if (prog) setCompleted(true)
    setLoading(false)
  }

  async function markCompleted() {
    if (!userId || !topic || completed || marking) return
    setMarking(true)
    await supabase.from('progress').upsert(
      { student: userId, topic: topic.id, status: 'completed', xp: 10, completed_at: new Date().toISOString() },
      { onConflict: 'student,topic' }
    )
    const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', userId).single()
    if (profile) {
      await supabase.from('profiles').update({ total_xp: (profile.total_xp || 0) + 10 }).eq('id', userId)
    }
    setCompleted(true)
    setMarking(false)
    setShowXP(true)
    setTimeout(() => setShowXP(false), 2500)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  if (!topic) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff' }}>Тема не найдена</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: '2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <Link href="/topics" style={{ color: '#666', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          ← Все темы
        </Link>

        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid #2a2a3e', borderRadius: 24, padding: '32px 36px', marginBottom: 24 }}>
          {topic.grade && (
            <span style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 999, border: '1px solid rgba(167,139,250,0.3)', display: 'inline-block', marginBottom: 16 }}>
              {topic.grade}
            </span>
          )}
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{topic.name}</h1>
        </div>

        {topic.theory && (
          <Section icon="📖" title="Теория" color="#667eea" bg="rgba(102,126,234,0.08)">
            <p style={{ lineHeight: 1.9, color: '#ccc', whiteSpace: 'pre-wrap', margin: 0, fontSize: 15 }}>{topic.theory}</p>
          </Section>
        )}

        {topic.formulas && (
          <Section icon="🔢" title="Формулы" color="#f59e0b" bg="rgba(245,158,11,0.08)">
            <FormulaBlock text={topic.formulas} />
          </Section>
        )}

        {topic.examples && (
          <Section icon="💡" title="Примеры" color="#10b981" bg="rgba(16,185,129,0.08)">
            <p style={{ lineHeight: 1.9, color: '#ccc', whiteSpace: 'pre-wrap', margin: 0, fontSize: 15 }}>{topic.examples}</p>
          </Section>
        )}

        {topic.tasks && (
          <Section icon="🧪" title="Практика" color="#ec4899" bg="rgba(236,72,153,0.08)">
            <p style={{ lineHeight: 1.9, color: '#ccc', whiteSpace: 'pre-wrap', margin: 0, fontSize: 15 }}>{topic.tasks}</p>
          </Section>
        )}

        {topic.resource && (
          <Section icon="🌐" title="Образовательный ресурс" color="#06b6d4" bg="rgba(6,182,212,0.08)">
            <a href={topic.resource} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.35)', borderRadius: 12, color: '#67e8f9', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              🔗 Открыть ресурс <span style={{ fontSize: 12, opacity: 0.7 }}>↗</span>
            </a>
          </Section>
        )}

        {topic.media && topic.media.length > 0 && (
          <Section icon="🖼" title="Материалы" color="#a78bfa" bg="rgba(167,139,250,0.08)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {topic.media.map((item, i) => (
                <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2a3e', background: '#0a0a14' }}>
                  {item.type === 'image'
                    ? <img src={item.url} style={{ width: '100%', display: 'block' }} alt={item.name} />
                    : <video src={item.url} controls style={{ width: '100%', display: 'block' }} />
                  }
                </div>
              ))}
            </div>
          </Section>
        )}

        <div style={{ marginTop: 40, textAlign: 'center', position: 'relative', paddingBottom: 60 }}>
          {showXP && (
            <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', fontSize: 26, fontWeight: 800, color: '#4ade80', animation: 'floatUp 2.5s ease forwards', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              +10 XP ⭐
            </div>
          )}
          <button
            onClick={markCompleted}
            disabled={completed || marking}
            style={{
              padding: '18px 56px', borderRadius: 18, border: 'none', fontSize: 17, fontWeight: 700,
              cursor: completed ? 'default' : 'pointer',
              background: completed ? 'linear-gradient(135deg, #10b981, #059669)' : marking ? '#2a2a3e' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff', transition: 'all 0.3s ease',
              boxShadow: completed ? '0 8px 32px rgba(16,185,129,0.35)' : '0 8px 32px rgba(102,126,234,0.35)',
            }}
          >
            {completed ? '✅ Тема завершена!' : marking ? '⏳ Сохраняем...' : '🎯 Завершить тему (+10 XP)'}
          </button>
          {completed && (
            <p style={{ color: '#666', fontSize: 13, marginTop: 14 }}>Отличная работа! Ты уже прошёл эту тему.</p>
          )}
        </div>

      </div>
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0px); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-70px); }
        }
        .katex { color: #fcd34d !important; font-size: 1.2em !important; }
        .katex-display { margin: 0 !important; }
      `}</style>
    </div>
  )
}

function Section({ icon, title, color, bg, children }: {
  icon: string
  title: string
  color: string
  bg: string
  children: React.ReactNode
}) {
  return (
    <div style={{ background: bg, border: '1px solid #2a2a3e', borderLeft: `4px solid ${color}`, borderRadius: 20, padding: '24px 28px', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: color }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}