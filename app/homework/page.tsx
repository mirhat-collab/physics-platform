'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Homework = { id: number; title: string; description: string; class_name: string; due_date: string; created_at: string; media_urls?: string[] }
type Submission = { id: number; homework_id: number; answer: string; grade: string; media_url?: string }

export default function HomeworkPage() {
  const router = useRouter()
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [userGrade, setUserGrade] = useState('')
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [mediaFiles, setMediaFiles] = useState<Record<number, File | null>>({})
  const [mediaPreviews, setMediaPreviews] = useState<Record<number, string>>({})
  const [uploading, setUploading] = useState<number | null>(null)
  const [sending, setSending] = useState<number | null>(null)
  const [sent, setSent] = useState<Record<number, boolean>>({})
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('full_name, email, grade, role').eq('id', user.id).single()
    if (profile) { setUserName(profile.full_name || profile.email); setUserGrade(profile.grade) }

    if (profile?.role === 'teacher') { router.push('/teacher'); return }

    const { data: hw } = await supabase.from('homework').select('*').eq('class_name', profile?.grade || '').order('created_at', { ascending: false })
    if (hw) setHomeworks(hw)

    const { data: subs } = await supabase.from('homework_submissions').select('*').eq('student_id', user.id)
    if (subs) {
      setSubmissions(subs)
      const s: Record<number, boolean> = {}
      subs.forEach(sub => { s[sub.homework_id] = true })
      setSent(s)
    }
    setLoading(false)
  }

  function handleFileSelect(hwId: number, file: File | null) {
    if (!file) return
    setMediaFiles(prev => ({ ...prev, [hwId]: file }))
    const url = URL.createObjectURL(file)
    setMediaPreviews(prev => ({ ...prev, [hwId]: url }))
  }

  async function submitAnswer(hwId: number) {
    const answer = answers[hwId]
    if (!answer?.trim() && !mediaFiles[hwId]) return
    setSending(hwId)

    let mediaUrl = ''
    const file = mediaFiles[hwId]
    if (file) {
      setUploading(hwId)
      const ext = file.name.split('.').pop()
      const path = `submissions/${userId}_${hwId}_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('homework-media').upload(path, file)
      if (!error) {
        const { data: urlData } = supabase.storage.from('homework-media').getPublicUrl(path)
        mediaUrl = urlData.publicUrl
      }
      setUploading(null)
    }

    await supabase.from('homework_submissions').insert({
      homework_id: hwId, student_id: userId, student_name: userName,
      answer: answer?.trim() || '', media_url: mediaUrl || null
    })
    setSent({ ...sent, [hwId]: true })
    setSending(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff' }}>Загрузка...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: '2rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a3e, #0f0f1a)', borderBottom: '1px solid #2a2a3e', borderRadius: 20, padding: '24px', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px' }}>📝 Домашние задания</h1>
          <p style={{ color: '#888', margin: 0, fontSize: 14 }}>{userGrade} класс</p>
        </div>

        {homeworks.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            Заданий пока нет
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {homeworks.map(hw => {
            const mySub = submissions.find(s => s.homework_id === hw.id)
            const isSent = sent[hw.id]
            const isOverdue = hw.due_date && new Date(hw.due_date) < new Date()
            const preview = mediaPreviews[hw.id]
            const file = mediaFiles[hw.id]

            return (
              <div key={hw.id} style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', border: `1px solid ${isSent ? '#10b98144' : isOverdue ? '#f5576c33' : '#2a2a3e'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{hw.title}</div>
                    <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                      {hw.due_date ? `До ${new Date(hw.due_date).toLocaleDateString('ru-RU')}` : 'Без срока'}
                      {isOverdue && !isSent && <span style={{ color: '#f5576c', marginLeft: 8 }}>⚠️ Просрочено</span>}
                    </div>
                  </div>
                  {isSent && (
                    <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                      {mySub?.grade ? `Оценка: ${mySub.grade}` : '✅ Сдано'}
                    </span>
                  )}
                </div>

                {hw.description && <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>{hw.description}</p>}

                {/* Медиа от учителя */}
                {hw.media_urls && hw.media_urls.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    {hw.media_urls.map((url, i) => {
                      const isVideo = url.match(/\.(mp4|webm|mov)$/i)
                      return isVideo ? (
                        <video key={i} src={url} controls style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, border: '1px solid #2a2a3e' }} />
                      ) : (
                        <img key={i} src={url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, border: '1px solid #2a2a3e', objectFit: 'cover' }} />
                      )
                    })}
                  </div>
                )}

                {isSent ? (
                  <div style={{ background: '#0f0f1a', borderRadius: 10, padding: '12px 16px', border: '1px solid #2a2a3e' }}>
                    <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Твой ответ:</div>
                    {mySub?.answer && <div style={{ color: '#ccc', fontSize: 14, marginBottom: mySub.media_url ? 10 : 0 }}>{mySub.answer}</div>}
                    {mySub?.media_url && (
                      mySub.media_url.match(/\.(mp4|webm|mov)$/i)
                        ? <video src={mySub.media_url} controls style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8 }} />
                        : <img src={mySub.media_url} alt="Твоя работа" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8 }} />
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={3} value={answers[hw.id] || ''}
                      onChange={e => setAnswers({ ...answers, [hw.id]: e.target.value })}
                      placeholder="Напиши свой ответ..."
                      style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #2a2a3e', background: '#0f0f1a', color: '#fff', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'sans-serif', marginBottom: 10 }}
                    />

                    {/* Прикрепить фото/видео */}
                    <input
                      ref={el => { fileRefs.current[hw.id] = el }}
                      type="file" accept="image/*,video/*" style={{ display: 'none' }}
                      onChange={e => handleFileSelect(hw.id, e.target.files?.[0] || null)}
                    />

                    {preview ? (
                      <div style={{ position: 'relative', marginBottom: 10, display: 'inline-block' }}>
                        {file?.type.startsWith('video')
                          ? <video src={preview} style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10, border: '1px solid #2a2a3e' }} muted />
                          : <img src={preview} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10, border: '1px solid #2a2a3e', objectFit: 'cover' }} />
                        }
                        <button onClick={() => { setMediaFiles(p => ({ ...p, [hw.id]: null })); setMediaPreviews(p => ({ ...p, [hw.id]: '' })) }}
                          style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: '#f5576c', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    ) : (
                      <button onClick={() => fileRefs.current[hw.id]?.click()}
                        style={{ width: '100%', padding: '10px', borderRadius: 10, border: '2px dashed #2a2a3e', background: 'transparent', color: '#888', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
                        📎 Прикрепить фото или видео
                      </button>
                    )}

                    <button onClick={() => submitAnswer(hw.id)}
                      disabled={sending === hw.id || uploading === hw.id || (!answers[hw.id]?.trim() && !mediaFiles[hw.id])}
                      style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: (answers[hw.id]?.trim() || mediaFiles[hw.id]) ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#2a2a3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                      {uploading === hw.id ? '⏳ Загружаю файл...' : sending === hw.id ? 'Отправляем...' : '📨 Сдать'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
