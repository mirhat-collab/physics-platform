// Формула LaTeX как обычный текст — для мест, где KaTeX не нарисовать
// (пункты <select>): $2{,}5 \cdot 10^{-3}$ Вб → «2,5 · 10⁻³ Вб», $\frac{\pi}{4}$ → «π/4».
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺', '(': '⁽', ')': '⁾', n: 'ⁿ', x: 'ˣ' }
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '-': '₋', '+': '₊', n: 'ₙ', x: 'ₓ' }
const SYM: Record<string, string> = {
  cdot: '·', times: '×', pi: 'π', infty: '∞', cup: '∪', cap: '∩', circ: '°', alpha: 'α', beta: 'β', gamma: 'γ',
  Delta: 'Δ', lambda: 'λ', mu: 'μ', omega: 'ω', varphi: 'φ', phi: 'φ', rho: 'ρ', approx: '≈', le: '≤', ge: '≥',
  leq: '≤', geq: '≥', ne: '≠', pm: '±', sqrt: '√', ldots: '…', dots: '…', to: '→', in: '∈', varnothing: '∅', degree: '°',
}

// Содержимое {…} начиная с позиции открывающей скобки
function group(s: string, i: number): [string, number] {
  if (s[i] !== '{') return [s[i] ?? '', i + 1]
  let depth = 0
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++
    else if (s[j] === '}' && --depth === 0) return [s.slice(i + 1, j), j + 1]
  }
  return [s.slice(i + 1), s.length]
}

const wrap = (s: string) => (/^[\w.,π√²³]+$/u.test(s) ? s : `(${s})`)
const script = (s: string, map: Record<string, string>, mark: string) =>
  [...s].every(c => map[c]) ? [...s].map(c => map[c]).join('') : `${mark}${wrap(s)}`

function convert(s: string): string {
  let out = ''
  for (let i = 0; i < s.length;) {
    const c = s[i]
    if (c === '\\') {
      const m = s.slice(i + 1).match(/^([a-zA-Z]+|.)/)
      const cmd = m ? m[1] : ''
      i += 1 + cmd.length
      if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
        const [a, j] = group(s, i), [b, k] = group(s, j)
        out += `${wrap(convert(a))}/${wrap(convert(b))}`
        i = k
      } else if (cmd === 'sqrt') {
        let deg = ''
        if (s[i] === '[') { const e = s.indexOf(']', i); deg = s.slice(i + 1, e); i = e + 1 }
        const [a, j] = group(s, i)
        out += `${deg ? script(deg, SUP, '') : ''}√${wrap(convert(a))}`
        i = j
      } else if (cmd === 'text' || cmd === 'mathrm' || cmd === 'operatorname' || cmd === 'vec' || cmd === 'overline') {
        const [a, j] = group(s, i)
        out += convert(a)
        i = j
      } else if (cmd === 'left' || cmd === 'right' || cmd === ',' || cmd === ';' || cmd === '!') {
        if (cmd === ',' || cmd === ';') out += ' '
      } else if (cmd === ' ' ) out += ' '
      else out += SYM[cmd] ?? cmd
    } else if (c === '^' || c === '_') {
      // Показатель — группа {…}, один символ или команда (^\circ)
      const cmd = s[i + 1] === '\\' ? s.slice(i + 1).match(/^\\[a-zA-Z]+/)?.[0] : undefined
      const [a, j] = cmd ? [cmd, i + 1 + cmd.length] : group(s, i + 1)
      const v = convert(a)
      out += v === '°' ? '°' : script(v, c === '^' ? SUP : SUB, c)
      i = j
    } else if (c === '{' || c === '}') { i++ }
    else { out += c; i++ }
  }
  return out
}

export function plainMath(text: string): string {
  return text
    .replace(/\$\$?([^$]+)\$\$?/g, (_, m: string) => convert(m.replace(/\{,\}/g, ',')))
    .replace(/\s+/g, ' ')
    .trim()
}
