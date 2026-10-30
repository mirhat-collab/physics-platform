import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

// Живые цифры для главной: сколько учеников, решённых заданий и пробных ЕНТ.
// Только общие количества — никаких имён и личных данных.
// CDN Vercel держит ответ 10 минут, чтобы не дёргать базу на каждый заход.

const CACHE = 'public, s-maxage=600, stale-while-revalidate=3600'

export async function GET() {
  try {
    const db = createSupabaseAdmin()
    const [students, attempts, answers] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      db.from('ent_attempts').select('*', { count: 'exact', head: true }),
      db.from('answer_log').select('*', { count: 'exact', head: true }),
    ])
    return NextResponse.json({
      stats: { students: students.count ?? 0, mockExams: attempts.count ?? 0, answers: answers.count ?? 0 },
    }, { headers: { 'Cache-Control': CACHE } })
  } catch {
    // Нет ключа или база недоступна — главная просто не покажет эти блоки
    return NextResponse.json({ stats: null }, { headers: { 'Cache-Control': 'public, s-maxage=60' } })
  }
}
