'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { sortTopicsByNumber } from '@/lib/topic-order'
import { useT } from '@/app/components/LanguageProvider'
import { useTranslatedNames } from '@/app/components/useTranslatedNames'

type Topic = {
  id: string
  name: string
  theory: string
  formulas: string
  grade: string
}

const GRADE_ORDER = ['7', '8', '9', '10', '11']

export default function TopicsPage() {
  const { t } = useT()
  const [topics, setTopics] = useState<Topic[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'recent' | 'bookmarked'>('all')
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const topicName = useTranslatedNames('topic', topics.map(t => t.id))

  useEffect(() => {
    load()
    try {
      const recent = JSON.parse(localStorage.getItem('recentTopics') || '[]')
      setRecentIds(Array.isArray(recent) ? recent : [])
    } catch { setRecentIds([]) }
    try {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
      setBookmarkIds(new Set(Array.isArray(bookmarks) ? bookmarks : []))
    } catch { setBookmarkIds(new Set()) }
  }, [])

  async function load() {
    const { data } = await supabase.from('topics').select('*')
    if (data) setTopics(sortTopicsByNumber(data))

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: progress } = await supabase
        .from('progress').select('topic')
        .eq('student', user.id).eq('status', 'completed')
      if (progress && data) {
        const progressTopics = new Set(progress.map(p => String(p.topic)))
        const ids = new Set(
          data.filter(t => progressTopics.has(String(t.id)) || progressTopics.has(t.name)).map(t => t.id)
        )
        setCompletedIds(ids)
      }
    }
    setLoading(false)
  }

  const knownGrades = GRADE_ORDER.filter(g =>
    topics.some(t => t.grade === g || t.grade === `${g}th Grade`)
  )
  const otherGrades = Array.from(new Set(
    topics
      .map(t => t.grade?.replace('th Grade', ''))
      .filter((g): g is string => !!g && !GRADE_ORDER.includes(g))
  )).sort()
  const grades = ['all', ...knownGrades, ...otherGrades]

  let filtered = gradeFilter === 'all'
    ? topics
    : topics.filter(t => t.grade === gradeFilter || t.grade === `${gradeFilter}th Grade`)

  if (statusFilter === 'completed') {
    filtered = filtered.filter(t => completedIds.has(t.id) || completedIds.has(String(t.id)))
  } else if (statusFilter === 'bookmarked') {
    filtered = filtered.filter(t => bookmarkIds.has(String(t.id)))
  } else if (statusFilter === 'recent') {
    const recentSet = new Set(recentIds)
    filtered = filtered.filter(t => recentSet.has(t.id) || recentSet.has(String(t.id)))
    filtered = [...filtered].sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id))
  }

  // Поиск по названию темы
  if (search.trim()) {
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      topicName(t.id, t.name).toLowerCase().includes(search.toLowerCase())
    )
  }

  const progressPercent = topics.length > 0 ? Math.round((completedIds.size / topics.length) * 100) : 0

  if (loading) return (
    <div className="nb-root" aria-busy="true">
      <div className="app-page"><span className="sr-only">{t('Загрузка...')}</span></div>
    </div>
  )

  const statusTabs = [
    { key: 'all', label: t('Все темы') },
    { key: 'completed', label: t('Изученные') },
    { key: 'bookmarked', label: t('Закладки') },
    { key: 'recent', label: t('Недавние') },
  ] as const

  // Запомнить тему в «Недавних» при переходе
  const remember = (id: string) => {
    try {
      const recent: string[] = JSON.parse(localStorage.getItem('recentTopics') || '[]')
      const updated = [id, ...(Array.isArray(recent) ? recent : []).filter(x => x !== id)].slice(0, 20)
      localStorage.setItem('recentTopics', JSON.stringify(updated))
    } catch { /* нет доступа к storage */ }
  }

  return (
    <div className="nb-root">
      <div className="app-page">
        <header className="dash-head">
          <p className="nb-eyebrow">{t('Учёба')}</p>
          <h1 className="dash-name">{t('Темы')}</h1>
          <p className="dash-meta">{t('Выбери тему и начни изучать')}</p>
        </header>

        <ul className="nb-stats dash-stats" role="list">
          <li><span className="nb-stat-n">{topics.length}</span><span className="nb-stat-l">{t('тем всего')}</span></li>
          <li><span className="nb-stat-n">{completedIds.size}</span><span className="nb-stat-l">{t('изучено')}</span></li>
          <li><span className="nb-stat-n">{grades.length - 1}</span><span className="nb-stat-l">{t('классов')}</span></li>
        </ul>
        <div className="dash-level">
          <div className="dash-level-row"><span>{t('Твой прогресс')}</span><span>{completedIds.size} / {topics.length} · {progressPercent}%</span></div>
          <div className="app-bar" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={t('Твой прогресс')}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="tp-tools">
          <label className="tp-search">
            <span className="sr-only">{t('Поиск')}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Поиск темы...')} />
          </label>
          <div className="tp-chips" role="group" aria-label={t('Класс')}>
            {grades.map(g => (
              <button key={g} type="button" aria-pressed={gradeFilter === g} className={`chip${gradeFilter === g ? ' on' : ''}`} onClick={() => setGradeFilter(g)}>
                {g === 'all' ? t('Все') : t('{g} класс', { g })}
              </button>
            ))}
          </div>
          <div className="auth-tabs tp-status" role="tablist" aria-label={t('Темы')}>
            {statusTabs.map(({ key, label }) => (
              <button key={key} type="button" role="tab" aria-selected={statusFilter === key} className={statusFilter === key ? 'on' : ''} onClick={() => setStatusFilter(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="tp-empty">
            {search ? t('😕 Ничего не найдено по запросу "{search}"', { search: search }) : statusFilter === 'completed' ? t('😅 Ты ещё не изучил ни одной темы') : statusFilter === 'bookmarked' ? t('🔖 Нет сохранённых тем — нажми 📌 на странице темы') : t('😅 Нет недавно открытых тем')}
          </p>
        ) : (
          <ol className="tp-list" role="list">
            {filtered.map(topic => {
              const grade = topic.grade.replace('th Grade', '')
              const isDone = completedIds.has(topic.id) || completedIds.has(String(topic.id))
              return (
                <li key={topic.id}>
                  <Link href={`/topics/${topic.id}`} className={`tp-row${isDone ? ' done' : ''}`} onClick={() => remember(topic.id)}>
                    <span className="tp-grade" aria-label={t('{g} класс', { g: grade })}>{grade}</span>
                    <span className="tp-body">
                      <span className="tp-title">{topicName(topic.id, topic.name)}</span>
                      {topic.theory && <span className="tp-snippet">{topic.theory.slice(0, 110)}…</span>}
                    </span>
                    {isDone && (
                      <span className="tp-done" title={t('Изучено')}>
                        <svg viewBox="0 0 30 30" aria-hidden><path d="M4 15 C 7 18, 9 21, 11 25 C 15 15, 20 8, 27 3" /></svg>
                        <span className="sr-only">{t('Изучено')}</span>
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
