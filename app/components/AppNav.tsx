'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Icon from './Icon'

type NavItem = { href: string; icon: string; label: string }
type NavGroup = { title: string; items: NavItem[] }

// Страницы без меню: лендинг, вход, админка, установка приложения
const NO_NAV = ['/', '/login', '/admin', '/install']

function buildGroups(role: string | null): NavGroup[] {
  const groups: NavGroup[] = []
  if (role === 'teacher') {
    groups.push({ title: 'Учитель', items: [
      { href: '/teacher', icon: 'school', label: 'Кабинет учителя' },
      { href: '/bank', icon: 'clipboard', label: 'Банк задач' },
    ] })
  }
  if (role === 'admin') {
    groups.push({ title: 'Администратор', items: [
      { href: '/admin', icon: 'school', label: 'Админка' },
      { href: '/bank', icon: 'clipboard', label: 'Банк задач' },
    ] })
  }
  if (role === 'parent') {
    groups.push({ title: 'Родитель', items: [{ href: '/parent', icon: 'users', label: 'Мои дети' }] })
  }
  groups.push(
    {
      title: 'Учёба',
      items: [
        { href: '/dashboard', icon: 'home', label: 'Главная' },
        { href: '/topics', icon: 'book', label: 'Темы' },
        { href: '/homework', icon: 'clipboard', label: 'Домашние задания' },
        { href: '/stats', icon: 'pie', label: 'Моя статистика' },
      ],
    },
    {
      title: 'Тренировка',
      items: [
        { href: '/formulas', icon: 'formula', label: 'Тренажёр формул' },
        { href: '/ent', icon: 'target', label: 'Подготовка к ЕНТ' },
      ],
    },
    {
      title: 'Соревнования',
      items: [
        { href: '/tournament', icon: 'trophy', label: 'Турниры' },
        { href: '/progress', icon: 'chart', label: 'Рейтинг' },
        { href: '/achievements', icon: 'medal', label: 'Достижения' },
      ],
    },
  )
  return groups
}

// Нижняя панель на телефоне — только самое нужное, остальное в «Меню»
const MOBILE_TABS: NavItem[] = [
  { href: '/dashboard', icon: 'home', label: 'Главная' },
  { href: '/topics', icon: 'book', label: 'Темы' },
  { href: '/formulas', icon: 'formula', label: 'Формулы' },
  { href: '/ent', icon: 'target', label: 'ЕНТ' },
]

function isActive(path: string, href: string) {
  return path === href || path.startsWith(href + '/')
}

export default function AppNav() {
  const path = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  // Меню открыто только на той странице, где его открыли — при переходе закроется само
  const [drawerPath, setDrawerPath] = useState<string | null>(null)
  const drawer = drawerPath === path
  const setDrawer = (open: boolean) => setDrawerPath(open ? path : null)
  const [dark, setDark] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      try { setDark(localStorage.getItem('theme') !== 'light') } catch { /* нет доступа к storage */ }
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('role, full_name, email, avatar_url').eq('id', user.id).single()
      if (p) {
        setRole(p.role)
        setName(p.full_name || p.email || '')
        setAvatar(p.avatar_url || null)
      }
    })
  }, [])

  if (NO_NAV.includes(path)) return null

  const groups = buildGroups(role)

  function toggleTheme() {
    const next = !dark
    setDark(next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch { /* нет доступа к storage */ }
    document.body.classList.toggle('light-theme', !next)
    document.body.style.background = next ? '#0f0f1a' : '#f0f2f8'
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = (name || '?').slice(0, 2).toUpperCase()

  const profileRow = (
    <Link href="/profile" className={`nav-link${isActive(path, '/profile') ? ' active' : ''}`} style={{ padding: '10px 12px' }}>
      <span className="nav-avatar">
        {avatar ? <img src={avatar} alt="" /> : initials}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'Профиль'}</span>
    </Link>
  )

  const groupList = groups.map(g => (
    <div key={g.title} style={{ marginBottom: 18 }}>
      <div className="nav-group-title">{g.title}</div>
      {g.items.map(item => (
        <Link key={item.href} href={item.href} className={`nav-link${isActive(path, item.href) ? ' active' : ''}`}>
          <Icon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </div>
  ))

  const footerActions = (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button onClick={toggleTheme} className="nav-action" title={dark ? 'Светлая тема' : 'Тёмная тема'}>
        <Icon name={dark ? 'sun' : 'moon'} size={18} />
        {dark ? 'Светлая' : 'Тёмная'}
      </button>
      <button onClick={logout} className="nav-action" title="Выйти">
        <Icon name="logout" size={18} />
        Выйти
      </button>
    </div>
  )

  return (
    <>
      {/* Боковое меню — компьютер и планшет */}
      <aside className="app-sidebar">
        <Link href="/dashboard" className="nav-brand">
          <img src="/logo-mark.png" alt="" width={28} height={28} style={{ objectFit: 'contain' }} />
          Mirha_Edu
        </Link>
        <nav style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>{groupList}</nav>
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          {profileRow}
          {footerActions}
        </div>
      </aside>

      {/* Нижняя панель — телефон */}
      <nav className="app-tabbar">
        {MOBILE_TABS.map(item => (
          <Link key={item.href} href={item.href} className={`tab-link${isActive(path, item.href) ? ' active' : ''}`}>
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
        <button onClick={() => setDrawer(true)} className={`tab-link${drawer ? ' active' : ''}`}>
          <Icon name="menu" size={22} />
          <span>Меню</span>
        </button>
      </nav>

      {/* Выдвижное меню со всеми разделами — телефон */}
      {drawer && (
        <div className="drawer-backdrop" onClick={() => setDrawer(false)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              {profileRow}
              <button onClick={() => setDrawer(false)} className="nav-icon-btn" aria-label="Закрыть">
                <Icon name="close" />
              </button>
            </div>
            {groupList}
            <Link href="/install" className="nav-link">
              <Icon name="phone" />
              Установить приложение
            </Link>
            {footerActions}
          </div>
        </div>
      )}
    </>
  )
}
