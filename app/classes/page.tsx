import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const gradeColors: Record<string, { bg: string; accent: string; icon: string }> = {
  '7th Grade': { bg: 'linear-gradient(135deg, #667eea, #764ba2)', accent: '#a78bfa', icon: '🔬' },
  '8th Grade': { bg: 'linear-gradient(135deg, #f093fb, #f5576c)', accent: '#fb7185', icon: '⚡' },
  '9th Grade': { bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', accent: '#38bdf8', icon: '🌊' },
  '10th Grade': { bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', accent: '#34d399', icon: '⚗️' },
  '11th Grade': { bg: 'linear-gradient(135deg, #fa709a, #fee140)', accent: '#fbbf24', icon: '🚀' },
}

export default async function ClassesPage() {
  const { data: classes } = await supabase.from('classes').select('*')
  return (
    <>
      <style>{`
        .class-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .class-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 24px 48px rgba(0,0,0,0.5);
          border-color: #4a4a6e !important;
        }
        .class-card:active {
          transform: translateY(-4px) scale(1.01);
        }
      `}</style>
      <main style={{ minHeight: '100vh', padding: '2rem', background: '#0f0f1a' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            ⚡ Классы физики
          </h1>
          <p style={{ color: '#888', marginBottom: 40, fontSize: '1.1rem' }}>
            Выбери свой класс и начни изучать
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {classes?.map((cls) => {
              const s = gradeColors[cls.name] ?? { bg: 'linear-gradient(135deg, #667eea, #764ba2)', accent: '#a78bfa', icon: '📚' }
              return (
                <Link key={cls.id} href={`/classes/${cls.id}`} style={{ textDecoration: 'none' }}>
                  <div className="class-card" style={{ background: '#1a1a2e', borderRadius: 16, overflow: 'hidden', border: '1px solid #2a2a3e', cursor: 'pointer' }}>
                    <div style={{ background: s.bg, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '2.5rem' }}>{s.icon}</span>
                      <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {cls.total_topics} тем
                      </span>
                    </div>
                    <div style={{ padding: '1.2rem' }}>
                      <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
                        {cls.name}
                      </h2>
                      <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: 1.6 }}>
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