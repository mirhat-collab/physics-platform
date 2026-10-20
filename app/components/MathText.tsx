'use client'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Текст с формулами: $…$ — формула в строке, $$…$$ — отдельной строкой, **…** — жирный.
// Пустая строка начинает новый абзац.

function renderInline(raw: string): string {
  // Жирный (**…**) может охватывать и формулу, поэтому сначала заменяем
  // маркеры на служебные символы, а теги ставим уже в обычном тексте.
  // Переносы строк тоже только в тексте: внутри SVG от KaTeX они свои.
  const text = raw.replace(/\*\*([\s\S]+?)\*\*/g, '\u0001$1\u0002')
  const plain = (s: string) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\u0001/g, '<strong>').replace(/\u0002/g, '</strong>')
    .replace(/\n/g, '<br/>')
  let html = ''
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    html += plain(text.slice(last, m.index))
    const display = m[1] !== undefined
    html += katex.renderToString((m[1] ?? m[2]).trim(), { throwOnError: false, displayMode: display })
    last = m.index + m[0].length
  }
  return html + plain(text.slice(last))
}

export default function MathText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim())
  return (
    <div className="math-text" style={style}>
      {paragraphs.map((p, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: renderInline(p.trim()) }} />
      ))}
    </div>
  )
}
