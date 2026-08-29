import mammoth from 'mammoth'
import JSZip from 'jszip'
// Импортируем напрямую lib/pdf-parse.js, а не пакет целиком: index.js
// пакета проверяет `!module.parent` для "debug-режима" и под Turbopack/
// webpack эта проверка ошибочно срабатывает, пытаясь прочитать
// несуществующий тестовый PDF и ломая билд.
// @ts-expect-error — пакет не экспортирует типы для этого пути
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

const MAX_CHARS_PER_FILE = 3000

// Достаёт обычный текст из docx/pptx/pdf — используется, чтобы квиз можно
// было сгенерировать по прикреплённым файлам темы, а не только по полю
// theory. Старые бинарные .doc/.ppt не поддерживаем — редкий случай, не
// стоит усложнения.
export async function extractTextFromFile(buffer: Buffer, ext: string): Promise<string> {
  try {
    const e = ext.toLowerCase()
    let text = ''
    if (e === 'docx') {
      text = (await mammoth.extractRawText({ buffer })).value
    } else if (e === 'pptx') {
      text = await extractPptxText(buffer)
    } else if (e === 'pdf') {
      text = (await pdfParse(buffer)).text
    }
    return text.trim().slice(0, MAX_CHARS_PER_FILE)
  } catch (err) {
    console.error('extractTextFromFile error:', err)
    return ''
  }
}

async function extractPptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer)
  const slideNames = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)?.[1] ?? 0)
      const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] ?? 0)
      return na - nb
    })

  const slides: string[] = []
  for (const name of slideNames) {
    const xml = await zip.files[name].async('text')
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1])
    if (runs.length) slides.push(runs.join(' '))
  }
  return slides.join('\n\n')
}
