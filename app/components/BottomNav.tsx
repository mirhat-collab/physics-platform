'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const path = usePathname()

  const items = [
    { href: '/dashboard', icon: '🏠', label: 'Главная' },
    { href: '/topics', icon: '📚', label: 'Темы' },
    { href: '/homework', icon: '📝', label: 'Задания' },
    { href: '/tournament', icon: '🏆', label: 'Турниры' },
    { href: '/profile', icon: '👤', label: 'Профиль' },
  ]

  if (path === '/admin') return null

  const isLanding = path === '/' || path === '/login'

  if (isLanding) {
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
        <div style={{ marginTop: 12, fontSize: 11, color: '#555' }}>© 2025 Mirha_Edu · Все права защищены</div>
      </div>
    )
  }

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
      background: '#12122a', borderTop: '1px solid #2a2a3e',
      display: 'flex', height: 64,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map(item => {
        const active = path.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', gap: 2,
            background: 'transparent', position: 'relative',
          }}>
            <span style={{ fontSize: 22, display: 'inline-block', transform: active ? 'scale(1.15) translateY(-1px)' : 'scale(1)', transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#a78bfa' : '#555', transition: 'color 0.2s' }}>
              {item.label}
            </span>
            {active && (
              <div className="animate-scale-in" style={{ position: 'absolute', bottom: 0, width: 32, height: 3, background: 'linear-gradient(90deg,#667eea,#a78bfa)', borderRadius: '3px 3px 0 0', boxShadow: '0 0 8px rgba(167,139,250,0.6)' }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}