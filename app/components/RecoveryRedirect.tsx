'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PENDING_JOIN, joinPath } from '@/lib/groups'

// Ссылка из письма «сброс пароля» может привести на любую страницу (например,
// на главную, если адрес /reset-password не добавлен в настройки Supabase).
// Supabase сообщает о входе по такой ссылке событием PASSWORD_RECOVERY —
// тогда ведём на страницу нового пароля.
// Так же после регистрации по приглашению в группу (подтверждение почты
// открывает главную) возвращаем ученика на страницу приглашения.
export default function RecoveryRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && pathname !== '/reset-password') { router.replace('/reset-password'); return }
      if (!session || pathname.startsWith('/join/') || pathname === '/reset-password') return
      let code: string | null = null
      try { code = localStorage.getItem(PENDING_JOIN) } catch { /* нет доступа к storage */ }
      if (code) router.replace(joinPath(code))
    })
    return () => data.subscription.unsubscribe()
  }, [router, pathname])
  return null
}
