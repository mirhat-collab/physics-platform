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
    const root = document.documentElement
    if (isDark) {
      root.style.setProperty('--bg', '#0f0f1a')
      root.style.setProperty('--bg2', '#1a1a2e')
      root.style.setProperty('--bg3', '#2a2a3e')
      root.style.setProperty('--text', '#ffffff')
      root.style.setProperty('--text2', '#888888')
      root.style.setProperty('--border', '#2a2a3e')
      document.body.style.background = '#0f0f1a'
    } else {
      root.style.setProperty('--bg', '#f0f0f8')
      root.style.setProperty('--bg2', '#ffffff')
      root.style.setProperty('--bg3', '#e8e8f0')
      root.style.setProperty('--text', '#111111')
      root.style.setProperty('--text2', '#555555')
      root.style.setProperty('--border', '#d0d0e0')
      document.body.style.background = '#f0f0f8'
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
      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
      fontSize: 18, transition: 'all 0.2s'
    }} title={dark ? 'Светлая тема' : 'Тёмная тема'}>
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
