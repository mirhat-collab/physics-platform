import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// Подписанный токен вида "expiresAt.hmac" — не требует общей памяти между
// serverless-функциями (в отличие от Map в памяти процесса, которая не
// шарится между инстансами на Vercel).
const TTL_MS = 8 * 60 * 60 * 1000 // 8 часов

function secret(): string {
  const s = process.env.ADMIN_PASSWORD
  if (!s) throw new Error('Не задана переменная окружения ADMIN_PASSWORD')
  return s
}

export function signAdminToken(): string {
  const expiresAt = Date.now() + TTL_MS
  const sig = createHmac('sha256', secret()).update(String(expiresAt)).digest('hex')
  return `${expiresAt}.${sig}`
}

export function verifyAdminToken(token: string | null): boolean {
  if (!token) return false
  const [expiresAtStr, sig] = token.split('.')
  if (!expiresAtStr || !sig) return false
  const expiresAt = Number(expiresAtStr)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false

  const expectedSig = createHmac('sha256', secret()).update(expiresAtStr).digest('hex')
  const a = Buffer.from(sig, 'hex')
  const b = Buffer.from(expectedSig, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  const token = req.headers.get('x-admin-token')
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }
  return null
}
