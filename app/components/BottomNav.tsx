'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const path = usePathname()

  const items = [
    { href: '/dashboard', icon: '🏠', label: 'Главная' },
    { href: '/topics', icon: '📚', label: 'Темы' },
    { href: '/homework', icon: '📝', label: 'Задания' },
    { href: '/progress', icon: '🏆', label: 'Рейтинг' },
    { href: '/profile', icon: '👤', label: 'Профиль' },
  ]

  if (path === '/admin') return null

  const isLanding = path === '/' || path === '/login'

  if (isLanding) {
    return (
      <div style={{ background: '#0a0a14', borderTop: '1px solid #2a2a3e', padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ marginBottom: 12, fontWeight: 600, color: '#fff', fontSize: 14 }}>⚡ Physics Platform</div>
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
        <div style={{ marginTop: 12, fontSize: 11, color: '#555' }}>© 2025 Physics Platform · Все права защищены</div>
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
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#a78bfa' : '#555', transition: 'color 0.2s' }}>
              {item.label}
            </span>
            {active && (
              <div style={{ position: 'absolute', bottom: 0, width: 32, height: 3, background: '#a78bfa', borderRadius: '3px 3px 0 0' }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}