'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Tournament = { id: number; title: string; description?: string; type?: string; class_name: string; status: string; ends_at?: string; media_url?: string; prize?: string }
type TournamentSub = { id: number; tournament_id: number; student_name: string; text_answer: string; media_url?: string; place?: number; teacher_comment?: string; submitted_at: string }

const TYPE_LABELS: Record<string, string> = { essay: '📝 Эссе', model: '🏗️ Макет', photo: '📸 Фото', video: '🎥 Видео', experiment: '🔬 Опыт', other: '🏆 Турнир' }
const TYPE_COLORS: Record<string, string> = { essay: '#667eea', model: '#10b981', photo: '#f59e0b', video: '#ef4444', experiment: '#8b5cf6', other: '#f59e0b' }

export default function TournamentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [userGrade, setUserGrade] = useState('')
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [mySubs, setMySubs] = useState<TournamentSub[]>([])
  const [allSubs, setAllSubs] = useState<TournamentSub[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [mediaFiles, setMediaFiles] = useState<Record<number, File | null>>({})
  const [mediaPreviews, setMediaPreviews] = useState<Record<number, string>>({})
  const [uploading, setUploading] = useState<number | null>(null)
  const [sending, setSending] = useState<number | null>(null)
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('full_name, email, grade, role').eq('id', user.id).single()
    if (profile) { setUserName(profile.full_name || profile.email); setUserGrade(profile.grade) }
    if (profile?.role === 'teacher') { router.push('/teacher'); return }

    const { data: ts } = await supabase.from('tournaments').select('*').eq('class_name', profile?.grade || '').order('created_at', { ascending: false })
    if (ts) setTournaments(ts)

    const { data: subs } = await supabase.from('tournament_submissions').select('*').eq('student_id', user.id)
    if (subs) setMySubs(subs)

    const { data: allS } = await supabase.from('tournament_submissions').select('*').order('place', { ascending: true })
    if (allS) setAllSubs(allS)

    setLoading(false)
  }

  async function submit(tId: number) {
    const text = answers[tId]
    const file = mediaFiles[tId]
    if (!text?.trim() && !file) return
    setSending(tId)

    let mediaUrl = ''
    if (file) {
      setUploading(tId)
      const ext = file.name.split('.').pop()
      const path = `tournament-submissions/${userId}_${tId}_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('homework-media').upload(path, file)
      if (!error) {
        const { data: urlData } = supabase.storage.from('homework-media').getPublicUrl(path)
        mediaUrl = urlData.publicUrl
      }
      setUploading(null)
    }

    const { data } = await supabase.from('tournament_submissions').insert({
      tournament_id: tId, student_id: userId, student_name: userName,
      text_answer: text?.trim() || '', media_url: mediaUrl || null
    }).select().single()

    if (data) setMySubs([...mySubs, data])
    setSending(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff' }}>Загрузка...</div>
    </div>
  )

  const active = tournaments.filter(t => t.status === 'active')
  const ended = tournaments.filter(t => t.status !== 'active')

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: '1.5rem', paddingBottom: 80 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        <div style={{ background: 'linear-gradient(135deg, #2a1a0e, #1a1000)', border: '1px solid #f59e0b33', borderRadius: 20, padding: '24px', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px' }}>🏆 Турниры</h1>
          <p style={{ color: '#888', margin: 0, fontSize: 14 }}>{userGrade} класс · Соревнуйся и побеждай!</p>
        </div>

        {tournaments.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <div>Турниров пока нет</div>
            <div style={{ fontSize: 13, marginTop: 8, color: '#444' }}>Учитель скоро объявит новый турнир</div>
          </div>
        )}

        {/* Активные турниры */}
        {active.length > 0 && (
          <>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#10b981', marginBottom: 12 }}>🟢 Активные ({active.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
              {active.map(t => {
                const mySub = mySubs.find(s => s.tournament_id === t.id)
                const tSubs = allSubs.filter(s => s.tournament_id === t.id)
                const isOpen = selected === t.id
                const typeColor = TYPE_COLORS[t.type || 'other']
                const isOverdue = t.ends_at && new Date(t.ends_at) < new Date()

                return (
                  <div key={t.id} style={{ background: '#1a1a2e', borderRadius: 16, border: `1px solid ${mySub ? '#10b98144' : '#f59e0b33'}`, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 20px', cursor: 'pointer' }} onClick={() => setSelected(isOpen ? null : t.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ background: `${typeColor}22`, color: typeColor, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                              {TYPE_LABELS[t.type || 'other']}
                            </span>
                            {mySub && <span style={{ background: '#10b98122', color: '#10b981', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>✅ Сдано</span>}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 17 }}>{t.title}</div>
                          {t.ends_at && (
                            <div style={{ color: isOverdue ? '#f5576c' : '#888', fontSize: 12, marginTop: 4 }}>
                              {isOverdue ? '⚠️ Приём работ завершён' : `⏰ До ${new Date(t.ends_at).toLocaleDateString('ru-RU')}`}
                            </div>
                          )}
                          {t.prize && <div style={{ color: '#f59e0b', fontSize: 12, marginTop: 4 }}>🎁 {t.prize}</div>}
                        </div>
                        <span style={{ color: '#555', marginLeft: 12 }}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ borderTop: '1px solid #2a2a3e', padding: '16px 20px' }}>
                        {t.description && <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>{t.description}</p>}
                        {t.media_url && (t.media_url.match(/\.(mp4|webm|mov)$/i)
                          ? <video src={t.media_url} controls style={{ maxWidth: '100%', borderRadius: 10, marginBottom: 14 }} />
                          : <img src={t.media_url} alt="" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 10, marginBottom: 14, objectFit: 'cover' }} />
                        )}

                        {mySub ? (
                          <div>
                            <div style={{ background: '#0f0f1a', borderRadius: 10, padding: '14px', border: '1px solid #2a2a3e', marginBottom: 14 }}>
                              <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Твоя работа:</div>
                              {mySub.text_answer && <p style={{ color: '#ccc', fontSize: 14, margin: '0 0 8px' }}>{mySub.text_answer}</p>}
                              {mySub.media_url && (mySub.media_url.match(/\.(mp4|webm|mov)$/i)
                                ? <video src={mySub.media_url} controls style={{ maxWidth: '100%', borderRadius: 8 }} />
                                : <img src={mySub.media_url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
                              )}
                              {mySub.place && (
                                <div style={{ marginTop: 10, fontSize: 18 }}>
                                  {mySub.place === 1 ? '🥇 1 место!' : mySub.place === 2 ? '🥈 2 место!' : '🥉 3 место!'}
                                  {mySub.teacher_comment && <div style={{ fontSize: 13, color: '#f59e0b', marginTop: 4 }}>💬 {mySub.teacher_comment}</div>}
                                </div>
                              )}
                            </div>

                            {/* Все работы (результаты) */}
                            {tSubs.some(s => s.place) && (
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#888', marginBottom: 8 }}>🏅 Результаты:</div>
                                {tSubs.filter(s => s.place).sort((a, b) => (a.place || 9) - (b.place || 9)).map(s => (
                                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#0f0f1a', borderRadius: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 20 }}>{s.place === 1 ? '🥇' : s.place === 2 ? '🥈' : '🥉'}</span>
                                    <span style={{ fontWeight: 600 }}>{s.student_name}</span>
                                    {s.teacher_comment && <span style={{ color: '#888', fontSize: 12 }}>· {s.teacher_comment}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#ccc' }}>📤 Отправь свою работу:</div>
                            <textarea rows={4} value={answers[t.id] || ''}
                              onChange={e => setAnswers({ ...answers, [t.id]: e.target.value })}
                              placeholder={t.type === 'essay' ? 'Напиши своё эссе...' : t.type === 'photo' || t.type === 'video' ? 'Добавь описание к своей работе...' : 'Опиши свою работу...'}
                              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #2a2a3e', background: '#0f0f1a', color: '#fff', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'sans-serif', marginBottom: 10 }}
                            />
                            <input ref={el => { fileRefs.current[t.id] = el }} type="file" accept="image/*,video/*" style={{ display: 'none' }}
                              onChange={e => {
                                const f = e.target.files?.[0]; if (!f) return
                                setMediaFiles(p => ({ ...p, [t.id]: f }))
                                setMediaPreviews(p => ({ ...p, [t.id]: URL.createObjectURL(f) }))
                              }} />
                            {mediaPreviews[t.id] ? (
                              <div style={{ position: 'relative', marginBottom: 10, display: 'inline-block' }}>
                                {mediaFiles[t.id]?.type?.startsWith('video')
                                  ? <video src={mediaPreviews[t.id]} style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10 }} muted />
                                  : <img src={mediaPreviews[t.id]} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10, objectFit: 'cover' }} />}
                                <button onClick={() => { setMediaFiles(p => ({ ...p, [t.id]: null })); setMediaPreviews(p => ({ ...p, [t.id]: '' })) }}
                                  style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: '#f5576c', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer' }}>×</button>
                              </div>
                            ) : (
                              <button onClick={() => fileRefs.current[t.id]?.click()}
                                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '2px dashed #2a2a3e', background: 'transparent', color: '#888', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
                                📎 Прикрепить фото или видео
                              </button>
                            )}
                            <button onClick={() => submit(t.id)}
                              disabled={sending === t.id || uploading === t.id || (!answers[t.id]?.trim() && !mediaFiles[t.id])}
                              style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: (answers[t.id]?.trim() || mediaFiles[t.id]) ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#2a2a3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                              {uploading === t.id ? '⏳ Загружаю...' : sending === t.id ? 'Отправляю...' : '🚀 Отправить работу'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Завершённые */}
        {ended.length > 0 && (
          <>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#555', marginBottom: 12 }}>⚫ Завершённые</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ended.map(t => {
                const tSubs = allSubs.filter(s => s.tournament_id === t.id).filter(s => s.place).sort((a, b) => (a.place || 9) - (b.place || 9))
                return (
                  <div key={t.id} style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 20px', border: '1px solid #2a2a3e', opacity: 0.8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ background: '#ffffff11', color: '#888', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{TYPE_LABELS[t.type || 'other']}</span>
                      <span style={{ fontWeight: 700 }}>{t.title}</span>
                    </div>
                    {tSubs.length > 0 && (
                      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        {tSubs.slice(0, 3).map(s => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                            <span>{s.place === 1 ? '🥇' : s.place === 2 ? '🥈' : '🥉'}</span>
                            <span style={{ color: '#ccc' }}>{s.student_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
