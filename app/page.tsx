'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MotionConfig, motion } from 'motion/react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useT } from '@/app/components/LanguageProvider'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import HeroTry from '@/app/components/HeroTry'
import { StatsStrip } from '@/app/components/LandingLive'
import { scroll } from '@/app/components/landing/scroll-state'
import { ChapterNav, CursorGlow, Magnetic, Marquee, SplitText, Tilt, TypeFormula } from '@/app/components/landing/Effects'

// 3D-сцена только в браузере: WebGL на сервере не нужен
const PhysicsScene = dynamic(() => import('@/app/components/landing/PhysicsScene'), { ssr: false })

// Плавное появление блока при прокрутке
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 48 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }} transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  )
}

// Переводит прокрутку в номер сцены для 3D: центр главы i на экране → scroll.s = i
function ScrollDriver() {
  useEffect(() => {
    let raf = 0
    const update = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'))
      const mid = window.innerHeight / 2
      let s = 0
      for (const el of els) {
        const r = el.getBoundingClientRect()
        const i = Number(el.dataset.scene)
        if (r.top <= mid) s = i + Math.min(1, (mid - r.top) / r.height) - 0.5
      }
      scroll.s = Math.max(0, Math.min(els.length - 0.4, s))
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [])
  return null
}

// Короткие слова (с, и, к…) не остаются висеть в конце строки
const glue = (text: string) => text.replace(/(^|\s)(\S{1,2})\s/g, '$1$2\u00a0')

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

  // Пока проверяем вход — тёмный экран без вспышки
  if (checking) return <div className="lx-root" aria-busy="true"><span className="sr-only">{t('Загрузка...')}</span></div>

  const chapters = [
    { topic: t('Механика'), title: t('Задачи как на ЕНТ'), text: t('Все темы по спецификации НЦТ. У каждой задачи — решение по шагам, а не просто ответ.'), formula: 'h = v₀² / 2g' },
    { topic: t('Колебания'), title: t('Не понял — спроси'), text: t('Застрял на шаге? ИИ объяснит его другими словами. Хоть пять раз подряд.'), formula: 'T = 2π√(l / g)' },
    { topic: t('Атомная физика'), title: t('Пробный ЕНТ'), text: t('Вариант в формате настоящего экзамена, с таймером. После — разбор каждой ошибки.'), formula: 'E = hν' },
    { topic: t('Гравитация'), title: t('Прогноз балла'), text: t('Видно, сколько наберёшь сейчас и что подтянуть, чтобы дотянуть до гранта.'), formula: 'F = G·m₁m₂ / r²' },
  ]

  // Открытые страницы без входа — и для гостей, и для поисковиков
  const subjects = [
    {
      key: 'phys', title: t('Физика'),
      text: t('Механика, термодинамика, электричество, оптика и атомная физика.'),
      links: [
        { href: `${pre}/podgotovka/fizika`, label: t('Задачи ЕНТ по физике') },
        { href: `${pre}/podgotovka/fizika/formuly`, label: t('Формулы по физике') },
      ],
    },
    {
      key: 'math', title: t('Математика'),
      text: t('Алгебра, уравнения, функции, геометрия и начала анализа.'),
      links: [
        { href: `${pre}/podgotovka/matematika`, label: t('Задачи ЕНТ по математике') },
        { href: `${pre}/podgotovka/matematika/formuly`, label: t('Формулы по математике') },
      ],
    },
  ]

  return (
    <MotionConfig reducedMotion="user">
    <div className="lx-root">
      <PhysicsScene />
      <ScrollDriver />
      <CursorGlow />
      <ChapterNav labels={chapters.map(c => c.topic)} label={t('Главы')} />

      <header className="lx-top">
        <Link href="/" className="lx-brand">
          <img src="/logo-mark.png" alt="" />
          Mirha_Edu
        </Link>
        <div className="lx-top-actions">
          <LanguageSwitcher compact tone="paper" />
          <Link href="/login" className="lx-login">{t('Войти')}</Link>
        </div>
      </header>

      <main id="main">
        <section className="lx-hero" data-scene="0">
          <Reveal>
            <p className="lx-kicker">{t('ЕНТ · физика · математика')}</p>
            <h1 className="lx-h1"><SplitText text={t('Каждая задача.')} /><SplitText text={t('Каждый шаг.')} delay={0.45} className="lx-h1-accent" /></h1>
            <p className="lx-lead">{glue(t('Разбираем ЕНТ по физике и математике так, чтобы ты понял, а не зазубрил. Бесплатно, на русском и казахском.'))}</p>
            <div className="lx-cta">
              <Magnetic><Link href="/login" className="lx-btn lx-shine">{t('Начать бесплатно')}<Arrow /></Link></Magnetic>
              <HeroTry pre={pre} />
            </div>
          </Reveal>
          <p className="lx-hint" aria-hidden>{t('Листай')} ↓</p>
        </section>

        {chapters.map((c, i) => (
          <section key={c.title} className="lx-chapter" data-scene={i + 1} aria-labelledby={`lx-ch-${i}`}>
            <Reveal className="lx-panel lx-glow-border">
              <p className="lx-kicker"><span className="lx-num">0{i + 1}</span> {c.topic}</p>
              <h2 id={`lx-ch-${i}`} className="lx-h2">{c.title}</h2>
              <p className="lx-text">{glue(c.text)}</p>
              <TypeFormula text={c.formula} />
            </Reveal>
          </section>
        ))}

        <Marquee items={['F = ma', 'E = mc²', 'v = v₀ + at', 'a² + b² = c²', 'p = mv', 'D = b² − 4ac', 'I = U / R', 'sin²α + cos²α = 1', 'Q = cmΔt', 'y = kx + b']} />

        <section className="lx-band" aria-label={t('Цифры')}>
          <Reveal>
            <p className="lx-kicker">{t('Уже с нами')}</p>
            <StatsStrip />
          </Reveal>
        </section>

        <section className="lx-band lx-teachers" aria-labelledby="lx-teach">
          <Reveal>
            <p className="lx-kicker">{t('Учителям')}</p>
            <h2 id="lx-teach" className="lx-h2">{t('Класс — как на ладони')}</h2>
            <p className="lx-text">{glue(t('Группа по ссылке или QR-коду, домашка в два клика и отчёт: кто какую тему не понял.'))}</p>
          </Reveal>
        </section>

        <nav className="lx-band" aria-labelledby="lx-open">
          <Reveal>
            <p className="lx-kicker">{t('Открыто без регистрации')}</p>
            <h2 id="lx-open" className="lx-h2">{t('Выбери предмет')}</h2>
          </Reveal>
          <div className="lx-subjects">
            {subjects.map((sub, i) => (
              <Reveal key={sub.key} delay={i * 0.12}>
                <Tilt className={`lx-subject lx-subject-${sub.key}`}>
                <h3>{sub.title}</h3>
                <p>{sub.text}</p>
                <ul role="list">
                  {sub.links.map(l => <li key={l.href}><Link href={l.href}>{l.label}<Arrow /></Link></li>)}
                </ul>
                </Tilt>
              </Reveal>
            ))}
          </div>
          <Link href={`${pre}/podgotovka/stati`} className="lx-more">{t('Всё про ЕНТ: статьи и советы')}<Arrow /></Link>
        </nav>

        <section className="lx-final">
          <Reveal>
            <h2 className="lx-h1 lx-final-title"><span>{t('Начни с одной')}</span><span className="lx-h1-accent">{t('задачи.')}</span></h2>
            <p className="lx-lead">{t('Сегодня. Бесплатно.')}</p>
            <Magnetic><Link href="/login" className="lx-btn lx-shine">{t('Начать бесплатно')}<Arrow /></Link></Magnetic>
          </Reveal>
        </section>
      </main>
    </div>
    </MotionConfig>
  )
}
