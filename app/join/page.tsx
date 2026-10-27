'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinPath } from '@/lib/groups'
import { useT } from '@/app/components/LanguageProvider'

// Вступить в группу по коду, который продиктовал учитель
export default function JoinByCode() {
  const { t } = useT()
  const router = useRouter()
  const [code, setCode] = useState('')
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form className="card" style={{ maxWidth: 400, width: '100%', padding: 32, textAlign: 'center', color: 'var(--text)' }}
        onSubmit={e => { e.preventDefault(); if (clean.length >= 4) router.push(joinPath(clean)) }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px' }}>{t('Вступить в группу')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 16px' }}>{t('Введи код, который дал учитель.')}</p>
        <input className="input" value={code} onChange={e => setCode(e.target.value)} autoFocus placeholder="ABC123" maxLength={12}
          style={{ width: '100%', textAlign: 'center', fontSize: 22, letterSpacing: 4, fontFamily: 'monospace', marginBottom: 12 }} />
        <button className="btn" type="submit" disabled={clean.length < 4} style={{ width: '100%' }}>{t('Продолжить')}</button>
      </form>
    </div>
  )
}
