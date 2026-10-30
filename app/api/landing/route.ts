import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

// Живые данные для главной: топ-3 учеников по XP и честные цифры.
// Только агрегаты и «Имя Ф.» — без почты и прочих личных данных.
// CDN Vercel держит ответ 10 минут, чтобы не дёргать базу на каждый заход.

const CACHE = 'public, s-maxage=600, stale-while-revalidate=3600'

// «Айгерим Сапарова» → «Айгерим С.»
function shortName(full: string | null): string {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  return parts[1] ? `${parts[0]} ${parts[1][0].toUpperCase()}.` : parts[0]
}

export async function GET() {
  try {
    const db = createSupabaseAdmin()
    const [top, students, attempts, answers] = await Promise.all([
      db.from('profiles').select('full_name, grade, total_xp').eq('role', 'student').gt('total_xp', 0)
        .order('total_xp', { ascending: false }).limit(3),
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      db.from('ent_attempts').select('*', { count: 'exact', head: true }),
      db.from('answer_log').select('*', { count: 'exact', head: true }),
    ])
    return NextResponse.json({
      top: (top.data || []).map(p => ({ name: shortName(p.full_name), grade: p.grade || '', xp: p.total_xp || 0 })),
      stats: { students: students.count ?? 0, mockExams: attempts.count ?? 0, answers: answers.count ?? 0 },
    }, { headers: { 'Cache-Control': CACHE } })
  } catch {
    // Нет ключа или база недоступна — главная просто не покажет эти блоки
    return NextResponse.json({ top: [], stats: null }, { headers: { 'Cache-Control': 'public, s-maxage=60' } })
  }
}
