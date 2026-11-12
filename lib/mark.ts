// Задания «Отметь на рисунке»: ученик не выбирает вариант, а сам отмечает
// ответ — промежуток на числовой прямой, точку на координатной плоскости или
// точки на единичной окружности. Каждое задание сразу на двух языках.
import { lead, signed, term } from './templates/helpers'
import type { Locale } from './i18n'

export type MarkKind = 'line' | 'plane' | 'circle'

// Множество на числовой прямой с целыми концами: отмечены ли целые точки
// min..max, промежутки между соседними точками и лучи левее min / правее max
export type LineSet = { min: number; max: number; points: boolean[]; gaps: boolean[]; left: boolean; right: boolean }
export type PlanePoint = { x: number; y: number; label?: string }

export type MarkTask =
  | { kind: 'line'; question: string; solution: string; answer: LineSet }
  | { kind: 'plane'; question: string; solution: string; answer: PlanePoint[]; multi: boolean; shown?: PlanePoint[]; curve?: [number, number][] }
  | { kind: 'circle'; question: string; solution: string; answer: number[]; multi: boolean }

export const LINE_RANGE = 8 // прямая от -8 до 8
export const PLANE_RANGE = 6 // плоскость от -6 до 6
export const CIRCLE_DEGREES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]
const nz = (a: number, b: number) => { let k = 0; while (k === 0) k = rnd(a, b); return k }

// ---------- Числовая прямая ----------
export function emptyLine(min = -LINE_RANGE, max = LINE_RANGE): LineSet {
  return { min, max, points: Array(max - min + 1).fill(false), gaps: Array(max - min).fill(false), left: false, right: false }
}

// Множество по условию: концы промежутков — целые числа внутри прямой,
// поэтому на каждом промежутке между целыми условие не меняется
export function lineFrom(f: (x: number) => boolean, min = -LINE_RANGE, max = LINE_RANGE): LineSet {
  const s = emptyLine(min, max)
  s.points = s.points.map((_, i) => f(min + i))
  s.gaps = s.gaps.map((_, i) => f(min + i + 0.5))
  s.left = f(min - 0.5)
  s.right = f(max + 0.5)
  return s
}

export const sameLine = (a: LineSet, b: LineSet) =>
  a.min === b.min && a.max === b.max && a.left === b.left && a.right === b.right &&
  a.points.every((p, i) => p === b.points[i]) && a.gaps.every((g, i) => g === b.gaps[i])

// Запись множества промежутками: (-∞; 2) ∪ [5; +∞)
export function lineToTex(s: LineSet): string {
  type Tok = { kind: 'gap'; a: number; b: number; on: boolean } | { kind: 'pt'; p: number; on: boolean }
  const toks: Tok[] = [{ kind: 'gap', a: -Infinity, b: s.min, on: s.left }]
  for (let i = 0; i < s.points.length; i++) {
    toks.push({ kind: 'pt', p: s.min + i, on: s.points[i] })
    toks.push(i < s.gaps.length ? { kind: 'gap', a: s.min + i, b: s.min + i + 1, on: s.gaps[i] } : { kind: 'gap', a: s.max, b: Infinity, on: s.right })
  }
  const parts: string[] = []
  let start: { a: number; aIn: boolean } | null = null
  const num = (v: number) => (v === -Infinity ? '-\\infty' : v === Infinity ? '+\\infty' : String(v))
  const close = (b: number, bIn: boolean) => {
    if (!start) return
    parts.push(start.a === b ? `\\{${b}\\}` : `${start.aIn ? '[' : '('}${num(start.a)}; ${num(b)}${bIn ? ']' : ')'}`)
    start = null
  }
  toks.forEach((tk, i) => {
    if (tk.on && !start) start = tk.kind === 'pt' ? { a: tk.p, aIn: true } : { a: tk.a, aIn: false }
    else if (!tk.on && start) {
      if (tk.kind === 'pt') close(tk.p, false)
      else { const prev = toks[i - 1]; close(prev.kind === 'pt' ? prev.p : tk.a, true) }
    }
  })
  if (start) close(Infinity, false)
  return parts.length ? parts.join(' \\cup ') : '\\varnothing'
}

