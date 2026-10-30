'use client'
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n'
import { useT } from './LanguageProvider'

// Переключатель языка: РУС / ҚАЗ
// tone="paper" — для страниц в стиле «Тетрадь», цвета берутся из --nb-*
export default function LanguageSwitcher({ compact = false, tone = 'default' }: { compact?: boolean; tone?: 'default' | 'paper' }) {
  const paper = tone === 'paper'
  const { locale, setLocale, t } = useT()
  return (
    <div role="group" aria-label={t('Язык')} className={paper ? undefined : 'lang-switch'} style={{ display: 'flex', gap: 4, background: paper ? 'transparent' : 'rgba(127,127,127,0.12)', border: paper ? '1px solid var(--nb-line)' : undefined, borderRadius: 10, padding: 3 }}>
      {LOCALES.map(l => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          title={LOCALE_LABELS[l].name}
          aria-pressed={locale === l}
          style={{
            flex: compact ? undefined : 1,
            padding: compact ? '5px 8px' : '7px 10px',
            minHeight: paper ? 44 : undefined, minWidth: paper ? 44 : undefined,
            borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
            background: locale === l ? (paper ? 'var(--nb-text)' : 'linear-gradient(135deg, #667eea, #764ba2)') : 'transparent',
            color: locale === l ? (paper ? 'var(--nb-paper)' : '#fff') : (paper ? 'var(--nb-text-2)' : '#888'),
          }}
        >
          {LOCALE_LABELS[l].short}
          <span className="sr-only" lang={l}>{LOCALE_LABELS[l].name}</span>
        </button>
      ))}
    </div>
  )
}
