// Банк по мотивам сборника Сканави: тригонометрия (радианы, формулы,
// уравнения и неравенства). Параметрические шаблоны: числа случайные,
// ответ считается в коде — корни уравнений и неравенств находим перебором
// по сетке углов, на которой заведомо лежат все граничные точки.
import type { Template } from '../helpers'
import { piFrac } from '../more/common'
import { c, h, N, T as T0, pick, rnd, frac, gcd, fx, type B } from './bi'

// Варианты без повторов: совпавшие заменяются соседними значениями верного ответа
const key = (x: B | string) => (typeof x === 'string' ? x : x[0])
const bump = (r: string, i: number) => (/\d/.test(r) ? r.replace(/\d+/, m => String(+m + i)) : r.replace('$', `$${i + 1}`))
const T = (q: B, right: B | string, wrongs: (B | string)[], n: number, sol: B | string) => {
  const seen = new Set([key(right)]), w: (B | string)[] = []
  for (const x of wrongs) if (!seen.has(key(x))) { seen.add(key(x)); w.push(x) }
  for (let i = 1; typeof right === 'string' && w.length < 4 && i < 40; i++) { const x = bump(right, i); if (!seen.has(x)) { seen.add(x); w.push(x) } }
  return T0(q, right, w, n, sol)
}
const Q = (ru: string, kk: string): B => [ru, kk]
const F = (p: number, q: number) => `$${frac(p, q)}$`
const P = (k: number, m: number) => `$${piFrac(k, m)}$`
const D = '°'
const shuffle = <X,>(a: X[]): X[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = rnd(0, i); [b[i], b[j]] = [b[j], b[i]] } return b }
const par = (x: number | string) => (String(x).startsWith('-') ? `(${x})` : String(x))
const cf = (k: number) => (k === 1 ? '' : k === -1 ? '-' : String(k))
// Коэффициент πn: πn, 2πn, \frac{πn}{2}
const PN = (p: number, q: number) => { const g = gcd(p, q); p /= g; q /= g; const top = `${p === 1 ? '' : p}\\pi n`; return q === 1 ? top : `\\frac{${top}}{${q}}` }

// ---------- тригонометрия в градусах ----------
type Fn = 'sin' | 'cos' | 'tg' | 'ctg'
const rad = (d: number) => (d * Math.PI) / 180
const fv = (f: Fn, d: number): number => {
  const s = Math.sin(rad(d)), co = Math.cos(rad(d))
  if (f === 'sin') return s
  if (f === 'cos') return co
  if (f === 'tg') return Math.abs(co) < 1e-12 ? NaN : s / co
  return Math.abs(s) < 1e-12 ? NaN : co / s
}
const FN: Record<Fn, string> = { sin: '\\sin', cos: '\\cos', tg: '\\mathrm{tg}', ctg: '\\mathrm{ctg}' }
const fa = (f: Fn, arg: string) => `${FN[f]}${f === 'tg' || f === 'ctg' ? '\\,' : ' '}${arg}`
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9

// Табличные значения; as — arcsin в долях π/12, at — arctg в долях π/12
type V = { t: string; v: number; as?: number; at?: number }
const S2 = Math.SQRT2 / 2, S3 = Math.sqrt(3) / 2, T3 = Math.sqrt(3) / 3
const VSC: V[] = [
  { t: '\\frac{1}{2}', v: 0.5, as: 2 }, { t: '-\\frac{1}{2}', v: -0.5, as: -2 },
  { t: '\\frac{\\sqrt{2}}{2}', v: S2, as: 3 }, { t: '-\\frac{\\sqrt{2}}{2}', v: -S2, as: -3 },
  { t: '\\frac{\\sqrt{3}}{2}', v: S3, as: 4 }, { t: '-\\frac{\\sqrt{3}}{2}', v: -S3, as: -4 },
]
const VEDGE: V[] = [{ t: '0', v: 0, as: 0, at: 0 }, { t: '1', v: 1, as: 6 }, { t: '-1', v: -1, as: -6 }]
const VTG: V[] = [
  { t: '\\frac{\\sqrt{3}}{3}', v: T3, at: 2 }, { t: '-\\frac{\\sqrt{3}}{3}', v: -T3, at: -2 },
  { t: '1', v: 1, at: 3 }, { t: '-1', v: -1, at: -3 }, { t: '\\sqrt{3}', v: Math.sqrt(3), at: 4 }, { t: '-\\sqrt{3}', v: -Math.sqrt(3), at: -4 },
]
const ALLV: V[] = [...VEDGE, ...VSC, ...VTG]
const valT = (x: number) => ALLV.find(v => near(v.v, x))?.t ?? fx(x)
const pool = (f: Fn) => (f === 'tg' ? VTG : VSC)

// Корни g(x) = 0 на [L; R] (градусы); все корни лежат на сетке с шагом st
const grid = (L: number, R: number, st: number) => { const a: number[] = []; for (let i = 0; L + i * st <= R + 1e-9; i++) a.push(L + i * st); return a }
const rootsOf = (g: (x: number) => number, L: number, R: number, st = 0.25) => grid(L, R, st).filter(x => Math.abs(g(x)) < 1e-9)
const dg = (x: number) => `${String(+x.toFixed(4)).replace('.', '{,}')}°`
const rd = (x: number) => piFrac(Math.round(x * 4), 720)
const list = (xs: number[], f: (x: number) => string) => xs.map(f).join('; ')

// Решение неравенства g(x) rel 0 на [L; R]: объединение промежутков в градусах
type Rel = '>' | '<' | '\\ge' | '\\le'
const holds = (y: number, rel: Rel) => (rel === '>' ? y > 1e-9 : rel === '<' ? y < -1e-9 : rel === '\\ge' ? y > -1e-9 : y < 1e-9)
const solveIneq = (g: (x: number) => number, rel: Rel, L: number, R: number, st = 15): string => {
  const pts = grid(L, R, st), ok: boolean[] = []
  pts.forEach((x, i) => { ok.push(holds(g(x), rel)); if (i < pts.length - 1) ok.push(holds(g(x + st / 2), rel)) })
  const parts: string[] = []
  for (let i = 0; i < ok.length; i++) {
    if (!ok[i]) continue
    let j = i
    while (j + 1 < ok.length && ok[j + 1]) j++
    if (i === j && i % 2 === 0) parts.push(`\\{${dg(pts[i / 2])}\\}`)
    else parts.push(`${i % 2 ? '(' : '['}${dg(pts[i % 2 ? (i - 1) / 2 : i / 2])}; ${dg(pts[j % 2 ? (j + 1) / 2 : j / 2])}${j % 2 ? ')' : ']'}`)
    i = j
  }
  return `$${parts.length ? parts.join(' \\cup ') : '\\varnothing'}$`
}
const flip = (rel: Rel): Rel => (rel === '>' ? '\\le' : rel === '<' ? '\\ge' : rel === '\\ge' ? '<' : '>')
const loose = (rel: Rel): Rel => (rel === '>' ? '\\ge' : rel === '<' ? '\\le' : rel === '\\ge' ? '>' : '<')

// Многочлен: [[коэффициент, множитель], ...] → «2\sin^2 x - \sin x - 1»
const polyL = (terms: [number, string][]) => {
  let out = ''
  for (const [k, v] of terms) {
    if (k === 0) continue
    const a = Math.abs(k), body = v === '' ? String(a) : `${a === 1 ? '' : a}${v}`
    out += out ? ` ${k < 0 ? '-' : '+'} ${body}` : `${k < 0 ? '-' : ''}${body}`
  }
  return out || '0'
}
// (q1 t - p1)(q2 t - p2) → коэффициенты A, B, C
const quad = (p1: number, q1: number, p2: number, q2: number) => [q1 * q2, -(q1 * p2 + q2 * p1), p1 * p2]

// Пифагоровы тройки: sin и cos «хороших» углов
const TR: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]]
const tri = (i = rnd(0, TR.length - 1)): [number, number, number] => { const [a, b, cc] = TR[i]; return rnd(0, 1) ? [a, b, cc] : [b, a, cc] }
const two = () => { const i = rnd(0, TR.length - 1); let j = rnd(0, TR.length - 1); while (j === i) j = rnd(0, TR.length - 1); return [tri(i), tri(j)] }
const QR = ['I', 'II', 'III', 'IV']
const QI = ['\\left(0; \\frac{\\pi}{2}\\right)', '\\left(\\frac{\\pi}{2}; \\pi\\right)', '\\left(\\pi; \\frac{3\\pi}{2}\\right)', '\\left(\\frac{3\\pi}{2}; 2\\pi\\right)']
const sgnS = (q: number) => (q < 2 ? 1 : -1), sgnC = (q: number) => (q === 0 || q === 3 ? 1 : -1)
const posRu = (s: number) => (s > 0 ? 'положителен' : 'отрицателен'), posKk = (s: number) => (s > 0 ? 'оң' : 'теріс')
// неострый угол, не кратный 15°
const odd = (lo: number, hi: number) => { let x = rnd(lo, hi); while (x % 15 === 0) x = rnd(lo, hi); return x }

const R1 = 'Радианная мера угла', V1 = 'Табличные значения тригонометрических функций', S1 = 'Формулы суммы и разности углов'
const D1 = 'Формулы двойного и половинного аргумента', P1 = 'Формулы приведения', I1 = 'Тождественные преобразования'
const A1 = 'Обратные тригонометрические функции', E1 = 'Простейшие тригонометрические уравнения'
const E2 = 'Тригонометрические уравнения: разложение на множители', E3 = 'Однородные уравнения. Метод вспомогательного угла'
const E4 = 'Тригонометрические неравенства'

// Значения sin(α ± β), cos(α ± β) по числителям sin и cos (общий знаменатель c1·c2)
const SUMS = (sa: number, ca: number, sb: number, cb: number) => ({
  sp: sa * cb + ca * sb, sm: sa * cb - ca * sb, cp: ca * cb - sa * sb, cm: ca * cb + sa * sb,
})
type SK = 'sp' | 'sm' | 'cp' | 'cm'
const SNAME: Record<SK, string> = { sp: '\\sin(\\alpha + \\beta)', sm: '\\sin(\\alpha - \\beta)', cp: '\\cos(\\alpha + \\beta)', cm: '\\cos(\\alpha - \\beta)' }
const SFORM: Record<SK, string> = {
  sp: '\\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta', sm: '\\sin\\alpha\\cos\\beta - \\cos\\alpha\\sin\\beta',
  cp: '\\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta', cm: '\\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta',
}

// Общие решения простейших уравнений (углы в долях π/d, период p/q · πn)
const sinS = (t: number, d: number, p: number, q: number) => `$x = ${t < 0 ? '(-1)^{n+1}' : '(-1)^n'} ${piFrac(Math.abs(t), d)} + ${PN(p, q)}$`
const cosS = (t: number, d: number, p: number, q: number) => `$x = \\pm ${piFrac(Math.abs(t), d)} + ${PN(p, q)}$`
const tgS = (t: number, d: number, p: number, q: number) => `$x = ${t === 0 ? '' : `${piFrac(t, d)} + `}${PN(p, q)}$`