type Op = '>' | '<' | '\\ge' | '\\le'
const OPS: Op[] = ['>', '<', '\\ge', '\\le']
const FLIP: Record<Op, Op> = { '>': '<', '<': '>', '\\ge': '\\le', '\\le': '\\ge' }
const cmp = (l: number, op: Op, r: number) => (op === '>' ? l > r : op === '<' ? l < r : op === '\\ge' ? l >= r : l <= r)
const less = (op: Op): Op => (op === '>' || op === '<' ? '<' : '\\le')
const lin = (k: number, b: number) => (k === 0 ? String(b) : `${lead(k, 'x')} ${signed(b)}`.trim())

type Gen = (L: (ru: string, kk: string) => string) => MarkTask | null

const LINE_GENS: Gen[] = [
  // ax + b ⋚ c
  L => {
    const a = nz(-5, 5), r = rnd(-6, 6), b = rnd(-9, 9), op = pick(OPS), c = a * r + b
    const op2 = a < 0 ? FLIP[op] : op
    const ineq = `${lin(a, b)} ${op} ${c}`
    const steps = a === 1 ? `$x ${op} ${c - b}$` : `$${lead(a, 'x')} ${op} ${c - b}$, $x ${op2} ${r}$${a < 0 ? L(' (при делении на отрицательное число знак неравенства меняется)', ' (теріс санға бөлгенде теңсіздік таңбасы ауысады)') : ''}`
    const answer = lineFrom(x => cmp(a * x + b, op, c))
    return { kind: 'line', question: L(`Отметь на числовой прямой решение неравенства $${ineq}$.`, `Сан түзуінде $${ineq}$ теңсіздігінің шешімін белгіле.`), solution: `${steps}.\n\n${L('Ответ', 'Жауабы')}: $x \\in ${lineToTex(answer)}$`, answer }
  },
  // x² + bx + c ⋚ 0
  L => {
    const p = rnd(-6, 5), q = rnd(p + 1, 6), op = pick(OPS)
    const ineq = `x^2 ${term(-(p + q), 'x')} ${signed(p * q)} ${op} 0`.replace(/\s+/g, ' ')
    const answer = lineFrom(x => cmp((x - p) * (x - q), op, 0))
    return {
      kind: 'line', question: L(`Отметь на числовой прямой решение неравенства $${ineq}$.`, `Сан түзуінде $${ineq}$ теңсіздігінің шешімін белгіле.`),
      solution: `${L(`Корни трёхчлена: $x = ${p}$ и $x = ${q}$. Ветви параболы направлены вверх: между корнями она ниже оси $Ox$, вне их — выше.`, `Үшмүшенің түбірлері: $x = ${p}$ және $x = ${q}$. Параболаның тармақтары жоғары қараған: түбірлердің арасында ол $Ox$ осінен төмен, сыртында — жоғары.`)}\n\n${L('Ответ', 'Жауабы')}: $x \\in ${lineToTex(answer)}$`, answer,
    }
  },
  // |x - a| ⋚ b
  L => {
    const a = rnd(-4, 4), b = rnd(1, 4), op = pick(OPS)
    const inner = `x ${signed(-a)}`.trim()
    const ineq = `|${inner}| ${op} ${b}`
    const answer = lineFrom(x => cmp(Math.abs(x - a), op, b))
    const inside = op === '<' || op === '\\le'
    const steps = inside
      ? (a === 0 ? `$-${b} ${op} x ${op} ${b}$.` : `$-${b} ${op} ${inner} ${op} ${b}$, $${a - b} ${op} x ${op} ${a + b}$.`)
      : a === 0 ? L(`$x ${less(op)} -${b}$ или $x ${op} ${b}$.`, `$x ${less(op)} -${b}$ немесе $x ${op} ${b}$.`) : L(`$${inner} ${less(op)} -${b}$ или $${inner} ${op} ${b}$, т.е. $x ${less(op)} ${a - b}$ или $x ${op} ${a + b}$.`, `$${inner} ${less(op)} -${b}$ немесе $${inner} ${op} ${b}$, яғни $x ${less(op)} ${a - b}$ немесе $x ${op} ${a + b}$.`)
    return { kind: 'line', question: L(`Отметь на числовой прямой решение неравенства $${ineq}$.`, `Сан түзуінде $${ineq}$ теңсіздігінің шешімін белгіле.`), solution: `${steps}\n\n${L('Ответ', 'Жауабы')}: $x \\in ${lineToTex(answer)}$`, answer }
  },
  // (x - p) / (x - q) ⋚ 0
  L => {
    const p = rnd(-6, 6), q = rnd(-6, 6), op = pick(OPS)
    if (p === q) return null
    const ineq = `\\frac{x ${signed(-p)}}{x ${signed(-q)}} ${op} 0`
    const answer = lineFrom(x => x !== q && cmp((x - p) / (x - q), op, 0))
    return {
      kind: 'line', question: L(`Отметь на числовой прямой решение неравенства $${ineq}$.`, `Сан түзуінде $${ineq}$ теңсіздігінің шешімін белгіле.`),
      solution: `${L(`Метод интервалов: нуль числителя $x = ${p}$, нуль знаменателя $x = ${q}$ — эту точку всегда выкалываем. Справа от большего из них дробь положительна, дальше знаки чередуются.`, `Интервалдар әдісі: алымының нөлі $x = ${p}$, бөлімінің нөлі $x = ${q}$ — бұл нүктені әрқашан алып тастаймыз. Олардың үлкенінен оң жақта бөлшек оң, әрі қарай таңбалар кезектеседі.`)}\n\n${L('Ответ', 'Жауабы')}: $x \\in ${lineToTex(answer)}$`, answer,
    }
  },
  // система двух линейных неравенств
  L => {
    const k1 = nz(-3, 3), k2 = nz(-3, 3), r1 = rnd(-6, 6), r2 = rnd(-6, 6), m1 = rnd(-6, 6), m2 = rnd(-6, 6), o1 = pick(OPS), o2 = pick(OPS)
    const f = (x: number) => cmp(k1 * x + m1, o1, k1 * r1 + m1) && cmp(k2 * x + m2, o2, k2 * r2 + m2)
    const answer = lineFrom(f)
    if (!answer.points.some(Boolean) && !answer.gaps.some(Boolean)) return null
    const s1 = `x ${k1 < 0 ? FLIP[o1] : o1} ${r1}`, s2 = `x ${k2 < 0 ? FLIP[o2] : o2} ${r2}`
    const sys = `\\begin{cases} ${lin(k1, m1)} ${o1} ${k1 * r1 + m1} \\\\ ${lin(k2, m2)} ${o2} ${k2 * r2 + m2} \\end{cases}`
    return {
      kind: 'line', question: L(`Отметь на числовой прямой решение системы $${sys}$`, `Сан түзуінде $${sys}$ жүйесінің шешімін белгіле.`),
      solution: `${L(`Из первого неравенства: $${s1}$, из второго: $${s2}$. Решение системы — их общая часть.`, `Бірінші теңсіздіктен: $${s1}$, екіншісінен: $${s2}$. Жүйенің шешімі — олардың ортақ бөлігі.`)}\n\n${L('Ответ', 'Жауабы')}: $x \\in ${lineToTex(answer)}$`, answer,
    }
  },
]

