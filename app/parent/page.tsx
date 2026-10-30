'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { gradeLabel } from '@/lib/grade-match'
import { useT } from '@/app/components/LanguageProvider'
import { useTranslatedNames } from '@/app/components/useTranslatedNames'

type Student = { id: string; full_name: string; email?: string; grade: string; total_xp: number; streak: number }
type Progress = { topic: string; completed_at: string; name?: string }

export default function ParentPage() {
  const { t, dateLocale } = useT()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [progress, setProgress] = useState<Progress[]>([])
  const [linkEmail, setLinkEmail] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkMsg, setLinkMsg] = useState('')

  const topicName = useTranslatedNames('topic', progress.filter(p => p.name).map(p => p.topic))
  useEffect(() => { loadData() }, [])

  // Живые обновления: XP/стрик ученика и новые пройденные темы — без
  // перезагрузки страницы.
  useEffect(() => {
    if (students.length === 0) return
    const ids = students.map(s => s.id)

    const channel = supabase
      .channel('parent-live-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        const updated = payload.new as Student
        if (!ids.includes(updated.id)) return
        setStudents(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'progress' }, payload => {
        const row = payload.new as { student: string; topic: string; status: string; completed_at: string }
        if (row.status !== 'completed' || selectedStudent?.id !== row.student) return
        setProgress(prev => [{ topic: row.topic, completed_at: row.completed_at }, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [students, selectedStudent])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const { data: links } = await supabase.from('parent_links').select('student_id').eq('parent_id', user.id)
    if (links && links.length > 0) {
      const ids = links.map(l => l.student_id)
      const { data: studs } = await supabase.from('profiles').select('id, full_name, grade, total_xp, streak, role').in('id', ids)
      if (studs) setStudents(studs)
    }
    setLoading(false)
  }

  async function linkStudent() {
    if (!linkEmail.trim()) return
    setLinking(true)
    setLinkMsg('')
    // Чужие профили родителю не видны — ищем одного ученика по точной почте
    const { data: found } = await supabase.rpc('find_student_by_email', { p_email: linkEmail.trim() })
    const student = ((found || []) as Student[])[0] ?? null
    if (!student) { setLinkMsg(t('❌ Ученик с таким email не найден')); setLinking(false); return }
    const { data: existing } = await supabase.from('parent_links').select('id').eq('parent_id', userId).eq('student_id', student.id).maybeSingle()
    if (existing) { setLinkMsg(t('Этот ученик уже привязан')); setLinking(false); return }
    await supabase.from('parent_links').insert({ parent_id: userId, student_id: student.id })
    setStudents([...students, student])
    setLinkEmail('')
    setLinkMsg(t('✅ Ученик успешно привязан!'))
    setLinking(false)
    setTimeout(() => setLinkMsg(''), 3000)
  }

  async function loadProgress(student: Student) {
    setSelectedStudent(student)
    const { data } = await supabase.from('progress').select('topic, completed_at').eq('student', student.id).eq('status', 'completed').order('completed_at', { ascending: false })
    if (!data) return
    // В progress лежит только id темы — подтягиваем названия, чтобы не показывать «Тема #75»
    const ids = [...new Set(data.map(p => Number(p.topic)).filter(Number.isFinite))]
    const { data: topics } = ids.length ? await supabase.from('topics').select('id, name').in('id', ids) : { data: [] }
    const names = new Map((topics || []).map(t => [String(t.id), t.name as string]))
    setProgress(data.map(p => ({ ...p, name: names.get(String(p.topic)) })))
  }

  if (loading) return (
    <div className="nb-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text)' }}>{t('Загрузка...')}</div>
    </div>
  )

  const level = (xp: number) => Math.floor(xp / 100) + 1

  return (
    <div className="nb-root" style={{ minHeight: '100vh', color: 'var(--text)', padding: '2rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '24px', marginBottom: 24, border: '1px solid var(--line)' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px' }}>{t('👨‍👩‍👧 Родительский доступ')}</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>{t('Следи за успехами своего ребёнка')}</p>
        </div>

        {/* Привязать ученика */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '20px', border: '1px solid var(--line)', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 14px', fontWeight: 700 }}>{t('🔗 Привязать ученика')}</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={linkEmail} onChange={e => setLinkEmail(e.target.value)}
              placeholder={t('Email ученика')}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none' }}
            />
            <button onClick={linkStudent} disabled={linking || !linkEmail.trim()}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'var(--on-accent)', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}>
              {linking ? '...' : t('Привязать')}
            </button>
          </div>
          {linkMsg && <div style={{ marginTop: 10, fontSize: 13, color: linkMsg.startsWith('✅') ? 'var(--good)' : 'var(--bad)' }}>{linkMsg}</div>}
          <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>{t('Введи email который ученик использовал при регистрации')}</p>
        </div>

        {/* Список привязанных учеников */}
        {students.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👶</div>
            {t('Привяжи ученика чтобы видеть его прогресс')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {students.map(s => (
              <div key={s.id}>
                <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${selectedStudent?.id === s.id ? 'color-mix(in srgb, var(--accent) 33%, transparent)' : 'var(--line)'}`, cursor: 'pointer' }}
                  onClick={() => selectedStudent?.id === s.id ? setSelectedStudent(null) : loadProgress(s)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {(s.full_name || t('Без имени')).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{s.full_name || t('Без имени')}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{gradeLabel(s.grade, t)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                      <div><div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 18 }}>{s.total_xp}</div><div style={{ color: 'var(--muted)', fontSize: 11 }}>XP</div></div>
                      <div><div style={{ fontWeight: 800, color: 'var(--good)', fontSize: 18 }}>{level(s.total_xp)}</div><div style={{ color: 'var(--muted)', fontSize: 11 }}>{t('Уровень')}</div></div>
                      <div><div style={{ fontWeight: 800, color: 'var(--warn)', fontSize: 18 }}>🔥{s.streak}</div><div style={{ color: 'var(--muted)', fontSize: 11 }}>{t('дней')}</div></div>
                    </div>
                  </div>
                </div>

                {selectedStudent?.id === s.id && (
                  <div style={{ background: 'var(--surface)', borderRadius: '0 0 16px 16px', padding: '16px 20px', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderTop: 'none', marginTop: -4 }}>
                    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, color: 'var(--muted)' }}>{t('Пройденные темы (')}{progress.length}):</div>
                    {progress.length === 0 ? (
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('Пока не прошёл ни одной темы')}</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {progress.slice(0, 10).map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
                            <span style={{ color: 'var(--text)' }}>✅ {p.name ? topicName(p.topic, p.name) : t('Тема #{topic}', { topic: p.topic })}</span>
                            <span style={{ color: 'var(--muted)' }}>{new Date(p.completed_at).toLocaleDateString(dateLocale)}</span>
                          </div>
                        ))}
                        {progress.length > 10 && <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>{t('и ещё')} {progress.length - 10} {t('тем...')}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ marginTop: 32, width: '100%', padding: '14px', borderRadius: 14, border: '1px solid color-mix(in srgb, var(--bad) 20%, transparent)', background: 'var(--surface)', color: 'var(--bad)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {t('🚪 Выйти')}
        </button>
      </div>
    </div>
  )
}
