'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const path = usePathname()

  const items = [
    { href: '/classes', icon: '🏠', label: 'Главная' },
    { href: '/topics', icon: '📚', label: 'Темы' },
    { href: '/progress', icon: '🏆', label: 'Рейтинг' },
    { href: '/profile', icon: '👤', label: 'Профиль' },
  ]

  const hide = ['/', '/login', '/admin']
  if (hide.includes(path)) return null

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
      background: '#12122a',
      borderTop: '1px solid #2a2a3e',
      display: 'flex',
      height: 64,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map(item => {
        const active = path.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', gap: 2,
            background: 'transparent',
          }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: active ? '#a78bfa' : '#555',
              transition: 'color 0.2s',
            }}>
              {item.label}
            </span>
            {active && (
              <div style={{
                position: 'absolute', bottom: 0,
                width: 32, height: 3,
                background: '#a78bfa',
                borderRadius: '3px 3px 0 0',
              }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}