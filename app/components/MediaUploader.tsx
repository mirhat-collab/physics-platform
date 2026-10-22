'use client'
import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { extractStoragePath } from '@/lib/file-protect'
import { useT } from '@/app/components/LanguageProvider'

// Загрузка файлов в Storage для тем и справочника ЕНТ (только для админа)

const BUCKET = 'topic-media'

export type MediaItem = { url: string; type: 'image' | 'video' | 'file'; name: string }

export function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return '📕'
  if (ext === 'doc' || ext === 'docx') return '📘'
  if (ext === 'ppt' || ext === 'pptx') return '📙'
  return '📄'
}

export default function MediaUploader({ existing, onDone }: { existing: MediaItem[]; onDone: (items: MediaItem[]) => void }) {
  const { t } = useT()
  // Специально без своего state для items — используем existing напрямую.
  // Раньше был внутренний items-state, инициализированный один раз из existing:
  // после сохранения темы родитель сбрасывал existing в [], но здесь всё ещё
  // висели миниатюры только что загруженных файлов (React не пересинхронизирует
  // useState(existing) при смене пропа). Админ принимал их за "мусор от прошлой
  // темы" и жал × — а это реально удаляло файл из Storage, хотя он уже был
  // привязан к только что созданной теме. Контролируемый компонент убирает
  // саму возможность такого рассинхрона.
  const items = existing || []
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setMsg(t('Загружаю...'))
    const newItems: MediaItem[] = []
    for (const file of files) {
      // Сервер только выдаёт подписанную ссылку — сам файл идёт напрямую
      // в Supabase Storage из браузера, в обход лимита Vercel на размер тела запроса.
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) { setMsg(t('Ошибка: ') + t(data?.error || 'не удалось загрузить')); continue }

      const { error: uploadError } = await supabase.storage.from(BUCKET).uploadToSignedUrl(data.path, data.token, file)
      if (uploadError) { setMsg(t('Ошибка: ') + uploadError.message); continue }

      const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'file'
      newItems.push({ url: data.url, type, name: file.name })
    }
    onDone([...items, ...newItems])
    setUploading(false)
    setMsg(t('✅ Загружено {length} файл(ов)', { length: newItems.length }))
    setTimeout(() => setMsg(''), 3000)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function remove(i: number) {
    const item = items[i]
    onDone(items.filter((_, idx) => idx !== i))

    const path = extractStoragePath(item.url, BUCKET)
    if (!path) return
    await fetch(`/api/admin/upload?path=${encodeURIComponent(path)}`, { method: 'DELETE' }).catch(() => {})
  }

  return (
    <div>
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed #2a2a4e', borderRadius: 12, padding: '18px 14px',
          textAlign: 'center', cursor: 'pointer', color: '#888', fontSize: 14,
          background: '#0a0a18', marginBottom: 10,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#667eea')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a4e')}
      >
        {uploading ? t('⏳ Загружаю...') : t('📎 Нажми чтобы добавить фото, видео, PDF или конспект')}
        <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>JPG, PNG, GIF, MP4, WebM, PDF, DOC(X), PPT(X)</div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
        multiple
        style={{ display: 'none' }}
        onChange={handleFiles}
      />
      {msg && <div style={{ color: '#4ade80', fontSize: 13, marginBottom: 8 }}>{msg}</div>}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
          {items.map((item, i) => (
            <div key={i} style={{ position: 'relative', width: 100, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a3e' }}>
              {item.type === 'image'
                ? <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} />
                : item.type === 'video'
                ? <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                : (
                  <div style={{ width: '100%', height: '100%', background: '#151530', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 22 }}>{fileIcon(item.name)}</div>
                    <div style={{ fontSize: 9, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{item.name}</div>
                  </div>
                )
              }
              <button
                onClick={() => remove(i)}
                style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: '#f5576c', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', padding: 0, lineHeight: '20px' }}
              >×</button>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.6)', fontSize: 9, color: '#ccc', padding: '2px 4px', textAlign: 'center' }}>
                {item.type === 'video' ? t('▶ видео') : item.type === 'image' ? t('🖼 фото') : t('📄 файл')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
