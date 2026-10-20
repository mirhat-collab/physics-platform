'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getActualGrade } from '@/lib/grade-match'

export default function StreakTracker() {
  useEffect(() => {
    let mounted = true

    async function updateStreak() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return

      const today = new Date().toISOString().split('T')[0]
      const { data: profile } = await supabase
        .from('profiles').select('streak, last_visit, grade, role').eq('id', user.id).single()
      if (!profile || !mounted) return

      // Если уже обновляли сегодня — ничего не делаем
      if (profile.last_visit === today) return

      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const newStreak = profile.last_visit === yesterday
        ? (profile.streak || 0) + 1
        : 1

      if (!mounted) return
      await supabase.from('profiles').update({
        last_visit: today,
        streak: newStreak,
        ...(profile.role === 'student' ? { grade: getActualGrade(profile.grade || '', profile.last_visit) } : {}),
      }).eq('id', user.id)
    }

    updateStreak()
    return () => { mounted = false }
  }, [])

  return null
}
