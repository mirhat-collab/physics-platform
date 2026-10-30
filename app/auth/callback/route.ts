import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

// Возврат после входа через Google / Apple: меняем одноразовый код на сессию
// и ведём в кабинет по роли. Новому ученику без класса — сначала выбрать класс.
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const login = new URL('/login', url.origin)
  if (!code) {
    login.searchParams.set('oauth_error', url.searchParams.get('error_description') || 'no_code')
    return NextResponse.redirect(login)
  }

  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    login.searchParams.set('oauth_error', error?.message || 'no_user')
    return NextResponse.redirect(login)
  }

  const { data: profile } = await supabase.from('profiles').select('role, grade').eq('id', data.user.id).single()
  const role = profile?.role
  const path = role === 'admin' ? '/admin'
    : role === 'teacher' ? '/teacher'
    : role === 'parent' ? '/parent'
    : !profile?.grade ? '/profile'
    : '/dashboard'
  return NextResponse.redirect(new URL(path, url.origin))
}
