import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken, verifyAdminToken } from '@/lib/admin-token'

// Rate limiting: максимум 5 попыток с одного IP за 15 минут
const attempts = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()

  // Проверка rate limit
  const attempt = attempts.get(ip)
  if (attempt && now < attempt.resetAt) {
    if (attempt.count >= 5) {
      return NextResponse.json({ ok: false }, { status: 429 })
    }
    attempt.count++
  } else {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
  }

  // Задержка против brute-force
  await new Promise(r => setTimeout(r, 300))

  try {
    const { password } = await req.json()
    if (password && password === process.env.ADMIN_PASSWORD) {
      attempts.delete(ip) // Сбрасываем счётчик при успехе
      return NextResponse.json({ ok: true, token: signAdminToken() })
    }
  } catch {}

  return NextResponse.json({ ok: false }, { status: 401 })
}

// Проверка токена
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  return NextResponse.json({ valid: verifyAdminToken(token) })
}
