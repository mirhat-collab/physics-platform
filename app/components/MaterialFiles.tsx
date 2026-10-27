'use client'
import { useState } from 'react'
import ProtectedFileViewer, { canView } from '@/app/components/ProtectedFileViewer'
import { extractStoragePath } from '@/lib/file-protect'
import { fileSize, mediaIcon, type MediaItem } from '@/app/components/MediaUploader'
import { useT } from '@/app/components/LanguageProvider'

// Файлы материала справочника: «Открыть» на сайте (без водяного знака) и «Скачать»

async function downloadUrl(item: MediaItem): Promise<string> {
  const path = extractStoragePath(item.url, 'topic-media')
  const res = await fetch('/api/file-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, download: item.name }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.url) throw new Error(data?.error || 'Ошибка загрузки файла')
  return data.url
}

export default function MaterialFiles({ media }: { media: MediaItem[] }) {
  const { t } = useT()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [viewer, setViewer] = useState<MediaItem | null>(null)

  function open(item: MediaItem) {
    if (item.type === 'link') window.open(item.url, '_blank', 'noopener,noreferrer')
    else setViewer(item)
  }

  async function download(item: MediaItem) {
    setError('')
    setBusy(item.url)
    try {
      window.location.href = await downloadUrl(item)
    } catch (e) {
      setError(t(e instanceof Error ? e.message : 'Ошибка загрузки файла'))
    } finally {
      setBusy(null)
    }
  }

  const btn = { padding: '6px 12px', fontSize: 13 } as const
  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
      {media.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface-2)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 20 }}>{mediaIcon(item)}</span>
          <span style={{ flex: 1, minWidth: 140, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name}
            {item.size ? <span style={{ color: 'var(--muted)', fontSize: 12 }}> · {fileSize(item.size)}</span> : null}
          </span>
          {(item.type === 'link' || canView(item.name)) && (
            <button className="btn btn-ghost" style={btn} onClick={() => open(item)}>
              {item.type === 'link' ? t('Перейти') : t('Открыть')}
            </button>
          )}
          {item.type !== 'link' && (
            <button className="btn" style={btn} disabled={busy === item.url} onClick={() => download(item)}>
              {busy === item.url ? '⏳' : '⬇'} {t('Скачать')}
            </button>
          )}
        </div>
      ))}
      {error && <div style={{ color: 'var(--bad)', fontSize: 13 }}>{error}</div>}
      {viewer && <ProtectedFileViewer fileUrl={viewer.url} fileName={viewer.name} material onClose={() => setViewer(null)} />}
    </div>
  )
}
