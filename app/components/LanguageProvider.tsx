'use client'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DATE_LOCALE, LOCALE_COOKIE, makeT, type Locale, type TFunction } from '@/lib/i18n'

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: TFunction; dateLocale: string }

const LanguageContext = createContext<Ctx | null>(null)

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = next
    setLocaleState(next)
    // Серверные страницы (список классов и т.п.) перерисуются на новом языке
    router.refresh()
  }, [router])

  const value = useMemo(() => ({ locale, setLocale, t: makeT(locale), dateLocale: DATE_LOCALE[locale] }), [locale, setLocale])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useT(): Ctx {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useT() вне LanguageProvider')
  return ctx
}
