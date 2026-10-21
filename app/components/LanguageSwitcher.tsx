'use client'
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n'
import { useT } from './LanguageProvider'

// Переключатель языка: РУС / ҚАЗ / ENG
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useT()
  return (
    <div role="group" aria-label={t('Язык')} style={{ display: 'flex', gap: 4, background: 'rgba(127,127,127,0.12)', borderRadius: 10, padding: 3 }}>
      {LOCALES.map(l => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          title={LOCALE_LABELS[l].name}
          aria-pressed={locale === l}
          style={{
            flex: compact ? undefined : 1,
            padding: compact ? '5px 8px' : '7px 10px',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
            background: locale === l ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
            color: locale === l ? '#fff' : '#888',
          }}
        >
          {LOCALE_LABELS[l].short}
        </button>
      ))}
    </div>
  )
}
