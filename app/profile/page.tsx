'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ThemeToggle from '@/app/components/ThemeToggle'

type Profile = { id: string; full_name: string; email: string; grade: string; total_xp: number; streak: number; avatar_url?: string }

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarHover, setAvatarHover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (p) {
      setProfile(p)
      setNewName(p.full_name || '')
      setAvatarUrl(p.avatar_url || null)
    }
    setLoading(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setAvatarUploading(true)
    setMsg('')

    const userId = profile.id

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(userId + '.jpg', file, { upsert: true })

    if (uploadError) {
      setMsg('❌ Ошибка загрузки: ' + uploadError.message)
      setAvatarUploading(false)
      setTimeout(() => setMsg(''), 5000)
      return
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(userId + '.jpg')

    const publicUrl = urlData.publicUrl

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      setMsg('❌ Ошибка сохранения: ' + updateError.message)
      setAvatarUploading(false)
      setTimeout(() => setMsg(''), 5000)
      return
    }

    // Bust cache by appending timestamp so the browser fetches the new image
    setAvatarUrl(publicUrl + '?t=' + Date.now())
    setProfile({ ...profile, avatar_url: publicUrl })
    setAvatarUploading(false)
    setMsg('✅ Фото обновлено!')
    setTimeout(() => setMsg(''), 3000)
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    <div style={{ minHeight: '100vh', color: '#fff', padding: '1.5rem' }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>👤 Профиль</h1>
          <ThemeToggle />
        </div>

        {/* Аватар и имя */}
        <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 24, padding: '32px', marginBottom: 20, textAlign: 'center' }}>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />

          {/* Clickable avatar circle */}
          <div
            onClick={() => !avatarUploading && fileInputRef.current?.click()}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            style={{
              position: 'relative',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 800,
              margin: '0 auto 16px',
              cursor: avatarUploading ? 'wait' : 'pointer',
              overflow: 'hidden',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              initials
            )}

            {/* Camera overlay on hover or while uploading */}
            {(avatarHover || avatarUploading) && (
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: avatarUploading ? 14 : 22,
                transition: 'opacity 0.15s',
              }}>
                {avatarUploading ? '...' : '📷'}
              </div>
            )}
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

        {/* Установить приложение */}
        <Link href="/install" style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15))', border: '1px solid rgba(102,126,234,0.3)', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>📲</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Установить приложение</div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Добавь на экран телефона — бесплатно!</div>
              </div>
            </div>
            <span style={{ color: '#667eea', fontSize: 20 }}>→</span>
          </div>
        </Link>

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
