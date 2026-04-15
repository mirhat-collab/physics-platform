'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Profile = { id: string; full_name: string; email: string; grade: string; total_xp: number; streak: number }

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (p) { setProfile(p); setNewName(p.full_name || '') }
    setLoading(false)
  }

  async function saveName() {
    if (!profile || !newName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: newName.trim() }).eq('id', profile.id)
    if (error) {
      setMsg('❌ Ошибка: ' + error.message)
      setSaving(false)
      setTimeout(() => setMsg(''), 5000)
      return
    }
    setProfile({ ...profile, full_name: newName.trim() })
    setEditing(false)
    setSaving(false)
    setMsg('✅ Имя сохранено!')
    setTimeout(() => setMsg(''), 3000)
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

  const level = Math.floor((profile?.total_xp || 0) / 100) + 1
  const xpInLevel = (profile?.total_xp || 0) % 100
  const initials = (profile?.full_name || profile?.email || '?').slice(0, 2).toUpperCase()

  const input: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1px solid #2a2a3e', background: '#0f0f1a',
    color: '#fff', fontSize: 15, boxSizing: 'border-box', outline: 'none'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: '1.5rem' }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 24 }}>👤 Профиль</h1>

        {/* Аватар и имя */}
        <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 24, padding: '32px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, margin: '0 auto 16px' }}>
            {initials}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>
            {profile?.full_name || 'Без имени'}
          </div>
          <div style={{ opacity: 0.8, fontSize: 14 }}>{profile?.email}</div>
          <div style={{ opacity: 0.8, fontSize: 14, marginTop: 4 }}>{profile?.grade} класс · Уровень {level}</div>
        </div>

        {/* Статистика */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 16, border: '1px solid #2a2a3e', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#a78bfa' }}>{profile?.total_xp}</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>Всего XP</div>
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 16, border: '1px solid #2a2a3e', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b' }}>🔥{profile?.streak}</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>Дней подряд</div>
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 16, border: '1px solid #2a2a3e', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981' }}>{level}</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>Уровень</div>
          </div>
        </div>

        {/* XP прогресс */}
        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '16px 20px', marginBottom: 20, border: '1px solid #2a2a3e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: '#888' }}>До уровня {level + 1}</span>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>{xpInLevel} / 100 XP</span>
          </div>
          <div style={{ background: '#0f0f1a', borderRadius: 999, height: 8 }}>
            <div style={{ height: '100%', width: `${xpInLevel}%`, background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 999 }} />
          </div>
        </div>

        {/* Достижения */}
        <Link href="/achievements" style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🏅</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Достижения</div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Твои награды и значки</div>
              </div>
            </div>
            <span style={{ color: '#555', fontSize: 20 }}>→</span>
          </div>
        </Link>

        {/* Редактировать имя */}
        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', marginBottom: 20, border: '1px solid #2a2a3e' }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>✏️ Изменить имя</div>
          {editing ? (
            <div>
              <input style={input} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Твоё имя" />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={saveName} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#43e97b', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  {saving ? 'Сохраняю...' : '💾 Сохранить'}
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#2a2a3e', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #2a2a3e', background: '#0f0f1a', color: '#a78bfa', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Изменить имя
            </button>
          )}
          {msg && <div style={{ color: '#4ade80', fontSize: 13, marginTop: 8 }}>{msg}</div>}
        </div>

        {/* Выйти */}
        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid #f5576c33', background: '#2d1a1a', color: '#f5576c', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
        >
          🚪 Выйти из аккаунта
        </button>

      </div>
    </div>
  )
}