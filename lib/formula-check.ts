// Проверка «по смыслу»: ученик мог собрать формулу в другом, но равносильном
// виде (U₁/U₂ = N₁/N₂ вместо N₁/N₂ = U₁/U₂, ab вместо ba и т. п.).
//
// Как проверяем: переводим формулу в выражение JS, подставляем случайные
// значения букв и подбираем одну букву так, чтобы исходная формула
// выполнялась. В этой точке формула ученика тоже должна выполняться.
// Повторяем несколько раз. Если формулу не удаётся разобрать (производные,
// интегралы, модули, ±), возвращаем null — тогда проверка остаётся строгой.

import { parseFormula, type Formula, type Tok } from './formulas'

class Unsupported extends Error {}

const CONST_FULL = /^(arcsin|arccos|arcctg|arctg|sin|cos|ctg|tg|log|lg|ln|π|\d+(?:,\d+)?|[+−±])$/

const SUP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', 'ⁿ': 'n', 'ᵐ': 'm', 'ˣ': 'x', 'ᵏ': 'k', 'ᵇ': 'b',
}
const SUB: Record<string, string> = {
  'ₐ': 'a', 'ₑ': 'e', 'ₖ': 'k', 'ₓ': 'x',
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
}
// Буквы в показателях и индексах логарифмов, которые не являются переменными формулы
const LETTER_DEFAULT: Record<string, number> = { n: 3, m: 2, k: 2.5, x: 1.7, a: 2.3, b: 1.9, e: Math.E }

type Item =
  | { k: 'atom'; js: string }
  | { k: 'op'; v: '+' | '-' | '*' | '/' | '=' }
  | { k: 'fn'; name: string; base?: string }
  | { k: 'pow'; js: string }
  | { k: 'caret' } | { k: 'lp' } | { k: 'rp' } | { k: 'sep' } | { k: 'pct' }

function letter(ch: string, vars: Set<string>): string {
  if (/^\d+$/.test(ch)) return ch
  if (vars.has(ch)) return `V[${JSON.stringify(ch)}]`
  return String(LETTER_DEFAULT[ch] ?? 1.37)
}

function exponent(raw: string, vars: Set<string>): string {
  let js = ''
  let prevOperand = false
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    if (c === '+' || c === '-') { js += c; prevOperand = false; continue }
    let tok = c
    if (/\d/.test(c)) while (/\d/.test(raw[i + 1] ?? '')) tok += raw[++i]
    if (prevOperand) js += '*'
    js += letter(tok, vars)
    prevOperand = true
  }
  return `(${js})`
}

function toItems(toks: Tok[], vars: Set<string>): Item[] {
  const out: Item[] = []
  for (const tok of toks) {
    if (tok.t === 'var') out.push({ k: 'atom', js: `V[${JSON.stringify(tok.v)}]` })
    else if (tok.t === 'frac') out.push({ k: 'atom', js: `((${compileExpr(tok.num, vars)})/(${compileExpr(tok.den, vars)}))` })
    else if (tok.t === 'sqrt') out.push({ k: 'atom', js: `Math.sqrt(${compileExpr(tok.body, vars)})` })
    else if (tok.t === 'const') {
      if (tok.kind === 'num') out.push({ k: 'atom', js: tok.v === 'π' ? 'Math.PI' : tok.v.replace(',', '.') })
      else if (tok.kind === 'sign') {
        if (tok.v === '±') throw new Unsupported()
        out.push({ k: 'op', v: tok.v === '+' ? '+' : '-' })
      } else out.push({ k: 'fn', name: tok.v })
    } else {
      const s = tok.v
      for (let i = 0; i < s.length; i++) {
        const c = s[i]
        const last = out[out.length - 1]
        if (last?.k === 'fn' && last.name === 'log' && last.base === undefined && SUB[c]) {
          let b = SUB[c]
          while (SUB[s[i + 1]] && /\d/.test(SUB[s[i + 1]]) && /\d/.test(b)) b += SUB[s[++i]]
          last.base = letter(b, vars)
          continue
        }
        if (SUP[c]) {
          let raw = SUP[c]
          while (SUP[s[i + 1]]) raw += SUP[s[++i]]
          out.push({ k: 'pow', js: exponent(raw, vars) })
        } else if (c === ' ') out.push({ k: 'sep' })
        else if (c === '=') out.push({ k: 'op', v: '=' })
        else if (c === '·') out.push({ k: 'op', v: '*' })
        else if (c === ':' || c === '/') out.push({ k: 'op', v: '/' })
        else if (c === '(') out.push({ k: 'lp' })
        else if (c === ')') out.push({ k: 'rp' })
        else if (c === '^') out.push({ k: 'caret' })
        else if (c === '%') out.push({ k: 'pct' })
        else if (c === '°' || c === 'Δ') continue
        else throw new Unsupported()
      }
    }
  }
  return out
}

