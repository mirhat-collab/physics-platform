'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinPath } from '@/lib/groups'
import Link from 'next/link'
import { useT } from '@/app/components/LanguageProvider'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'

// Вступить в группу по коду, который продиктовал учитель
export default function JoinByCode() {
  const { t } = useT()
  const router = useRouter()
  const [code, setCode] = useState('')
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return (
    <div className="nb-root">
      <div className="nb-wrap">
        <header className="nb-top">
          <Link href="/" className="nb-brand" aria-label={t('На главную')}>
            <img src="/logo-mark.png" alt="" />
            Mirha_Edu
          </Link>
          <LanguageSwitcher compact tone="paper" />
        </header>
        <main className="join">
          <form className="auth-sheet join-sheet" onSubmit={e => { e.preventDefault(); if (clean.length >= 4) router.push(joinPath(clean)) }}>
            <p className="nb-kicker">{t('Группа учителя')}</p>
            <h1 className="auth-title">{t('Вступить в группу')}</h1>
            <p className="auth-sub">{t('Введи код, который дал учитель.')}</p>
            <input className="auth-input join-code" value={code} onChange={e => setCode(e.target.value)} autoFocus placeholder="ABC123" maxLength={12}
              aria-label={t('Код группы')} autoCapitalize="characters" autoComplete="off" />
            <button className="nb-btn auth-submit" type="submit" disabled={clean.length < 4}>{t('Продолжить')}</button>
          </form>
        </main>
      </div>
    </div>
  )
}
