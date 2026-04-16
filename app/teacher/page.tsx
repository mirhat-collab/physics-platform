'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Profile = { id: string; full_name: string; email: string; grade: string; total_xp: number; streak: number; role: string }
type ClassStat = { name: string; students: Profile[]; avg_xp: number; completed_topics: number; total_topics: number }
type Homework = { id: number; title: string; description: string; class_name: string; due_date: string; created_at: string; media_urls?: string[] }
type Submission = { id: number; homework_id: number; student_name: string; answer: string; submitted_at: string; grade: string; media_url?: string }
type Tournament = { id: number; title: string; class_name: string; status: string; ends_at: string; created_at: string }

export default function TeacherPage() {
  const router = useRouter()
  const [teacher, setTeacher] = useState<Profile | null>(null)
  const [students, setStudents] = useState<Profile[]>([])
  const [classStats, setClassStats] = useState<ClassStat[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'students' | 'classes' | 'homework' | 'tournament'>('overview')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  // Домашние задания
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [hwTitle, setHwTitle] = useState('')
  const [hwDesc, setHwDesc] = useState('')
  const [hwClass, setHwClass] = useState('')
  const [hwDue, setHwDue] = useState('')
  const [hwMediaFiles, setHwMediaFiles] = useState<File[]>([])
  const [hwMediaPreviews, setHwMediaPreviews] = useState<string[]>([])
  const [hwUploading, setHwUploading] = useState(false)
  const [savingHw, setSavingHw] = useState(false)
  const [selectedHw, setSelectedHw] = useState<number | null>(null)
  const [gradingId, setGradingId] = useState<number | null>(null)
  const [gradeValue, setGradeValue] = useState('')
  const hwFileRef = useRef<HTMLInputElement>(null)

  // Турниры
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [tTitle, setTTitle] = useState('')
  const [tClass, setTClass] = useState('')
  const [tEnds, setTEnds] = useState('')
  const [savingT, setSavingT] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile || profile.role !== 'teacher') { router.push('/dashboard'); return }
    setTeacher(profile)

    const { data: allStudents } = await supabase.from('profiles').select('*').eq('role', 'student').order('total_xp', { ascending: false })
    if (allStudents) setStudents(allStudents)

    const { data: classes } = await supabase.from('classes').select('*')
    const { data: progress } = await supabase.from('progress').select('*').eq('status', 'completed')
    if (classes && allStudents && progress) {
      const stats: ClassStat[] = classes.map(cls => {
        const clsStudents = allStudents.filter(s => s.grade === cls.name)
        const studentIds = clsStudents.map(s => s.id)
        const clsProgress = progress.filter(p => studentIds.includes(p.student))
        const uniqueTopics = new Set(clsProgress.map(p => p.topic))
        const avgXp = clsStudents.length > 0 ? Math.round(clsStudents.reduce((sum, s) => sum + s.total_xp, 0) / clsStudents.length) : 0
        return { name: cls.name, students: clsStudents, avg_xp: avgXp, completed_topics: uniqueTopics.size, total_topics: cls.total_topics || 0 }
      })
      setClassStats(stats)
    }

    const { data: hw } = await supabase.from('homework').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
    if (hw) setHomeworks(hw)

    const { data: subs } = await supabase.from('homework_submissions').select('*').order('submitted_at', { ascending: false })
    if (subs) setSubmissions(subs)

    const { data: t } = await supabase.from('tournaments').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
    if (t) setTournaments(t)

    setLoading(false)
  }

  function handleHwMedia(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files)
    setHwMediaFiles(prev => [...prev, ...newFiles])
    newFiles.forEach(f => {
      const url = URL.createObjectURL(f)
      setHwMediaPreviews(prev => [...prev, url])
    })
  }

  async function createHomework() {
    if (!hwTitle.trim() || !hwClass || !teacher) return
    setSavingHw(true)

    // Загружаем медиа файлы
    const mediaUrls: string[] = []
    if (hwMediaFiles.length > 0) {
      setHwUploading(true)
      for (const file of hwMediaFiles) {
        const ext = file.name.split('.').pop()
        const path = `homework/${teacher.id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('homework-media').upload(path, file)
        if (!error) {
          const { data: urlData } = supabase.storage.from('homework-media').getPublicUrl(path)
          mediaUrls.push(urlData.publicUrl)
        }
      }
      setHwUploading(false)
    }

    const { data } = await supabase.from('homework').insert({
      title: hwTitle, description: hwDesc, class_name: hwClass,
      due_date: hwDue || null, created_by: teacher.id,
      media_urls: mediaUrls.length > 0 ? mediaUrls : null
    }).select().single()
    if (data) setHomeworks([data, ...homeworks])
    setHwTitle(''); setHwDesc(''); setHwClass(''); setHwDue('')
    setHwMediaFiles([]); setHwMediaPreviews([])
    setSavingHw(false)
  }

  async function gradeSubmission(subId: number) {
    await supabase.from('homework_submissions').update({ grade: gradeValue }).eq('id', subId)
    setSubmissions(submissions.map(s => s.id === subId ? { ...s, grade: gradeValue } : s))
    setGradingId(null); setGradeValue('')
  }

  async function createTournament() {
    if (!tTitle.trim() || !tClass || !teacher) return
    setSavingT(true)
    const { data } = await supabase.from('tournaments').insert({
      title: tTitle, class_name: tClass, status: 'active',
      ends_at: tEnds || null, created_by: teacher.id
    }).select().single()
    if (data) setTournaments([data, ...tournaments])
    setTTitle(''); setTClass(''); setTEnds('')
    setSavingT(false)
  }

  async function endTournament(id: number) {
    await supabase.from('tournaments').update({ status: 'ended' }).eq('id', id)
    setTournaments(tournaments.map(t => t.id === id ? { ...t, status: 'ended' } : t))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  const selectedClassStudents = selectedClass ? students.filter(s => s.grade === selectedClass) : []
  const selectedHwSubs = submissions.filter(s => s.homework_id === selectedHw)
  const classNames = classStats.map(c => c.name)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #2a2a3e',
    background: '#0f0f1a', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none', marginBottom: 10
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff' }}>
      {/* Шапка */}
      <div style={{ background: 'linear-gradient(135deg, #0a2a1a, #0f0f1a)', borderBottom: '1px solid #2a2a3e', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👨‍🏫</div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Панель учителя</h1>
                <p style={{ color: '#888', margin: 0, fontSize: 13 }}>{teacher?.full_name || teacher?.email}</p>
              </div>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#888', cursor: 'pointer', fontSize: 13 }}>
              🚪 Выйти
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { val: students.length, label: 'учеников', color: '#10b981' },
              { val: classStats.length, label: 'классов', color: '#a78bfa' },
              { val: students.length > 0 ? Math.round(students.reduce((s, p) => s + p.total_xp, 0) / students.length) : 0, label: 'средний XP', color: '#f59e0b' },
            ].map(({ val, label, color }) => (
              <div key={label} style={{ background: `rgba(${color === '#10b981' ? '16,185,129' : color === '#a78bfa' ? '167,139,250' : '245,158,11'},0.1)`, border: `1px solid rgba(${color === '#10b981' ? '16,185,129' : color === '#a78bfa' ? '167,139,250' : '245,158,11'},0.2)`, borderRadius: 14, padding: '14px 18px' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 2rem' }}>
        {/* Табы */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'overview', label: '📊 Обзор' },
            { key: 'classes', label: '📚 Классы' },
            { key: 'students', label: '👤 Ученики' },
            { key: 'homework', label: '📝 Домашние задания' },
            { key: 'tournament', label: '🏆 Турниры' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              background: tab === t.key ? '#10b981' : '#1a1a2e', color: '#fff',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ОБЗОР */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {classStats.map(cls => {
              const percent = cls.total_topics > 0 ? Math.round((cls.completed_topics / cls.total_topics) * 100) : 0
              return (
                <div key={cls.name} style={{ background: '#1a1a2e', borderRadius: 16, padding: '18px 22px', border: '1px solid #2a2a3e', cursor: 'pointer' }}
                  onClick={() => { setTab('classes'); setSelectedClass(cls.name) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{cls.name}</div>
                      <div style={{ color: '#888', fontSize: 13 }}>{cls.students.length} учеников · ср. XP: {cls.avg_xp}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: percent >= 75 ? '#10b981' : percent >= 40 ? '#f59e0b' : '#667eea' }}>{percent}%</div>
                      <div style={{ color: '#888', fontSize: 11 }}>{cls.completed_topics}/{cls.total_topics} тем</div>
                    </div>
                  </div>
                  <div style={{ background: '#0f0f1a', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg,#10b981,#059669)', borderRadius: 999 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* КЛАССЫ */}
        {tab === 'classes' && (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {classStats.map(cls => (
                <button key={cls.name} onClick={() => setSelectedClass(cls.name === selectedClass ? null : cls.name)} style={{
                  padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: selectedClass === cls.name ? '#10b981' : '#1a1a2e', color: '#fff',
                }}>{cls.name} ({cls.students.length})</button>
              ))}
            </div>
            {selectedClass && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedClassStudents.length === 0 && <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>В этом классе нет учеников</div>}
                {selectedClassStudents.map((s, i) => (
                  <div key={s.id} style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', border: '1px solid #2a2a3e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                        {(s.full_name || s.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.full_name || s.email}</div>
                        <div style={{ color: '#888', fontSize: 12 }}>{s.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                      <div><div style={{ fontWeight: 700, color: '#a78bfa' }}>{s.total_xp}</div><div style={{ color: '#888', fontSize: 11 }}>XP</div></div>
                      <div><div style={{ fontWeight: 700, color: '#f59e0b' }}>🔥{s.streak}</div><div style={{ color: '#888', fontSize: 11 }}>дней</div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ВСЕ УЧЕНИКИ */}
        {tab === 'students' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {students.map((s, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
              return (
                <div key={s.id} style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', border: '1px solid #2a2a3e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, minWidth: 32 }}>{medal}</span>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                      {(s.full_name || s.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.full_name || s.email}</div>
                      <div style={{ color: '#888', fontSize: 12 }}>{s.grade} класс · {s.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                    <div><div style={{ fontWeight: 700, color: '#a78bfa' }}>{s.total_xp}</div><div style={{ color: '#888', fontSize: 11 }}>XP</div></div>
                    <div><div style={{ fontWeight: 700, color: '#f59e0b' }}>🔥{s.streak}</div><div style={{ color: '#888', fontSize: 11 }}>дней</div></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ДОМАШНИЕ ЗАДАНИЯ */}
        {tab === 'homework' && (
          <div>
            {/* Форма создания */}
            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', border: '1px solid #2a2a3e', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>➕ Новое задание</h3>
              <input style={inputStyle} placeholder="Название задания" value={hwTitle} onChange={e => setHwTitle(e.target.value)} />
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} placeholder="Описание / условие задачи" value={hwDesc} onChange={e => setHwDesc(e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <select style={{ ...inputStyle, marginBottom: 0 }} value={hwClass} onChange={e => setHwClass(e.target.value)}>
                  <option value="">Выбери класс</option>
                  {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input style={{ ...inputStyle, marginBottom: 0 }} type="date" value={hwDue} onChange={e => setHwDue(e.target.value)} />
              </div>

              {/* Загрузка медиа */}
              <input ref={hwFileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={e => handleHwMedia(e.target.files)} />
              <div onClick={() => hwFileRef.current?.click()}
                style={{ border: '2px dashed #2a2a4e', borderRadius: 12, padding: '14px', textAlign: 'center', cursor: 'pointer', color: '#888', fontSize: 13, background: '#0a0a18', marginBottom: 10 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#10b981')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a4e')}>
                📎 Прикрепить фото или видео к заданию
              </div>
              {hwMediaPreviews.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {hwMediaPreviews.map((preview, i) => (
                    <div key={i} style={{ position: 'relative', width: 80, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a3e' }}>
                      {hwMediaFiles[i]?.type.startsWith('video')
                        ? <video src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                        : <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      }
                      <button onClick={e => { e.stopPropagation(); setHwMediaFiles(p => p.filter((_, idx) => idx !== i)); setHwMediaPreviews(p => p.filter((_, idx) => idx !== i)) }}
                        style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: '#f5576c', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', padding: 0, lineHeight: '18px' }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={createHomework} disabled={savingHw || hwUploading || !hwTitle.trim() || !hwClass}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: hwTitle && hwClass ? 'linear-gradient(135deg,#10b981,#059669)' : '#2a2a3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                {hwUploading ? '⏳ Загружаю файлы...' : savingHw ? 'Создаём...' : '✅ Создать задание'}
              </button>
            </div>

            {/* Список заданий */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {homeworks.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 40 }}>Заданий пока нет</div>}
              {homeworks.map(hw => {
                const hwSubs = submissions.filter(s => s.homework_id === hw.id)
                const isOpen = selectedHw === hw.id
                return (
                  <div key={hw.id} style={{ background: '#1a1a2e', borderRadius: 14, border: '1px solid #2a2a3e', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => setSelectedHw(isOpen ? null : hw.id)}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{hw.title}</div>
                        <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{hw.class_name} · {hwSubs.length} ответов{hw.due_date ? ` · до ${new Date(hw.due_date).toLocaleDateString('ru-RU')}` : ''}</div>
                      </div>
                      <span style={{ color: '#555' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #2a2a3e', padding: '16px 20px' }}>
                        {hw.description && <p style={{ color: '#aaa', fontSize: 14, marginBottom: 16 }}>{hw.description}</p>}
                        {hwSubs.length === 0 && <div style={{ color: '#555', fontSize: 14 }}>Ответов пока нет</div>}
                        {hwSubs.map(sub => (
                          <div key={sub.id} style={{ background: '#0f0f1a', borderRadius: 10, padding: '12px 16px', marginBottom: 10, border: '1px solid #2a2a3e' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontWeight: 600, color: '#a78bfa', fontSize: 13 }}>{sub.student_name}</span>
                              <span style={{ color: '#555', fontSize: 12 }}>{new Date(sub.submitted_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                            {sub.answer && <p style={{ color: '#ccc', fontSize: 14, margin: '0 0 10px' }}>{sub.answer}</p>}
                            {sub.media_url && (
                              sub.media_url.match(/\.(mp4|webm|mov)$/i)
                                ? <video src={sub.media_url} controls style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 10 }} />
                                : <img src={sub.media_url} alt="Работа ученика" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginBottom: 10, objectFit: 'cover' }} />
                            )}
                            {sub.grade ? (
                              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>Оценка: {sub.grade}</span>
                            ) : gradingId === sub.id ? (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#fff', fontSize: 13 }}
                                  placeholder="Оценка (5, 4, 3...)" value={gradeValue} onChange={e => setGradeValue(e.target.value)} />
                                <button onClick={() => gradeSubmission(sub.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Сохранить</button>
                                <button onClick={() => setGradingId(null)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#2a2a3e', color: '#fff', cursor: 'pointer', fontSize: 13 }}>✕</button>
                              </div>
                            ) : (
                              <button onClick={() => { setGradingId(sub.id); setGradeValue('') }}
                                style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #2a2a3e', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 12 }}>
                                ✏️ Поставить оценку
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ТУРНИРЫ */}
        {tab === 'tournament' && (
          <div>
            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', border: '1px solid #2a2a3e', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>🏆 Новый турнир</h3>
              <input style={inputStyle} placeholder="Название турнира (напр. «Осенний турнир»)" value={tTitle} onChange={e => setTTitle(e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <select style={{ ...inputStyle, marginBottom: 0 }} value={tClass} onChange={e => setTClass(e.target.value)}>
                  <option value="">Выбери класс</option>
                  {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input style={{ ...inputStyle, marginBottom: 0 }} type="date" value={tEnds} onChange={e => setTEnds(e.target.value)} placeholder="Дата окончания" />
              </div>
              <button onClick={createTournament} disabled={savingT || !tTitle.trim() || !tClass}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: tTitle && tClass ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#2a2a3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                {savingT ? 'Создаём...' : '🚀 Запустить турнир'}
              </button>
              <p style={{ color: '#666', fontSize: 12, marginTop: 10 }}>После запуска ученики класса увидят турнир и смогут соревноваться — чем больше тем пройдут, тем выше XP и место в таблице</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tournaments.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 40 }}>Турниров пока нет</div>}
              {tournaments.map(t => (
                <div key={t.id} style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 20px', border: `1px solid ${t.status === 'active' ? '#f59e0b44' : '#2a2a3e'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{t.title}</div>
                      <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                        {t.class_name} · {t.status === 'active' ? '🟢 Активный' : '⚫ Завершён'}
                        {t.ends_at ? ` · до ${new Date(t.ends_at).toLocaleDateString('ru-RU')}` : ''}
                      </div>
                    </div>
                    {t.status === 'active' && (
                      <button onClick={() => endTournament(t.id)}
                        style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#2a2a3e', color: '#888', cursor: 'pointer', fontSize: 12 }}>
                        Завершить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
