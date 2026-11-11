// Рисунок к задаче банка: файл в публичном бакете, путь bank/…
export const BANK_IMAGE_BUCKET = 'homework-media'

// Ссылка на рисунок принимается, только если она ведёт в наш бакет
export function isBankImageUrl(url: string | null | undefined, base = process.env.NEXT_PUBLIC_SUPABASE_URL): boolean {
  if (!url || !base) return false
  const prefix = `${base.replace(/\/$/, '')}/storage/v1/object/public/${BANK_IMAGE_BUCKET}/bank/`
  return url.startsWith(prefix) && /^[\w./%-]+$/.test(url.slice(prefix.length))
}

// Рисунок показывается тем же блоком, что и SVG-рисунки шаблонов
export function bankFigure(url: string | null | undefined, base?: string): string | undefined {
  if (!isBankImageUrl(url, base)) return undefined
  return `<img src="${url}" alt="" loading="lazy" style="max-width:100%;max-height:360px;height:auto;border-radius:10px;display:block" />`
}
