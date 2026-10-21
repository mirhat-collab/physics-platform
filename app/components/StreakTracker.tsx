'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getActualGrade } from '@/lib/grade-match'
import { kzDate, nextStreak } from '@/lib/streak'

export default function StreakTracker() {
  useEffect(() => {
    let mounted = true

    async function updateStreak() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return

      const today = kzDate()
      const { data: profile } = await supabase
        .from('profiles').select('streak, last_visit, grade, role').eq('id', user.id).single()
      if (!profile || !mounted) return

      // Если уже обновляли сегодня — ничего не делаем
      if (profile.last_visit === today) return

      const newStreak = nextStreak(profile.last_visit, profile.streak)

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