const FN: Record<string, (a: string) => string> = {
  sin: a => `Math.sin(${a})`, cos: a => `Math.cos(${a})`, tg: a => `Math.tan(${a})`, ctg: a => `(1/Math.tan(${a}))`,
  arcsin: a => `Math.asin(${a})`, arccos: a => `Math.acos(${a})`, arctg: a => `Math.atan(${a})`,
  arcctg: a => `(Math.PI/2-Math.atan(${a}))`, ln: a => `Math.log(${a})`, lg: a => `Math.log10(${a})`,
}

function parseItems(items: Item[]): string[] {
  let i = 0
  const peek = () => items[i]
  const skipSep = () => { while (peek()?.k === 'sep') i++ }
  const isOp = (v: string) => { const it = peek(); return it?.k === 'op' && it.v === v }
  const startsPrimary = (it?: Item) => it?.k === 'atom' || it?.k === 'fn' || it?.k === 'lp'

  function expr(): string {
    skipSep()
    let js = ''
    if (isOp('-') || isOp('+')) { js = (peek() as { v: string }).v === '-' ? '-' : ''; i++ }
    js += term()
    for (;;) {
      skipSep()
      if (isOp('+') || isOp('-')) { const v = (peek() as { v: string }).v; i++; js += v + term() }
      else return js
    }
  }
  function term(): string {
    let js = factor()
    for (;;) {
      skipSep()
      if (isOp('*') || isOp('/')) { const v = (peek() as { v: string }).v; i++; js = `(${js})${v}(${factor()})` }
      else if (startsPrimary(peek())) js = `(${js})*(${factor()})`
      else return js
    }
  }
  function factor(): string {
    skipSep()
    if (isOp('-')) { i++; return `(-${factor()})` }
    if (isOp('+')) { i++; return factor() }
    return postfix(primary())
  }
  function postfix(base: string): string {
    let js = base
    for (;;) {
      const it = peek()
      if (it?.k === 'pow') { i++; js = `Math.pow(${js},${it.js})` }
      else if (it?.k === 'caret') { i++; js = `Math.pow(${js},${postfix(primary())})` }
      else if (it?.k === 'pct') { i++; js = `(${js}*0.01)` }
      else return js
    }
  }
  function primary(): string {
    const it = peek()
    if (!it) throw new Unsupported()
    if (it.k === 'atom') { i++; return it.js }
    if (it.k === 'lp') {
      i++
      const e = expr()
      skipSep()
      if (peek()?.k !== 'rp') throw new Unsupported()
      i++
      return `(${e})`
    }
    if (it.k === 'fn') {
      i++
      let fnPow: string | null = null
      if (peek()?.k === 'pow') fnPow = (items[i++] as { js: string }).js
      // Аргумент функции — подряд идущие множители без пробела: sin2α, sin(α+β), sin α/2
      let arg = postfix(argPrimary())
      while (peek()?.k === 'atom' || peek()?.k === 'lp') arg = `(${arg})*(${postfix(argPrimary())})`
      let js: string
      if (it.name === 'log') {
        if (!it.base) throw new Unsupported()
        js = `(Math.log(${arg})/Math.log(${it.base}))`
      } else if (FN[it.name]) js = FN[it.name](arg)
      else throw new Unsupported()
      return fnPow ? `Math.pow(${js},${fnPow})` : js
    }
    throw new Unsupported()
  }
  function argPrimary(): string {
    const it = peek()
    if (it?.k !== 'atom' && it?.k !== 'lp') throw new Unsupported()
    return primary()
  }

  const sides = [expr()]
  for (;;) {
    skipSep()
    if (i >= items.length) break
    if (!isOp('=')) throw new Unsupported()
    i++
    sides.push(expr())
  }
  return sides
}

