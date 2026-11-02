import { continueRender, delayRender, staticFile } from 'remotion'
import { FACES } from './fonts-data'

// Подключаем локальные шрифты и ждём их загрузки до первого кадра
export const SANS = 'Montserrat, sans-serif'
export const MONO = '"JetBrains Mono", monospace'

if (typeof window !== 'undefined' && typeof FontFace !== 'undefined') {
  const handle = delayRender('fonts')
  Promise.all(FACES.map(f => {
    const face = new FontFace(f.family, `url(${staticFile(`fonts/${f.file}`)}) format('woff2')`, { weight: f.weight, unicodeRange: f.range })
    ;(document.fonts as unknown as { add(f: FontFace): void }).add(face)
    return face.load()
  })).then(() => continueRender(handle)).catch(() => continueRender(handle))
}
