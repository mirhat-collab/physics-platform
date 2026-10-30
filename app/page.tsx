'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useT } from '@/app/components/LanguageProvider'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import HandwrittenFormulas from '@/app/components/HandwrittenFormulas'

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export default function LobbyPage() {
  const { t, locale } = useT()
  const pre = locale === 'kk' ? '/kk' : ''
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  // Пока проверяем вход — чистый лист, без вспышки старого фона
  if (checking) return <div className="nb-root" aria-busy="true"><span className="sr-only">{t('Загрузка...')}</span></div>

  const features = [
    { title: t('Все темы по спецификации НЦТ'), text: t('Теория, формулы и задачи с подробным решением по физике и математике.') },
    { title: t('Пробный ЕНТ с прогнозом балла'), text: t('Решай варианты в формате настоящего экзамена и узнай, сколько баллов наберёшь.') },
    { title: t('ИИ объяснит непонятный шаг'), text: t('Застрял в решении? Нажми на шаг — и получи объяснение простыми словами.') },
    { title: t('Для учителей'), text: t('Группы по ссылке и QR-коду, домашние задания и отчёты по каждому ученику.') },
  ]

  // Открытые страницы без входа — и для гостей, и для поисковиков
  const open = [
    { href: `${pre}/podgotovka/fizika`, label: t('Задачи ЕНТ по физике') },
    { href: `${pre}/podgotovka/matematika`, label: t('Задачи ЕНТ по математике') },
    { href: `${pre}/podgotovka/fizika/formuly`, label: t('Формулы по физике') },
    { href: `${pre}/podgotovka/matematika/formuly`, label: t('Формулы по математике') },
    { href: `${pre}/podgotovka/stati`, label: t('Всё про ЕНТ: статьи и советы') },
  ]

  return (
    <div className="nb-root">
      <div className="nb-wrap">
        <header className="nb-top">
          <Link href="/" className="nb-brand">
            <img src="/logo-mark.png" alt="" />
            Mirha_Edu
          </Link>
          <div className="nb-top-actions">
            <LanguageSwitcher compact tone="paper" />
            <Link href="/login" className="nb-top-login">{t('Войти')}</Link>
          </div>
        </header>

        <main id="main">
        <section className="nb-hero">
          <div className="nb-hero-text">
            <p className="nb-eyebrow">{t('ЕНТ · физика и математика')}</p>
            <h1 className="nb-h1">{t('Подготовка к ЕНТ')}</h1>
            <svg className="nb-underline" viewBox="0 0 420 18" preserveAspectRatio="none" aria-hidden>
              <path pathLength={1} d="M3 12 C 80 5, 190 4, 300 8 S 400 12, 416 6" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
            <p className="nb-lead">{t('Физика и математика: задачи ЕНТ с решением, пробный ЕНТ онлайн, рейтинг и XP. Бесплатно.')}</p>
            <div className="nb-cta">
              <Link href="/login" className="nb-btn">{t('Начать бесплатно')}<Arrow /></Link>
              <Link href="/login" className="nb-link">{t('У меня уже есть аккаунт')}</Link>
            </div>
            <p className="nb-note">{t('Бесплатно · на русском и казахском')}</p>
          </div>
          <div className="nb-hero-art">
            <HandwrittenFormulas />
          </div>
        </section>

        <section className="nb-section" aria-labelledby="nb-inside">
          <h2 id="nb-inside" className="nb-h2">{t('Всё для ЕНТ — в одной тетради')}</h2>
          <ol className="nb-features" role="list">
            {features.map((f, i) => (
              <li key={f.title} className="nb-feature">
                <span className="nb-feature-num" aria-hidden>{i + 1}.</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <nav className="nb-section" aria-labelledby="nb-open">
          <h2 id="nb-open" className="nb-h2">{t('Открыто без регистрации')}</h2>
          <ul className="nb-toc" role="list">
            {open.map(o => (
              <li key={o.href}>
                <Link href={o.href}>{o.label}<span className="nb-toc-dots" aria-hidden /></Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="nb-final">
          <p className="nb-final-hand">{t('Удачи на ЕНТ!')}</p>
          <p>{t('Начни с одной задачи — сегодня.')}</p>
          <Link href="/login" className="nb-btn">{t('Начать бесплатно')}<Arrow /></Link>
        </section>
        </main>
      </div>
    </div>
  )
}
