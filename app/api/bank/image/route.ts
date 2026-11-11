import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireStaff } from '@/lib/admin-auth'
import { BANK_IMAGE_BUCKET } from '@/lib/bank-image'

const EXT = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']

// Рисунок к задаче банка: выдаём подписанную ссылку, браузер грузит файл
// прямо в Supabase Storage (в обход лимита Vercel на размер запроса)
export async function POST(req: NextRequest) {
  const denied = await requireStaff()
  if (denied) return denied
  const { name } = await req.json().catch(() => ({ name: null }))
  const ext = typeof name === 'string' && name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  if (!EXT.includes(ext)) return NextResponse.json({ error: 'Нужна картинка: PNG, JPG, WEBP, GIF или SVG' }, { status: 400 })
  const path = `bank/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin.storage.from(BANK_IMAGE_BUCKET).createSignedUploadUrl(path)
    if (error || !data) throw error || new Error('no signed url')
    const { data: urlData } = admin.storage.from(BANK_IMAGE_BUCKET).getPublicUrl(path)
    return NextResponse.json({ token: data.token, path, url: urlData.publicUrl })
  } catch (err) {
    console.error('Bank image upload:', err)
    return NextResponse.json({ error: 'Не удалось подготовить загрузку файла' }, { status: 500 })
  }
}
