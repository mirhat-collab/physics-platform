'use client'
import { useState } from 'react'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'
import { SITE_URL } from '@/lib/seo'
import { shareQuery, SHARE_TEXT, type ShareData } from '@/lib/share'

// «Поделиться результатом»: картинка для сторис + ссылка с превью.
// На телефоне открывается системное меню (Instagram, WhatsApp, Telegram…).
export default function ShareResult({ data }: { data: Omit<ShareData, 'lang'> }) {
  const { t, locale } = useT()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const d: ShareData = { ...data, lang: locale === 'kk' ? 'kk' : 'ru' }
  const q = shareQuery(d)
  const link = `${SITE_URL}/r?${q}`
  const text = SHARE_TEXT[d.lang].message(d)

  async function storyFile(): Promise<File> {
    const res = await fetch(`/api/share/card?${q}&f=story`)
    const blob = await res.blob()
    return new File([blob], `mirha-edu-${d.s}.png`, { type: 'image/png' })
  }

  async function share() {
    setBusy(true); setNote('')
    try {
      const file = await storyFile()
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text} ${link}` })
      } else if (navigator.share) {
        await navigator.share({ text, url: link })
      } else {
        // Компьютер: скачиваем картинку и копируем ссылку
        const a = document.createElement('a')
        a.href = URL.createObjectURL(file); a.download = file.name; a.click()
        URL.revokeObjectURL(a.href)
        await navigator.clipboard?.writeText(`${text} ${link}`).catch(() => {})
        setNote(t('Картинка скачана, ссылка скопирована'))
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setNote(t('Не получилось — попробуй ещё раз'))
    }
    setBusy(false)
  }

  return (
    <div className="share-result">
      <div className="share-box">
        <button type="button" className="btn" onClick={share} disabled={busy}>
          <Icon name="share" size={18} /> {busy ? t('Готовлю картинку…') : t('Поделиться результатом')}
        </button>
        <a className="btn btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          WhatsApp
        </a>
      </div>
      {note && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>{note}</div>}
    </div>
  )
}
