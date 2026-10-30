'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Icon from '@/app/components/Icon'
import { sortTopicsByNumber } from '@/lib/topic-order'
import EntCoach from '@/app/components/EntCoach'
import { useT } from '@/app/components/LanguageProvider'
import { useTranslatedNames } from '@/app/components/useTranslatedNames'

type Profile = { id: string; full_name: string; email: string; grade: string; total_xp: number; streak: number }
type Topic = { id: string; name: string; grade: string }

const VALID_GRADES = ['7', '8', '9', '10', '11']

export default function DashboardPage() {
  const { t } = useT()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [completed, setCompleted] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const topicName = useTranslatedNames('topic', topics.map(t => t.id))

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (p) setProfile(p)

    const safeGrade = p?.grade && VALID_GRADES.includes(p.grade) ? p.grade : null
    if (safeGrade) {
      const { data: t } = await supabase.from('topics').select('*').eq('grade', safeGrade)
      if (t) setTopics(t)
    }

    const { data: prog } = await supabase
      .from('progress').select('topic')
      .eq('student', user.id).eq('status', 'completed')
    // progress.topic хранится текстом, а topics.id — число: сравниваем строками
    if (prog) setCompleted(prog.map(p => String(p.topic)))

    setLoading(false)
  }

  if (loading) return (
    <div className="nb-root" aria-busy="true">
      <div className="app-page"><span className="sr-only">{t('Загрузка...')}</span></div>
    </div>
  )

  const gradeDisplay = profile?.grade && VALID_GRADES.includes(profile.grade) ? t('{grade} класс', { grade: profile.grade }) : t('Класс не указан')
  const doneCount = topics.filter(t => completed.includes(String(t.id))).length
  const percent = topics.length > 0 ? Math.round((doneCount / topics.length) * 100) : 0
  const nextTopic = sortTopicsByNumber(topics).find(t => !completed.includes(String(t.id)))
  const level = Math.floor((profile?.total_xp || 0) / 100) + 1
  const xpInLevel = (profile?.total_xp || 0) % 100

  const tools = [
    { href: '/ent', icon: 'target', title: t('Подготовка к ЕНТ'), text: t('Задания уровня ЕНТ с разбором от ИИ') },
    { href: '/formulas', icon: 'formula', title: t('Тренажёр формул'), text: t('Собери формулу из букв — физика и математика') },
    { href: '/topics', icon: 'book', title: t('Все темы'), text: t('Теория, формулы и тесты по классам') },
    { href: '/progress', icon: 'chart', title: t('Прогресс'), text: t('Твой XP и успехи классов') },
  ]

  return (
    <div className="nb-root">
      <div className="app-page">
        <header className="dash-head">
          <p className="nb-eyebrow">{t('Добро пожаловать')}</p>
          <h1 className="dash-name">{profile?.full_name || profile?.email}</h1>
          <p className="dash-meta">{gradeDisplay} · {t('Уровень')} {level}</p>
        </header>

        <ul className="nb-stats dash-stats" role="list">
          <li><span className="nb-stat-n">{profile?.total_xp ?? 0}</span><span className="nb-stat-l">{t('Всего XP')}</span></li>
          <li><span className="nb-stat-n">{profile?.streak ?? 0}</span><span className="nb-stat-l">{t('Дней подряд')}</span></li>
          <li><span className="nb-stat-n">{percent}%</span><span className="nb-stat-l">{t('Пройдено тем')}</span></li>
        </ul>
        <div className="dash-level">
          <div className="dash-level-row"><span>{t('До уровня {n}', { n: level + 1 })}</span><span>{xpInLevel} / 100 XP</span></div>
          <div className="app-bar" role="progressbar" aria-valuenow={xpInLevel} aria-valuemin={0} aria-valuemax={100} aria-label={t('До уровня {n}', { n: level + 1 })}>
            <span style={{ width: `${xpInLevel}%` }} />
          </div>
        </div>

        {nextTopic && (
          <Link href={`/topics/${nextTopic.id}`} className="dash-next">
            <span className="dash-next-k">{t('Следующая тема')}</span>
            <span className="dash-next-t">{topicName(nextTopic.id, nextTopic.name)}</span>
            <span className="nb-btn">{t('Начать · +10 XP')}</span>
          </Link>
        )}

        <EntCoach />

        {topics.length > 0 && (
          <section className="dash-block" aria-labelledby="dash-class">
            <div className="dash-class">
              <div className="dash-class-row">
                <b id="dash-class">{t('Прогресс класса')}</b>
                <span>{doneCount} / {topics.length} {t('тем')}</span>
              </div>
              <div className="app-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-labelledby="dash-class">
                <span style={{ width: `${percent}%` }} />
              </div>
            </div>
          </section>
        )}

        <section className="dash-block" aria-labelledby="dash-tools">
          <h2 id="dash-tools" className="app-h2">{t('Тренировка')}</h2>
          <div className="dash-tools">
            {tools.map(c => (
              <Link key={c.href} href={c.href} className="dash-tool">
                <span className="dash-tool-i"><Icon name={c.icon} size={20} /></span>
                <span><b>{c.title}</b><small>{c.text}</small></span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