// ---------- Координатная плоскость ----------
const pt = (p: PlanePoint) => `(${p.x}; ${p.y})`
const ans = (L: (ru: string, kk: string) => string, ps: PlanePoint[]) => `${L('Ответ', 'Жауабы')}: $${ps.map(pt).join(',\\ ')}$`

const PLANE_GENS: Gen[] = [
  // вершина параболы
  L => {
    const a = pick([1, -1]), p = rnd(-5, 5), q = rnd(-5, 5), b = -2 * a * p, c = a * p * p + q
    const f = `y = ${a < 0 ? '-' : ''}x^2 ${term(b, 'x')} ${signed(c)}`.replace(/\s+/g, ' ').trim()
    return {
      kind: 'plane', multi: false, answer: [{ x: p, y: q }],
      question: L(`Отметь на координатной плоскости вершину параболы $${f}$.`, `Координаталық жазықтықта $${f}$ параболасының төбесін белгіле.`),
      solution: `$x_0 = -\\frac{b}{2a} = ${p}$, $y_0 = y(${p}) = ${q}$.\n\n${ans(L, [{ x: p, y: q }])}`,
    }
  },
  // точка пересечения прямых
  L => {
    const X = rnd(-5, 5), Y = rnd(-5, 5), k1 = rnd(-3, 3), k2 = rnd(-3, 3)
    if (k1 === k2) return null
    const b1 = Y - k1 * X, b2 = Y - k2 * X
    if (Math.abs(b1) > 12 || Math.abs(b2) > 12) return null
    const l1 = lin(k1, b1), l2 = lin(k2, b2)
    return {
      kind: 'plane', multi: false, answer: [{ x: X, y: Y }],
      question: L(`Отметь точку пересечения прямых $y = ${l1}$ и $y = ${l2}$.`, `$y = ${l1}$ және $y = ${l2}$ түзулерінің қиылысу нүктесін белгіле.`),
      solution: `$${l1} = ${l2}$ ⇒ $x = ${X}$, $y = ${Y}$.\n\n${ans(L, [{ x: X, y: Y }])}`,
    }
  },
  // симметричная точка
  L => {
    const A = { x: nz(-5, 5), y: nz(-5, 5), label: 'A' }
    const kind = rnd(0, 3)
    const B = [{ x: A.x, y: -A.y }, { x: -A.x, y: A.y }, { x: -A.x, y: -A.y }, { x: A.y, y: A.x }][kind]
    if (B.x === A.x && B.y === A.y) return null
    const rel = [L('оси $Ox$', '$Ox$ осіне'), L('оси $Oy$', '$Oy$ осіне'), L('начала координат', 'координаталар басына'), L('прямой $y = x$', '$y = x$ түзуіне')][kind]
    const why = [
      L('при симметрии относительно $Ox$ меняется знак ординаты', '$Ox$ осіне қатысты симметрияда ордината таңбасы ауысады'),
      L('при симметрии относительно $Oy$ меняется знак абсциссы', '$Oy$ осіне қатысты симметрияда абсцисса таңбасы ауысады'),
      L('при симметрии относительно начала координат меняются знаки обеих координат', 'координаталар басына қатысты симметрияда екі координатаның да таңбасы ауысады'),
      L('при симметрии относительно прямой $y = x$ координаты меняются местами', '$y = x$ түзуіне қатысты симметрияда координаталар орын алмастырады'),
    ][kind]
    return {
      kind: 'plane', multi: false, answer: [B], shown: [A],
      question: L(`Отметь точку, симметричную точке $A${pt(A)}$ относительно ${rel}.`, `$A${pt(A)}$ нүктесіне ${rel} қатысты симметриялы нүктені белгіле.`),
      solution: `${why[0].toUpperCase()}${why.slice(1)}.\n\n${ans(L, [B])}`,
    }
  },
  // середина отрезка
  L => {
    const A = { x: rnd(-6, 6), y: rnd(-6, 6), label: 'A' }
    const B = { x: A.x + 2 * rnd(-3, 3), y: A.y + 2 * rnd(-3, 3), label: 'B' }
    if (Math.abs(B.x) > 6 || Math.abs(B.y) > 6 || (A.x === B.x && A.y === B.y)) return null
    const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
    return {
      kind: 'plane', multi: false, answer: [M], shown: [A, B],
      question: L(`Отметь середину отрезка $AB$, где $A${pt(A)}$, $B${pt(B)}$.`, `$AB$ кесіндісінің ортасын белгіле, мұндағы $A${pt(A)}$, $B${pt(B)}$.`),
      solution: `$x = \\frac{${A.x} ${signed(B.x) || '+ 0'}}{2} = ${M.x}$, $y = \\frac{${A.y} ${signed(B.y) || '+ 0'}}{2} = ${M.y}$.\n\n${ans(L, [M])}`,
    }
  },
  // центр окружности
  L => {
    const a = rnd(-5, 5), b = rnd(-5, 5), r = rnd(1, 5)
    const sq = (v: string, k: number) => (k === 0 ? `${v}^2` : `(${v} ${signed(-k)})^2`)
    const eq = `${sq('x', a)} + ${sq('y', b)} = ${r * r}`
    return {
      kind: 'plane', multi: false, answer: [{ x: a, y: b }],
      question: L(`Отметь центр окружности $${eq}$.`, `$${eq}$ шеңберінің центрін белгіле.`),
      solution: `${L('Окружность $(x - a)^2 + (y - b)^2 = R^2$ имеет центр $(a; b)$ и радиус $R$.', '$(x - a)^2 + (y - b)^2 = R^2$ шеңберінің центрі $(a; b)$, радиусы $R$.')} $R = ${r}$.\n\n${ans(L, [{ x: a, y: b }])}`,
    }
  },
  // чтение графика: экстремумы, наибольшее / наименьшее значение
  L => {
    const ys: number[] = [rnd(-4, 4)]
    for (let x = -5; x <= 6; x++) {
      let y = 99
      while (Math.abs(y) > 5) y = ys[ys.length - 1] + pick([-2, -1, 1, 2])
      ys.push(y)
    }
    const curve = ys.map((y, i) => [i - 6, y] as [number, number])
    const maxs = curve.filter((_, i) => i > 0 && i < ys.length - 1 && ys[i] > ys[i - 1] && ys[i] > ys[i + 1]).map(([x, y]) => ({ x, y }))
    const mins = curve.filter((_, i) => i > 0 && i < ys.length - 1 && ys[i] < ys[i - 1] && ys[i] < ys[i + 1]).map(([x, y]) => ({ x, y }))
    const kind = rnd(0, 3)
    const graph = L('На рисунке — график функции $y = f(x)$ на отрезке $[-6; 6]$.', 'Суретте $[-6; 6]$ кесіндісіндегі $y = f(x)$ функциясының графигі берілген.')
    if (kind < 2) {
      const list = kind === 0 ? maxs : mins
      if (!list.length || list.length > 4) return null
      return {
        kind: 'plane', multi: true, answer: list, curve,
        question: `${graph} ${kind === 0 ? L('Отметь все точки максимума функции (точки графика).', 'Функцияның барлық максимум нүктелерін (графиктің нүктелерін) белгіле.') : L('Отметь все точки минимума функции (точки графика).', 'Функцияның барлық минимум нүктелерін (графиктің нүктелерін) белгіле.')}`,
        solution: `${kind === 0 ? L('В точке максимума возрастание сменяется убыванием.', 'Максимум нүктесінде өсу кемумен алмасады.') : L('В точке минимума убывание сменяется возрастанием.', 'Минимум нүктесінде кему өсумен алмасады.')}\n\n${ans(L, list)}`,
      }
    }
    const best = kind === 2 ? Math.max(...ys) : Math.min(...ys)
    const list = curve.filter(([, y]) => y === best).map(([x, y]) => ({ x, y }))
    if (list.length > 1) return null
    return {
      kind: 'plane', multi: false, answer: list, curve,
      question: `${graph} ${kind === 2 ? L('Отметь точку графика, в которой функция принимает наибольшее значение.', 'Функция ең үлкен мәнін қабылдайтын график нүктесін белгіле.') : L('Отметь точку графика, в которой функция принимает наименьшее значение.', 'Функция ең кіші мәнін қабылдайтын график нүктесін белгіле.')}`,
      solution: `${kind === 2 ? L('Это самая высокая точка графика', 'Бұл графиктің ең биік нүктесі') : L('Это самая низкая точка графика', 'Бұл графиктің ең төмен нүктесі')}: $f(${list[0].x}) = ${best}$.\n\n${ans(L, list)}`,
    }
  },
]

