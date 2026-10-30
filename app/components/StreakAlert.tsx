'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { kzDate } from '@/lib/streak'
import { useT } from '@/app/components/LanguageProvider'

export default function StreakAlert() {
  const { t } = useT()
  const [show, setShow] = useState(false)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    checkStreak()
  }, [])

  async function checkStreak() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('streak, last_visit').eq('id', user.id).single()
    if (!profile || !profile.last_visit || profile.streak < 2) return

    const today = kzDate()
    const yesterday = kzDate(1)

    // Показываем если последний визит был вчера (стрик под угрозой если не зайдёт сегодня)
    // Но раз они зашли — значит стрик уже обновлён StreakTracker'ом
    // Покажем если last_visit НЕ сегодня (ещё не обновился)
    const dismissed = sessionStorage.getItem('streakAlertDismissed')
    if (dismissed) return

    if (profile.last_visit !== today && profile.last_visit === yesterday) {
      setStreak(profile.streak)
      setShow(true)
    }
  }

  function dismiss() {
    setShow(false)
    sessionStorage.setItem('streakAlertDismissed', '1')
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, background: 'var(--warn)',
      borderRadius: 16, padding: '14px 20px', display: 'flex',
      alignItems: 'center', gap: 12, boxShadow: '0 8px 32px color-mix(in srgb, var(--warn) 40%, transparent)',
      maxWidth: 360, width: '90%', animation: 'slideDown 0.4s ease'
    }}>
      <span style={{ fontSize: 28 }}>🔥</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 14 }}>{t('Стрик')} {streak} {t('дней!')}</div>
        <div style={{ color: 'color-mix(in srgb, var(--text) 85%, transparent)', fontSize: 12 }}>{t('Заходи каждый день чтобы не потерять')}</div>
      </div>
      <button onClick={dismiss} style={{
        background: 'color-mix(in srgb, var(--text) 20%, transparent)', border: 'none', borderRadius: 8,
        color: 'var(--text)', cursor: 'pointer', padding: '4px 8px', fontSize: 14
      }}>✕</button>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-20px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
    </div>
  )
}
