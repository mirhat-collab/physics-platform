import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

// Управляет class_access — точечными разрешениями для закрытых классов.
// RLS на class_access отдаёт ученику только его собственные записи, поэтому
// список всех выданных доступов для класса читаем через service role, как
// и остальную запись в admin-панели.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const classId = new URL(req.url).searchParams.get('class_id')
    if (!classId) return NextResponse.json({ error: 'Не указан id класса' }, { status: 400 })
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .from('class_access')
      .select('id, student_id, created_at, profiles:student_id ( id, email, full_name, display_name )')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ access: data })
  } catch (err) {
    console.error('Admin class-access GET error:', err)
    return NextResponse.json({ error: 'Не удалось получить список доступа' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const body = await req.json().catch(() => null)
    if (!body?.class_id || !body?.student_id) {
      return NextResponse.json({ error: 'Не указан класс или ученик' }, { status: 400 })
    }
    const admin = createSupabaseAdmin()
    const { error } = await admin
      .from('class_access')
      .upsert({ class_id: body.class_id, student_id: body.student_id }, { onConflict: 'class_id,student_id' })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Admin class-access POST error:', err)
    return NextResponse.json({ error: 'Не удалось выдать доступ' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Не указан id записи доступа' }, { status: 400 })
    const admin = createSupabaseAdmin()
    const { error } = await admin.from('class_access').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Admin class-access DELETE error:', err)
    return NextResponse.json({ error: 'Не удалось убрать доступ' }, { status: 500 })
  }
}