// ---------- Единичная окружность ----------
export function radTex(deg: number): string {
  if (deg === 0) return '0'
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a)
  const d = g(Math.abs(deg), 180), p = deg / d, q = 180 / d
  const top = p === 1 ? '\\pi' : p === -1 ? '-\\pi' : `${p}\\pi`
  if (q === 1) return top
  return `${p < 0 ? '-' : ''}\\frac{${Math.abs(p) === 1 ? '' : Math.abs(p)}\\pi}{${q}}`
}

const TRIG: { f: 'sin' | 'cos' | 'tg'; tex: string; v: number }[] = [
  ...(['sin', 'cos'] as const).flatMap(f => [
    { f, tex: '0', v: 0 }, { f, tex: '\\frac{1}{2}', v: 0.5 }, { f, tex: '-\\frac{1}{2}', v: -0.5 },
    { f, tex: '\\frac{\\sqrt{2}}{2}', v: Math.SQRT1_2 }, { f, tex: '-\\frac{\\sqrt{2}}{2}', v: -Math.SQRT1_2 },
    { f, tex: '\\frac{\\sqrt{3}}{2}', v: Math.sqrt(3) / 2 }, { f, tex: '-\\frac{\\sqrt{3}}{2}', v: -Math.sqrt(3) / 2 },
    { f, tex: '1', v: 1 }, { f, tex: '-1', v: -1 },
  ]),
  { f: 'tg', tex: '1', v: 1 }, { f: 'tg', tex: '-1', v: -1 }, { f: 'tg', tex: '\\sqrt{3}', v: Math.sqrt(3) },
  { f: 'tg', tex: '-\\sqrt{3}', v: -Math.sqrt(3) }, { f: 'tg', tex: '\\frac{\\sqrt{3}}{3}', v: Math.sqrt(3) / 3 }, { f: 'tg', tex: '0', v: 0 },
]
const trigValue = (f: 'sin' | 'cos' | 'tg', deg: number) => {
  const r = (deg * Math.PI) / 180
  return f === 'sin' ? Math.sin(r) : f === 'cos' ? Math.cos(r) : deg % 180 === 90 ? NaN : Math.tan(r)
}

