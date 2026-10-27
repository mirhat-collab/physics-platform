'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useT } from '@/app/components/LanguageProvider'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'

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

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>{t('Загрузка...')}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}><LanguageSwitcher compact /></div>

      {/* Декоративное свечение на фоне */}
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(102,126,234,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <img
        src="/logo-mark.png"
        alt="Mirha_Edu"
        className="animate-float"
        style={{ width: 96, height: 96, objectFit: 'contain', marginBottom: 20, filter: 'drop-shadow(0 8px 24px rgba(102,126,234,0.45))', position: 'relative' }}
      />

      <h1 className="animate-fade-in-up" style={{ fontSize: '2.6rem', fontWeight: 900, margin: '0 0 12px', textAlign: 'center', background: 'linear-gradient(135deg, #a78bfa, #667eea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative' }}>
        {t('Подготовка к ЕНТ')}
      </h1>
      <p className="animate-fade-in-up" style={{ color: '#888', fontSize: 16, textAlign: 'center', maxWidth: 380, marginBottom: 48, lineHeight: 1.6, animationDelay: '0.08s', position: 'relative' }}>
        {t('Физика и математика: задачи ЕНТ с решением, пробный ЕНТ онлайн, рейтинг и XP. Бесплатно.')}
      </p>

      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 500, width: '100%', marginBottom: 40, position: 'relative' }}>
        {[
          { icon: '📚', label: t('Темы по классам') },
          { icon: '🏆', label: t('Рейтинг и XP') },
          { icon: '🔥', label: t('Стрики побед') },
        ].map(f => (
          <div key={f.label} className="hover-lift" style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 12px', textAlign: 'center', border: '1px solid #2a2a3e' }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{f.label}</div>
          </div>
        ))}
      </div>

      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320, animationDelay: '0.2s', position: 'relative' }}>
        <Link href="/login" style={{ textDecoration: 'none' }}>
          <button className="btn-glow" style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            {t('⚡ Войти')}
          </button>
        </Link>
        <Link href="/login" style={{ textDecoration: 'none' }}>
          <button className="btn-glow" style={{ width: '100%', padding: '16px', borderRadius: 14, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#a78bfa', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            {t('🚀 Зарегистрироваться')}
          </button>
        </Link>
      </div>

      {/* Открытые страницы без входа — и для гостей, и для поисковиков */}
      <nav aria-label={t('Подготовка к ЕНТ')} style={{ marginTop: 32, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 520, position: 'relative' }}>
        <Link className="chip" href={`${pre}/podgotovka/fizika`} style={{ textDecoration: 'none' }}>{t('Задачи ЕНТ по физике')}</Link>
        <Link className="chip" href={`${pre}/podgotovka/matematika`} style={{ textDecoration: 'none' }}>{t('Задачи ЕНТ по математике')}</Link>
        <Link className="chip" href={`${pre}/podgotovka/fizika/formuly`} style={{ textDecoration: 'none' }}>{t('Формулы по физике')}</Link>
        <Link className="chip" href={`${pre}/podgotovka/matematika/formuly`} style={{ textDecoration: 'none' }}>{t('Формулы по математике')}</Link>
        <Link className="chip" href={`${pre}/podgotovka/stati`} style={{ textDecoration: 'none' }}>{t('Всё про ЕНТ: статьи и советы')}</Link>
      </nav>

    </div>
  )
}