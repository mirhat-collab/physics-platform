/**
 * Достаёт путь файла внутри бакета из URL, который раньше сохранялся как
 * "публичный" (Supabase Storage getPublicUrl), например:
 *   https://xxxx.supabase.co/storage/v1/object/public/topic-media/topics/123_abc.pdf
 * -> "topics/123_abc.pdf"
 *
 * Это позволяет НЕ менять формат данных в базе (поле media[].url остаётся тем же),
 * при этом реально работать с файлом через приватный бакет + подписанные ссылки.
 */
export function extractStoragePath(url: string, bucket: string): string | null {
  try {
    const marker = `/object/public/${bucket}/`
    const idx = url.indexOf(marker)
    if (idx === -1) {
      // на случай, если где-то уже лежит просто относительный путь
      return url.startsWith('http') ? null : url
    }
    return decodeURIComponent(url.slice(idx + marker.length))
  } catch {
    return null
  }
}

export function fileExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() || ''
}

export function isOfficeDoc(name: string): boolean {
  const ext = fileExt(name)
  return ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)
}

export function isPdf(name: string): boolean {
  return fileExt(name) === 'pdf'
}
