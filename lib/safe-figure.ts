// Рисунок к заданию вставляется на страницу как HTML. Обычно это SVG, который
// собрал шаблон на сервере, но тот же рисунок хранится в базе вместе с
// заданием (работа над ошибками, жалобы на задания) — а строки в базе может
// записать и сам пользователь. Поэтому перед вставкой пропускаем только
// безобидный SVG из известных тегов и атрибутов; всё остальное не показываем.
import { isBankImageUrl } from './bank-image'

const TAGS = new Set(['svg', 'g', 'path', 'line', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'text', 'tspan', 'defs', 'marker', 'clippath', 'title', 'lineargradient', 'stop'])
const ATTRS = new Set([
  'xmlns', 'viewbox', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'dx', 'dy',
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin',
  'opacity', 'transform', 'id', 'class', 'role', 'aria-label', 'aria-hidden', 'preserveaspectratio',
  'font-size', 'font-family', 'font-style', 'font-weight', 'text-anchor', 'dominant-baseline', 'letter-spacing',
  'marker-end', 'marker-start', 'marker-mid', 'markerwidth', 'markerheight', 'markerunits', 'refx', 'refy', 'orient', 'clip-path', 'clip-rule',
  'offset', 'stop-color', 'stop-opacity', 'gradientunits', 'style',
])
// Один тег целиком и текст после него (до следующего «<»)
const CHUNK = /^(\/?)([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:\s*=\s*(?:"[^"<>]*"|'[^'<>]*'))?)*)\s*(\/?)>([^<>]*)$/
const ATTR = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g
const BANK_IMG = /^<img src="([^"<>\s]+)" alt="" loading="lazy" style="max-width:100%;max-height:360px;height:auto;border-radius:10px;display:block" \/>$/

function safeValue(name: string, value: string): boolean {
  const v = value.toLowerCase().replace(/\s+/g, '')
  if (/javascript:|data:|vbscript:|expression\(|@import|&#|\\/.test(v)) return false
  // Ссылки — только на элементы этого же рисунка: url(#id)
  if (v.includes('url(') && !/^(?:[^u]|u(?!rl\())*(?:url\(#[\w-]+\)(?:[^u]|u(?!rl\())*)*$/.test(v)) return false
  if (name === 'xmlns') return value === 'http://www.w3.org/2000/svg'
  return true
}

// Возвращает рисунок, если он безопасен, иначе — undefined (рисунок не показываем)
export function safeFigure(html: string | null | undefined, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL): string | undefined {
  if (typeof html !== 'string' || !html || html.length > 200_000) return undefined
  const src = html.trim()
  // Рисунок задачи из банка: картинка из нашего хранилища
  const img = BANK_IMG.exec(src)
  if (img) return isBankImageUrl(img[1], supabaseUrl) ? src : undefined
  if (!/^<svg[\s>]/i.test(src)) return undefined
  const chunks = src.split('<')
  if (chunks[0] !== '') return undefined
  for (const chunk of chunks.slice(1)) {
    const m = CHUNK.exec(chunk)
    if (!m || !TAGS.has(m[2].toLowerCase())) return undefined
    if (m[1]) { if (m[3].trim()) return undefined; continue }
    ATTR.lastIndex = 0
    let a: RegExpExecArray | null
    while ((a = ATTR.exec(m[3]))) {
      const name = a[1].toLowerCase()
      if (!ATTRS.has(name) || !safeValue(name, a[2] ?? a[3] ?? '')) return undefined
    }
  }
  return src
}
