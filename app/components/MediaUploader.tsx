'use client'
import { useRef, useState } from 'react'
import { extractStoragePath } from '@/lib/file-protect'
import { useT } from '@/app/components/LanguageProvider'

// Загрузка файлов в Storage для тем и справочника ЕНТ (только для админа)

const BUCKET = 'topic-media'
// Бесплатный тариф Supabase принимает файл до 50 МБ. Что больше (видео,
// большие сборники) — добавляем ссылкой на YouTube, Google Диск и т. п.
export const MAX_FILE_MB = 50

export type MediaItem = { url: string; type: 'image' | 'video' | 'file' | 'link'; name: string; size?: number }

export function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return '📕'
  if (ext === 'doc' || ext === 'docx') return '📘'
  if (ext === 'ppt' || ext === 'pptx') return '📙'
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return '📗'
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜'
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return '🎧'
  return '📄'
}

export function mediaIcon(item: MediaItem): string {
  return item.type === 'image' ? '🖼' : item.type === 'video' ? '🎬' : item.type === 'link' ? '🔗' : fileIcon(item.name)
}

export function fileSize(bytes?: number): string {
  if (!bytes) return ''
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`
}

// Ссылку открываем в новой вкладке, файл — в защищённом просмотрщике
export function openMedia(item: MediaItem, view: (item: MediaItem) => void) {
  if (item.type === 'link') window.open(item.url, '_blank', 'noopener,noreferrer')
  else view(item)
}

// Загрузка по подписанной ссылке через XHR — ради полосы прогресса
// (supabase-js uploadToSignedUrl делает то же самое через fetch, без прогресса)
function uploadWithProgress(path: string, token: string, file: File, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${path}?token=${encodeURIComponent(token)}`
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const body = new FormData()
    body.append('cacheControl', '3600')
    body.append('', file)
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('apikey', key)
    xhr.setRequestHeader('Authorization', `Bearer ${key}`)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total) }
    xhr.onload = () => {
      if (xhr.status < 300) return resolve()
      let message = `HTTP ${xhr.status}`
      try { message = JSON.parse(xhr.responseText).message || message } catch {}
      reject(new Error(message))
    }
    xhr.onerror = () => reject(new Error('нет связи с сервером'))
    xhr.send(body)
  })
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
  const [progress, setProgress] = useState<{ name: string; done: number; index: number; total: number } | null>(null)
  const [msg, setMsg] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [link, setLink] = useState<{ url: string; name: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(files: File[]) {
    if (!files.length || uploading) return
    setUploading(true)
    setMsg('')
    const errs: string[] = []
    const newItems: MediaItem[] = []
    for (const [index, file] of files.entries()) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        errs.push(t('«{name}» — {size}, больше {max} МБ. Загрузи его на YouTube или Google Диск и добавь ссылкой.', { name: file.name, size: fileSize(file.size), max: MAX_FILE_MB }))
        continue
      }
      setProgress({ name: file.name, done: 0, index: index + 1, total: files.length })
      // Сервер только выдаёт подписанную ссылку — сам файл идёт напрямую
      // в Supabase Storage из браузера, в обход лимита Vercel на размер тела запроса.
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) { errs.push(`«${file.name}»: ${t(data?.error || 'не удалось загрузить')}`); continue }
      try {
        await uploadWithProgress(data.path, data.token, file, done => setProgress(p => (p ? { ...p, done } : p)))
      } catch (e) {
        errs.push(`«${file.name}»: ${e instanceof Error ? e.message : t('не удалось загрузить')}`)
        continue
      }
      const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'file'
      newItems.push({ url: data.url, type, name: file.name, size: file.size })
    }
    onDone([...items, ...newItems])
    setUploading(false)
    setProgress(null)
    setErrors(errs)
    if (newItems.length) {
      setMsg(t('✅ Загружено {length} файл(ов)', { length: newItems.length }))
      setTimeout(() => setMsg(''), 3000)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  function addLink() {
    if (!link) return
    let url = link.url.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    try { new URL(url) } catch { setErrors([t('Неверная ссылка')]); return }
    const name = link.name.trim() || new URL(url).hostname.replace(/^www\./, '')
    onDone([...items, { url, type: 'link', name }])
    setLink(null)
    setErrors([])
  }

  async function remove(i: number) {
    const item = items[i]
    onDone(items.filter((_, idx) => idx !== i))

    if (item.type === 'link') return
    const path = extractStoragePath(item.url, BUCKET)
    if (!path) return
    await fetch(`/api/admin/upload?path=${encodeURIComponent(path)}`, { method: 'DELETE' }).catch(() => {})
  }

  return (
    <div>
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); upload(Array.from(e.dataTransfer.files)) }}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 12, padding: '18px 14px',
          textAlign: 'center', cursor: uploading ? 'default' : 'pointer', color: 'var(--muted)', fontSize: 14,
          background: 'var(--bg)', marginBottom: 10,
        }}
      >
        {uploading ? t('⏳ Загружаю...') : t('📎 Нажми или перетащи сюда файлы — любые: PDF, Word, презентации, фото, видео, архивы')}
        <div style={{ fontSize: 12, marginTop: 4, color: 'var(--muted)' }}>{t('До {max} МБ на файл. Больше — добавь ссылкой.', { max: MAX_FILE_MB })}</div>
      </div>
      <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => upload(Array.from(e.target.files || []))} />
      {progress && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {progress.total > 1 ? `${progress.index}/${progress.total} · ` : ''}{progress.name}
            </span>
            <span>{Math.round(progress.done * 100)}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--surface)', overflow: 'hidden' }}>
            <div style={{ width: `${progress.done * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width .2s' }} />
          </div>
        </div>
      )}
      {link ? (
        <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
          <input className="input" autoFocus value={link.url} onChange={e => setLink({ ...link, url: e.target.value })}
            placeholder={t('Ссылка: YouTube, Google Диск, сайт…')} onKeyDown={e => e.key === 'Enter' && addLink()} />
          <input className="input" value={link.name} onChange={e => setLink({ ...link, name: e.target.value })}
            placeholder={t('Название (необязательно)')} onKeyDown={e => e.key === 'Enter' && addLink()} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" style={{ padding: '6px 14px' }} onClick={addLink}>{t('Добавить ссылку')}</button>
            <button type="button" className="btn btn-ghost" style={{ padding: '6px 14px' }} onClick={() => setLink(null)}>{t('Отмена')}</button>
          </div>
        </div>
      ) : (
        <button type="button" className="chip" style={{ marginBottom: 10 }} onClick={() => setLink({ url: '', name: '' })}>🔗 {t('Добавить ссылку')}</button>
      )}
      {msg && <div style={{ color: 'var(--good)', fontSize: 13, marginBottom: 8 }}>{msg}</div>}
      {errors.map((e, i) => <div key={i} style={{ color: 'var(--bad)', fontSize: 13, marginBottom: 6 }}>{e}</div>)}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
          {items.map((item, i) => (
            <div key={i} style={{ position: 'relative', width: 100, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
              {item.type === 'image'
                ? <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} />
                : item.type === 'video'
                ? <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 22 }}>{mediaIcon(item)}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{item.name}</div>
                  </div>
                )
              }
              <button
                onClick={() => remove(i)}
                style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'var(--bad)', border: 'none', color: 'var(--on-accent)', fontSize: 12, cursor: 'pointer', padding: 0, lineHeight: '20px' }}
              >×</button>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.6)', fontSize: 9, color: 'var(--text)', padding: '2px 4px', textAlign: 'center' }}>
                {item.type === 'video' ? t('▶ видео') : item.type === 'image' ? t('🖼 фото') : item.type === 'link' ? t('🔗 ссылка') : item.size ? fileSize(item.size) : t('📄 файл')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
