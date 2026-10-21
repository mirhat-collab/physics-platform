'use client'
import { useEffect, useState } from 'react'
import { useT } from './LanguageProvider'

// Переводы названий тем / описаний классов для списков. Сервер переводит
// через ИИ один раз и хранит в базе, здесь — ещё и кэш на время сессии.
const cache = new Map<string, Record<string, string>>()

export function useTranslatedNames(kind: 'topic' | 'class', ids: (number | string)[]): (id: number | string, fallback: string) => string {
  const { locale } = useT()
  const key = `${locale}:${kind}`
  const [, setVersion] = useState(0)
  const idsKey = ids.map(String).sort().join(',')

  useEffect(() => {
    if (locale === 'ru' || !idsKey) return
    const known = cache.get(key) ?? {}
    const missing = idsKey.split(',').filter(id => !(id in known))
    if (!missing.length) return
    let cancelled = false
    fetch('/api/translate/names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, ids: missing.map(Number) }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data?.names) return
        cache.set(key, { ...(cache.get(key) ?? {}), ...data.names })
        if (!cancelled) setVersion(v => v + 1)
      })
      .catch(() => { /* остаётся русский текст */ })
    return () => { cancelled = true }
  }, [key, kind, locale, idsKey])

  return (id, fallback) => (locale === 'ru' ? fallback : cache.get(key)?.[String(id)] ?? fallback)
}
