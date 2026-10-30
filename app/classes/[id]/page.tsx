'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { gradeVariants } from '@/lib/grade-match'
import { sortTopicsByNumber } from '@/lib/topic-order'
import { useT } from '@/app/components/LanguageProvider'
import { useTranslatedNames } from '@/app/components/useTranslatedNames'

type Topic = { id: string; name: string; theory: string; grade: string }
type ClassData = { id: string; name: string; program: string; total_topics: number }

export default function ClassPage() {
  const { t } = useT()
  const { id } = useParams()
  const router = useRouter()
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [completed, setCompleted] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)
  const topicName = useTranslatedNames('topic', topics.map(t => t.id))
  const className = useTranslatedNames('class', classData ? [classData.id] : [])

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // RLS прячет закрытые классы от учеников без доступа — cls будет null,
    // если класс закрыт и ученику доступ не выдан.
    const { data: cls } = await supabase.from('classes').select('*').eq('id', id).single()
    if (!cls) { setClassData(null); setLoading(false); return }
    setClassData(cls)

    const { data: t } = await supabase.from('topics').select('*').in('grade', gradeVariants(cls.name))
    if (t) setTopics(sortTopicsByNumber(t))

    const { data: prog } = await supabase
      .from('progress').select('topic')
      .eq('student', user.id).eq('status', 'completed')
    // progress.topic хранится текстом, а topics.id — число: сравниваем строками
    if (prog) setCompleted(prog.map(p => String(p.topic)))

    setLoading(false)
  }

  if (loading) return (
    <div className="nb-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text)', fontSize: 18 }}>{t('Загрузка...')}</div>
    </div>
  )

  if (!classData) return (
    <div className="nb-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 24, padding: 48, width: '100%', maxWidth: 400, border: '1px solid var(--line)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ color: 'var(--text)', fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>{t('Класс закрыт')}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 14 }}>{t('У тебя нет доступа к этому классу. Обратись к администратору.')}</p>
        <Link href="/classes" style={{ display: 'inline-block', width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: 12, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>{t('← Все классы')}</Link>
      </div>
    </div>
  )

  const doneCount = topics.filter(t => completed.includes(String(t.id))).length
  const percent = topics.length > 0 ? Math.round((doneCount / topics.length) * 100) : 0

  return (
    <div className="nb-root" style={{ minHeight: '100vh', color: 'var(--text)', padding: '2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <Link href="/classes" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          {t('← Все классы')}
        </Link>

        {/* Шапка класса */}
        <div style={{ background: 'var(--accent)', borderRadius: 24, padding: '32px 36px', marginBottom: 28 }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>{classData ? className(classData.id, classData.program) : ''}</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 20px' }}>{t(classData?.name ?? '')}</h1>

          {/* Прогресс бар */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.9, marginBottom: 8 }}>
            <span>{t('Прогресс')}</span>
            <span>{doneCount} / {topics.length} {t('тем')}</span>
          </div>
          <div style={{ background: 'color-mix(in srgb, var(--text) 20%, transparent)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: 'var(--text)', borderRadius: 999, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>{percent}{t('% завершено')}</div>
        </div>

        {/* Список тем */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>{t('📚 Темы')}</h2>

        {topics.length === 0 && (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>{t('Темы ещё не добавлены')}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topics.map((topic, index) => {
            const isDone = completed.includes(String(topic.id))
            const isHov = hovered === topic.id
            return (
              <Link key={topic.id} href={`/topics/${topic.id}`} style={{ textDecoration: 'none' }}>
                <div
                  onMouseEnter={() => setHovered(topic.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: isHov ? 'var(--surface)' : 'var(--surface)',
                    border: `1px solid ${isDone ? 'var(--good)' : 'var(--line)'}`,
                    borderLeft: `4px solid ${isDone ? 'var(--good)' : 'var(--accent)'}`,
                    borderRadius: 16, padding: '18px 22px',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transform: isHov ? 'translateX(4px)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isDone ? 'var(--good)' : 'var(--line)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, flexShrink: 0,
                      color: isDone ? 'var(--on-accent)' : 'var(--muted)',
                    }}>
                      {isDone ? '✓' : index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: isDone ? 'var(--good)' : 'var(--text)' }}>
                        {topicName(topic.id, topic.name)}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>
                        {topic.theory?.slice(0, 60)}...
                      </div>
                    </div>
                  </div>
                  <div style={{ color: isDone ? 'var(--good)' : 'var(--muted)', fontSize: 20, flexShrink: 0 }}>
                    {isDone ? '✅' : '→'}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  )
}