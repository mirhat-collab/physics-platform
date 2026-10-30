'use client'
import { useEffect, useState } from 'react'
import MathText from '@/app/components/MathText'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import ProtectedFileViewer from '@/app/components/ProtectedFileViewer'
import { useT } from '@/app/components/LanguageProvider'

type MediaItem = { url: string; type: 'image' | 'video' | 'file' | 'link'; name: string }

function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return '📕'
  if (ext === 'doc' || ext === 'docx') return '📘'
  if (ext === 'ppt' || ext === 'pptx') return '📙'
  return '📄'
}

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
    <div className="ls-formulas">
      {lines.map((line, i) => {
        let html = ''
        try {
          html = katex.renderToString(line.trim(), { throwOnError: false, displayMode: true })
        } catch {
          html = `<span style="font-family:monospace">${line}</span>`
        }
        return (
          <div key={i} className="ls-formula"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </div>
  )
}

export default function TopicPage() {
  const { t, dateLocale, locale } = useT()
  const { id } = useParams()
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)
  // Перевод темы на язык интерфейса (делает ИИ на сервере, кэшируется в базе)
  const [translated, setTranslated] = useState<{ locale: string; fields: Partial<Topic> } | null>(null)
  const [translating, setTranslating] = useState(false)
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
  const [viewerItem, setViewerItem] = useState<MediaItem | null>(null)

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

  // Загружаем квиз в фоне сразу после загрузки темы; при смене языка —
  // заново, сервер отдаёт вопросы на языке интерфейса
  useEffect(() => {
    if (!topic) return
    setQuiz(null)
    setQuizDone(false)
    loadQuiz()
  }, [topic, locale])

  useEffect(() => {
    if (!topic || locale === 'ru') return
    let cancelled = false
    setTranslating(true)
    fetch('/api/translate/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: topic.id }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (!cancelled && data?.fields) setTranslated({ locale, fields: data.fields }) })
      .catch(() => { /* покажем русский оригинал */ })
      .finally(() => { if (!cancelled) setTranslating(false) })
    return () => { cancelled = true }
  }, [topic, locale])

  async function loadQuiz() {
    if (!topic) return
    setQuizLoading(true)
    setQuizError(false)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id, topicName: topic.name, theory: topic.theory, formulas: topic.formulas, examples: topic.examples })
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
    if (profile) setUserName(profile.full_name || profile.email || t('Аноним'))

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
    <div className="nb-root" aria-busy="true">
      <div className="app-page"><span className="sr-only">{t('Загрузка...')}</span></div>
    </div>
  )

  const view = topic && locale !== 'ru' && translated?.locale === locale ? { ...topic, ...translated.fields } : topic

  if (!topic) return (
    <div className="nb-root">
      <div className="app-page">
        <Link href="/topics" className="ls-back">← {t('Все темы')}</Link>
        <p className="tp-empty">{t('Тема не найдена')}</p>
      </div>
    </div>
  )

  // Разделы конспекта — нумеруются только те, что есть у темы
  const sections = [
    topic.theory && { key: 'theory', title: t('Теория'), body: <p className="ls-text">{view?.theory}</p> },
    topic.formulas && { key: 'formulas', title: t('Формулы'), body: <FormulaBlock text={topic.formulas} /> },
    topic.examples && { key: 'examples', title: t('Примеры'), body: <p className="ls-text">{view?.examples}</p> },
    topic.tasks && { key: 'tasks', title: t('Практика'), body: <p className="ls-text">{view?.tasks}</p> },
    topic.resource && {
      key: 'resource', title: t('Образовательный ресурс'),
      body: <a href={topic.resource} target="_blank" rel="noopener noreferrer" className="nb-link">{t('Открыть ресурс')} ↗</a>,
    },
    topic.media && topic.media.length > 0 && {
      key: 'media', title: t('Материалы'),
      body: (
        <div className="ls-media">
          {topic.media.map((item, i) => (
            <button key={i} type="button" className="ls-file"
              onClick={() => item.type === 'link' ? window.open(item.url, '_blank', 'noopener,noreferrer') : setViewerItem(item)}>
              <span aria-hidden>{item.type === 'image' ? '🖼' : item.type === 'video' ? '🎬' : item.type === 'link' ? '🔗' : fileIcon(item.name)}</span>
              <span className="ls-file-name">{item.name}</span>
              <span className="ls-file-open">{t('Открыть')} ↗</span>
            </button>
          ))}
        </div>
      ),
    },
  ].filter(Boolean) as { key: string; title: string; body: React.ReactNode }[]

  return (
    <div className="nb-root">
      <div className="app-page ls-page">
        <Link href="/topics" className="ls-back">← {t('Все темы')}</Link>

        <header className="ls-head">
          <div>
            {topic.grade && <p className="nb-eyebrow">{t(topic.grade)}</p>}
            <h1 className="dash-name">{view?.name}</h1>
            {locale !== 'ru' && (translating || translated?.locale === locale) && (
              <p className="dash-meta">{translating ? t('Переводим тему…') : t('Переведено ИИ — возможны неточности')}</p>
            )}
          </div>
          <button type="button" onClick={toggleBookmark} aria-pressed={bookmarked}
            className={`ls-bookmark${bookmarked ? ' on' : ''}`}
            title={bookmarked ? t('Убрать из закладок') : t('Добавить в закладки')}
            aria-label={bookmarked ? t('Убрать из закладок') : t('Добавить в закладки')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><path d="M6 3h12v18l-6-4-6 4z" /></svg>
          </button>
        </header>

        <article className="ls-sheet">
          {sections.map((sec, n) => (
            <section key={sec.key} className="ls-section" aria-labelledby={`ls-${sec.key}`}>
              <h2 id={`ls-${sec.key}`} className="ls-h"><span className="ls-n">§{n + 1}</span>{sec.title}</h2>
              {sec.body}
            </section>
          ))}
        </article>

        {viewerItem && (
          <ProtectedFileViewer
            fileUrl={viewerItem.url}
            fileName={viewerItem.name}
            watermarkLabel={`Mirha_Edu · ${userName || t('Ученик')} · ${new Date().toLocaleString(dateLocale)}`}
            onClose={() => setViewerItem(null)}
          />
        )}

        {showXP && (
          <div className="ls-xp-backdrop" role="status">
            <div className="ls-xp">
              <svg viewBox="0 0 30 30" aria-hidden><path d="M4 15 C 7 18, 9 21, 11 25 C 15 15, 20 8, 27 3" /></svg>
              <p className="ls-xp-t">{t('Тема завершена!')}</p>
              <p className="ls-xp-n">+10 XP</p>
              <p className="ls-xp-s">{t('Продолжай в том же духе!')}</p>
            </div>
          </div>
        )}

        <div className="ls-actions">
          {completed ? (
            <p className="ls-done">
              <svg viewBox="0 0 30 30" aria-hidden><path d="M4 15 C 7 18, 9 21, 11 25 C 15 15, 20 8, 27 3" /></svg>
              <span><b>{t('Тема пройдена')}</b><br />{t('Отличная работа! Ты уже прошёл эту тему.')}</span>
            </p>
          ) : (
            <button type="button" className="nb-btn ls-btn" onClick={markCompleted} disabled={marking}>
              {marking ? t('Сохраняем…') : t('Завершить тему · +10 XP')}
            </button>
          )}
          <button type="button" className="try-open ls-btn" onClick={startQuiz}>
            {quizLoading ? t('Готовим вопросы…') : t('Проверить знания')}
          </button>
        </div>

        {showQuiz && (
          <section className="ls-card" aria-labelledby="ls-quiz">
            <h2 id="ls-quiz" className="app-h2">{t('Мини-тест по теме')}</h2>
            {quizLoading && <p className="ls-muted">{t('ИИ готовит вопросы…')}</p>}
            {!quizLoading && quizError && (
              <div className="ls-muted">
                <p>{t('Не удалось загрузить вопросы')}</p>
                <button type="button" className="btn btn-ghost" onClick={loadQuiz}>{t('Попробовать снова')}</button>
              </div>
            )}
            {!quizLoading && quiz && quiz.map((q, qi) => (
              <div key={qi} className="ls-q">
                <MathText text={`${qi + 1}. ${q.question}`} style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }} />
                <div className="ls-opts">
                  {q.options.map((opt, ai) => {
                    const isSelected = quizAnswers[qi] === ai
                    const isCorrect = q.correct === ai
                    const state = quizDone ? (isCorrect ? ' is-right' : isSelected ? ' is-wrong' : '') : isSelected ? ' is-picked' : ''
                    return (
                      <button key={ai} type="button" aria-pressed={isSelected} disabled={quizDone}
                        className={`try-opt ls-opt${state}`} onClick={() => answerQuestion(qi, ai)}>
                        <MathText text={opt} />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {!quizLoading && quiz && !quizDone && (
              <button type="button" className="nb-btn ls-btn" onClick={submitQuiz} disabled={quizAnswers.some(a => a === null)}>
                {t('Проверить ответы')}
              </button>
            )}
            {quizDone && (
              <div className="ls-result" aria-live="polite">
                <p className="try-verdict">{t('{a} из {b} правильно', { a: quizScore, b: quiz?.length ?? 0 })}</p>
                <p className="ls-muted">
                  {quizScore === 4 ? t('Отлично! Ты отлично знаешь тему!') : quizScore >= 3 ? t('Хорошо! Почти всё правильно!') : quizScore >= 2 ? t('Неплохо, но стоит повторить материал') : t('Советуем перечитать теорию ещё раз')}
                </p>
                <button type="button" className="btn btn-ghost" onClick={() => { setQuizAnswers(new Array(quiz?.length ?? 0).fill(null)); setQuizDone(false) }}>
                  {t('Пройти снова')}
                </button>
              </div>
            )}
          </section>
        )}

        <section className="ls-card" aria-labelledby="ls-comments">
          <h2 id="ls-comments" className="app-h2">{t('Вопросы и комментарии')}</h2>
          <label className="auth-field">
            <span className="sr-only">{t('Задай вопрос или оставь комментарий...')}</span>
            <textarea className="auth-input ls-textarea" rows={3} value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder={t('Задай вопрос или оставь комментарий...')} />
          </label>
          <button type="button" className="nb-btn ls-send" onClick={sendComment} disabled={sendingComment || !commentText.trim()}>
            {sendingComment ? t('Отправляем...') : t('Отправить')}
          </button>
          {comments.length === 0 ? (
            <p className="ls-muted">{t('Пока нет комментариев. Будь первым!')}</p>
          ) : (
            <ul className="ls-comments" role="list">
              {comments.map(c => (
                <li key={c.id}>
                  <div className="ls-c-head">
                    <b>{c.user_name || t('Аноним')}</b>
                    <span>{new Date(c.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p>{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
