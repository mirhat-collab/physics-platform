'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved !== 'light'
    setDark(isDark)
    applyTheme(isDark)
  }, [])

  function applyTheme(isDark: boolean) {
    if (isDark) {
      document.body.classList.remove('light-theme')
      document.body.style.background = '#0f0f1a'
    } else {
      document.body.classList.add('light-theme')
      document.body.style.background = '#f0f2f8'
    }
  }

  function toggle() {
    const next = !dark
    setDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    applyTheme(next)
  }

  return (
    <button onClick={toggle} style={{
      background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      border: dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)',
      borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
      fontSize: 18, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6
    }} title={dark ? 'Светлая тема' : 'Тёмная тема'}>
      {dark ? '☀️' : '🌙'}
      <span style={{ fontSize: 12, fontWeight: 600, color: dark ? '#888' : '#555' }}>
        {dark ? 'Светлая' : 'Тёмная'}
      </span>
    </button>
  )
}
