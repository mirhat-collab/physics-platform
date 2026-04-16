'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import katex from 'katex'
import 'katex/dist/katex.min.css'

type MediaItem = { url: string; type: 'image' | 'video'; name: string }

type Topic = {
  id: string
  name: string
  theory: string
  formulas: string
  examples: string
  tasks: string
  resource: string
  grade: string
  media: MediaItem[]
}

function FormulaBlock({ text }: { text: string }) {
  const lines = text.split('\n').filter(l => l.trim() !== '')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {lines.map((line, i) => {
        let html = ''
        try {
          html = katex.renderToString(line.trim(), { throwOnError: false, displayMode: true })
        } catch {
          html = `<span style="color:#fcd34d;font-family:monospace">${line}</span>`
        }
        return (
          <div key={i} style={{ background: '#0a0a14', borderRadius: 12, padding: '16px 24px', border: '1px solid rgba(245,158,11,0.2)', overflowX: 'auto' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </div>
  )
}

export default function TopicPage() {
  const { id } = useParams()
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [marking, setMarking] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<{ question: string; options: string[]; correct: number }[] | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([])
  const [quizDone, setQuizDone] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizError, setQuizError] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [comments, setComments] = useState<{ id: number; user_name: string; text: string; created_at: string }[]>([])
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => { loadData() }, [id])

  useEffect(() => {
    if (!id) return
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('bookmarks') || '[]')
      setBookmarked(Array.isArray(saved) && saved.includes(String(id)))
    } catch { setBookmarked(false) }
  }, [id])

  function toggleBookmark() {
    let saved: string[] = []
    try { saved = JSON.parse(localStorage.getItem('bookmarks') || '[]'); if (!Array.isArray(saved)) saved = [] } catch { saved = [] }
    let updated: string[]
    if (bookmarked) {
      updated = saved.filter(b => b !== String(id))
    } else {
      updated = [String(id), ...saved]
    }
    localStorage.setItem('bookmarks', JSON.stringify(updated))
    setBookmarked(!bookmarked)
  }

  // Загружаем квиз в фоне сразу после загрузки темы
  useEffect(() => {
    if (!topic) return
    if (quiz) return
    loadQuiz()
  }, [topic])

  async function loadQuiz() {
    if (!topic) return
    setQuizLoading(true)
    setQuizError(false)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicName: topic.name, theory: topic.theory, formulas: topic.formulas, examples: topic.examples })
      })
      const data = await res.json()
      if (data.questions && data.questions.length > 0) {
        setQuiz(data.questions)
        setQuizAnswers(new Array(data.questions.length).fill(null))
      } else {
        setQuizError(true)
      }
    } catch {
      setQuizError(true)
    }
    setQuizLoading(false)
  }

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    const { data: topicData } = await supabase.from('topics').select('*').eq('id', id).single()
    if (topicData) setTopic(topicData)
    const { data: prog } = await supabase
      .from('progress').select('id')
      .eq('student', user.id).eq('topic', id).eq('status', 'completed').maybeSingle()
    if (prog) setCompleted(true)

    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
    if (profile) setUserName(profile.full_name || profile.email || 'Аноним')

    loadComments()
    setLoading(false)
  }

  async function loadComments() {
    const { data } = await supabase
      .from('comments').select('*')
      .eq('topic_id', String(id))
      .order('created_at', { ascending: false })
    if (data) setComments(data)
  }

  async function sendComment() {
    if (!commentText.trim() || !userId || !id) return
    setSendingComment(true)
    await supabase.from('comments').insert({
      topic_id: String(id),
      user_id: userId,
      user_name: userName,
      text: commentText.trim(),
    })
    setCommentText('')
    await loadComments()
    setSendingComment(false)
  }

  async function markCompleted() {
    if (!userId || !topic || completed || marking) return
    setMarking(true)

    // Проверяем — есть ли уже запись
    const { data: existing } = await supabase.from('progress')
      .select('id').eq('student', userId).eq('topic', topic.id).maybeSingle()

    if (!existing) {
      // Записываем прогресс через upsert — защита от двойного клика
      const { error: progressError } = await supabase.from('progress').upsert({
        student: userId, topic: topic.id, status: 'completed', xp: 10,
        completed_at: new Date().toISOString()
      }, { onConflict: 'student,topic', ignoreDuplicates: true })

      if (progressError) {
        console.error('Progress error:', progressError)
        setMarking(false)
        return
      }

      // Начисляем XP атомарно — исключаем race condition
      const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', userId).single()
      if (profile) {
        await supabase.from('profiles').update({ total_xp: (profile.total_xp || 0) + 10 }).eq('id', userId)
      }
    }

    setCompleted(true)
    setMarking(false)
    setShowXP(true)
    setTimeout(() => setShowXP(false), 3000)
  }

  function startQuiz() {
    setShowQuiz(true)
  }

  function answerQuestion(qIndex: number, aIndex: number) {
    if (quizDone) return
    const updated = [...quizAnswers]
    updated[qIndex] = aIndex
    setQuizAnswers(updated)
  }

  function submitQuiz() {
    setQuizDone(true)
  }

  const quizScore = quiz ? quiz.filter((q, i) => quizAnswers[i] === q.correct).length : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  if (!topic) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff' }}>Тема не найдена</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: '2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <Link href="/topics" style={{ color: '#666', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          ← Все темы
        </Link>

        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid #2a2a3e', borderRadius: 24, padding: '32px 36px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              {topic.grade && (
                <span style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 999, border: '1px solid rgba(167,139,250,0.3)', display: 'inline-block', marginBottom: 16 }}>
                  {topic.grade}
                </span>
              )}
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{topic.name}</h1>
            </div>
            <button onClick={toggleBookmark} style={{
              background: bookmarked ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
              border: bookmarked ? '1px solid rgba(245,158,11,0.4)' : '1px solid #2a2a3e',
              borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
              fontSize: 20, transition: 'all 0.2s', flexShrink: 0
            }} title={bookmarked ? 'Убрать из закладок' : 'Добавить в закладки'}>
              {bookmarked ? '🔖' : '📌'}
            </button>
          </div>
        </div>

        {topic.theory && (
          <Section icon="📖" title="Теория" color="#667eea" bg="rgba(102,126,234,0.08)">
            <p style={{ lineHeight: 1.9, color: '#ccc', whiteSpace: 'pre-wrap', margin: 0, fontSize: 15 }}>{topic.theory}</p>
          </Section>
        )}

        {topic.formulas && (
          <Section icon="🔢" title="Формулы" color="#f59e0b" bg="rgba(245,158,11,0.08)">
            <FormulaBlock text={topic.formulas} />
          </Section>
        )}

        {topic.examples && (
          <Section icon="💡" title="Примеры" color="#10b981" bg="rgba(16,185,129,0.08)">
            <p style={{ lineHeight: 1.9, color: '#ccc', whiteSpace: 'pre-wrap', margin: 0, fontSize: 15 }}>{topic.examples}</p>
          </Section>
        )}

        {topic.tasks && (
          <Section icon="🧪" title="Практика" color="#ec4899" bg="rgba(236,72,153,0.08)">
            <p style={{ lineHeight: 1.9, color: '#ccc', whiteSpace: 'pre-wrap', margin: 0, fontSize: 15 }}>{topic.tasks}</p>
          </Section>
        )}

        {topic.resource && (
          <Section icon="🌐" title="Образовательный ресурс" color="#06b6d4" bg="rgba(6,182,212,0.08)">
            <a href={topic.resource} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.35)', borderRadius: 12, color: '#67e8f9', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              🔗 Открыть ресурс <span style={{ fontSize: 12, opacity: 0.7 }}>↗</span>
            </a>
          </Section>
        )}

        {topic.media && topic.media.length > 0 && (
          <Section icon="🖼" title="Материалы" color="#a78bfa" bg="rgba(167,139,250,0.08)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {topic.media.map((item, i) => (
                <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2a3e', background: '#0a0a14' }}>
                  {item.type === 'image'
                    ? <img src={item.url} style={{ width: '100%', display: 'block' }} alt={item.name} />
                    : <video src={item.url} controls style={{ width: '100%', display: 'block' }} />
                  }
                </div>
              ))}
            </div>
          </Section>
        )}

        <div style={{ marginTop: 40, textAlign: 'center', position: 'relative', paddingBottom: 60 }}>
          {showXP && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', zIndex: 1000,
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                border: '1px solid #667eea55', borderRadius: 24,
                padding: '40px 48px', textAlign: 'center',
                animation: 'popIn 0.4s ease'
              }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Тема завершена!</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#4ade80', marginBottom: 8 }}>+10 XP ⭐</div>
                <div style={{ color: '#888', fontSize: 14 }}>Продолжай в том же духе!</div>
              </div>
            </div>
          )}
          <button
            onClick={markCompleted}
            disabled={completed || marking}
            style={{
              padding: '18px 56px', borderRadius: 18, border: 'none', fontSize: 17, fontWeight: 700,
              cursor: completed ? 'default' : 'pointer',
              background: completed ? 'linear-gradient(135deg, #10b981, #059669)' : marking ? '#2a2a3e' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff', transition: 'all 0.3s ease',
              boxShadow: completed ? '0 8px 32px rgba(16,185,129,0.35)' : '0 8px 32px rgba(102,126,234,0.35)',
            }}
          >
            {completed ? '✅ Тема завершена!' : marking ? '⏳ Сохраняем...' : '🎯 Завершить тему (+10 XP)'}
          </button>
          {completed && (
            <p style={{ color: '#666', fontSize: 13, marginTop: 14 }}>Отличная работа! Ты уже прошёл эту тему.</p>
          )}
        </div>

        {/* Кнопка квиза */}
        <div style={{ textAlign: 'center', marginTop: 16, paddingBottom: 60 }}>
          <button onClick={startQuiz} style={{
            padding: '14px 40px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
            background: quizLoading
              ? '#2a2a3e'
              : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff', boxShadow: quizLoading ? 'none' : '0 8px 24px rgba(245,158,11,0.3)',
            transition: 'all 0.3s'
          }}>
            {quizLoading ? '⏳ Готовим вопросы...' : quiz ? '🧠 Проверить знания (квиз готов!)' : '🧠 Проверить знания (квиз)'}
          </button>
        </div>

        {/* Квиз */}
        {showQuiz && (
          <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '28px', border: '1px solid #2a2a3e', marginBottom: 40 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>🧠 Мини-тест по теме</h2>
            {quizLoading && (
              <div style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                AI генерирует вопросы...
              </div>
            )}
            {!quizLoading && quizError && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>😕</div>
                <div style={{ color: '#888', marginBottom: 16, fontSize: 14 }}>Не удалось загрузить вопросы</div>
                <button onClick={loadQuiz} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  🔄 Попробовать снова
                </button>
              </div>
            )}
            {!quizLoading && quiz && quiz.map((q, qi) => (
              <div key={qi} style={{ marginBottom: 24, padding: '20px', background: '#0f0f1a', borderRadius: 14, border: '1px solid #2a2a3e' }}>
                <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>{qi + 1}. {q.question}</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {q.options.map((opt, ai) => {
                    const isSelected = quizAnswers[qi] === ai
                    const isCorrect = q.correct === ai
                    let bg = '#1a1a2e'
                    let border = '1px solid #2a2a3e'
                    let color = '#ccc'
                    if (quizDone) {
                      if (isCorrect) { bg = 'rgba(16,185,129,0.15)'; border = '1px solid #10b981'; color = '#10b981' }
                      else if (isSelected && !isCorrect) { bg = 'rgba(245,87,108,0.15)'; border = '1px solid #f5576c'; color = '#f5576c' }
                    } else if (isSelected) {
                      bg = 'rgba(102,126,234,0.2)'; border = '1px solid #667eea'; color = '#a78bfa'
                    }
                    return (
                      <button key={ai} onClick={() => answerQuestion(qi, ai)} style={{
                        padding: '12px 16px', borderRadius: 10, border, background: bg, color,
                        textAlign: 'left', cursor: quizDone ? 'default' : 'pointer', fontSize: 14,
                        fontWeight: isSelected || (quizDone && isCorrect) ? 600 : 400, transition: 'all 0.2s'
                      }}>
                        {quizDone && isCorrect && '✅ '}{quizDone && isSelected && !isCorrect && '❌ '}{opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {!quizLoading && quiz && !quizDone && (
              <button onClick={submitQuiz}
                disabled={quizAnswers.some(a => a === null)}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: quizAnswers.some(a => a === null) ? '#2a2a3e' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: quizAnswers.some(a => a === null) ? 'not-allowed' : 'pointer'
                }}>
                Проверить ответы
              </button>
            )}
            {quizDone && (
              <div style={{ textAlign: 'center', padding: '20px', background: quizScore >= 3 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 14, border: `1px solid ${quizScore >= 3 ? '#10b98155' : '#f59e0b55'}` }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{quizScore === 4 ? '🏆' : quizScore >= 3 ? '🎉' : quizScore >= 2 ? '😊' : '📚'}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: quizScore >= 3 ? '#10b981' : '#f59e0b' }}>
                  {quizScore} из {quiz?.length ?? 0} правильно
                </div>
                <div style={{ color: '#888', marginTop: 6, fontSize: 14 }}>
                  {quizScore === 4 ? 'Отлично! Ты отлично знаешь тему!' : quizScore >= 3 ? 'Хорошо! Почти всё правильно!' : quizScore >= 2 ? 'Неплохо, но стоит повторить материал' : 'Советуем перечитать теорию ещё раз'}
                </div>
                <button onClick={() => { setQuizAnswers(new Array(quiz?.length ?? 0).fill(null)); setQuizDone(false) }}
                  style={{ marginTop: 16, padding: '10px 28px', borderRadius: 10, border: 'none', background: '#2a2a3e', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  Пройти снова
                </button>
              </div>
            )}
          </div>
        )}

        {/* Комментарии */}
        <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '24px', border: '1px solid #2a2a3e', marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800 }}>💬 Вопросы и комментарии</h2>

          {/* Форма отправки */}
          <div style={{ marginBottom: 24 }}>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Задай вопрос или оставь комментарий..."
              rows={3}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '1px solid #2a2a3e', background: '#0f0f1a',
                color: '#fff', fontSize: 14, resize: 'vertical',
                boxSizing: 'border-box', outline: 'none', fontFamily: 'sans-serif'
              }}
            />
            <button
              onClick={sendComment}
              disabled={sendingComment || !commentText.trim()}
              style={{
                marginTop: 8, padding: '10px 24px', borderRadius: 10, border: 'none',
                background: commentText.trim() ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#2a2a3e',
                color: '#fff', fontWeight: 700, cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                fontSize: 14, transition: 'all 0.2s'
              }}>
              {sendingComment ? 'Отправляем...' : '📨 Отправить'}
            </button>
          </div>

          {/* Список комментариев */}
          {comments.length === 0 && (
            <div style={{ color: '#555', textAlign: 'center', padding: '20px 0', fontSize: 14 }}>
              Пока нет комментариев. Будь первым!
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {comments.map(c => (
              <div key={c.id} style={{ background: '#0f0f1a', borderRadius: 12, padding: '14px 16px', border: '1px solid #2a2a3e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#a78bfa' }}>{c.user_name || 'Аноним'}</span>
                  <span style={{ color: '#555', fontSize: 12 }}>
                    {new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6 }}>{c.text}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { transform: scale(0.8); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        .katex { color: #fcd34d !important; font-size: 1.2em !important; }
        .katex-display { margin: 0 !important; }
      `}</style>
    </div>
  )
}

function Section({ icon, title, color, bg, children }: {
  icon: string
  title: string
  color: string
  bg: string
  children: React.ReactNode
}) {
  return (
    <div style={{ background: bg, border: '1px solid #2a2a3e', borderLeft: `4px solid ${color}`, borderRadius: 20, padding: '24px 28px', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: color }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}