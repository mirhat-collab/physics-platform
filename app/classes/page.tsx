import { createSupabaseServer } from '../../lib/supabase-server'
import { gradeVariants } from '../../lib/grade-match'
import Link from 'next/link'

const gradeColors: Record<string, { bg: string; accent: string; icon: string }> = {
  '7th Grade': { bg: 'linear-gradient(135deg, #667eea, #764ba2)', accent: '#a78bfa', icon: '🔬' },
  '8th Grade': { bg: 'linear-gradient(135deg, #f093fb, #f5576c)', accent: '#fb7185', icon: '⚡' },
  '9th Grade': { bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', accent: '#38bdf8', icon: '🌊' },
  '10th Grade': { bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', accent: '#34d399', icon: '⚗️' },
  '11th Grade': { bg: 'linear-gradient(135deg, #fa709a, #fee140)', accent: '#fbbf24', icon: '🚀' },
}

export default async function ClassesPage() {
  const supabase = await createSupabaseServer()
  const { data: classes } = await supabase.from('classes').select('*')
  const { data: topics } = await supabase.from('topics').select('grade')
  const topicCount = (grade: string) => topics?.filter(t => gradeVariants(grade).includes(t.grade)).length ?? 0
  return (
    <>
      <style>{`
        .class-card {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .class-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
          border-color: rgba(255,255,255,0.16) !important;
        }
        .class-card:active {
          transform: translateY(-2px) scale(0.99);
        }
      `}</style>
      <main style={{ minHeight: '100vh', padding: '2rem' }}>
        <div className="animate-fade-in-up" style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            ⚡ Классы физики
          </h1>
          <p style={{ color: 'var(--c-text-dim)', marginBottom: 36, fontSize: '1.05rem' }}>
            Выбери свой класс и начни изучать
          </p>
          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {classes?.map((cls) => {
              const s = gradeColors[cls.name] ?? { bg: 'linear-gradient(135deg, #667eea, #764ba2)', accent: '#a78bfa', icon: '📚' }
              return (
                <Link key={cls.id} href={`/classes/${cls.id}`} style={{ textDecoration: 'none' }}>
                  <div className="class-card glass-card" style={{ overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ background: s.bg, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '2.5rem' }}>{s.icon}</span>
                      <span className="pill" style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}>
                        {topicCount(cls.name)} тем
                      </span>
                    </div>
                    <div style={{ padding: '1.2rem' }}>
                      <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
                        {cls.name}
                      </h2>
                      <p style={{ color: 'var(--c-text-dim)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {cls.program}
                      </p>
                      <div style={{ marginTop: 16, color: s.accent, fontSize: '0.9rem', fontWeight: 600 }}>
                        Открыть класс →
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </>
  )
}