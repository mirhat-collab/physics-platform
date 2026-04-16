import { NextRequest, NextResponse } from 'next/server'

// Rate limiting: максимум 10 попыток с одного IP за 15 минут
const attempts = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()

  const attempt = attempts.get(ip)
  if (attempt && now < attempt.resetAt) {
    if (attempt.count >= 10) {
      return NextResponse.json({ valid: false }, { status: 429 })
    }
    attempt.count++
  } else {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
  }

  // Задержка против перебора
  await new Promise(r => setTimeout(r, 200))

  try {
    const { code } = await req.json()
    if (code && code === process.env.TEACHER_PASSWORD) {
      attempts.delete(ip)
      return NextResponse.json({ valid: true })
    }
  } catch {}

  return NextResponse.json({ valid: false })
}
