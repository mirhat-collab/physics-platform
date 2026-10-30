'use client'
import { usePathname } from 'next/navigation'
import { useT } from '@/app/components/LanguageProvider'

// Подвал с контактами — только на лендинге и странице входа.
// Внутри приложения навигацию рисует AppNav.
export default function LandingFooter() {
  const { t } = useT()
  const path = usePathname()
  if (path !== '/' && path !== '/login') return null

  // На главной и странице входа — подвал в стиле «Тетрадь»
  if (path === '/' || path === '/login') return (
    <footer className="nb-footer">
      <div className="nb-footer-in">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--nb-text)' }}>
          <img src="/logo-mark.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          Mirha_Edu
        </span>
        <div className="nb-footer-links">
          <a href="https://wa.me/77083528305" target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z" /></svg>
            <span className="sr-only">WhatsApp: </span>+7 708 352 8305
          </a>
          <a href="mailto:sultanovmirhat@gmail.com">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
            <span className="sr-only">Email: </span>sultanovmirhat@gmail.com
          </a>
        </div>
        <small>{t('© 2025 Mirha_Edu · Все права защищены')}</small>
      </div>
    </footer>
  )

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
