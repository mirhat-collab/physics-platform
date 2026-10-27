'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Ссылка из письма «сброс пароля» может привести на любую страницу (например,
// на главную, если адрес /reset-password не добавлен в настройки Supabase).
// Supabase сообщает о входе по такой ссылке событием PASSWORD_RECOVERY —
// тогда ведём на страницу нового пароля.
export default function RecoveryRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY' && pathname !== '/reset-password') router.replace('/reset-password')
    })
    return () => data.subscription.unsubscribe()
  }, [router, pathname])
  return null
}