function compileExpr(toks: Tok[], vars: Set<string>): string {
  const sides = parseItems(toItems(toks, vars))
  if (sides.length !== 1) throw new Unsupported()
  return sides[0]
}

type Sides = (V: Record<string, number>) => number[]

function compile(expr: string): { fn: Sides; vars: string[] } | null {
  try {
    const { toks, slots, kinds } = parseFormula(expr)
    const vars = Array.from(new Set(slots.filter((_, k) => kinds[k] === 'var')))
    const sides = parseItems(toItems(toks, new Set(vars)))
    if (sides.length !== 2) return null
    const fn = new Function('V', `return [${sides.join(',')}]`) as Sides
    return { fn, vars }
  } catch {
    return null
  }
}

function serialize(toks: Tok[], fill: string[]): string {
  return toks.map(tok => {
    if (tok.t === 'text') return tok.v
    if (tok.t === 'frac') return `{${serialize(tok.num, fill)}|${serialize(tok.den, fill)}}`
    if (tok.t === 'sqrt') return `√(${serialize(tok.body, fill)})`
    const v = fill[tok.slot]
    return CONST_FULL.test(v) ? v : `[${v}]`
  }).join('')
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-7 * (1 + Math.abs(a) + Math.abs(b))
const residual = (fn: Sides, V: Record<string, number>) => { const [a, b] = fn(V); return { r: a - b, a, b } }

// Подбираем значение буквы name, при котором исходная формула верна
function solve(fn: Sides, V: Record<string, number>, name: string): boolean {
  const grid: number[] = []
  for (let e = -3; e <= 4; e += 0.05) grid.push(10 ** e)
  const xs = [...grid.map(x => -x).reverse(), ...grid]
  const at = (x: number) => { V[name] = x; return residual(fn, V).r }
  let px = xs[0], pr = at(px)
  for (let k = 1; k < xs.length; k++) {
    const x = xs[k], r = at(x)
    if (Number.isFinite(pr) && Number.isFinite(r) && Math.sign(pr) !== Math.sign(r)) {
      let lo = px, hi = x, rlo = pr
      for (let it = 0; it < 100; it++) {
        const mid = (lo + hi) / 2, rm = at(mid)
        if (Math.sign(rm) === Math.sign(rlo)) { lo = mid; rlo = rm } else hi = mid
      }
      V[name] = (lo + hi) / 2
      const { a, b } = residual(fn, V)
      if (close(a, b)) return true
    }
    px = x; pr = r
  }
  return false
}

export function equivalentFill(formula: Formula, fill: string[]): boolean | null {
  const orig = compile(formula.expr)
  if (!orig) return null
  const { toks, slots } = parseFormula(formula.expr)
  // «v = s/t» спрашивает именно v: если слева одна буква, она должна остаться
  // на месте (t = s/v тоже верно, но это уже другая формула)
  const eq = toks.findIndex(t => t.t === 'text' && t.v.includes('='))
  const lhs = toks.slice(0, eq).filter(t => !(t.t === 'text' && !t.v.trim()))
  if (lhs.length === 1 && lhs[0].t === 'var' && fill[lhs[0].slot] !== slots[lhs[0].slot]) return false
  const user = compile(serialize(toks, fill))
  if (!user) return false

  let passed = 0
  for (let attempt = 0; attempt < 12 && passed < 4; attempt++) {
    const V: Record<string, number> = {}
    for (const v of new Set([...orig.vars, ...user.vars])) V[v] = 0.4 + Math.random() * 2.1
    const start = residual(orig.fn, V)
    // В случайной точке обе формулы должны вести себя одинаково — иначе
    // «U₁/U₂ = U₁/U₂» (верно всегда) прошло бы как равносильная запись
    const [ua, ub] = user.fn(V)
    if (Number.isFinite(ua) && Number.isFinite(ub) && Number.isFinite(start.r) && close(ua, ub) !== close(start.a, start.b)) return false
    if (!close(start.a, start.b)) {
      const order = [...orig.vars].sort(() => Math.random() - 0.5)
      if (!order.some(v => solve(orig.fn, V, v))) continue
    }
    const [a, b] = user.fn(V)
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue
    if (!close(a, b)) return false
    passed++
  }
  return passed >= 3 ? true : null
}
