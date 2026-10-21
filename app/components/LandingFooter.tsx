'use client'
import { usePathname } from 'next/navigation'
import { useT } from '@/app/components/LanguageProvider'

// Подвал с контактами — только на лендинге и странице входа.
// Внутри приложения навигацию рисует AppNav.
export default function LandingFooter() {
  const { t } = useT()
  const path = usePathname()
  if (path !== '/' && path !== '/login') return null

  return (
    <div style={{ background: '#0a0a14', borderTop: '1px solid #2a2a3e', padding: '20px 24px', textAlign: 'center' }}>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, color: '#fff', fontSize: 14 }}>
        <img src="/logo-mark.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
        Mirha_Edu
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <a href="https://wa.me/77083528305" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>
          📱 +7 708 352 8305
        </a>
        <a href="mailto:sultanovmirhat@gmail.com"
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60a5fa', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>
          ✉️ sultanovmirhat@gmail.com
        </a>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: '#555' }}>{t('© 2025 Mirha_Edu · Все права защищены')}</div>
    </div>
  )
}
