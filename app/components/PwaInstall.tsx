'use client'
import { useEffect, useState } from 'react'

export default function PwaInstall() {
  const [prompt, setPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Регистрируем service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Ловим событие установки
    const handler = (e: any) => {
      e.preventDefault()
      setPrompt(e)
      const dismissed = localStorage.getItem('pwaInstallDismissed')
      if (!dismissed) setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
  }

  function dismiss() {
    setShow(false)
    localStorage.setItem('pwaInstallDismissed', '1')
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: 16, padding: '14px 20px', display: 'flex',
      alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(102,126,234,0.5)',
      maxWidth: 360, width: '90%', animation: 'slideUp 0.4s ease'
    }}>
      <span style={{ fontSize: 28 }}>📲</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>Установи как приложение</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Работает без интернета!</div>
      </div>
      <button onClick={install} style={{
        background: '#fff', border: 'none', borderRadius: 8,
        color: '#667eea', cursor: 'pointer', padding: '6px 12px',
        fontSize: 12, fontWeight: 700
      }}>Установить</button>
      <button onClick={dismiss} style={{
        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
        color: '#fff', cursor: 'pointer', padding: '4px 8px', fontSize: 14
      }}>✕</button>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
    </div>
  )
}