export const SK_TRIG: Template[] = [
  // ---------- Радианная мера угла ----------
  c(R1, n => {
    const d = 15 * pick([1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 26, 28, 30])
    return T(Q(`Выразите в радианах угол ${d}°.`, `${d}° бұрышын радианмен өрнектеңіз.`), P(d, 180), [P(d, 90), P(d, 360), P(d + 15, 180), P(180, d)], n,
      [`$1° = \\frac{\\pi}{180}$ рад, поэтому $${d}° = \\frac{${d}\\pi}{180} = ${piFrac(d, 180)}$.`, `$1° = \\frac{\\pi}{180}$ рад, сондықтан $${d}° = \\frac{${d}\\pi}{180} = ${piFrac(d, 180)}$.`])
  }),
  c(R1, n => {
    const m = pick([3, 4, 5, 6, 9, 10, 12, 18, 20, 36])
    let k = rnd(1, 3 * m)
    while (gcd(k, m) !== 1) k = rnd(1, 3 * m)
    const d = (180 * k) / m
    return N(Q(`Выразите в градусах угол $${piFrac(k, m)}$ рад.`, `$${piFrac(k, m)}$ рад бұрышын градуспен өрнектеңіз.`), d, [2 * d, d / 2, (180 * m) / k, d + 180], n, D,
      [`$\\pi$ рад $= 180°$, поэтому $${piFrac(k, m)} = \\frac{${k} \\cdot 180°}{${m}} = ${d}°$.`, `$\\pi$ рад $= 180°$, сондықтан $${piFrac(k, m)} = \\frac{${k} \\cdot 180°}{${m}} = ${d}°$.`])
  }),
  c(R1, n => {
    const R = rnd(2, 12), q = pick([0.5, 1.5, 2, 2.5, 3, 1.2, 0.8, 0.4]), l = R * q
    return N(Q(`Длина дуги окружности радиуса ${R} см равна ${fx(l)} см. Найдите радианную меру центрального угла, опирающегося на эту дугу.`, `Радиусы ${R} см шеңбер доғасының ұзындығы ${fx(l)} см. Осы доғаға тірелетін центрлік бұрыштың радиандық өлшемін табыңыз.`),
      q, [1 / q, l * R, q / 2, 2 * q], n, 'рад',
      [`Длина дуги $l = \\alpha R$, поэтому $\\alpha = \\frac{l}{R} = \\frac{${fx(l)}}{${R}} = ${fx(q)}$ рад.`, `Доға ұзындығы $l = \\alpha R$, сондықтан $\\alpha = \\frac{l}{R} = \\frac{${fx(l)}}{${R}} = ${fx(q)}$ рад.`])
  }),
  c(R1, n => {
    const xs: number[] = []
    for (let x = 1; x <= 20; x++) { const s = (x % (2 * Math.PI)) % (Math.PI / 2); if (Math.min(s, Math.PI / 2 - s) > 0.15) xs.push(x) }
    const x = pick(xs), j = Math.floor(x / (2 * Math.PI)), r = x - 2 * Math.PI * j, q = Math.floor(r / (Math.PI / 2))
    const lo = fx((q * Math.PI) / 2), hi = fx(((q + 1) * Math.PI) / 2)
    const opt = (i: number): B => [`${QR[i]} четверть`, `${QR[i]} ширек`]
    const red = j ? `$${x} - ${piFrac(2 * j, 1)} \\approx ${fx(r)}$` : `$${x}$`
    return T(Q(`В какой координатной четверти лежит угол ${x} рад?`, `${x} рад бұрышы қай координаталық ширекте жатыр?`), opt(q), [0, 1, 2, 3].filter(i => i !== q).map(opt), n,
      [`$\\frac{\\pi}{2} \\approx 1{,}57$, $2\\pi \\approx 6{,}28$. ${j ? 'Отбросим полные обороты: ' : 'Угол '}${red}${j ? '' : ' рад'}; так как $${lo} < ${fx(r)} < ${hi}$, угол лежит в ${QR[q]} четверти.`,
        `$\\frac{\\pi}{2} \\approx 1{,}57$, $2\\pi \\approx 6{,}28$. ${j ? 'Толық айналымдарды алып тастаймыз: ' : 'Бұрыш '}${red}${j ? '' : ' рад'}; $${lo} < ${fx(r)} < ${hi}$ болғандықтан, бұрыш ${QR[q]} ширекте жатыр.`])
  }),
  h(R1, n => {
    const all: [number, number, number][] = []
    for (let hh = 1; hh <= 11; hh++) for (let m = 2; m < 60; m += 2) { let d = Math.abs(30 * hh - 5.5 * m); if (d > 180) d = 360 - d; if (d > 0 && d % 15 === 0) all.push([hh, m, d]) }
    const [hh, m, d] = pick(all), diff = Math.abs(30 * hh + m / 2 - 6 * m)
    let w = Math.abs(30 * hh - 6 * m)
    if (w > 180) w = 360 - w
    const tail = diff > 180 ? `, $360° - ${fx(diff)}° = ${d}°$` : ''
    return T(Q(`Часы показывают ${hh} ч ${m} мин. Найдите в радианах меньший угол между часовой и минутной стрелками.`, `Сағат ${hh} сағат ${m} минутты көрсетіп тұр. Сағаттық және минуттық тілдердің арасындағы кіші бұрышты радианмен табыңыз.`),
      P(d, 180), [P(w, 180), P(360 - d, 180), P(d, 360), P(d + 30, 180)], n,
      [`От отметки 12 минутная стрелка повернулась на $6° \\cdot ${m} = ${6 * m}°$, часовая — на $30° \\cdot ${hh} + 0{,}5° \\cdot ${m} = ${fx(30 * hh + m / 2)}°$. Разность $${fx(diff)}°$${tail}; $${d}° = ${piFrac(d, 180)}$.`,
        `12 белгісінен минуттық тіл $6° \\cdot ${m} = ${6 * m}°$-қа, сағаттық тіл $30° \\cdot ${hh} + 0{,}5° \\cdot ${m} = ${fx(30 * hh + m / 2)}°$-қа бұрылды. Айырмасы $${fx(diff)}°$${tail}; $${d}° = ${piFrac(d, 180)}$.`])
  }),

  // ---------- Табличные значения ----------
  c(V1, n => {
    const a = rnd(2, 12), b = rnd(2, 12), k = rnd(1, 6), ans = (a + b) / 2 - k
    return N(Q(`Вычислите: $${a}\\sin 30° + ${b}\\cos 60° - ${cf(k)}\\,\\mathrm{tg}\\,45°$.`, `Есептеңіз: $${a}\\sin 30° + ${b}\\cos 60° - ${cf(k)}\\,\\mathrm{tg}\\,45°$.`), ans,
      [a + b - k, (a + b) / 2 + k, (a - b) / 2 - k, a / 2 + b - k], n, '',
      `$\\sin 30° = \\cos 60° = \\frac{1}{2}$, $\\mathrm{tg}\\,45° = 1$: $\\frac{${a}}{2} + \\frac{${b}}{2} - ${k} = ${fx(ans)}$`)
  }),
  c(V1, n => {
    const a = rnd(2, 12), b = rnd(1, 4), p = 4 * rnd(1, 4), ans = a / 2 + 3 * b - (3 * p) / 4
    const e = `${a}\\sin^2 45° + ${cf(b)}\\,\\mathrm{tg}^2 60° - ${p}\\cos^2 30°`
    return N(Q(`Вычислите: $${e}$.`, `Есептеңіз: $${e}$.`), ans,
      [a + 3 * b - (3 * p) / 4, a / 2 + b - (3 * p) / 4, a / 2 + 3 * b - p / 4, a / 2 + b / 3 - (3 * p) / 4], n, '',
      `$\\sin^2 45° = \\frac{1}{2}$, $\\mathrm{tg}^2 60° = 3$, $\\cos^2 30° = \\frac{3}{4}$: $${fx(a / 2)} + ${3 * b} - ${(3 * p) / 4} = ${fx(ans)}$`)
  }),
  c(V1, n => {
    const f = pick(['sin', 'cos', 'tg'] as Fn[])
    let m = 4, k = 1, d = 45
    do { m = pick([4, 6]); k = rnd(-2 * m, 4 * m); d = (180 * k) / m } while (d % 90 === 0)
    const val = fv(f, d), right = valT(val)
    const co = f === 'sin' ? fv('cos', d) : f === 'cos' ? fv('sin', d) : 1 / val
    const pl = (f === 'tg' ? VTG : VSC).map(v => v.t)
    const ang = piFrac(k, m), e = `${FN[f]}${k < 0 ? `\\left(${ang}\\right)` : ang}`
    const d0 = ((d % 360) + 360) % 360
    return T(Q(`Найдите значение $${e}$.`, `$${e}$ мәнін табыңыз.`), `$${right}$`, [valT(-val), valT(co), valT(-co), ...shuffle(pl)].map(t => `$${t}$`), n,
      `$${ang} = ${d}°$; $${fa(f, `(${d}°)`)} = ${fa(f, `${d0}°`)} = ${right}$`)
  }),
  c(V1, n => {
    const a = rnd(1, 9), b = rnd(1, 5), p = 2 * rnd(1, 5), ans = a + 3 * b - 1.5 * p
    const e = `${a}\\sqrt{2}\\sin 45° + ${b}\\sqrt{3}\\,\\mathrm{tg}\\,60° - ${p}\\sqrt{3}\\cos 30°`
    return N(Q(`Вычислите: $${e}$.`, `Есептеңіз: $${e}$.`), ans, [a + b - p, a + 3 * b - 3 * p, 2 * a + 3 * b - 1.5 * p, a + 3 * b + 1.5 * p], n, '',
      `$\\sqrt{2}\\sin 45° = 1$, $\\sqrt{3}\\,\\mathrm{tg}\\,60° = 3$, $\\sqrt{3}\\cos 30° = \\frac{3}{2}$: $${a} + ${3 * b} - ${1.5 * p} = ${fx(ans)}$`)
  }),
  h(V1, n => {
    const k1 = pick([13, 17, 19, 23, 25, 29, 31, 35, 37, 41, 43, 47]), k2 = pick([4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20]), k3 = pick([5, 7, 9, 11, 13, 15, 17, 19, 21, 23])
    const s = Math.round(2 * fv('sin', 30 * k1)) / 2, co = Math.round(2 * fv('cos', 60 * k2)) / 2, t = Math.round(fv('tg', 45 * k3))
    const a = 2 * rnd(1, 5), b = 2 * rnd(1, 5), p = rnd(1, 5), ans = a * s + b * co - p * t
    const e = `${a}\\sin\\frac{${k1}\\pi}{6} + ${b}\\cos\\frac{${k2}\\pi}{3} - ${cf(p)}\\,\\mathrm{tg}\\frac{${k3}\\pi}{4}`
    const h2 = (x: number) => par(frac(2 * x, 2))
    return N(Q(`Вычислите: $${e}$.`, `Есептеңіз: $${e}$.`), ans, [a / 2 + b / 2 - p, -ans, a * s + b * co + p * t, a * s - b * co - p * t, -a * s + b * co - p * t], n, '',
      [`Отбрасываем периоды ($2\\pi$ для синуса и косинуса, $\\pi$ для тангенса): $\\sin\\frac{${k1}\\pi}{6} = \\sin${piFrac(k1 % 12, 6)} = ${frac(2 * s, 2)}$, $\\cos\\frac{${k2}\\pi}{3} = \\cos${piFrac(k2 % 6, 3)} = ${frac(2 * co, 2)}$, $\\mathrm{tg}\\frac{${k3}\\pi}{4} = \\mathrm{tg}${piFrac(k3 % 4, 4)} = ${t}$. Итого $${a} \\cdot ${h2(s)} + ${b} \\cdot ${h2(co)} - ${p} \\cdot ${par(t)} = ${fx(ans)}$.`,
        `Периодтарды алып тастаймыз (синус пен косинус үшін $2\\pi$, тангенс үшін $\\pi$): $\\sin\\frac{${k1}\\pi}{6} = \\sin${piFrac(k1 % 12, 6)} = ${frac(2 * s, 2)}$, $\\cos\\frac{${k2}\\pi}{3} = \\cos${piFrac(k2 % 6, 3)} = ${frac(2 * co, 2)}$, $\\mathrm{tg}\\frac{${k3}\\pi}{4} = \\mathrm{tg}${piFrac(k3 % 4, 4)} = ${t}$. Барлығы $${a} \\cdot ${h2(s)} + ${b} \\cdot ${h2(co)} - ${p} \\cdot ${par(t)} = ${fx(ans)}$.`])
  }),

  // ---------- Формулы суммы и разности ----------
  c(S1, n => {
    const [[a1, b1, c1], [a2, b2, c2]] = two(), v = SUMS(a1, b1, a2, b2), k = pick(['sp', 'sm', 'cp', 'cm'] as SK[]), den = c1 * c2
    const wr = (['sp', 'sm', 'cp', 'cm'] as SK[]).filter(x => x !== k).map(x => F(v[x], den))
    return T(Q(`$\\alpha$ и $\\beta$ — острые углы, $\\sin\\alpha = \\frac{${a1}}{${c1}}$, $\\cos\\beta = \\frac{${b2}}{${c2}}$. Найдите $${SNAME[k]}$.`, `$\\alpha$ және $\\beta$ — сүйір бұрыштар, $\\sin\\alpha = \\frac{${a1}}{${c1}}$, $\\cos\\beta = \\frac{${b2}}{${c2}}$. $${SNAME[k]}$ мәнін табыңыз.`),
      F(v[k], den), [F(-v[k], den), ...wr], n,
      [`Углы острые, поэтому $\\cos\\alpha = \\sqrt{1 - \\sin^2\\alpha} = \\frac{${b1}}{${c1}}$, $\\sin\\beta = \\frac{${a2}}{${c2}}$. $${SNAME[k]} = ${SFORM[k]} = \\frac{${v[k]}}{${den}}$.`,
        `Бұрыштар сүйір, сондықтан $\\cos\\alpha = \\sqrt{1 - \\sin^2\\alpha} = \\frac{${b1}}{${c1}}$, $\\sin\\beta = \\frac{${a2}}{${c2}}$. $${SNAME[k]} = ${SFORM[k]} = \\frac{${v[k]}}{${den}}$.`])
  }),
  c(S1, n => {
    const kind = rnd(0, 3)
    const S = pick([[30, 150, 210, 330, 90, 270], [30, 90, 150], [60, 120, 240, 300, 180], [60, 120, 180]][kind])
    let x = 0, y = 0
    do {
      if (kind % 2 === 0) { x = rnd(Math.max(1, S - 170), Math.min(170, S - 1)); y = S - x } else { y = rnd(1, 175 - S); x = y + S }
    } while (x % 15 === 0 || y % 15 === 0)
    const v = Math.round(2 * fv(kind < 2 ? 'sin' : 'cos', S)) / 2, a = 2 * rnd(1, 8), ans = a * v
    const e = [`\\sin ${x}°\\cos ${y}° + \\cos ${x}°\\sin ${y}°`, `\\sin ${x}°\\cos ${y}° - \\cos ${x}°\\sin ${y}°`, `\\cos ${x}°\\cos ${y}° - \\sin ${x}°\\sin ${y}°`, `\\cos ${x}°\\cos ${y}° + \\sin ${x}°\\sin ${y}°`][kind]
    const fn = kind < 2 ? '\\sin' : '\\cos', op = kind % 2 === 0 ? '+' : '-'
    return N(Q(`Вычислите: $${a}(${e})$.`, `Есептеңіз: $${a}(${e})$.`), ans, [-ans, a, -a, a / 2, 2 * ans], n, '',
      `$${a}${fn}(${x}° ${op} ${y}°) = ${a}${fn} ${S}° = ${fx(ans)}$`)
  }),
  c(S1, n => {
    const plus = rnd(0, 1) === 1
    let p = 0, q = 0
    do { p = rnd(-5, 6); q = rnd(-5, 6) } while (p === 0 || q === 0 || p === q || p + q === 0 || (plus ? 1 - p * q : 1 + p * q) === 0)
    const num = plus ? p + q : p - q, den = plus ? 1 - p * q : 1 + p * q, op = plus ? '+' : '-', op2 = plus ? '-' : '+'
    const alt = (a: number, b: number) => (b === 0 ? `$${a + 1}$` : F(a, b))
    const wr = plus ? [alt(p + q, 1 + p * q), alt(p - q, 1 + p * q), `$${p + q}$`, alt(p + q, p * q - 1)] : [alt(p - q, 1 - p * q), alt(p + q, 1 - p * q), `$${p - q}$`, alt(q - p, 1 + p * q)]
    return T(Q(`$\\mathrm{tg}\\,\\alpha = ${p}$, $\\mathrm{tg}\\,\\beta = ${q}$. Найдите $\\mathrm{tg}(\\alpha ${op} \\beta)$.`, `$\\mathrm{tg}\\,\\alpha = ${p}$, $\\mathrm{tg}\\,\\beta = ${q}$. $\\mathrm{tg}(\\alpha ${op} \\beta)$ мәнін табыңыз.`),
      F(num, den), wr, n,
      `$\\mathrm{tg}(\\alpha ${op} \\beta) = \\frac{\\mathrm{tg}\\,\\alpha ${op} \\mathrm{tg}\\,\\beta}{1 ${op2} \\mathrm{tg}\\,\\alpha\\,\\mathrm{tg}\\,\\beta} = \\frac{${num}}{${den}} = ${frac(num, den)}$`)
  }),
  c(S1, n => {
    const plus = rnd(0, 1) === 1, S = plus ? pick([45, 135, 225, 315]) : pick([45, 135])
    let x = 0, y = 0
    do {
      if (plus) { x = rnd(Math.max(1, S - 179), Math.min(179, S - 1)); y = S - x } else { y = rnd(1, 175 - S); x = y + S }
    } while (x % 15 === 0 || y % 15 === 0 || x % 90 === 0 || y % 90 === 0)
    const v = Math.round(fv('tg', S)), a = rnd(2, 12), ans = a * v
    const e = plus ? `\\frac{\\mathrm{tg}\\,${x}° + \\mathrm{tg}\\,${y}°}{1 - \\mathrm{tg}\\,${x}°\\,\\mathrm{tg}\\,${y}°}` : `\\frac{\\mathrm{tg}\\,${x}° - \\mathrm{tg}\\,${y}°}{1 + \\mathrm{tg}\\,${x}°\\,\\mathrm{tg}\\,${y}°}`
    return N(Q(`Вычислите: $${a} \\cdot ${e}$.`, `Есептеңіз: $${a} \\cdot ${e}$.`), ans, [-ans, a / 2, 2 * a, 0], n, '',
      [`Дробь равна $\\mathrm{tg}(${x}° ${plus ? '+' : '-'} ${y}°) = \\mathrm{tg}\\,${S}° = ${v}$, ответ $${a} \\cdot ${par(v)} = ${ans}$.`, `Бөлшек $\\mathrm{tg}(${x}° ${plus ? '+' : '-'} ${y}°) = \\mathrm{tg}\\,${S}° = ${v}$-ге тең, жауабы $${a} \\cdot ${par(v)} = ${ans}$.`])
  }),
  h(S1, n => {
    const [[a1, b1, c1], [a2, b2, c2]] = two(), qa = rnd(1, 3), qb = rnd(0, 3)
    const sa = sgnS(qa) * a1, ca = sgnC(qa) * b1, sb = sgnS(qb) * a2, cb = sgnC(qb) * b2
    const v = SUMS(sa, ca, sb, cb), naive = SUMS(Math.abs(sa), Math.abs(ca), Math.abs(sb), Math.abs(cb)), den = c1 * c2
    const k = pick(['sp', 'sm', 'cp', 'cm'] as SK[]), others = (['sp', 'sm', 'cp', 'cm'] as SK[]).filter(x => x !== k)
    return T(Q(`Известно, что $\\sin\\alpha = ${frac(sa, c1)}$, $\\alpha \\in ${QI[qa]}$, и $\\cos\\beta = ${frac(cb, c2)}$, $\\beta \\in ${QI[qb]}$. Найдите $${SNAME[k]}$.`,
      `$\\sin\\alpha = ${frac(sa, c1)}$, $\\alpha \\in ${QI[qa]}$ және $\\cos\\beta = ${frac(cb, c2)}$, $\\beta \\in ${QI[qb]}$ екені белгілі. $${SNAME[k]}$ мәнін табыңыз.`),
      F(v[k], den), [F(naive[k], den), F(-v[k], den), ...others.map(x => F(v[x], den))], n,
      [`В ${QR[qa]} четверти косинус ${posRu(ca)}: $\\cos\\alpha = ${frac(ca, c1)}$; в ${QR[qb]} четверти синус ${posRu(sb)}: $\\sin\\beta = ${frac(sb, c2)}$. $${SNAME[k]} = ${SFORM[k]} = ${frac(v[k], den)}$.`,
        `${QR[qa]} ширекте косинус ${posKk(ca)}: $\\cos\\alpha = ${frac(ca, c1)}$; ${QR[qb]} ширекте синус ${posKk(sb)}: $\\sin\\beta = ${frac(sb, c2)}$. $${SNAME[k]} = ${SFORM[k]} = ${frac(v[k], den)}$.`])
  }),

  // ---------- Двойной и половинный аргумент ----------
  c(D1, n => {
    const [a, b, cc] = tri(), q = rnd(0, 3), sa = sgnS(q) * a, ca = sgnC(q) * b, c2 = cc * cc
    const vals = [F(2 * sa * ca, c2), F(ca * ca - sa * sa, c2), F(2 * sa * ca, ca * ca - sa * sa)]
    const names = ['\\sin 2\\alpha', '\\cos 2\\alpha', '\\mathrm{tg}\\,2\\alpha'], forms = ['2\\sin\\alpha\\cos\\alpha', '\\cos^2\\alpha - \\sin^2\\alpha', '\\frac{\\sin 2\\alpha}{\\cos 2\\alpha}']
    const k = rnd(0, 2), right = [[2 * sa * ca, c2], [ca * ca - sa * sa, c2], [2 * sa * ca, ca * ca - sa * sa]][k]
    return T(Q(`$\\sin\\alpha = ${frac(sa, cc)}$, $\\alpha \\in ${QI[q]}$. Найдите $${names[k]}$.`, `$\\sin\\alpha = ${frac(sa, cc)}$, $\\alpha \\in ${QI[q]}$. $${names[k]}$ мәнін табыңыз.`),
      vals[k], [F(-right[0], right[1]), ...vals.filter((_, i) => i !== k), F(2 * sa, cc), F(sa * ca, c2)], n,
      [`В ${QR[q]} четверти $\\cos\\alpha = ${frac(ca, cc)}$. $${names[k]} = ${forms[k]} = ${frac(right[0], right[1])}$.`, `${QR[q]} ширекте $\\cos\\alpha = ${frac(ca, cc)}$. $${names[k]} = ${forms[k]} = ${frac(right[0], right[1])}$.`])
  }),
  c(D1, n => {
    const form = rnd(0, 2)
    let ans = 0, e = '', s = ''
    if (form === 0) {
      const x = pick([15, 75, 105, 165]), a = 4 * rnd(1, 6), v = Math.round(2 * fv('sin', 2 * x)) / 2
      ans = (a / 2) * v; e = `${a}\\sin ${x}°\\cos ${x}°`; s = `$${e} = ${a / 2}\\sin ${2 * x}° = ${a / 2} \\cdot ${par(frac(2 * v, 2))} = ${fx(ans)}$`
    } else if (form === 1) {
      const x = pick([15, 75, 105, 165]), a = 2 * rnd(1, 6), sg = Math.sign(fv('cos', 2 * x))
      ans = (3 * a * sg) / 2; e = `${a}\\sqrt{3}(\\cos^2 ${x}° - \\sin^2 ${x}°)`; s = `$${e} = ${a}\\sqrt{3}\\cos ${2 * x}° = ${a}\\sqrt{3} \\cdot ${sg < 0 ? '\\left(-\\frac{\\sqrt{3}}{2}\\right)' : '\\frac{\\sqrt{3}}{2}'} = ${fx(ans)}$`
    } else {
      const x = pick([22.5, 67.5, 112.5, 157.5]), a = 2 * rnd(1, 10), v = Math.round(fv('tg', 2 * x)), xs = String(x).replace('.', '{,}')
      ans = (a / 2) * v; e = `\\frac{${a}\\,\\mathrm{tg}\\,${xs}°}{1 - \\mathrm{tg}^2 ${xs}°}`; s = `$${e} = ${a / 2}\\,\\mathrm{tg}\\,${2 * x}° = ${a / 2} \\cdot ${par(v)} = ${fx(ans)}$`
    }
    return N(Q(`Вычислите: $${e}$.`, `Есептеңіз: $${e}$.`), ans, [-ans, 2 * ans, ans / 2, -2 * ans], n, '', s)
  }),
  c(D1, n => {
    let p = 1, q = 2
    do { p = rnd(1, 7) * (rnd(0, 3) ? 1 : -1); q = rnd(1, 7) } while (gcd(p, q) !== 1 || Math.abs(p) === q)
    const vals: [number, number][] = [[q * q - p * p, q * q + p * p], [2 * p * q, p * p + q * q], [2 * p * q, q * q - p * p]]
    const names = ['\\cos 2\\alpha', '\\sin 2\\alpha', '\\mathrm{tg}\\,2\\alpha']
    const forms = ['\\frac{1 - \\mathrm{tg}^2\\alpha}{1 + \\mathrm{tg}^2\\alpha}', '\\frac{2\\,\\mathrm{tg}\\,\\alpha}{1 + \\mathrm{tg}^2\\alpha}', '\\frac{2\\,\\mathrm{tg}\\,\\alpha}{1 - \\mathrm{tg}^2\\alpha}']
    const k = rnd(0, 2), [u, w] = vals[k]
    return T(Q(`$\\mathrm{tg}\\,\\alpha = ${frac(p, q)}$. Найдите $${names[k]}$.`, `$\\mathrm{tg}\\,\\alpha = ${frac(p, q)}$. $${names[k]}$ мәнін табыңыз.`),
      F(u, w), [F(-u, w), ...vals.filter((_, i) => i !== k).map(([x, y]) => F(x, y)), F(2 * p, q)], n,
      `$${names[k]} = ${forms[k]} = ${frac(u, w)}$`)
  }),
  c(D1, n => {
    let p = 1, q = 3
    do { q = rnd(3, 9); p = rnd(1 - q, q - 1) } while (p === 0 || gcd(p, q) !== 1)
    const vals: [number, number][] = [[q - p, 2 * q], [q + p, 2 * q], [q - p, q + p]]
    const names = ['\\sin^2\\frac{\\alpha}{2}', '\\cos^2\\frac{\\alpha}{2}', '\\mathrm{tg}^2\\frac{\\alpha}{2}']
    const forms = ['\\frac{1 - \\cos\\alpha}{2}', '\\frac{1 + \\cos\\alpha}{2}', '\\frac{1 - \\cos\\alpha}{1 + \\cos\\alpha}']
    const k = rnd(0, 2), [u, w] = vals[k]
    return T(Q(`$\\cos\\alpha = ${frac(p, q)}$. Найдите $${names[k]}$.`, `$\\cos\\alpha = ${frac(p, q)}$. $${names[k]}$ мәнін табыңыз.`),
      F(u, w), [...vals.filter((_, i) => i !== k).map(([x, y]) => F(x, y)), F(q - p, q), F(p, 2 * q)], n,
      `$${names[k]} = ${forms[k]} = ${frac(u, w)}$`)
  }),
  h(D1, n => {
    const [a, b, cc] = tri(), q = rnd(0, 3), sa = sgnS(q) * a, ca = sgnC(q) * b
    return T(Q(`$\\sin\\alpha = ${frac(sa, cc)}$, $\\alpha \\in ${QI[q]}$. Найдите $\\mathrm{tg}\\,\\frac{\\alpha}{2}$.`, `$\\sin\\alpha = ${frac(sa, cc)}$, $\\alpha \\in ${QI[q]}$. $\\mathrm{tg}\\,\\frac{\\alpha}{2}$ мәнін табыңыз.`),
      F(sa, cc + ca), [F(sa, cc - ca), F(cc + ca, sa), F(-sa, cc + ca), F(sa, cc), F(-sa, cc - ca)], n,
      [`В ${QR[q]} четверти косинус ${posRu(ca)}: $\\cos\\alpha = ${frac(ca, cc)}$. $\\mathrm{tg}\\,\\frac{\\alpha}{2} = \\frac{\\sin\\alpha}{1 + \\cos\\alpha} = \\frac{${frac(sa, cc)}}{${frac(cc + ca, cc)}} = ${frac(sa, cc + ca)}$.`,
        `${QR[q]} ширекте косинус ${posKk(ca)}: $\\cos\\alpha = ${frac(ca, cc)}$. $\\mathrm{tg}\\,\\frac{\\alpha}{2} = \\frac{\\sin\\alpha}{1 + \\cos\\alpha} = \\frac{${frac(sa, cc)}}{${frac(cc + ca, cc)}} = ${frac(sa, cc + ca)}$.`])
  }),

  // ---------- Формулы приведения ----------
  c(P1, n => {
    const f = pick(['sin', 'cos', 'tg', 'ctg'] as Fn[]), k = rnd(1, 7), sg = rnd(0, 1) ? 1 : -1, x0 = 17
    const val = fv(f, 90 * k + sg * x0)
    const fam: [string, number][] = f === 'sin' || f === 'cos'
      ? [['\\sin\\alpha', fv('sin', x0)], ['-\\sin\\alpha', -fv('sin', x0)], ['\\cos\\alpha', fv('cos', x0)], ['-\\cos\\alpha', -fv('cos', x0)]]
      : [['\\mathrm{tg}\\,\\alpha', fv('tg', x0)], ['-\\mathrm{tg}\\,\\alpha', -fv('tg', x0)], ['\\mathrm{ctg}\\,\\alpha', fv('ctg', x0)], ['-\\mathrm{ctg}\\,\\alpha', -fv('ctg', x0)]]
    const right = fam.find(([, v]) => near(v, val))![0]
    const e = `${FN[f]}\\left(${piFrac(k, 2)} ${sg > 0 ? '+' : '-'} \\alpha\\right)`
    const q = Math.floor((((90 * k + sg * x0) % 360) + 360) % 360 / 90)
    return T(Q(`Упростите выражение $${e}$.`, `$${e}$ өрнегін ықшамдаңыз.`), `$${right}$`, fam.filter(([t]) => t !== right).map(([t]) => `$${t}$`), n,
      [`${k % 2 ? 'Число $\\frac{\\pi}{2}$ взято нечётное число раз, поэтому функция меняется на кофункцию' : 'Число $\\frac{\\pi}{2}$ взято чётное число раз, поэтому название функции сохраняется'}. При остром $\\alpha$ угол лежит в ${QR[q]} четверти, где $${FN[f]}$ ${posRu(val)}. Итак, $${e} = ${right}$.`,
        `${k % 2 ? '$\\frac{\\pi}{2}$ тақ рет алынған, сондықтан функция кофункцияға ауысады' : '$\\frac{\\pi}{2}$ жұп рет алынған, сондықтан функция атауы сақталады'}. Сүйір $\\alpha$ үшін бұрыш ${QR[q]} ширекте жатыр, онда $${FN[f]}$ ${posKk(val)}. Сонымен, $${e} = ${right}$.`])
  }),
  c(P1, n => {
    const f = pick(['sin', 'cos'] as Fn[]), base = f === 'sin' ? pick([30, 150, 210, 330, 90, 270]) : pick([60, 120, 240, 300, 0, 180])
    const j = pick([-3, -2, -1, 1, 2, 3, 4]), d = 360 * j + base, a = 2 * rnd(1, 10), ans = (a * Math.round(2 * fv(f, base))) / 2
    const arg = d < 0 ? `(${d}°)` : ` ${d}°`
    return N(Q(`Вычислите: $${a}${FN[f]}${arg}$.`, `Есептеңіз: $${a}${FN[f]}${arg}$.`), ans, [-ans, a, -a, a / 2], n, '',
      `$${a}${FN[f]}${arg} = ${a}${FN[f]}(${d}° ${j > 0 ? '-' : '+'} ${Math.abs(360 * j)}°) = ${a}${FN[f]} ${base}° = ${fx(ans)}$`)
  }),
  c(P1, n => {
    const TERMS: [string, (x: number) => number][] = [
      ['\\sin(\\pi - \\alpha)', x => Math.sin(Math.PI - x)], ['\\sin(\\pi + \\alpha)', x => Math.sin(Math.PI + x)],
      ['\\cos\\left(\\frac{\\pi}{2} - \\alpha\\right)', x => Math.cos(Math.PI / 2 - x)], ['\\cos\\left(\\frac{\\pi}{2} + \\alpha\\right)', x => Math.cos(Math.PI / 2 + x)],
      ['\\sin(2\\pi - \\alpha)', x => Math.sin(2 * Math.PI - x)], ['\\cos\\left(\\frac{3\\pi}{2} - \\alpha\\right)', x => Math.cos((3 * Math.PI) / 2 - x)],
      ['\\cos\\left(\\frac{3\\pi}{2} + \\alpha\\right)', x => Math.cos((3 * Math.PI) / 2 + x)], ['\\sin(3\\pi - \\alpha)', x => Math.sin(3 * Math.PI - x)],
      ['\\sin(\\alpha - \\pi)', x => Math.sin(x - Math.PI)],
    ]
    const [t1, t2, t3] = shuffle(TERMS).slice(0, 3), x0 = 0.4, co = (t: [string, (x: number) => number]) => Math.round(t[1](x0) / Math.sin(x0))
    const s1 = co(t1), s2 = co(t2), s3 = co(t3)
    const a = rnd(2, 9)
    let b = rnd(2, 9)
    while (a === b) b = rnd(2, 9)
    const num = a * s1 + b * s2, ans = num / s3
    const st = (s: number) => `${s < 0 ? '-' : ''}\\sin\\alpha`
    const e = `\\frac{${a}${t1[0]} + ${b}${t2[0]}}{${t3[0]}}`
    return N(Q(`Найдите значение выражения $${e}$.`, `$${e}$ өрнегінің мәнін табыңыз.`), ans, [a + b, a - b, -ans, b - a], n, '',
      [`По формулам приведения $${t1[0]} = ${st(s1)}$, $${t2[0]} = ${st(s2)}$, $${t3[0]} = ${st(s3)}$. Получаем $\\frac{${num}\\sin\\alpha}{${st(s3)}} = ${ans}$.`,
        `Келтіру формулалары бойынша $${t1[0]} = ${st(s1)}$, $${t2[0]} = ${st(s2)}$, $${t3[0]} = ${st(s3)}$. Сонда $\\frac{${num}\\sin\\alpha}{${st(s3)}} = ${ans}$.`])
  }),
  c(P1, n => {
    const f = pick(['tg', 'ctg'] as Fn[]), k = rnd(1, 7), sg = rnd(0, 1) ? 1 : -1, t = pick([2, 4, 5, 0.5, 0.25, 0.2, -2, -4, -0.5, -0.2])
    const a0 = Math.atan(t), ang = (k * Math.PI) / 2 + sg * a0, val = f === 'tg' ? Math.tan(ang) : 1 / Math.tan(ang)
    const cand = [t, -t, 1 / t, -1 / t], ans = cand.find(x => Math.abs(x - val) < 1e-6)!
    const e = `${FN[f]}\\left(${piFrac(k, 2)} ${sg > 0 ? '+' : '-'} \\alpha\\right)`
    const isT = Math.abs(ans) === Math.abs(t), nm = `${ans < 0 === t < 0 ? '' : '-'}\\mathrm{${isT ? 'tg' : 'ctg'}}\\,\\alpha`
    return N(Q(`Известно, что $\\mathrm{tg}\\,\\alpha = ${fx(t)}$. Найдите $${e}$.`, `$\\mathrm{tg}\\,\\alpha = ${fx(t)}$ екені белгілі. $${e}$ мәнін табыңыз.`), ans, cand.filter(x => x !== ans), n, '',
      [`По формулам приведения $${e} = ${nm}$${isT ? '' : ', а $\\mathrm{ctg}\\,\\alpha = \\frac{1}{\\mathrm{tg}\\,\\alpha}$'}. Ответ: $${fx(ans)}$.`,
        `Келтіру формулалары бойынша $${e} = ${nm}$${isT ? '' : ', ал $\\mathrm{ctg}\\,\\alpha = \\frac{1}{\\mathrm{tg}\\,\\alpha}$'}. Жауабы: $${fx(ans)}$.`])
  }),
  h(P1, n => {
    const u1 = odd(10, 80), u2 = odd(10, 80), m1 = pick([1, 3, 5, 7, 9, 11]), m2 = pick([1, 3, 5, 7, 9, 11]), s1 = rnd(0, 1) ? 1 : -1, s2 = rnd(0, 1) ? 1 : -1
    const x1 = 90 * m1 + s1 * u1, x2 = 90 * m2 + s2 * u2
    const r1 = Math.round(fv('sin', x1) / fv('cos', u1)), r2 = Math.round(fv('tg', x2) / fv('ctg', u2))
    const a = rnd(2, 9)
    let b = rnd(2, 9)
    while (a === b) b = rnd(2, 9)
    const ans = a * r1 + b * r2
    const e = `${a} \\cdot \\frac{\\sin ${x1}°}{\\cos ${u1}°} + ${b} \\cdot \\frac{\\mathrm{tg}\\,${x2}°}{\\mathrm{ctg}\\,${u2}°}`
    const body = `$\\sin ${x1}° = \\sin(${90 * m1}° ${s1 > 0 ? '+' : '-'} ${u1}°) = ${r1 < 0 ? '-' : ''}\\cos ${u1}°$, $\\mathrm{tg}\\,${x2}° = \\mathrm{tg}(${90 * m2}° ${s2 > 0 ? '+' : '-'} ${u2}°) = ${r2 < 0 ? '-' : ''}\\mathrm{ctg}\\,${u2}°$`
    return N(Q(`Вычислите: $${e}$.`, `Есептеңіз: $${e}$.`), ans, [a + b, a - b, -ans, b - a, -a - b], n, '',
      [`По формулам приведения ${body}. Значение: $${a} \\cdot ${par(r1)} + ${b} \\cdot ${par(r2)} = ${ans}$.`, `Келтіру формулалары бойынша ${body}. Мәні: $${a} \\cdot ${par(r1)} + ${b} \\cdot ${par(r2)} = ${ans}$.`])
  }),

  // ---------- Тождественные преобразования ----------
  c(I1, n => {
    const [a, b, cc] = tri(), q = rnd(0, 3), S = sgnS(q) * a, C = sgnC(q) * b
    const k = rnd(0, 2), names = ['\\sin\\alpha', '\\mathrm{tg}\\,\\alpha', '\\mathrm{ctg}\\,\\alpha']
    const vals: [number, number][] = [[S, cc], [S, C], [C, S]], [u, w] = vals[k]
    const all = [[S, cc], [-S, cc], [S, C], [-S, C], [C, S], [-C, S]].map(([x, y]) => F(x, y))
    return T(Q(`$\\cos\\alpha = ${frac(C, cc)}$, $\\alpha \\in ${QI[q]}$. Найдите $${names[k]}$.`, `$\\cos\\alpha = ${frac(C, cc)}$, $\\alpha \\in ${QI[q]}$. $${names[k]}$ мәнін табыңыз.`),
      F(u, w), [F(-u, w), ...shuffle(all)], n,
      [`В ${QR[q]} четверти синус ${posRu(S)}: $\\sin\\alpha = ${S > 0 ? '' : '-'}\\sqrt{1 - \\cos^2\\alpha} = ${frac(S, cc)}$. ${k ? `$${names[k]} = ${k === 1 ? '\\frac{\\sin\\alpha}{\\cos\\alpha}' : '\\frac{\\cos\\alpha}{\\sin\\alpha}'} = ${frac(u, w)}$.` : ''}`,
        `${QR[q]} ширекте синус ${posKk(S)}: $\\sin\\alpha = ${S > 0 ? '' : '-'}\\sqrt{1 - \\cos^2\\alpha} = ${frac(S, cc)}$. ${k ? `$${names[k]} = ${k === 1 ? '\\frac{\\sin\\alpha}{\\cos\\alpha}' : '\\frac{\\cos\\alpha}{\\sin\\alpha}'} = ${frac(u, w)}$.` : ''}`])
  }),
  c(I1, n => {
    let t = 1, pa = 1, pb = 1, pc = 1, pd = 1
    do { t = rnd(-4, 5); pa = rnd(1, 6); pb = rnd(1, 6); pc = rnd(1, 6); pd = rnd(1, 6) } while (t === 0 || pc * t === pd)
    const u = pa * t + pb, w = pc * t - pd
    const wr: string[] = [F(-u, w)]
    if (pc !== pd) wr.push(F(pa + pb, pc - pd))
    if (pc * t + pd !== 0) wr.push(F(pa * t - pb, pc * t + pd))
    if (pc !== pd * t) wr.push(F(pa + pb * t, pc - pd * t))
    const e = `\\frac{${cf(pa)}\\sin\\alpha + ${cf(pb)}\\cos\\alpha}{${cf(pc)}\\sin\\alpha - ${cf(pd)}\\cos\\alpha}`
    const te = `\\frac{${cf(pa)}\\,\\mathrm{tg}\\,\\alpha + ${pb}}{${cf(pc)}\\,\\mathrm{tg}\\,\\alpha - ${pd}}`
    return T(Q(`Известно, что $\\mathrm{tg}\\,\\alpha = ${t}$. Найдите значение выражения $${e}$.`, `$\\mathrm{tg}\\,\\alpha = ${t}$ екені белгілі. $${e}$ өрнегінің мәнін табыңыз.`), F(u, w), wr, n,
      [`Разделим числитель и знаменатель на $\\cos\\alpha$: $${te} = \\frac{${u}}{${w}} = ${frac(u, w)}$.`, `Алымы мен бөлімін $\\cos\\alpha$-ға бөлеміз: $${te} = \\frac{${u}}{${w}} = ${frac(u, w)}$.`])
  }),
  c(I1, n => {
    let p = 1, q = 2
    do { q = rnd(2, 7); p = rnd(1, Math.floor(q * Math.SQRT2)) } while (p === q || gcd(p, q) !== 1)
    const vals: [number, number][] = [[p * p - q * q, 2 * q * q], [p * p - q * q, q * q], [2 * q * q - p * p, q * q]]
    const names = ['\\sin\\alpha\\cos\\alpha', '\\sin 2\\alpha', '(\\sin\\alpha - \\cos\\alpha)^2']
    const k = rnd(0, 2), [u, w] = vals[k]
    const tail = [``, `, $\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha = ${frac(u, w)}$`, `, $(\\sin\\alpha - \\cos\\alpha)^2 = 1 - 2\\sin\\alpha\\cos\\alpha = ${frac(u, w)}$`][k]
    return T(Q(`Известно, что $\\sin\\alpha + \\cos\\alpha = ${frac(p, q)}$. Найдите $${names[k]}$.`, `$\\sin\\alpha + \\cos\\alpha = ${frac(p, q)}$ екені белгілі. $${names[k]}$ мәнін табыңыз.`),
      F(u, w), [F(-u, w), ...vals.filter((_, i) => i !== k).map(([x, y]) => F(x, y)), F(p * p + q * q, 2 * q * q), F(p - q, 2 * q)], n,
      [`Возведём в квадрат: $1 + 2\\sin\\alpha\\cos\\alpha = ${frac(p * p, q * q)}$, откуда $\\sin\\alpha\\cos\\alpha = ${frac(p * p - q * q, 2 * q * q)}$${tail}.`,
        `Квадраттаймыз: $1 + 2\\sin\\alpha\\cos\\alpha = ${frac(p * p, q * q)}$, бұдан $\\sin\\alpha\\cos\\alpha = ${frac(p * p - q * q, 2 * q * q)}$${tail}.`])
  }),
  c(I1, n => {
    const d = odd(10, 80)
    let e = odd(10, 80), f = odd(10, 80)
    while (e === d) e = odd(10, 80)
    while (f === d || f === e) f = odd(10, 80)
    const a = rnd(2, 9), b = rnd(1, 9), k = rnd(2, 9), ans = a - b + k
    const ex = `${a}\\sin^2 ${d}° + ${a}\\cos^2 ${d}° - ${cf(b)}\\,\\mathrm{tg}\\,${e}° \\cdot \\mathrm{ctg}\\,${e}° + \\frac{${k}}{1 + \\mathrm{tg}^2 ${f}°} + ${k}\\sin^2 ${f}°`
    return N(Q(`Вычислите: $${ex}$.`, `Есептеңіз: $${ex}$.`), ans, [a + b + k, a - b, a - b - k, a + k, 2 * a - b + k], n, '',
      `$\\sin^2 x + \\cos^2 x = 1$, $\\mathrm{tg}\\,x \\cdot \\mathrm{ctg}\\,x = 1$, $\\frac{1}{1 + \\mathrm{tg}^2 x} = \\cos^2 x$: $${a} - ${b} + ${k} = ${ans}$`)
  }),
  h(I1, n => {
    const s = pick([3, 4, 5, 6, -3, -4, -5]), pw = pick([3, 4])
    const ans = pw === 3 ? s ** 3 - 3 * s : (s * s - 2) ** 2 - 2
    const wr = pw === 3 ? [s ** 3, s ** 3 - s, s * s - 2, s ** 3 + 3 * s] : [s ** 4, (s * s - 2) ** 2, s ** 4 - 2, s ** 4 - 4]
    const body = pw === 3 ? `$a^3 + b^3 = (a + b)^3 - 3ab(a + b) = ${par(s)}^3 - 3 \\cdot ${par(s)} = ${ans}$` : `$a^2 + b^2 = (a + b)^2 - 2ab = ${s * s - 2}$, $a^4 + b^4 = (a^2 + b^2)^2 - 2a^2b^2 = ${ans}$`
    return N(Q(`Известно, что $\\mathrm{tg}\\,\\alpha + \\mathrm{ctg}\\,\\alpha = ${s}$. Найдите $\\mathrm{tg}^${pw}\\alpha + \\mathrm{ctg}^${pw}\\alpha$.`, `$\\mathrm{tg}\\,\\alpha + \\mathrm{ctg}\\,\\alpha = ${s}$ екені белгілі. $\\mathrm{tg}^${pw}\\alpha + \\mathrm{ctg}^${pw}\\alpha$ мәнін табыңыз.`), ans, wr, n, '',
      [`Обозначим $a = \\mathrm{tg}\\,\\alpha$, $b = \\mathrm{ctg}\\,\\alpha$, тогда $ab = 1$. ${body}.`, `$a = \\mathrm{tg}\\,\\alpha$, $b = \\mathrm{ctg}\\,\\alpha$ деп белгілейміз, сонда $ab = 1$. ${body}.`])
  }),

  // ---------- Обратные тригонометрические функции ----------
  c(A1, n => {
    const ARGS = VSC.map(v => [v.t, v.as!] as [string, number]), TGA = VTG.map(v => [v.t, v.at!] as [string, number])
    const term = () => {
      const f = pick(['arcsin', 'arccos', 'arctg'])
      const [t, v] = pick(f === 'arctg' ? TGA : ARGS)
      const arg = t.startsWith('-') ? `\\left(${t}\\right)` : t.startsWith('\\frac') ? t : `\\,${t}`
      const tex = f === 'arctg' ? `\\mathrm{arctg}${arg}` : `\\${f}${arg}`
      const val = f === 'arccos' ? 6 - v : v
      const alts = f === 'arcsin' ? [6 - v, -v] : f === 'arccos' ? [v, v < 0 ? -(6 + v) : -val] : [-v, 6 - v]
      return { tex, val, alts }
    }
    const t1 = term(), t2 = term(), op = rnd(0, 1) ? 1 : -1, ans = t1.val + op * t2.val
    const wr = [...t1.alts.map(x => x + op * t2.val), ...t2.alts.map(x => t1.val + op * x), t1.val - op * t2.val].map(x => P(x, 12))
    const e = `${t1.tex} ${op > 0 ? '+' : '-'} ${t2.tex}`
    return T(Q(`Вычислите: $${e}$.`, `Есептеңіз: $${e}$.`), P(ans, 12), wr, n,
      `$${t1.tex} = ${piFrac(t1.val, 12)}$, $${t2.tex} = ${piFrac(t2.val, 12)}$; $${e} = ${piFrac(ans, 12)}$`)
  }),
  c(A1, n => {
    const [a, b, cc] = tri(), sg = rnd(0, 1) ? 1 : -1, kind = rnd(0, 5)
    const x = [sg * b / cc, sg * a / cc, sg * b / cc, sg * a / cc, sg * a / b, sg * a / b][kind]
    const xt = [frac(sg * b, cc), frac(sg * a, cc), frac(sg * b, cc), frac(sg * a, cc), frac(sg * a, b), frac(sg * a, b)][kind]
    const inner = ['arccos', 'arcsin', 'arccos', 'arcsin', 'arctg', 'arctg'][kind], outer = ['sin', 'cos', 'tg', 'tg', 'cos', 'sin'][kind] as Fn
    const phi = inner === 'arcsin' ? Math.asin(x) : inner === 'arccos' ? Math.acos(x) : Math.atan(x)
    const val = outer === 'sin' ? Math.sin(phi) : outer === 'cos' ? Math.cos(phi) : Math.tan(phi)
    const den = [cc, b, a].find(d => Math.abs(val * d - Math.round(val * d)) < 1e-9)!, num = Math.round(val * den)
    const arg = xt.startsWith('-') ? `\\left(${xt}\\right)` : xt
    const it = inner === 'arctg' ? `\\mathrm{arctg}${arg}` : `\\${inner}${arg}`
    const e = `${FN[outer]}\\left(${it}\\right)`
    const g = inner === 'arcsin' ? '\\sin' : inner === 'arccos' ? '\\cos' : '\\mathrm{tg}'
    const range = inner === 'arccos' ? '[0; \\pi]' : inner === 'arcsin' ? '\\left[-\\frac{\\pi}{2}; \\frac{\\pi}{2}\\right]' : '\\left(-\\frac{\\pi}{2}; \\frac{\\pi}{2}\\right)'
    const pool2 = [[a, cc], [-a, cc], [b, cc], [-b, cc], [a, b], [-a, b], [b, a], [-b, a]].map(([u, w]) => F(u, w))
    return T(Q(`Вычислите: $${e}$.`, `Есептеңіз: $${e}$.`), F(num, den), [F(-num, den), ...shuffle(pool2)], n,
      [`Пусть $\\varphi = ${it}$. Тогда $${g}${g === '\\mathrm{tg}' ? '\\,' : ' '}\\varphi = ${xt}$ и $\\varphi \\in ${range}$, поэтому $${fa(outer, '\\varphi')} = ${frac(num, den)}$.`,
        `$\\varphi = ${it}$ болсын. Онда $${g}${g === '\\mathrm{tg}' ? '\\,' : ' '}\\varphi = ${xt}$ және $\\varphi \\in ${range}$, сондықтан $${fa(outer, '\\varphi')} = ${frac(num, den)}$.`])
  }),
  c(A1, n => {
    let p = 1, q = 2
    do { q = rnd(2, 7); p = rnd(1, q - 1) } while (gcd(p, q) !== 1)
    const vals: [number, number][] = [[q * q - 2 * p * p, q * q], [2 * p * p - q * q, q * q], [2 * p * q, p * p + q * q], [q * q - p * p, p * p + q * q]]
    const names = ['\\cos\\left(2\\arcsin\\frac{P}{Q}\\right)', '\\cos\\left(2\\arccos\\frac{P}{Q}\\right)', '\\sin\\left(2\\,\\mathrm{arctg}\\frac{P}{Q}\\right)', '\\cos\\left(2\\,\\mathrm{arctg}\\frac{P}{Q}\\right)']
    const forms = ['1 - 2x^2', '2x^2 - 1', '\\frac{2x}{1 + x^2}', '\\frac{1 - x^2}{1 + x^2}']
    const k = rnd(0, 3), [u, w] = vals[k], e = names[k].replace('P', String(p)).replace('Q', String(q))
    return T(Q(`Вычислите: $${e}$.`, `Есептеңіз: $${e}$.`), F(u, w), [F(-u, w), ...vals.filter((_, i) => i !== k).map(([x, y]) => F(x, y)), F(2 * p, q)], n,
      [`Здесь $x = \\frac{${p}}{${q}}$, и по формулам двойного угла значение равно $${forms[k]} = ${frac(u, w)}$.`, `Мұнда $x = \\frac{${p}}{${q}}$, қос бұрыш формулалары бойынша мәні $${forms[k]} = ${frac(u, w)}$.`])
  }),
  c(A1, n => {
    const a = rnd(2, 6), b = rnd(-6, 8), sum = b !== 0 && rnd(0, 1) === 1, f = pick(['arcsin', 'arccos'])
    const top = b === 0 ? 'x' : `x ${b > 0 ? '-' : '+'} ${Math.abs(b)}`, e = `y = \\${f}\\frac{${top}}{${a}}`
    const cnt = 2 * a + 1, ans = sum ? cnt * b : cnt
    const ex = `$-1 \\le \\frac{${top}}{${a}} \\le 1 \\Rightarrow ${b - a} \\le x \\le ${b + a}$`
    return sum
      ? N(Q(`Найдите сумму целых чисел из области определения функции $${e}$.`, `$${e}$ функциясының анықталу облысындағы бүтін сандардың қосындысын табыңыз.`), ans, [(cnt - 2) * b, 2 * a * b, b, cnt * (b + 1)], n, '',
        [`${ex}. Целые числа симметричны относительно $${b}$, их ${cnt}, сумма $${cnt} \\cdot ${par(b)} = ${ans}$.`, `${ex}. Бүтін сандар $${b}$ санына қатысты симметриялы, олар ${cnt}, қосындысы $${cnt} \\cdot ${par(b)} = ${ans}$.`])
      : N(Q(`Сколько целых чисел входит в область определения функции $${e}$?`, `$${e}$ функциясының анықталу облысына неше бүтін сан кіреді?`), ans, [2 * a, 2 * a - 1, a + 1, 2 * a + 2], n, '',
        [`${ex}, целых чисел $${b + a} - (${b - a}) + 1 = ${cnt}$.`, `${ex}, бүтін сандар саны $${b + a} - (${b - a}) + 1 = ${cnt}$.`])
  }),
  h(A1, n => {
    const [[a1, b1, c1], [a2, b2, c2]] = two(), v = SUMS(a1, b1, a2, b2), k = pick(['sp', 'sm', 'cp', 'cm'] as SK[]), den = c1 * c2
    const fn = k[0] === 's' ? '\\sin' : '\\cos', op = k[1] === 'p' ? '+' : '-'
    const e = `${fn}\\left(\\arcsin\\frac{${a1}}{${c1}} ${op} \\arccos\\frac{${b2}}{${c2}}\\right)`
    return T(Q(`Вычислите: $${e}$.`, `Есептеңіз: $${e}$.`), F(v[k], den), [F(-v[k], den), ...(['sp', 'sm', 'cp', 'cm'] as SK[]).filter(x => x !== k).map(x => F(v[x], den))], n,
      [`Пусть $\\alpha = \\arcsin\\frac{${a1}}{${c1}}$, $\\beta = \\arccos\\frac{${b2}}{${c2}}$ — острые углы, $\\cos\\alpha = \\frac{${b1}}{${c1}}$, $\\sin\\beta = \\frac{${a2}}{${c2}}$. $${SNAME[k]} = ${SFORM[k]} = ${frac(v[k], den)}$.`,
        `$\\alpha = \\arcsin\\frac{${a1}}{${c1}}$, $\\beta = \\arccos\\frac{${b2}}{${c2}}$ — сүйір бұрыштар, $\\cos\\alpha = \\frac{${b1}}{${c1}}$, $\\sin\\beta = \\frac{${a2}}{${c2}}$. $${SNAME[k]} = ${SFORM[k]} = ${frac(v[k], den)}$.`])
  }),

  // ---------- Простейшие уравнения ----------
  c(E1, n => {
    let f: Fn = 'sin', v = VSC[0], a = 1, b = 0, r: number[] = []
    const sol = (vv: number, bb: number) => rootsOf(x => fv(f, a * x - bb) - vv, 0.25, 360)
    do { f = pick(['sin', 'cos', 'tg'] as Fn[]); v = pick(pool(f)); a = pick([1, 2, 3]); b = pick([0, 15, 30, 45, 60, 90]); r = sol(v.v, b) } while (!Number.isInteger(r[0]) || !Number.isInteger(r[1]))
    const ans = r[0]
    const arg = b ? `${cf(a)}x - ${b}°` : `${cf(a)}x`, eq = `${b ? `${FN[f]}(${arg})` : fa(f, arg)} = ${v.t}`
    const u0 = a * ans - b
    return N(Q(`Найдите наименьший положительный корень уравнения $${eq}$ (в градусах).`, `$${eq}$ теңдеуінің ең кіші оң түбірін табыңыз (градуспен).`), ans,
      [r[1], sol(v.v, 0)[0], sol(-v.v, b)[0], u0, ans + 180].filter(x => Number.isInteger(x)), n, D,
      [`Наименьшему положительному $x$ соответствует $${arg} = ${u0}°$ (при этом $${fa(f, `${u0}°`)} = ${v.t}$), откуда $x = ${dg(ans)}$; следующий корень $${dg(r[1])}$.`,
        `Ең кіші оң $x$-ке $${arg} = ${u0}°$ сәйкес келеді ($${fa(f, `${u0}°`)} = ${v.t}$), бұдан $x = ${dg(ans)}$; келесі түбір $${dg(r[1])}$.`])
  }),
  c(E1, n => {
    const f = pick(['sin', 'cos', 'tg'] as Fn[]), v = pick(f === 'tg' ? [...VTG, VEDGE[0]] : [...VSC, ...VEDGE])
    let a = 1, m = 1
    do { a = rnd(1, 4); m = rnd(1, 3) } while (a * m > 6)
    const r = rootsOf(x => fv(f, a * x) - v.v, 0, 180 * m), cnt = r.length
    const eq = `${fa(f, `${cf(a)}x`)} = ${v.t}`, iv = `[0; ${piFrac(m, 1)}]`
    return N(Q(`Сколько корней имеет уравнение $${eq}$ на отрезке $${iv}$?`, `$${eq}$ теңдеуінің $${iv}$ кесіндісінде неше түбірі бар?`), cnt, [cnt + 1, cnt - 1, 2 * cnt, 2 * a * m], n, '',
      cnt ? [`Корни на отрезке: $${list(r, rd)}$ — всего ${cnt}.`, `Кесіндідегі түбірлер: $${list(r, rd)}$ — барлығы ${cnt}.`] : ['На отрезке корней нет.', 'Кесіндіде түбір жоқ.'])
  }),
  c(E1, n => {
    const f = pick(['sin', 'cos', 'tg'] as Fn[]), v = pick(pool(f)), k = pick([1, 2, 3]), d = 12 * k
    const eq = `${fa(f, `${cf(k)}x`)} = ${v.t}`
    let right = '', wr: string[] = [], s = ''
    if (f === 'sin') {
      const t = v.as!
      right = sinS(t, d, 1, k); wr = [sinS(-t, d, 1, k), cosS(t, d, 2, k), sinS(t, d, 2, k), sinS(t, 12, 1, 1), tgS(t, d, 1, k)]
      s = `${cf(k)}x = (-1)^n \\arcsin${v.t.startsWith('-') ? `\\left(${v.t}\\right)` : v.t} + \\pi n`
    } else if (f === 'cos') {
      const t = 6 - v.as!
      right = cosS(t, d, 2, k); wr = [cosS(12 - t, d, 2, k), cosS(t, d, 1, k), sinS(t, d, 1, k), cosS(t, 12, 2, 1), tgS(t, d, 1, k)]
      s = `${cf(k)}x = \\pm\\arccos${v.t.startsWith('-') ? `\\left(${v.t}\\right)` : v.t} + 2\\pi n`
    } else {
      const t = v.at!
      right = tgS(t, d, 1, k); wr = [tgS(-t, d, 1, k), tgS(t, d, 2, k), cosS(t, d, 1, k), tgS(t, 12, 1, 1), tgS(6 - t, d, 1, k)]
      s = `${cf(k)}x = \\mathrm{arctg}${v.t.startsWith('-') ? `\\left(${v.t}\\right)` : v.t} + \\pi n`
    }
    return T(Q(`Решите уравнение $${eq}$ ($n \\in \\mathbb{Z}$).`, `$${eq}$ теңдеуін шешіңіз ($n \\in \\mathbb{Z}$).`), right, wr, n,
      [`$${s}$${k > 1 ? `, затем делим на ${k}` : ''}: ${right}.`, `$${s}$${k > 1 ? `, содан кейін ${k}-ге бөлеміз` : ''}: ${right}.`])
  }),
  c(E1, n => {
    let f: Fn = 'sin', v = VSC[0], a = 1, R = 360, r: number[] = [], sum = 0
    do { f = pick(['sin', 'cos', 'tg'] as Fn[]); v = pick(pool(f)); a = pick([1, 2, 3]); R = a === 1 ? 360 : 180; r = rootsOf(x => fv(f, a * x) - v.v, 0, R); sum = r.reduce((s, x) => s + x, 0) } while (!Number.isInteger(sum))
    const r2 = rootsOf(x => fv(f, a * x) + v.v, 0, R).reduce((s, x) => s + x, 0)
    const eq = `${fa(f, `${cf(a)}x`)} = ${v.t}`, iv = `[0°; ${R}°]`
    return N(Q(`Найдите сумму корней уравнения $${eq}$, принадлежащих отрезку $${iv}$ (в градусах).`, `$${eq}$ теңдеуінің $${iv}$ кесіндісіне тиісті түбірлерінің қосындысын табыңыз (градуспен).`), sum,
      [sum - r[r.length - 1], r2, sum + 180, r[0]].filter(x => Number.isInteger(x)), n, D,
      [`Корни на отрезке: $${list(r, dg)}$; их сумма $${dg(sum)}$.`, `Кесіндідегі түбірлер: $${list(r, dg)}$; олардың қосындысы $${dg(sum)}$.`])
  }),
  h(E1, n => {
    const f = pick(['sin', 'cos', 'tg'] as Fn[])
    const [p, q, rt] = pick(f === 'tg' ? [[3, 1, '\\frac{\\sqrt{3}}{3}'], [1, 1, '1'], [1, 3, '\\sqrt{3}']] : [[4, 1, '\\frac{1}{2}'], [2, 1, '\\frac{\\sqrt{2}}{2}'], [4, 3, '\\frac{\\sqrt{3}}{2}']]) as [number, number, string]
    const Lk = pick([-2, -1, 0]), Rk = pick([2, 3, 4])
    const r = rootsOf(x => p * fv(f, x) ** 2 - q, 90 * Lk, 90 * Rk, 15), cnt = r.length
    const eq = `${cf(p)}${FN[f]}^2 x = ${q}`, iv = `\\left[${piFrac(Lk, 2)}; ${piFrac(Rk, 2)}\\right]`
    return N(Q(`Сколько корней имеет уравнение $${eq}$ на отрезке $${iv}$?`, `$${eq}$ теңдеуінің $${iv}$ кесіндісінде неше түбірі бар?`), cnt, [Math.ceil(cnt / 2), cnt + 1, cnt - 1, cnt + 2], n, '',
      [`$${FN[f]}^2 x = ${frac(q, p)}$, т. е. $${fa(f, 'x')} = \\pm ${rt}$. Корни на отрезке: $${list(r, rd)}$ — всего ${cnt}.`, `$${FN[f]}^2 x = ${frac(q, p)}$, яғни $${fa(f, 'x')} = \\pm ${rt}$. Кесіндідегі түбірлер: $${list(r, rd)}$ — барлығы ${cnt}.`])
  }),

  // ---------- Разложение на множители ----------
  c(E2, n => {
    const K = pick([{ t: '', v: 1 }, { t: '-', v: -1 }, { t: '\\sqrt{2}', v: Math.SQRT2 }, { t: '-\\sqrt{2}', v: -Math.SQRT2 }, { t: '\\sqrt{3}', v: Math.sqrt(3) }, { t: '-\\sqrt{3}', v: -Math.sqrt(3) }])
    const byCos = rnd(0, 1) === 1, m = rnd(1, 2), R = 180 * m
    const g = (x: number) => fv('sin', 2 * x) - K.v * fv(byCos ? 'cos' : 'sin', x)
    const r = rootsOf(g, 0, R, 15), cnt = r.length
    const lost = rootsOf(x => fv(byCos ? 'cos' : 'sin', x), 0, R, 15).length
    const kt = K.t.replace('-', '') || '1', other = byCos ? 'sin' : 'cos', common = byCos ? '\\cos x' : '\\sin x'
    const fac = `${common}\\,(2${FN[other]} x ${K.v > 0 ? '-' : '+'} ${kt}) = 0`
    const eq = `\\sin 2x = ${K.t}${common}`, iv = `[0; ${piFrac(m, 1)}]`
    return N(Q(`Сколько корней имеет уравнение $${eq}$ на отрезке $${iv}$?`, `$${eq}$ теңдеуінің $${iv}$ кесіндісінде неше түбірі бар?`), cnt, [cnt - lost, cnt + 1, cnt - 1, 2 * cnt], n, '',
      [`$2\\sin x\\cos x = ${K.t}${common}$, $${fac}$: $${common} = 0$ или $${fa(other as Fn, 'x')} = ${valT(K.v / 2)}$. Корни на отрезке: $${list(r, rd)}$ — всего ${cnt}.`,
        `$2\\sin x\\cos x = ${K.t}${common}$, $${fac}$: $${common} = 0$ немесе $${fa(other as Fn, 'x')} = ${valT(K.v / 2)}$. Кесіндідегі түбірлер: $${list(r, rd)}$ — барлығы ${cnt}.`])
  }),
  c(E2, n => {
    const f = pick(['sin', 'cos'] as Fn[]), OK: [number, number][] = [[1, 2], [-1, 2], [1, 1], [-1, 1], [0, 1]], BAD: [number, number][] = [[2, 1], [-2, 1], [3, 2], [-3, 2], [3, 1]]
    const [p1, q1] = pick(OK)
    let p2 = 0, q2 = 1
    do { [p2, q2] = pick([...OK, ...BAD]) } while (p2 * q1 === p1 * q2)
    const [A, Bc, C] = quad(p1, q1, p2, q2), m = rnd(1, 2), R = 180 * m
    const g = (x: number) => A * fv(f, x) ** 2 + Bc * fv(f, x) + C
    const r = rootsOf(g, 0, R, 15), cnt = r.length, bad = Math.abs(p2 / q2) > 1
    const eq = `${polyL([[A, `${FN[f]}^2 x`], [Bc, `${FN[f]} x`], [C, '']])} = 0`, iv = `[0; ${piFrac(m, 1)}]`
    const pt = `${polyL([[A, 't^2'], [Bc, 't'], [C, '']])} = 0`
    return N(Q(`Сколько корней имеет уравнение $${eq}$ на отрезке $${iv}$?`, `$${eq}$ теңдеуінің $${iv}$ кесіндісінде неше түбірі бар?`), cnt, [cnt + 1, cnt - 1, cnt + 2, 2 * cnt], n, '',
      [`Замена $t = ${FN[f]} x$: $${pt}$, $t_1 = ${frac(p1, q1)}$, $t_2 = ${frac(p2, q2)}$${bad ? `; значение $${frac(p2, q2)}$ не подходит, так как $|t| \\le 1$` : ''}. Корни на отрезке: $${list(r, rd)}$ — всего ${cnt}.`,
        `$t = ${FN[f]} x$ алмастыруы: $${pt}$, $t_1 = ${frac(p1, q1)}$, $t_2 = ${frac(p2, q2)}$${bad ? `; $${frac(p2, q2)}$ мәні жарамайды, себебі $|t| \\le 1$` : ''}. Кесіндідегі түбірлер: $${list(r, rd)}$ — барлығы ${cnt}.`])
  }),
  c(E2, n => {
    const K = pick([{ t: '', v: 1 }, { t: '-', v: -1 }, { t: '\\sqrt{3}', v: Math.sqrt(3) }, { t: '-\\sqrt{3}', v: -Math.sqrt(3) }, { t: '\\frac{\\sqrt{3}}{3}', v: T3 }, { t: '-\\frac{\\sqrt{3}}{3}', v: -T3 }])
    const bySin = rnd(0, 1) === 1, f: Fn = bySin ? 'sin' : 'cos'
    const g = (x: number) => fv(f, x) ** 2 - K.v * fv('sin', x) * fv('cos', x)
    const r = rootsOf(g, 0, 180, 15), sum = r.reduce((s, x) => s + x, 0)
    const tv = bySin ? K.v : 1 / K.v, rest = rootsOf(x => fv('tg', x) - tv, 0, 180, 15).reduce((s, x) => s + x, 0)
    const eq = `${FN[f]}^2 x = ${K.t}\\sin x\\cos x`
    const fac = `${FN[f]} x\\,(${bySin ? `\\sin x - ${K.t}\\cos x` : `\\cos x - ${K.t}\\sin x`}) = 0`.replace('- -', '+ ')
    return N(Q(`Найдите сумму корней уравнения $${eq}$, принадлежащих отрезку $[0°; 180°]$ (в градусах).`, `$${eq}$ теңдеуінің $[0°; 180°]$ кесіндісіне тиісті түбірлерінің қосындысын табыңыз (градуспен).`), sum,
      [rest, sum + 180, sum - r[r.length - 1], 2 * sum], n, D,
      [`$${fac}$: $${FN[f]} x = 0$ или $\\mathrm{tg}\\,x = ${valT(tv)}$. Корни на отрезке: $${list(r, dg)}$; сумма $${dg(sum)}$.`, `$${fac}$: $${FN[f]} x = 0$ немесе $\\mathrm{tg}\\,x = ${valT(tv)}$. Кесіндідегі түбірлер: $${list(r, dg)}$; қосындысы $${dg(sum)}$.`])
  }),
  c(E2, n => {
    const [a, b] = pick([[3, 1], [5, 1], [5, 3], [4, 2], [7, 1], [7, 3], [6, 2]]), type = rnd(0, 3), s = (a + b) / 2, d = (a - b) / 2
    const G: ((x: number) => number)[] = [x => fv('sin', a * x) + fv('sin', b * x), x => fv('sin', a * x) - fv('sin', b * x), x => fv('cos', a * x) + fv('cos', b * x), x => fv('cos', a * x) - fv('cos', b * x)]
    const eq = [`\\sin ${a}x + \\sin ${b}x = 0`, `\\sin ${a}x = \\sin ${b}x`, `\\cos ${a}x + \\cos ${b}x = 0`, `\\cos ${a}x = \\cos ${b}x`][type]
    const fs: [Fn, Fn] = ([['sin', 'cos'], ['cos', 'sin'], ['cos', 'cos'], ['sin', 'sin']] as [Fn, Fn][])[type]
    const prod = `${type === 3 ? '-' : ''}2${FN[fs[0]]} ${cf(s)}x\\,${FN[fs[1]]} ${cf(d)}x = 0`
    const r = rootsOf(G[type], 0, 180), cnt = r.length
    const r1 = rootsOf(x => fv(fs[0], s * x), 0, 180).length, r2 = rootsOf(x => fv(fs[1], d * x), 0, 180).length
    return N(Q(`Сколько корней имеет уравнение $${eq}$ на отрезке $[0°; 180°]$?`, `$${eq}$ теңдеуінің $[0°; 180°]$ кесіндісінде неше түбірі бар?`), cnt, [r1, r2, r1 + r2 === cnt ? cnt + 1 : r1 + r2, cnt - 1], n, '',
      [`Преобразуем в произведение: $${prod}$. Корни на отрезке: $${list(r, dg)}$ — всего ${cnt}.`, `Көбейтіндіге түрлендіреміз: $${prod}$. Кесіндідегі түбірлер: $${list(r, dg)}$ — барлығы ${cnt}.`])
  }),
  h(E2, n => {
    const OK: [number, number][] = [[1, 2], [-1, 2], [1, 1], [-1, 1]], ALL: [number, number][] = [...OK, [2, 1], [-2, 1], [3, 2], [-3, 2], [0, 1]]
    const [p1, q1] = pick(OK)
    let p2 = 0, q2 = 1
    do { [p2, q2] = pick(ALL) } while (p2 * q1 === p1 * q2)
    const [al, be, ga] = quad(p1, q1, p2, q2), bySin = rnd(0, 1) === 1, f: Fn = bySin ? 'sin' : 'cos', o: Fn = bySin ? 'cos' : 'sin'
    // α·o² − β·f − (γ + α) = −P(f), где P(t) = αt² + βt + γ
    const eq = `${polyL([[al, `${FN[o]}^2 x`], [-be, `${FN[f]} x`], [-ga - al, '']])} = 0`
    const g = (x: number) => al * fv(o, x) ** 2 - be * fv(f, x) - ga - al
    const r = rootsOf(g, 15, 360, 15), ans = r[0], bad = Math.abs(p2 / q2) > 1
    const pt = `${polyL([[al, 't^2'], [be, 't'], [ga, '']])} = 0`
    return N(Q(`Найдите наименьший положительный корень уравнения $${eq}$ (в градусах).`, `$${eq}$ теңдеуінің ең кіші оң түбірін табыңыз (градуспен).`), ans,
      [r[1] ?? ans + 360, 180 - ans, ans + 180, 360 - ans], n, D,
      [`Заменим $${FN[o]}^2 x = 1 - ${FN[f]}^2 x$ и $t = ${FN[f]} x$: $${pt}$, $t_1 = ${frac(p1, q1)}$, $t_2 = ${frac(p2, q2)}$${bad ? ` (не подходит: $|t| \\le 1$)` : ''}. Корни на $(0°; 360°]$: $${list(r, dg)}$; наименьший — $${dg(ans)}$.`,
        `$${FN[o]}^2 x = 1 - ${FN[f]}^2 x$ және $t = ${FN[f]} x$ алмастыруы: $${pt}$, $t_1 = ${frac(p1, q1)}$, $t_2 = ${frac(p2, q2)}$${bad ? ` (жарамайды: $|t| \\le 1$)` : ''}. $(0°; 360°]$ аралығындағы түбірлер: $${list(r, dg)}$; ең кішісі — $${dg(ans)}$.`])
  }),

  // ---------- Однородные уравнения, вспомогательный угол ----------
  c(E3, n => {
    const [at, a, bt, b] = pick([['', 1, '', 1], ['', 1, '-', -1], ['\\sqrt{3}', Math.sqrt(3), '', 1], ['\\sqrt{3}', Math.sqrt(3), '-', -1], ['', 1, '\\sqrt{3}', Math.sqrt(3)], ['', 1, '-\\sqrt{3}', -Math.sqrt(3)]]) as [string, number, string, number]
    const s = pick([1, 2, 3]), A = s === 1 ? at : `${s}${at}`, Bb = bt.replace('-', ''), Bt = s === 1 ? Bb : `${s}${Bb}`
    const eq = `${A}\\sin x ${b < 0 ? '-' : '+'} ${Bt}\\cos x = 0`, pos = rnd(0, 1) === 1
    const g = (x: number) => a * fv('sin', x) + b * fv('cos', x)
    const ans = pos ? rootsOf(g, 15, 360, 15)[0] : rootsOf(g, -360, -15, 15).pop()!
    const th = Math.round((Math.atan(-b / a) * 180) / Math.PI)
    return N(Q(`Найдите ${pos ? 'наименьший положительный' : 'наибольший отрицательный'} корень уравнения $${eq}$ (в градусах).`, `$${eq}$ теңдеуінің ең ${pos ? 'кіші оң' : 'үлкен теріс'} түбірін табыңыз (градуспен).`), ans,
      [-ans, ans + (pos ? 180 : -180), 90 - ans, pos ? 180 - ans : -180 - ans], n, D,
      [`$\\cos x = 0$ корнем не является, делим на $\\cos x$: $\\mathrm{tg}\\,x = ${valT(-b / a)}$, $x = ${th}° + 180° n$. Ответ: $${dg(ans)}$.`, `$\\cos x = 0$ түбір емес, $\\cos x$-ке бөлеміз: $\\mathrm{tg}\\,x = ${valT(-b / a)}$, $x = ${th}° + 180° n$. Жауабы: $${dg(ans)}$.`])
  }),
  c(E3, n => {
    const k = rnd(1, 3), m = rnd(1, 4)
    let t1 = 0, t2 = 0
    do { t1 = rnd(-3, 3); t2 = rnd(-3, 3) } while (t1 === t2)
    const A = k, Bc = -k * (t1 + t2), C = k * t1 * t2, cnt = [t1, t2].reduce((s, t) => s + (t === 0 ? m + 1 : m), 0)
    const eq = `${polyL([[A, '\\sin^2 x'], [Bc, '\\sin x\\cos x'], [C, '\\cos^2 x']])} = 0`, iv = `[0; ${piFrac(m, 1)}]`
    const pt = `${polyL([[A, 't^2'], [Bc, 't'], [C, '']])} = 0`
    return N(Q(`Сколько корней имеет уравнение $${eq}$ на отрезке $${iv}$?`, `$${eq}$ теңдеуінің $${iv}$ кесіндісінде неше түбірі бар?`), cnt, [2 * m, 2 * m + 1, m, cnt + 1, cnt - 1], n, '',
      [`При $\\cos x = 0$ получаем $${cf(A)}\\sin^2 x = 0$ — противоречие, поэтому делим на $\\cos^2 x$: $${pt}$, $t = \\mathrm{tg}\\,x$, $t_1 = ${t1}$, $t_2 = ${t2}$. На $${iv}$ число корней уравнения $\\mathrm{tg}\\,x = t$ равно $${m}$ при $t \\ne 0$ и $${m + 1}$ при $t = 0$. Всего ${cnt}.`,
        `$\\cos x = 0$ болса, $${cf(A)}\\sin^2 x = 0$ — қайшылық, сондықтан $\\cos^2 x$-қа бөлеміз: $${pt}$, $t = \\mathrm{tg}\\,x$, $t_1 = ${t1}$, $t_2 = ${t2}$. $${iv}$ кесіндісінде $\\mathrm{tg}\\,x = t$ теңдеуінің $t \\ne 0$ болғанда $${m}$, $t = 0$ болғанда $${m + 1}$ түбірі бар. Барлығы ${cnt}.`])
  }),
  c(E3, n => {
    const k = rnd(1, 2), [a0, b0, c0] = tri(rnd(0, 3)), a = a0 * k * (rnd(0, 1) ? 1 : -1), b = b0 * k * (rnd(0, 1) ? 1 : -1), R = c0 * k, d = rnd(-9, 9), mx = rnd(0, 1) === 1
    const y = polyL([[a, '\\sin x'], [b, '\\cos x'], [d, '']]), ans = mx ? R + d : d - R
    const wr = mx ? [Math.abs(a) + Math.abs(b) + d, d - R, R, R + d + 1] : [d - Math.abs(a) - Math.abs(b), R + d, -R, d]
    return N(Q(`Найдите ${mx ? 'наибольшее' : 'наименьшее'} значение функции $y = ${y}$.`, `$y = ${y}$ функциясының ең ${mx ? 'үлкен' : 'кіші'} мәнін табыңыз.`), ans, wr, n, '',
      [`$${polyL([[a, '\\sin x'], [b, '\\cos x']])} = ${R}\\sin(x + \\varphi)$, так как $\\sqrt{${a * a} + ${b * b}} = ${R}$. Значит, $${d - R} \\le y \\le ${R + d}$.`,
        `$${polyL([[a, '\\sin x'], [b, '\\cos x']])} = ${R}\\sin(x + \\varphi)$, себебі $\\sqrt{${a * a} + ${b * b}} = ${R}$. Демек, $${d - R} \\le y \\le ${R + d}$.`])
  }),
  c(E3, n => {
    const pr = pick([
      { l: '\\sin x + \\sqrt{3}\\cos x', a: 1, b: Math.sqrt(3), R: 2, p: 60 }, { l: '\\sqrt{3}\\sin x + \\cos x', a: Math.sqrt(3), b: 1, R: 2, p: 30 },
      { l: '\\sin x + \\cos x', a: 1, b: 1, R: Math.SQRT2, p: 45 }, { l: '\\sin x - \\sqrt{3}\\cos x', a: 1, b: -Math.sqrt(3), R: 2, p: -60 },
      { l: '\\sqrt{3}\\sin x - \\cos x', a: Math.sqrt(3), b: -1, R: 2, p: -30 }, { l: '\\sin x - \\cos x', a: 1, b: -1, R: Math.SQRT2, p: -45 },
    ])
    const rhs = pick(pr.R === 2
      ? [['1', 0.5], ['-1', -0.5], ['\\sqrt{2}', S2], ['-\\sqrt{2}', -S2], ['\\sqrt{3}', S3], ['-\\sqrt{3}', -S3], ['2', 1], ['-2', -1]]
      : [['1', S2], ['-1', -S2], ['\\sqrt{2}', 1], ['-\\sqrt{2}', -1], ['\\frac{\\sqrt{2}}{2}', 0.5], ['-\\frac{\\sqrt{2}}{2}', -0.5], ['\\frac{\\sqrt{6}}{2}', S3]]) as [string, number]
    const g = (x: number) => pr.a * fv('sin', x) + pr.b * fv('cos', x) - pr.R * rhs[1]
    const eq = `${pr.l} = ${rhs[0]}`, cntQ = rnd(0, 1) === 1, Rt = pr.R === 2 ? '2' : '\\sqrt{2}', arg = `x ${pr.p > 0 ? '+' : '-'} ${Math.abs(pr.p)}°`
    const all = rootsOf(g, 0, 360, 15), pos = rootsOf(g, 15, 720, 15)
    const head: B = [`$${pr.l} = ${Rt}\\sin(${arg})$, поэтому $\\sin(${arg}) = ${valT(rhs[1])}$. Корни на $[0°; 360°]$: $${list(all, dg)}$.`, `$${pr.l} = ${Rt}\\sin(${arg})$, сондықтан $\\sin(${arg}) = ${valT(rhs[1])}$. $[0°; 360°]$ кесіндісіндегі түбірлер: $${list(all, dg)}$.`]
    if (cntQ) {
      const cnt = all.length
      return N(Q(`Сколько корней имеет уравнение $${eq}$ на отрезке $[0°; 360°]$?`, `$${eq}$ теңдеуінің $[0°; 360°]$ кесіндісінде неше түбірі бар?`), cnt, [cnt + 1, cnt - 1, 2 * cnt, cnt + 2], n, '', head)
    }
    const ans = pos[0]
    return N(Q(`Найдите наименьший положительный корень уравнения $${eq}$ (в градусах).`, `$${eq}$ теңдеуінің ең кіші оң түбірін табыңыз (градуспен).`), ans, [pos[1], ans + 180, Math.abs(ans - 2 * pr.p), 360 - ans], n, D,
      [`${head[0]} Наименьший положительный корень — $${dg(ans)}$.`, `${head[1]} Ең кіші оң түбір — $${dg(ans)}$.`])
  }),
  h(E3, n => {
    const k = rnd(1, 2), m = rnd(1, 3), trap = rnd(0, 1) === 1, Dv = rnd(1, 3)
    let t1 = 0, t2 = 0
    do { t1 = rnd(-3, 3); t2 = rnd(-3, 3) } while (t1 === t2)
    const al = trap ? 0 : k, be = trap ? k : -k * (t1 + t2), ga = trap ? -k * t1 : k * t1 * t2
    const A = al + Dv, C = ga + Dv, ts = trap ? [t1] : [t1, t2]
    const base = ts.reduce((s, t) => s + (t === 0 ? m + 1 : m), 0), cnt = base + (trap ? m : 0)
    const eq = `${polyL([[A, '\\sin^2 x'], [be, '\\sin x\\cos x'], [C, '\\cos^2 x']])} = ${Dv}`, iv = `[0; ${piFrac(m, 1)}]`
    const hom = polyL([[al, '\\sin^2 x'], [be, '\\sin x\\cos x'], [ga, '\\cos^2 x']])
    const ru = trap
      ? `Заменим $${Dv} = ${Dv}(\\sin^2 x + \\cos^2 x)$: $${hom} = 0$, т. е. $\\cos x\\,(${polyL([[be, '\\sin x'], [ga, '\\cos x']])}) = 0$. Отсюда $\\cos x = 0$ (корней на отрезке: ${m}) или $\\mathrm{tg}\\,x = ${t1}$ (корней: ${base}). Всего ${cnt}.`
      : `Заменим $${Dv} = ${Dv}(\\sin^2 x + \\cos^2 x)$: $${hom} = 0$. $\\cos x = 0$ не подходит, делим на $\\cos^2 x$: $\\mathrm{tg}\\,x = ${t1}$ или $\\mathrm{tg}\\,x = ${t2}$. Число корней на отрезке: ${ts.map(t => `$\\mathrm{tg}\\,x = ${t}$ — ${t === 0 ? m + 1 : m}`).join(', ')}. Всего ${cnt}.`
    const kk = trap
      ? `$${Dv} = ${Dv}(\\sin^2 x + \\cos^2 x)$ деп жазамыз: $${hom} = 0$, яғни $\\cos x\\,(${polyL([[be, '\\sin x'], [ga, '\\cos x']])}) = 0$. Бұдан $\\cos x = 0$ (кесіндіде ${m} түбір) немесе $\\mathrm{tg}\\,x = ${t1}$ (${base} түбір). Барлығы ${cnt}.`
      : `$${Dv} = ${Dv}(\\sin^2 x + \\cos^2 x)$ деп жазамыз: $${hom} = 0$. $\\cos x = 0$ жарамайды, $\\cos^2 x$-қа бөлеміз: $\\mathrm{tg}\\,x = ${t1}$ немесе $\\mathrm{tg}\\,x = ${t2}$. Кесіндіде ${ts.map(t => `$\\mathrm{tg}\\,x = ${t}$ — ${t === 0 ? m + 1 : m}`).join(', ')} түбір. Барлығы ${cnt}.`
    return N(Q(`Сколько корней имеет уравнение $${eq}$ на отрезке $${iv}$?`, `$${eq}$ теңдеуінің $${iv}$ кесіндісінде неше түбірі бар?`), cnt,
      [trap ? base : cnt + m, cnt + 1, cnt - 1, 2 * m], n, '', [ru, kk])
  }),

  // ---------- Неравенства ----------
  c(E4, n => {
    const f = pick(['sin', 'cos'] as Fn[]), v = pick(VSC), rel = pick(['>', '<', '\\ge', '\\le'] as Rel[])
    const ge = rel === '>' || rel === '\\ge', closed = rel === '\\ge' || rel === '\\le', th = v.as!
    const E = (k: number, per: string) => (k === 0 ? per : `${piFrac(k, 12)} + ${per}`)
    const IV = ([a, b]: number[], cl: boolean, per = '2\\pi n') => `$${cl ? '\\left[' : '\\left('}${E(a, per)}; ${E(b, per)}${cl ? '\\right]' : '\\right)'}$`
    const sol = (fn: Fn, g: boolean, t: number) => (fn === 'sin' ? (g ? [t, 12 - t] : [-12 - t, t]) : g ? [t - 6, 6 - t] : [6 - t, 18 + t])
    const other: Fn = f === 'sin' ? 'cos' : 'sin'
    const e = `${fa(f, 'x')} ${rel} ${v.t}`
    return T(Q(`Решите неравенство $${e}$ ($n \\in \\mathbb{Z}$).`, `$${e}$ теңсіздігін шешіңіз ($n \\in \\mathbb{Z}$).`), IV(sol(f, ge, th), closed),
      [IV(sol(f, !ge, th), !closed), IV(sol(f, ge, th), !closed), IV(sol(f, ge, th), closed, '\\pi n'), IV(sol(other, ge, th), closed), IV(sol(f, ge, -th), closed)], n,
      [`На единичной окружности ${f === 'sin' ? 'синус — ордината' : 'косинус — абсцисса'} точки; уравнение $${fa(f, 'x')} = ${v.t}$ на одном обороте даёт граничные точки дуги, и с учётом периода $2\\pi$ получаем ${IV(sol(f, ge, th), closed)}.`,
        `Бірлік шеңберде ${f === 'sin' ? 'синус — нүктенің ординатасы' : 'косинус — нүктенің абсциссасы'}; $${fa(f, 'x')} = ${v.t}$ теңдеуі бір айналымда доғаның шекаралық нүктелерін береді, $2\\pi$ периодын ескеріп, ${IV(sol(f, ge, th), closed)} аламыз.`])
  }),
  c(E4, n => {
    const f = pick(['sin', 'cos'] as Fn[]), m = pick([3, 4, 6]), rel = pick(['>', '<', '\\ge', '\\le'] as Rel[])
    let v = VSC[0], L = 6, xs: number[] = []
    do {
      v = pick([...VSC, VEDGE[0]]); L = rnd(2 * m, 3 * m)
      xs = []
      for (let x = 0; x <= L; x++) if (holds(fv(f, (180 * x) / m) - v.v, rel)) xs.push(x)
    } while (xs.length === 0 || xs.length === L + 1)
    const cnt = xs.length
    let alt = 0
    for (let x = 0; x <= L; x++) if (holds(fv(f, (180 * x) / m) - v.v, loose(rel))) alt++
    const e = `${FN[f]}\\frac{\\pi x}{${m}} ${rel} ${v.t}`
    return N(Q(`Сколько целых решений имеет неравенство $${e}$ на отрезке $[0; ${L}]$?`, `$${e}$ теңсіздігінің $[0; ${L}]$ кесіндісінде неше бүтін шешімі бар?`), cnt,
      [alt === cnt ? cnt + 1 : alt, L + 1 - cnt, cnt - 1, cnt + 2], n, '',
      [`При целом $x$ угол $\\frac{\\pi x}{${m}}$ кратен $${piFrac(1, m)}$; проверяя значения на отрезке, находим целые решения: $${xs.join('; ')}$ — всего ${cnt}.`,
        `Бүтін $x$ үшін $\\frac{\\pi x}{${m}}$ бұрышы $${piFrac(1, m)}$-ге еселі; кесіндідегі мәндерді тексеріп, бүтін шешімдерді табамыз: $${xs.join('; ')}$ — барлығы ${cnt}.`])
  }),
  c(E4, n => {
    const v = pick(VTG), rel = pick(['>', '<', '\\ge', '\\le'] as Rel[]), th = v.at!
    const ge = rel === '>' || rel === '\\ge', closed = rel === '\\ge' || rel === '\\le'
    const E = (k: number, per: string) => (k === 0 ? per : `${piFrac(k, 12)} + ${per}`)
    const IV = (g: boolean, cl: boolean, t: number, per = '\\pi n', both = false) => {
      const [a, b] = g ? [t, 6] : [-6, t]
      const lb = both || (g && cl) ? '\\left[' : '\\left(', rb = both || (!g && cl) ? '\\right]' : '\\right)'
      return `$${lb}${E(a, per)}; ${E(b, per)}${rb}$`
    }
    const e = `\\mathrm{tg}\\,x ${rel} ${v.t}`, right = IV(ge, closed, th)
    return T(Q(`Решите неравенство $${e}$ ($n \\in \\mathbb{Z}$).`, `$${e}$ теңсіздігін шешіңіз ($n \\in \\mathbb{Z}$).`), right,
      [IV(ge, closed, th, '2\\pi n'), IV(!ge, !closed, th), IV(ge, closed, th, '\\pi n', true), IV(ge, closed, -th), IV(ge, !closed, th)], n,
      [`Тангенс возрастает на $\\left(-\\frac{\\pi}{2}; \\frac{\\pi}{2}\\right)$ и имеет период $\\pi$; $\\mathrm{tg}\\,x = ${v.t}$ при $x = ${piFrac(th, 12)}$, точки $\\pm\\frac{\\pi}{2} + \\pi n$ не входят. Ответ: ${right}.`,
        `Тангенс $\\left(-\\frac{\\pi}{2}; \\frac{\\pi}{2}\\right)$ аралығында өседі, периоды $\\pi$; $x = ${piFrac(th, 12)}$ болғанда $\\mathrm{tg}\\,x = ${v.t}$, ал $\\pm\\frac{\\pi}{2} + \\pi n$ нүктелері кірмейді. Жауабы: ${right}.`])
  }),
  c(E4, n => {
    const f = pick(['sin', 'cos'] as Fn[]), v = pick(VSC), rel = pick(['>', '<', '\\ge', '\\le'] as Rel[]), [L, R] = pick([[0, 360], [-180, 180]])
    const other: Fn = f === 'sin' ? 'cos' : 'sin'
    const S = (fn: Fn, vv: number, rr: Rel) => solveIneq(x => fv(fn, x) - vv, rr, L, R)
    const right = S(f, v.v, rel), bd = rootsOf(x => fv(f, x) - v.v, L, R, 15)
    const e = `${fa(f, 'x')} ${rel} ${v.t}`, iv = `[${L}°; ${R}°]`
    return T(Q(`Решите неравенство $${e}$ на отрезке $${iv}$.`, `$${e}$ теңсіздігін $${iv}$ кесіндісінде шешіңіз.`), right,
      [S(f, v.v, flip(rel)), S(f, v.v, loose(rel)), S(f, -v.v, rel), S(other, v.v, rel)], n,
      [`Граничные точки — корни уравнения $${fa(f, 'x')} = ${v.t}$ на отрезке: $${list(bd, dg)}$. Проверяя знак между ними, получаем ${right}.`,
        `Шекаралық нүктелер — кесіндідегі $${fa(f, 'x')} = ${v.t}$ теңдеуінің түбірлері: $${list(bd, dg)}$. Олардың арасындағы таңбаны тексеріп, ${right} аламыз.`])
  }),
  h(E4, n => {
    const f = pick(['sin', 'cos'] as Fn[]), RT: [number, number][] = [[1, 2], [-1, 2], [1, 1], [-1, 1], [0, 1]]
    let p1 = 0, q1 = 1, p2 = 0, q2 = 1, rel: Rel = '>', right = '', g = (x: number) => x
    do {
      [p1, q1] = pick(RT); [p2, q2] = pick([...RT, [2, 1], [-2, 1]]); rel = pick(['>', '<', '\\ge', '\\le'] as Rel[])
      const [A, Bc, C] = quad(p1, q1, p2, q2)
      g = (x: number) => A * fv(f, x) ** 2 + Bc * fv(f, x) + C
      right = p1 * q2 === p2 * q1 ? '' : solveIneq(g, rel, 0, 360)
    } while (!right || right === '$\\varnothing$' || right === '$[0°; 360°]$')
    const [A, Bc, C] = quad(p1, q1, p2, q2), other: Fn = f === 'sin' ? 'cos' : 'sin'
    const e = `${polyL([[A, `${FN[f]}^2 x`], [Bc, `${FN[f]} x`], [C, '']])} ${rel} 0`
    const pt = `${polyL([[A, 't^2'], [Bc, 't'], [C, '']])} ${rel} 0`
    const g2 = (x: number) => A * fv(other, x) ** 2 + Bc * fv(other, x) + C
    return T(Q(`Решите неравенство $${e}$ на отрезке $[0°; 360°]$.`, `$${e}$ теңсіздігін $[0°; 360°]$ кесіндісінде шешіңіз.`), right,
      [solveIneq(g, flip(rel), 0, 360), solveIneq(g, loose(rel), 0, 360), solveIneq(g2, rel, 0, 360), solveIneq(x => q1 * fv(f, x) - p1, rel, 0, 360)], n,
      [`Замена $t = ${FN[f]} x$: $${pt}$, корни $t_1 = ${frac(p1, q1)}$, $t_2 = ${frac(p2, q2)}$; находим промежутки для $t$ и переходим к $x$ (учитывая $|t| \\le 1$). Ответ: ${right}.`,
        `$t = ${FN[f]} x$ алмастыруы: $${pt}$, түбірлері $t_1 = ${frac(p1, q1)}$, $t_2 = ${frac(p2, q2)}$; $t$ үшін аралықтарды тауып, $x$-ке көшеміз ($|t| \\le 1$ ескеріледі). Жауабы: ${right}.`])
  }),
]
