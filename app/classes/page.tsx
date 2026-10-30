import { createSupabaseServer } from '../../lib/supabase-server'
import { gradeVariants } from '../../lib/grade-match'
import Link from 'next/link'
import { getLocale, getT } from '../../lib/i18n/server'
import { cachedTranslations } from '../../lib/translate'

// Обложки тетрадей: светлый лист с оттенком цвета класса
const gradeColors: Record<string, { bg: string; accent: string; icon: string }> = {
  '7th Grade': { bg: 'color-mix(in srgb, var(--accent) 14%, var(--surface))', accent: 'var(--accent)', icon: '🔬' },
  '8th Grade': { bg: 'color-mix(in srgb, var(--bad) 14%, var(--surface))', accent: 'var(--bad)', icon: '⚡' },
  '9th Grade': { bg: 'color-mix(in srgb, var(--accent) 14%, var(--surface))', accent: 'var(--accent)', icon: '🌊' },
  '10th Grade': { bg: 'color-mix(in srgb, var(--good) 14%, var(--surface))', accent: 'var(--good)', icon: '⚗️' },
  '11th Grade': { bg: 'color-mix(in srgb, var(--warn) 14%, var(--surface))', accent: 'var(--warn)', icon: '🚀' },
}

export default async function ClassesPage() {
  const supabase = await createSupabaseServer()
  const t = await getT()
  const { data: classes } = await supabase.from('classes').select('*')
  const { data: topics } = await supabase.from('topics').select('grade')
  const locale = await getLocale()
  // Описания классов переводит ИИ (при открытии класса); здесь берём готовое из кэша
  const programs = locale !== 'ru' && classes?.length
    ? await cachedTranslations('class_name', classes.map(c => c.id), locale).catch(() => new Map())
    : new Map()
  const topicCount = (grade: string) => topics?.filter(t => gradeVariants(grade).includes(t.grade)).length ?? 0
  return (
    <>
      <style>{`
        .class-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .class-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent) !important;
        }
        .class-card:active {
          transform: translateY(-4px) scale(1.01);
        }
      `}</style>
      <main className="nb-root" style={{ minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            {t('⚡ Классы физики')}
          </h1>
          <p style={{ color: 'var(--muted)', marginBottom: 40, fontSize: '1.1rem' }}>
            {t('Выбери свой класс и начни изучать')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {classes?.map((cls) => {
              const s = gradeColors[cls.name] ?? { bg: 'color-mix(in srgb, var(--accent) 14%, var(--surface))', accent: 'var(--accent)', icon: '📚' }
              return (
                <Link key={cls.id} href={`/classes/${cls.id}`} style={{ textDecoration: 'none' }}>
                  <div className="class-card" style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line)', cursor: 'pointer' }}>
                    <div style={{ background: s.bg, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '2.5rem' }}>{s.icon}</span>
                      <span style={{ background: 'color-mix(in srgb, var(--text) 20%, transparent)', color: 'var(--text)', borderRadius: 20, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {t('{n} тем', { n: topicCount(cls.name) })}
                      </span>
                    </div>
                    <div style={{ padding: '1.2rem' }}>
                      <h2 style={{ color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
                        {t(cls.name)}
                      </h2>
                      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {programs.get(cls.id)?.data.text ?? cls.program}
                      </p>
                      <div style={{ marginTop: 16, color: s.accent, fontSize: '0.9rem', fontWeight: 600 }}>
                        {t('Открыть класс →')}
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