const CIRCLE_GENS: Gen[] = [
  // точка, соответствующая углу
  L => {
    const deg = pick(CIRCLE_DEGREES.filter(d => d !== 0))
    const form = rnd(0, 4)
    const shown = form === 3 ? deg - 360 : form === 4 ? deg + 360 : deg
    const tex = form === 2 ? `${shown}^\\circ` : radTex(shown)
    const same = shown !== deg ? L(` Это та же точка, что и угол $${deg}^\\circ$ (отличаются на полный оборот $360^\\circ$).`, ` Бұл $${deg}^\\circ$ бұрышымен бірдей нүкте (толық айналымға, $360^\\circ$-қа ерекшеленеді).`) : ''
    return {
      kind: 'circle', multi: false, answer: [deg],
      question: L(`Отметь на единичной окружности точку, соответствующую углу $${tex}$.`, `Бірлік шеңберде $${tex}$ бұрышына сәйкес нүктені белгіле.`),
      solution: `$${tex} = ${form === 2 ? radTex(shown) : `${shown}^\\circ`}$.${shown >= 0 ? L(' Угол откладываем от положительного направления оси $Ox$ против часовой стрелки.', ' Бұрышты $Ox$ осінің оң бағытынан сағат тіліне қарсы саламыз.') : ''}${shown < 0 ? L(' Отрицательный угол откладываем по часовой стрелке.', ' Теріс бұрышты сағат тілі бағытымен саламыз.') : ''}${same}`,
    }
  },
  // все решения уравнения на [0; 2π)
  L => {
    const e = pick(TRIG)
    const answer = CIRCLE_DEGREES.filter(d => Math.abs(trigValue(e.f, d) - e.v) < 1e-9)
    if (!answer.length) return null
    const eq = `\\${e.f === 'tg' ? 'operatorname{tg}' : e.f}\\,x = ${e.tex}`
    const list = answer.map(d => `$x = ${radTex(d)}$`).join(', ')
    return {
      kind: 'circle', multi: true, answer,
      question: L(`Отметь на единичной окружности все решения уравнения $${eq}$ на промежутке $[0; 2\\pi)$.`, `Бірлік шеңберде $${eq}$ теңдеуінің $[0; 2\\pi)$ аралығындағы барлық шешімдерін белгіле.`),
      solution: `${e.f === 'sin' ? L('$\\sin x$ — ордината точки на окружности.', '$\\sin x$ — шеңбердегі нүктенің ординатасы.') : e.f === 'cos' ? L('$\\cos x$ — абсцисса точки на окружности.', '$\\cos x$ — шеңбердегі нүктенің абсциссасы.') : L('$\\operatorname{tg} x = \\frac{\\sin x}{\\cos x}$, период — $\\pi$.', '$\\operatorname{tg} x = \\frac{\\sin x}{\\cos x}$, периоды — $\\pi$.')} ${L('Подходят', 'Сәйкес келетіндер')}: ${list}.`,
    }
  },
]

