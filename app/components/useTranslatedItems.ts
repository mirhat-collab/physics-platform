'use client'
import { useEffect, useState } from 'react'
import { useT } from './LanguageProvider'

// Переводы ДЗ, турниров и справочника ЕНТ (название, описание, приз) на язык интерфейса
const cache = new Map<string, Record<string, Record<string, string>>>()

export function useTranslatedItems(kind: 'homework' | 'tournament' | 'material', ids: number[]): (id: number, field: string, fallback: string | undefined) => string | undefined {
  const { locale } = useT()
  const key = `${locale}:${kind}`
  const [, setVersion] = useState(0)
  const idsKey = [...ids].sort((a, b) => a - b).join(',')

  useEffect(() => {
    if (locale === 'ru' || !idsKey) return
    const known = cache.get(key) ?? {}
    const missing = idsKey.split(',').filter(id => !(id in known)).map(Number)
    if (!missing.length) return
    let cancelled = false
    fetch('/api/translate/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, ids: missing }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data?.items) return
        cache.set(key, { ...(cache.get(key) ?? {}), ...data.items })
        if (!cancelled) setVersion(v => v + 1)
      })
      .catch(() => { /* остаётся оригинал */ })
    return () => { cancelled = true }
  }, [key, kind, locale, idsKey])

  return (id, field, fallback) => (locale === 'ru' || !fallback ? fallback : cache.get(key)?.[String(id)]?.[field] || fallback)
}
