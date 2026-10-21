'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { gradeLabel, gradeVariants, studentClassNames } from '@/lib/grade-match'
import { useT } from '@/app/components/LanguageProvider'
import { useTranslatedItems } from '@/app/components/useTranslatedItems'

type Tournament = { id: number; title: string; description?: string; type?: string; class_name: string; status: string; ends_at?: string; media_url?: string; prize?: string }
type TournamentSub = { id: number; tournament_id: number; student_name: string; text_answer: string; media_url?: string; place?: number; teacher_comment?: string; submitted_at: string }

const TYPE_LABELS: Record<string, string> = { essay: '📝 Эссе', model: '🏗️ Макет', photo: '📸 Фото', video: '🎥 Видео', experiment: '🔬 Опыт', other: '🏆 Турнир' }
const TYPE_COLORS: Record<string, string> = { essay: '#667eea', model: '#10b981', photo: '#f59e0b', video: '#ef4444', experiment: '#8b5cf6', other: '#f59e0b' }

export default function TournamentPage() {
  const { t, dateLocale } = useT()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [userGrade, setUserGrade] = useState('')
  // Названия классов для просмотра учителем/админом ("7th Grade", …, "ЕНТ")
  const [previewClasses, setPreviewClasses] = useState<string[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [mySubs, setMySubs] = useState<TournamentSub[]>([])
  const [allSubs, setAllSubs] = useState<TournamentSub[]>([])
  const tri = useTranslatedItems('tournament', tournaments.map(x => x.id))
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [mediaFiles, setMediaFiles] = useState<Record<number, File | null>>({})
  const [mediaPreviews, setMediaPreviews] = useState<Record<number, string>>({})
  const [uploading, setUploading] = useState<number | null>(null)
  const [sending, setSending] = useState<number | null>(null)
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})
  // Учитель и админ видят страницу так, как её видит ученик выбранного класса
  const [preview, setPreview] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('full_name, email, grade, role').eq('id', user.id).single()
    if (profile) { setUserName(profile.full_name || profile.email); setUserGrade(profile.grade) }
    const isStaff = profile?.role === 'teacher' || profile?.role === 'admin'
    // RLS отдаёт открытые классы и только те закрытые, куда ученику выдан доступ
    const { data: classes } = await supabase.from('classes').select('name, is_locked')
    if (isStaff) {
      const names = (classes || []).map(c => c.name)
      setPreview(true)
      setPreviewClasses(names)
      setUserGrade(names[0] || '')
      await loadTournaments(names[0] ? gradeVariants(names[0]) : [])
    } else {
      await loadTournaments(studentClassNames(profile?.grade, classes || []))
    }

    const { data: subs } = await supabase.from('tournament_submissions').select('*').eq('student_id', user.id)
    if (subs) setMySubs(subs)

    const { data: allS } = await supabase.from('tournament_submissions').select('*').order('place', { ascending: true })
    if (allS) setAllSubs(allS)

    setLoading(false)
  }

  async function loadTournaments(classNames: string[]) {
    if (!classNames.length) { setTournaments([]); return }
    const { data: ts } = await supabase.from('tournaments').select('*').in('class_name', classNames).order('created_at', { ascending: false })
    setTournaments(ts || [])
  }

  function switchPreviewClass(name: string) {
    setUserGrade(name)
    loadTournaments(gradeVariants(name))
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
      setUploading(null)
      if (error) {
        setSending(null)
        alert(t('Не удалось загрузить файл: ') + error.message)
        return
      }
      mediaUrl = supabase.storage.from('homework-media').getPublicUrl(path).data.publicUrl
    }

    const { data } = await supabase.from('tournament_submissions').insert({
      tournament_id: tId, student_id: userId, student_name: userName,
      text_answer: text?.trim() || '', media_url: mediaUrl || null
    }).select().single()

    setSending(null)
    if (!data) { alert(t('Не удалось отправить работу, попробуй ещё раз')); return }
    setMySubs([...mySubs, data])
    setAllSubs(prev => [...prev, data])
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff' }}>{t('Загрузка...')}</div>
    </div>
  )

  const active = tournaments.filter(t => t.status === 'active')
  const ended = tournaments.filter(t => t.status !== 'active')

  return (
    <div style={{ minHeight: '100vh', color: '#fff', padding: '1.5rem', paddingBottom: 80 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        <div style={{ background: 'linear-gradient(135deg, #2a1a0e, #1a1000)', border: '1px solid #f59e0b33', borderRadius: 20, padding: '24px', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px' }}>{t('🏆 Турниры')}</h1>
          <p style={{ color: '#888', margin: 0, fontSize: 14 }}>{preview ? userGrade : gradeLabel(userGrade, t)} {t('· Соревнуйся и побеждай!')}</p>
        </div>

        {preview && (
          <div style={{ background: 'rgba(139,124,246,0.08)', border: '1px solid rgba(139,124,246,0.3)', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: '#c4bbff', fontWeight: 600, marginBottom: 10 }}>{t('Так эту страницу видят ученики. Выбери класс:')}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {previewClasses.map(name => (
                <button key={name} className={`chip${userGrade === name ? ' on' : ''}`} onClick={() => switchPreviewClass(name)}>{name}</button>
              ))}
            </div>
          </div>
        )}

        {tournaments.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <div>{t('Турниров пока нет')}</div>
            <div style={{ fontSize: 13, marginTop: 8, color: '#444' }}>{t('Учитель скоро объявит новый турнир')}</div>
          </div>
        )}

        {/* Активные турниры */}
        {active.length > 0 && (
          <>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#10b981', marginBottom: 12 }}>{t('🟢 Активные (')}{active.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
              {active.map(item => {
                const mySub = mySubs.find(s => s.tournament_id === item.id)
                const tSubs = allSubs.filter(s => s.tournament_id === item.id)
                const isOpen = selected === item.id
                const typeColor = TYPE_COLORS[item.type || 'other']
                const isOverdue = item.ends_at && new Date(item.ends_at) < new Date()

                return (
                  <div key={item.id} style={{ background: '#1a1a2e', borderRadius: 16, border: `1px solid ${mySub ? '#10b98144' : '#f59e0b33'}`, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 20px', cursor: 'pointer' }} onClick={() => setSelected(isOpen ? null : item.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ background: `${typeColor}22`, color: typeColor, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                              {t(TYPE_LABELS[item.type || 'other'])}
                            </span>
                            {mySub && <span style={{ background: '#10b98122', color: '#10b981', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{t('✅ Сдано')}</span>}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 17 }}>{tri(item.id, 'title', item.title)}</div>
                          {item.ends_at && (
                            <div style={{ color: isOverdue ? '#f5576c' : '#888', fontSize: 12, marginTop: 4 }}>
                              {isOverdue ? t('⚠️ Приём работ завершён') : t('⏰ До {date}', { date: new Date(item.ends_at).toLocaleDateString(dateLocale) })}
                            </div>
                          )}
                          {item.prize && <div style={{ color: '#f59e0b', fontSize: 12, marginTop: 4 }}>🎁 {tri(item.id, 'prize', item.prize)}</div>}
                        </div>
                        <span style={{ color: '#555', marginLeft: 12 }}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ borderTop: '1px solid #2a2a3e', padding: '16px 20px' }}>
                        {item.description && <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>{tri(item.id, 'description', item.description)}</p>}
                        {item.media_url && (item.media_url.match(/\.(mp4|webm|mov)$/i)
                          ? <video src={item.media_url} controls style={{ maxWidth: '100%', borderRadius: 10, marginBottom: 14 }} />
                          : <img src={item.media_url} alt="" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 10, marginBottom: 14, objectFit: 'cover' }} />
                        )}

                        {preview ? (
                          <div style={{ color: '#888', fontSize: 13, background: '#0f0f1a', borderRadius: 10, padding: '10px 14px', border: '1px dashed #2a2a3e' }}>
                            {t('Здесь ученик отправляет свою работу на турнир.')}
                          </div>
                        ) : mySub ? (
                          <div>
                            <div style={{ background: '#0f0f1a', borderRadius: 10, padding: '14px', border: '1px solid #2a2a3e', marginBottom: 14 }}>
                              <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>{t('Твоя работа:')}</div>
                              {mySub.text_answer && <p style={{ color: '#ccc', fontSize: 14, margin: '0 0 8px' }}>{mySub.text_answer}</p>}
                              {mySub.media_url && (mySub.media_url.match(/\.(mp4|webm|mov)$/i)
                                ? <video src={mySub.media_url} controls style={{ maxWidth: '100%', borderRadius: 8 }} />
                                : <img src={mySub.media_url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
                              )}
                              {mySub.place && (
                                <div style={{ marginTop: 10, fontSize: 18 }}>
                                  {mySub.place === 1 ? t('🥇 1 место!') : mySub.place === 2 ? t('🥈 2 место!') : t('🥉 3 место!')}
                                  {mySub.teacher_comment && <div style={{ fontSize: 13, color: '#f59e0b', marginTop: 4 }}>💬 {mySub.teacher_comment}</div>}
                                </div>
                              )}
                            </div>

                            {/* Все работы (результаты) */}
                            {tSubs.some(s => s.place) && (
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#888', marginBottom: 8 }}>{t('🏅 Результаты:')}</div>
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
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#ccc' }}>{t('📤 Отправь свою работу:')}</div>
                            <textarea rows={4} value={answers[item.id] || ''}
                              onChange={e => setAnswers({ ...answers, [item.id]: e.target.value })}
                              placeholder={item.type === 'essay' ? t('Напиши своё эссе...') : item.type === 'photo' || item.type === 'video' ? t('Добавь описание к своей работе...') : t('Опиши свою работу...')}
                              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #2a2a3e', background: '#0f0f1a', color: '#fff', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'sans-serif', marginBottom: 10 }}
                            />
                            <input ref={el => { fileRefs.current[item.id] = el }} type="file" accept="image/*,video/*" style={{ display: 'none' }}
                              onChange={e => {
                                const f = e.target.files?.[0]; if (!f) return
                                setMediaFiles(p => ({ ...p, [item.id]: f }))
                                setMediaPreviews(p => ({ ...p, [item.id]: URL.createObjectURL(f) }))
                              }} />
                            {mediaPreviews[item.id] ? (
                              <div style={{ position: 'relative', marginBottom: 10, display: 'inline-block' }}>
                                {mediaFiles[item.id]?.type?.startsWith('video')
                                  ? <video src={mediaPreviews[item.id]} style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10 }} muted />
                                  : <img src={mediaPreviews[item.id]} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10, objectFit: 'cover' }} />}
                                <button onClick={() => { setMediaFiles(p => ({ ...p, [item.id]: null })); setMediaPreviews(p => ({ ...p, [item.id]: '' })) }}
                                  style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: '#f5576c', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer' }}>×</button>
                              </div>
                            ) : (
                              <button onClick={() => fileRefs.current[item.id]?.click()}
                                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '2px dashed #2a2a3e', background: 'transparent', color: '#888', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
                                {t('📎 Прикрепить фото или видео')}
                              </button>
                            )}
                            <button onClick={() => submit(item.id)}
                              disabled={sending === item.id || uploading === item.id || (!answers[item.id]?.trim() && !mediaFiles[item.id])}
                              style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: (answers[item.id]?.trim() || mediaFiles[item.id]) ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#2a2a3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                              {uploading === item.id ? t('⏳ Загружаю...') : sending === item.id ? t('Отправляю...') : t('🚀 Отправить работу')}
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
            <div style={{ fontWeight: 700, fontSize: 15, color: '#555', marginBottom: 12 }}>{t('⚫ Завершённые')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ended.map(item => {
                const tSubs = allSubs.filter(s => s.tournament_id === item.id).filter(s => s.place).sort((a, b) => (a.place || 9) - (b.place || 9))
                return (
                  <div key={item.id} style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 20px', border: '1px solid #2a2a3e', opacity: 0.8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ background: '#ffffff11', color: '#888', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{t(TYPE_LABELS[item.type || 'other'])}</span>
                      <span style={{ fontWeight: 700 }}>{tri(item.id, 'title', item.title)}</span>
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
