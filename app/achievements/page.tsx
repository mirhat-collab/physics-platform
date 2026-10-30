'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useT } from '@/app/components/LanguageProvider'

type Profile = { total_xp: number; streak: number }
type Stats = { topics: number; homeworkDone: number }

const ACHIEVEMENTS = [
  // Темы
  { id: 'first_topic', icon: '🥇', title: 'Первые шаги', desc: 'Пройди первую тему', category: 'Учёба', check: (_: Profile, s: Stats) => s.topics >= 1 },
  { id: 'five_topics', icon: '📚', title: 'Книгочей', desc: 'Пройди 5 тем', category: 'Учёба', check: (_: Profile, s: Stats) => s.topics >= 5 },
  { id: 'ten_topics', icon: '🚀', title: 'Мастер', desc: 'Пройди 10 тем', category: 'Учёба', check: (_: Profile, s: Stats) => s.topics >= 10 },
  { id: 'twenty_topics', icon: '🧠', title: 'Физик', desc: 'Пройди 20 тем', category: 'Учёба', check: (_: Profile, s: Stats) => s.topics >= 20 },

  // XP
  { id: 'xp_100', icon: '⭐', title: 'Отличник', desc: 'Набери 100 XP', category: 'XP', check: (p: Profile, _: Stats) => p.total_xp >= 100 },
  { id: 'xp_500', icon: '💎', title: 'Эксперт', desc: 'Набери 500 XP', category: 'XP', check: (p: Profile, _: Stats) => p.total_xp >= 500 },
  { id: 'xp_1000', icon: '👑', title: 'Гений', desc: 'Набери 1000 XP', category: 'XP', check: (p: Profile, _: Stats) => p.total_xp >= 1000 },

  // Стрики
  { id: 'streak_3', icon: '🔥', title: '3 дня подряд', desc: 'Заходи 3 дня подряд', category: 'Стрик', check: (p: Profile, _: Stats) => p.streak >= 3 },
  { id: 'streak_7', icon: '⚡', title: 'Неделя подряд', desc: 'Заходи 7 дней подряд', category: 'Стрик', check: (p: Profile, _: Stats) => p.streak >= 7 },
  { id: 'streak_30', icon: '🌟', title: 'Легенда', desc: 'Заходи 30 дней подряд', category: 'Стрик', check: (p: Profile, _: Stats) => p.streak >= 30 },

  // Домашние задания
  { id: 'hw_first', icon: '📝', title: 'Прилежный ученик', desc: 'Сдай первое домашнее задание', category: 'Домашка', check: (_: Profile, s: Stats) => s.homeworkDone >= 1 },
  { id: 'hw_ten', icon: '📋', title: 'Ответственный', desc: 'Сдай 10 домашних заданий', category: 'Домашка', check: (_: Profile, s: Stats) => s.homeworkDone >= 10 },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Учёба': 'var(--accent)',
  'XP': 'var(--warn)',
  'Стрик': 'var(--bad)',
  'Домашка': 'var(--accent)',
}

export default function AchievementsPage() {
  const { t } = useT()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ topics: 0, homeworkDone: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (p) setProfile(p)

    const { data: prog } = await supabase.from('progress').select('topic').eq('student', user.id).eq('status', 'completed')
    const { data: hwSubs } = await supabase.from('homework_submissions').select('id').eq('student_id', user.id)

    setStats({
      topics: prog?.length || 0,
      homeworkDone: hwSubs?.length || 0,
    })

    setLoading(false)
  }

  if (loading) return (
    <div className="nb-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text)', fontSize: 18 }}>{t('Загрузка...')}</div>
    </div>
  )

  const unlocked = ACHIEVEMENTS.filter(a => profile && a.check(profile, stats))
  const locked = ACHIEVEMENTS.filter(a => !profile || !a.check(profile, stats))
  const categories = [...new Set(ACHIEVEMENTS.map(a => a.category))]

  return (
    <div className="nb-root" style={{ minHeight: '100vh', color: 'var(--text)', padding: '1.5rem', paddingBottom: 80 }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>{t('🏅 Достижения')}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 14 }}>{t('{a} из {b} получено', { a: unlocked.length, b: ACHIEVEMENTS.length })}</p>

        {/* Прогресс */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: 'var(--muted)' }}>{t('Общий прогресс')}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{unlocked.length} / {ACHIEVEMENTS.length}</span>
          </div>
          <div style={{ background: 'var(--bg)', borderRadius: 999, height: 8 }}>
            <div style={{ height: '100%', width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%`, background: 'var(--accent)', borderRadius: 999, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Статистика */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 24 }}>
          {[
            { val: stats.topics, label: t('тем'), color: 'var(--accent)' },
            { val: stats.homeworkDone, label: t('домашек'), color: 'var(--accent)' },
          ].map(({ val, label, color }) => (
            <div key={label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '12px 8px', border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
              <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* По категориям */}
        {categories.map(cat => {
          const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat)
          const catUnlocked = catAchievements.filter(a => profile && a.check(profile, stats))
          const color = CATEGORY_COLORS[cat] || 'var(--accent)'
          return (
            <div key={cat} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color, margin: 0 }}>{t(cat).toUpperCase()}</h2>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>{catUnlocked.length}/{catAchievements.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {catAchievements.map(a => {
                  const done = profile && a.check(profile, stats)
                  return (
                    <div key={a.id} style={{
                      background: done ? `color-mix(in srgb, ${color} 8%, var(--surface))` : 'var(--surface)',
                      border: `1px solid ${done ? `color-mix(in srgb, ${color} 40%, transparent)` : 'var(--line)'}`,
                      borderRadius: 14, padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 14,
                      opacity: done ? 1 : 0.45,
                    }}>
                      <div style={{ fontSize: 32, flexShrink: 0, filter: done ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: done ? 'var(--text)' : 'var(--muted)' }}>{t(a.title)}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{t(a.desc)}</div>
                      </div>
                      <div style={{ fontSize: 18 }}>{done ? '✅' : '🔒'}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}