const GENS: Record<MarkKind, Gen[]> = { line: LINE_GENS, plane: PLANE_GENS, circle: CIRCLE_GENS }

export function markTask(kind: MarkKind | 'all', locale: Locale): MarkTask {
  const L = (ru: string, kk: string) => (locale === 'kk' ? kk : ru)
  for (;;) {
    const k = kind === 'all' ? pick(['line', 'plane', 'circle'] as MarkKind[]) : kind
    const t = pick(GENS[k])(L)
    if (t) return t
  }
}

// ---------- Проверка ----------
const key = (p: PlanePoint) => `${p.x},${p.y}`
export function samePoints(a: PlanePoint[], b: PlanePoint[]): boolean {
  const A = new Set(a.map(key)), B = new Set(b.map(key))
  return A.size === B.size && [...A].every(k => B.has(k))
}
export const sameDegrees = (a: number[], b: number[]) => a.length === b.length && [...a].sort((x, y) => x - y).every((d, i) => d === [...b].sort((x, y) => x - y)[i])

export type MarkAnswer = { line?: LineSet; points?: PlanePoint[]; degrees?: number[] }
export function checkMark(t: MarkTask, a: MarkAnswer): boolean {
  if (t.kind === 'line') return !!a.line && sameLine(a.line, t.answer)
  if (t.kind === 'plane') return !!a.points && samePoints(a.points, t.answer)
  return !!a.degrees && sameDegrees(a.degrees, t.answer)
}

// Генераторов по видам — для теста
export const MARK_GENS = GENS
