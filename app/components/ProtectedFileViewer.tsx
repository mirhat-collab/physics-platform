'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { extractStoragePath, isPdf, isOfficeDoc, fileExt } from '@/lib/file-protect'
import { useT } from '@/app/components/LanguageProvider'

type Props = {
  fileUrl: string   // старое значение media[].url (используем только чтобы достать путь)
  fileName: string
  watermarkLabel?: string // например "Иванов Иван · 28.08.2026 20:48"; без него — без водяного знака
  material?: boolean // файл справочника ЕНТ: без водяного знака, с кнопкой «Скачать»
  onClose: () => void
}

const BUCKET = 'topic-media'

const VIEWABLE = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a']

// Можно ли показать файл на сайте (архивы и прочее — только скачать)
export function canView(name: string): boolean {
  return isPdf(name) || isOfficeDoc(name) || VIEWABLE.includes(fileExt(name))
}

export default function ProtectedFileViewer({ fileUrl, fileName, watermarkLabel = '', material = false, onClose }: Props) {
  const { t } = useT()
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const path = extractStoragePath(fileUrl, BUCKET)
      if (!path) {
        setError(t('Не удалось определить путь к файлу'))
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/api/file-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(material ? { path, material: true } : { path }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data) throw new Error(t(data?.error || 'Ошибка загрузки файла'))
        if (!cancelled) setSignedUrl(data.url)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t('Ошибка загрузки файла'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [fileUrl])

  const ext = fileExt(fileName)

  async function download() {
    const res = await fetch('/api/file-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: extractStoragePath(fileUrl, BUCKET), download: fileName }),
    })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.url) window.location.href = data.url
    else setError(t(data?.error || 'Ошибка загрузки файла'))
  }

  // Через портал в body: иначе окно оказывается под боковым меню, если
  // страница-родитель создаёт свой слой (анимация с transform)
  return createPortal(
    <div
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 960, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '16px 20px', color: '#fff',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {material && (
          <button
            onClick={download}
            style={{
              background: '#667eea', border: 'none', color: '#fff', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 14,
            }}
          >
            ⬇ {t('Скачать')}
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 14,
          }}
        >
          {t('✕ Закрыть')}
        </button>
        </div>
      </div>

      <div style={{
        flex: 1, width: '100%', maxWidth: 960, overflow: 'auto', background: '#0a0a14',
        borderRadius: 16, marginBottom: 20, position: 'relative',
      }}>
        {loading && (
          <div style={{ color: '#888', textAlign: 'center', padding: '80px 20px' }}>{t('⏳ Открываем файл…')}</div>
        )}
        {error && (
          <div style={{ color: '#f5576c', textAlign: 'center', padding: '80px 20px' }}>😕 {error}</div>
        )}
        {!loading && !error && signedUrl && isPdf(fileName) && (
          <PdfCanvasViewer url={signedUrl} watermarkLabel={watermarkLabel} />
        )}
        {!loading && !error && signedUrl && isOfficeDoc(fileName) && (
          <OfficeViewer url={signedUrl} watermarkLabel={watermarkLabel} />
        )}
        {!loading && !error && signedUrl && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) && (
          <div style={{ position: 'relative' }} onContextMenu={(e) => e.preventDefault()}>
            <img src={signedUrl} alt={fileName} style={{ width: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />
            <Watermark label={watermarkLabel} />
          </div>
        )}
        {!loading && !error && signedUrl && ['mp4', 'webm', 'mov'].includes(ext) && (
          <video src={signedUrl} controls controlsList="nodownload" style={{ width: '100%', display: 'block' }} />
        )}
        {!loading && !error && signedUrl && ['mp3', 'wav', 'ogg', 'm4a'].includes(ext) && (
          <audio src={signedUrl} controls controlsList="nodownload" style={{ width: '100%', display: 'block', padding: 20 }} />
        )}
        {!loading && !error && signedUrl && !canView(fileName) && (
          <div style={{ color: '#888', textAlign: 'center', padding: '80px 20px' }}>{material ? t('Этот файл нельзя посмотреть на сайте — нажми «Скачать».') : t('Этот файл нельзя посмотреть на сайте.')}</div>
        )}
      </div>
    </div>,
    document.body
  )
}

function Watermark({ label }: { label: string }) {
  if (!label) return null
  // Раньше это была плотная сетка 10x4 (40 плашек) с непрозрачностью 0.9 —
  // держало от копирования, но забивало текст под собой и мешало читать.
  // Реже и бледнее — метку по-прежнему видно на скриншоте, но она не спорит
  // с содержимым документа.
  const tile = (
    <span style={{
      display: 'inline-block', color: 'rgba(255,255,255,0.16)', fontSize: 12, fontWeight: 700,
      transform: 'rotate(-24deg)', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
  const rows = Array.from({ length: 4 })
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center',
      zIndex: 5,
    }}>
      {rows.map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 140 }}>
          {Array.from({ length: 2 }).map((_, j) => <div key={j}>{tile}</div>)}
        </div>
      ))}
    </div>
  )
}

/**
 * Рендерит PDF постранично в <canvas> (никакой готовый PDF-файл никогда не
 * лежит в DOM целиком, скачать "как есть" через обычное меню браузера нельзя),
 * поверх — водяной знак с именем ученика.
 */
function PdfCanvasViewer({ url, watermarkLabel }: { url: string; watermarkLabel: string }) {
  const { t } = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [renderError, setRenderError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let renderedCanvases: HTMLCanvasElement[] = []

    async function renderPdf() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString()

        const res = await fetch(url)
        const buf = await res.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise
        if (cancelled) return
        setNumPages(pdf.numPages)

        const container = containerRef.current
        if (!container) return
        container.innerHTML = ''

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return
          const page = await pdf.getPage(pageNum)
          const containerWidth = container.clientWidth || 900
          const baseViewport = page.getViewport({ scale: 1 })
          const scale = (containerWidth / baseViewport.width) * (window.devicePixelRatio || 1)
          const viewport = page.getViewport({ scale })

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = '100%'
          canvas.style.display = 'block'
          canvas.style.marginBottom = '8px'
          canvas.oncontextmenu = (e) => e.preventDefault()

          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
          container.appendChild(canvas)
          renderedCanvases.push(canvas)
        }
      } catch (e) {
        if (!cancelled) setRenderError(t('Не удалось отобразить PDF'))
        console.error(e)
      }
    }

    renderPdf()
    return () => { cancelled = true; renderedCanvases = [] }
  }, [url])

  return (
    <div
      style={{ position: 'relative', padding: 12, userSelect: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={containerRef} />
      {renderError && <div style={{ color: '#f5576c', textAlign: 'center', padding: 40 }}>{renderError}</div>}
      {numPages > 0 && <Watermark label={watermarkLabel} />}
      <style>{`
        @media print {
          body * { display: none !important; }
        }
      `}</style>
    </div>
  )
}

/**
 * Для PPT/PPTX/DOC/DOCX/XLS/XLSX — открываем через встроенный офисный вьюер.
 * Важно: это внешний сервис (Microsoft), у него есть своя мини-панель — полностью
 * убрать её мы не можем, но прямая ссылка на файл ученику не показывается,
 * а сама ссылка на файл действует всего пару минут.
 */
function OfficeViewer({ url, watermarkLabel }: { url: string; watermarkLabel: string }) {
  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
  return (
    <div style={{ position: 'relative', height: '80vh' }} onContextMenu={(e) => e.preventDefault()}>
      <iframe
        src={viewerUrl}
        style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
        title="document-viewer"
      />
      <Watermark label={watermarkLabel} />
    </div>
  )
}
