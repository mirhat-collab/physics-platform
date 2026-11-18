// Неравенства по мотивам задачника Сканави (уровень ЕНТ): числовые промежутки,
// линейные, квадратные, рациональные, иррациональные, показательные,
// логарифмические неравенства и системы. Задачи составлены заново: шаблоны
// параметрические, числа случайные, а ответ строится по выбранным критическим
// точкам и считается в коде. Тексты на русском и казахском.
import type { Template } from '../helpers'
import { c, h, N, T as T0, pick, rnd, frac, fx, gcd, type B } from './bi'
import { poly } from '../more/common'

// ---------- Множества на числовой прямой ----------
type Op = '<' | '>' | '\\le' | '\\ge'
type E = { v: number; s: string } // конец промежутка: значение и запись
type P = { a: E | null; b: E | null; l: boolean; r: boolean } // null — бесконечность
type S = P[]

const en = (v: number): E => ({ v, s: String(v) })
const ef = (p: number, q: number): E => ({ v: p / q, s: frac(p, q) })
const ed = (v: number): E => ({ v, s: fx(v) })

const OPS: Op[] = ['<', '>', '\\le', '\\ge']
const flip = (o: Op): Op => ({ '<': '>', '>': '<', '\\le': '\\ge', '\\ge': '\\le' } as Record<Op, Op>)[o]
const cmp = (v: number, o: Op) => (o === '<' ? v < 0 : o === '>' ? v > 0 : o === '\\le' ? v <= 0 : v >= 0)
const up = (o: Op) => o === '<' || o === '\\le'
const coin = () => rnd(0, 1) === 1

const inS = (s: S, x: number) => s.some(p => (p.a === null || x > p.a.v || (p.l && x === p.a.v)) && (p.b === null || x < p.b.v || (p.r && x === p.b.v)))
const ends = (s: S): E[] => s.flatMap(p => [p.a, p.b]).filter((x): x is E => x !== null)

// Множество по критическим точкам и правилу «точка входит / не входит»
function build(pts: E[], inc: (x: number) => boolean): S {
  const u: E[] = []
  for (const p of [...pts].sort((a, b) => a.v - b.v)) if (!u.length || u[u.length - 1].v !== p.v) u.push(p)
  const out: S = []
  let cur: P | null = null
  for (let i = 0; i <= u.length; i++) {
    const lo = i ? u[i - 1] : null, hi = i < u.length ? u[i] : null
    const mid = lo && hi ? (lo.v + hi.v) / 2 : lo ? lo.v + 1 : hi ? hi.v - 1 : 0
    if (inc(mid)) { if (!cur) cur = { a: lo, b: null, l: false, r: false }; cur.b = hi; cur.r = false } else if (cur) { out.push(cur); cur = null }
    if (i < u.length) {
      if (inc(u[i].v)) { if (!cur) cur = { a: u[i], b: u[i], l: true, r: true }; else { cur.b = u[i]; cur.r = true } } else if (cur) { cur.b = u[i]; cur.r = false; out.push(cur); cur = null }
    }
  }
  if (cur) out.push(cur)
  return out
}
const norm = (s: S) => build(ends(s), x => inS(s, x))
const inter = (a: S, b: S) => build([...ends(a), ...ends(b)], x => inS(a, x) && inS(b, x))
const uni = (a: S, b: S) => build([...ends(a), ...ends(b)], x => inS(a, x) || inS(b, x))
const comp = (a: S) => build(ends(a), x => !inS(a, x))
const ray = (k: E, o: Op): S => [up(o) ? { a: null, b: k, l: false, r: o === '\\le' } : { a: k, b: null, l: o === '\\ge', r: false }]
const seg = (a: E, b: E, l: boolean, r: boolean): S => [{ a, b, l, r }]
const togglePt = (s: S, v: number) => build([...ends(s), en(v)], x => (x === v ? !inS(s, x) : inS(s, x)))

// Метод интервалов: множители (x - корень)^кратность в числителе и знаменателе
type F = [E, number]
const chart = (nu: F[], de: F[], lead: number, o: Op): S => build([...nu, ...de].map(f => f[0]), x => {
  if (de.some(f => f[0].v === x)) return false
  let s = lead
  for (const [r, m] of [...nu, ...de]) { const d = x - r.v; if (d === 0) s = 0; else if (d < 0 && m % 2) s = -s }
  return cmp(s, o)
})

const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
const intsOf = (s: S) => range(-300, 300).filter(x => inS(s, x))
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

// ---------- Запись ----------
const pc = (p: P) => (p.a && p.b && p.a.v === p.b.v ? `\\{${p.a.s}\\}` : `${p.l ? '[' : '('}${p.a ? p.a.s : '-\\infty'};\\ ${p.b ? p.b.s : '+\\infty'}${p.r ? ']' : ')'}`)
const ins = (s: S) => s.map(pc).join(' \\cup ')
const ans = (s: S): B => (s.length ? [`$${ins(s)}$`, `$${ins(s)}$`] : ['решений нет', 'шешімі жоқ'])
const opt = (s: S): B | string => (s.length ? `$${ins(s)}$` : ans(s))
const key = (x: B | string) => (typeof x === 'string' ? x : x[0])
// x - r без «x - 0» и «x - -3»
const xm = (r: number) => (r === 0 ? 'x' : `x ${r > 0 ? '-' : '+'} ${Math.abs(r)}`)
const fac = (r: number) => (r === 0 ? 'x' : `(${xm(r)})`)
const prod = (rs: number[]) => [...rs.filter(r => r === 0), ...rs.filter(r => r !== 0)].map(fac).join('')
const sq = (r: number) => (r === 0 ? 'x^2' : `(${xm(r)})^2`)
const mono = (k: number) => poly([k, 0])
const pw = (a: number, m: number) => (m >= 0 ? String(a ** m) : `\\frac{1}{${a ** -m}}`)
const lg = (base: string, arg: string) => `\\log_{${base}}${arg === 'x' ? ' x' : `(${arg})`}`
// слагаемые со знаком: « - 3t», « + 2»
const tm = (k: number, v: string) => (k === 0 ? '' : ` ${k < 0 ? '-' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}${v}`)
const tc = (k: number) => (k === 0 ? '' : ` ${k < 0 ? '-' : '+'} ${Math.abs(k)}`)
const par = (v: number) => (v < 0 ? `(${fx(v)})` : fx(v))
const list = (xs: number[]) => xs.join(', ')
const nz = (lo: number, hi: number) => { let v = 0; while (v === 0) v = rnd(lo, hi); return v }
// два различных ненулевых корня p < r, не противоположных
const two = (lo = -6, hi = 7): [number, number] => {
  let p = 0, r = 0
  while (p === r || p === 0 || r === 0 || p === -r) { p = rnd(lo, hi); r = rnd(lo, hi) }
  return p < r ? [p, r] : [r, p]
}

// ---------- Формулировки ----------
const Q = (ru: string, kk: string): B => [ru, kk]
const solveQ = (f: string): B => [`Решите неравенство $${f}$.`, `$${f}$ теңсіздігін шешіңіз.`]
const cntQ = (f: string): B => [`Сколько целых решений имеет неравенство $${f}$?`, `$${f}$ теңсіздігінің неше бүтін шешімі бар?`]
const sumQ = (f: string): B => [`Найдите сумму целых решений неравенства $${f}$.`, `$${f}$ теңсіздігінің бүтін шешімдерінің қосындысын табыңыз.`]
const minQ = (f: string): B => [`Найдите наименьшее целое решение неравенства $${f}$.`, `$${f}$ теңсіздігінің ең кіші бүтін шешімін табыңыз.`]
const maxQ = (f: string): B => [`Найдите наибольшее целое решение неравенства $${f}$.`, `$${f}$ теңсіздігінің ең үлкен бүтін шешімін табыңыз.`]
const natQ = (f: string): B => [`Сколько натуральных решений имеет неравенство $${f}$?`, `$${f}$ теңсіздігінің неше натурал шешімі бар?`]
const natSumQ = (f: string): B => [`Найдите сумму натуральных решений неравенства $${f}$.`, `$${f}$ теңсіздігінің натурал шешімдерінің қосындысын табыңыз.`]
const sys = (...l: string[]) => `\\begin{cases} ${l.join(', \\\\ ')} \\end{cases}`
const sysQ = (f: string): B => [`Решите систему неравенств $${f}$.`, `$${f}$ теңсіздіктер жүйесін шешіңіз.`]
const sysCnt = (f: string): B => [`Сколько целых решений имеет система неравенств $${f}$?`, `$${f}$ теңсіздіктер жүйесінің неше бүтін шешімі бар?`]
const sysSum = (f: string): B => [`Найдите сумму целых решений системы неравенств $${f}$.`, `$${f}$ теңсіздіктер жүйесінің бүтін шешімдерінің қосындысын табыңыз.`]
const sysMax = (f: string): B => [`Найдите наибольшее целое решение системы неравенств $${f}$.`, `$${f}$ теңсіздіктер жүйесінің ең үлкен бүтін шешімін табыңыз.`]

// Ответ-множество: неверные варианты без повторов, недостающие добираются
// сменой скобок, дополнением и сдвигом
function variants(s: S): S[] {
  const out: S[] = []
  s.forEach((p, i) => {
    if (p.a && p.b && p.a.v === p.b.v) return
    if (p.a) out.push(s.map((q, j) => (j === i ? { ...q, l: !q.l } : q)))
    if (p.b) out.push(s.map((q, j) => (j === i ? { ...q, r: !q.r } : q)))
  })
  out.push(comp(s), s.map(p => ({ ...p, l: !p.l, r: !p.r })))
  if (ends(s).every(x => Number.isInteger(x.v))) for (const d of [1, -1, 2]) out.push(s.map(p => ({ ...p, a: p.a && en(p.a.v + d), b: p.b && en(p.b.v + d) })))
  out.push([{ a: null, b: null, l: false, r: false }], [])
  return out
}
function TA(q: B, right: S, wrongs: S[], n: number, sol: B | string) {
  const r = opt(right), seen = new Set([key(r)]), w: (B | string)[] = []
  const add = (s: S) => { const f = opt(norm(s)); if (!seen.has(key(f))) { seen.add(key(f)); w.push(f) } }
  wrongs.forEach(add)
  variants(right).forEach(add)
  return T0(q, r, w, n, sol)
}

const TP = 'Числовые промежутки: объединение и пересечение', TL = 'Линейные неравенства', TQ = 'Квадратные неравенства'
const TR = 'Рациональные неравенства. Метод интервалов', TI = 'Иррациональные неравенства', TE = 'Показательные неравенства'
const TG = 'Логарифмические неравенства', TS = 'Системы неравенств'
const LE: Op[] = ['<', '\\le'], GE: Op[] = ['>', '\\ge']

export const SK_INEQ: Template[] = [
  // ---------- Числовые промежутки ----------
  c(TP, n => {
    const a = rnd(-8, 1), m = a + rnd(1, 4), b = m + rnd(1, 4), d = b + rnd(1, 4)
    const A = seg(en(a), en(b), coin(), coin()), Bs = seg(en(m), en(d), coin(), coin()), R = inter(A, Bs)
    return TA(Q(`Найдите пересечение промежутков $${ins(A)}$ и $${ins(Bs)}$.`, `$${ins(A)}$ және $${ins(Bs)}$ аралықтарының қиылысуын табыңыз.`), R,
      [uni(A, Bs), seg(en(m), en(b), A[0].l, Bs[0].r), seg(en(a), en(m), A[0].l, !Bs[0].l), seg(en(b), en(d), !A[0].r, Bs[0].r)], n,
      [`Отметим оба промежутка на числовой прямой. Общая часть: $${ins(R)}$; конец входит в пересечение, только если он принадлежит обоим промежуткам.`,
        `Екі аралықты да сан түзуінде белгілейміз. Ортақ бөлігі: $${ins(R)}$; ұш нүкте екі аралыққа да тиісті болса ғана қиылысуға кіреді.`])
  }),
  c(TP, n => {
    const a = rnd(-8, 1), b = a + rnd(2, 5), m = coin() ? b : rnd(a + 1, b - 1), d = b + rnd(1, 4)
    const A = seg(en(a), en(b), coin(), coin()), Bs = seg(en(m), en(d), coin(), coin()), R = uni(A, Bs)
    return TA(Q(`Найдите объединение промежутков $${ins(A)}$ и $${ins(Bs)}$.`, `$${ins(A)}$ және $${ins(Bs)}$ аралықтарының бірігуін табыңыз.`), R,
      [inter(A, Bs), seg(en(a), en(d), A[0].l, Bs[0].r), seg(en(a), en(d), !A[0].l, !Bs[0].r), seg(en(m), en(b), true, true)], n,
      [`Объединение состоит из точек, принадлежащих хотя бы одному из промежутков: $${ins(R)}$.`, `Бірігуге аралықтардың кем дегенде біреуіне тиісті нүктелер кіреді: $${ins(R)}$.`])
  }),
  c(TP, n => {
    const a = rnd(-9, 3), b = a + rnd(3, 10), A: S = [{ a: null, b: en(b), l: false, r: coin() }], Bs: S = [{ a: en(a), b: null, l: coin(), r: false }]
    const R = inter(A, Bs), xs = intsOf(R), k = xs.length
    return N(Q(`Сколько целых чисел принадлежит пересечению промежутков $${ins(A)}$ и $${ins(Bs)}$?`, `$${ins(A)}$ және $${ins(Bs)}$ аралықтарының қиылысуына неше бүтін сан тиісті?`), k, [b - a, b - a + 1, b - a - 1, k + 2], n, '',
      [`Пересечение: $${ins(R)}$. Целые числа в нём: $${list(xs)}$ — всего $${k}$.`, `Қиылысуы: $${ins(R)}$. Ондағы бүтін сандар: $${list(xs)}$ — барлығы $${k}$.`])
  }),
  c(TP, n => {
    const a = rnd(-6, 2), b = a + rnd(2, 7), A: S = [{ a: null, b: en(a), l: false, r: coin() }], Bs: S = [{ a: en(b), b: null, l: coin(), r: false }]
    const C = comp(uni(A, Bs)), xs = intsOf(C), s = sum(xs), all = range(a, b)
    return N(Q(`Найдите сумму целых чисел, которые не принадлежат объединению промежутков $${ins(A)}$ и $${ins(Bs)}$.`, `$${ins(A)}$ және $${ins(Bs)}$ аралықтарының бірігуіне тиісті емес бүтін сандардың қосындысын табыңыз.`),
      s, [sum(all), sum(all) - a, sum(all) - b, sum(all) - a - b, -s], n, '',
      [`Объединению не принадлежат числа из $${ins(C)}$. Целые среди них: $${list(xs)}$, их сумма $${s}$.`, `Бірігуге $${ins(C)}$ аралығындағы сандар тиісті емес. Олардың ішіндегі бүтін сандар: $${list(xs)}$, қосындысы $${s}$.`])
  }),
  c(TP, n => {
    const a1 = rnd(-12, 4) / 2, a2 = a1 + rnd(1, 6) / 2, b1 = a2 + rnd(1, 6) / 2, b2 = b1 + rnd(1, 6) / 2
    const A = seg(ed(a1), ed(b1), coin(), coin()), Bs = seg(ed(a2), ed(b2), coin(), coin()), R = inter(A, Bs), len = b1 - a2
    const [X, Y] = coin() ? [A, Bs] : [Bs, A]
    return N(Q(`Найдите длину промежутка, который является пересечением промежутков $${ins(X)}$ и $${ins(Y)}$.`, `$${ins(X)}$ және $${ins(Y)}$ аралықтарының қиылысуы болатын аралықтың ұзындығын табыңыз.`),
      len, [b2 - a1, b1 - a1, b2 - a2, a2 - a1, b2 - b1], n, '',
      [`Пересечение: $${ins(R)}$, его длина $${fx(b1)} - ${par(a2)} = ${fx(len)}$.`, `Қиылысуы: $${ins(R)}$, оның ұзындығы $${fx(b1)} - ${par(a2)} = ${fx(len)}$.`])
  }),
  h(TP, n => {
    const m = rnd(-9, -2), a = m + rnd(1, 3), b = a + rnd(1, 4), d = b + rnd(1, 4)
    const A: S = [{ a: null, b: en(a), l: false, r: coin() }, { a: en(b), b: null, l: coin(), r: false }], Bs = seg(en(m), en(d), coin(), coin()), R = inter(A, Bs)
    return TA(Q(`Найдите пересечение множеств $A = ${ins(A)}$ и $B = ${ins(Bs)}$.`, `$A = ${ins(A)}$ және $B = ${ins(Bs)}$ жиындарының қиылысуын табыңыз.`), R,
      [Bs, inter(comp(A), Bs), uni(A, Bs), seg(en(m), en(d), A[0].r, A[1].l), inter(A.map(p => ({ ...p, l: !p.l, r: !p.r })), Bs)], n,
      [`Из промежутка $B$ убираем точки, не принадлежащие $A$, то есть $${ins(comp(A))}$. Получаем $A \\cap B = ${ins(R)}$.`,
        `$B$ аралығынан $A$ жиынына тиісті емес нүктелерді, яғни $${ins(comp(A))}$ бөлігін алып тастаймыз. Нәтижесі: $A \\cap B = ${ins(R)}$.`])
  }),

  // ---------- Линейные неравенства ----------
  c(TL, n => {
    const k = rnd(-6, 6), a = nz(-4, 5), b = rnd(-9, 9)
    let m = rnd(-4, 5); while (m === a) m = rnd(-4, 5)
    const A = a - m, d = A * k + b, o = pick(OPS), o2 = A > 0 ? o : flip(o)
    return TA(solveQ(`${poly([a, b])} ${o} ${poly([m, d])}`), ray(en(k), o2), [ray(en(k), flip(o2)), ray(en(-k), o2), ray(en(-k), flip(o2))], n,
      [`Переносим слагаемые с $x$ влево, а числа вправо: $${mono(A)} ${o} ${A * k}$` + (A < 0 ? `; делим на отрицательное число $${A}$ и меняем знак неравенства` : '') + `: $x ${o2} ${k}$.`,
        `$x$ бар мүшелерді сол жаққа, сандарды оң жаққа көшіреміз: $${mono(A)} ${o} ${A * k}$` + (A < 0 ? `; теріс $${A}$ санына бөлгенде теңсіздік таңбасы өзгереді` : '') + `: $x ${o2} ${k}$.`])
  }),
  c(TL, n => {
    const m = pick([2, 3, 4, 5, 6]); let q2 = pick([2, 3, 4, 5, 6]); while (q2 === m) q2 = pick([2, 3, 4, 5, 6])
    const p = rnd(1, 6), q = rnd(1, 6), r = rnd(-2, 3), o = pick(OPS)
    const A = q2 - m, R = r * m * q2 - q2 * p - m * q, o2 = A > 0 ? o : flip(o), big = up(o2)
    const xs = range(-300, 300).filter(x => cmp(q2 * (x + p) - m * (x - q) - r * m * q2, o)), ans1 = big ? Math.max(...xs) : Math.min(...xs)
    const f = `\\frac{${xm(-p)}}{${m}} - \\frac{${xm(q)}}{${q2}} ${o} ${r}`
    return N((big ? maxQ : minQ)(f), ans1, [ans1 + 1, ans1 - 1, -ans1, big ? ans1 + 2 : ans1 - 2], n, '',
      [`Умножим обе части на $${m * q2}$: $${q2}(${xm(-p)}) - ${m}(${xm(q)}) ${o} ${r * m * q2}$, откуда $${mono(A)} ${o} ${R}$ и $x ${o2} ${frac(R, A)}$. ${big ? 'Наибольшее' : 'Наименьшее'} целое решение: $${ans1}$.`,
        `Екі жағын да $${m * q2}$ санына көбейтеміз: $${q2}(${xm(-p)}) - ${m}(${xm(q)}) ${o} ${r * m * q2}$, бұдан $${mono(A)} ${o} ${R}$ және $x ${o2} ${frac(R, A)}$. Ең ${big ? 'үлкен' : 'кіші'} бүтін шешімі: $${ans1}$.`])
  }),
  c(TL, n => {
    const k = rnd(2, 5), j = rnd(1, k - 1), a = rnd(1, 6), b = rnd(1, 6), x0 = rnd(2, 9), t = rnd(0, k - j - 1), o = pick(LE)
    const d = (k - j) * x0 - k * a - j * b - t, xs = range(1, 300).filter(x => cmp(k * (x - a) - j * (x + b) - d, o))
    return N(natQ(`${k}(${xm(a)}) - ${j === 1 ? '' : j}(${xm(-b)}) ${o} ${d}`), xs.length, [xs.length + 1, xs.length - 1, x0 + 1, xs.length + 2], n, '',
      [`Раскроем скобки: $${poly([k - j, -k * a - j * b])} ${o} ${d}$, $${mono(k - j)} ${o} ${(k - j) * x0 - t}$, $x ${o} ${frac((k - j) * x0 - t, k - j)}$. Натуральные решения: $${list(xs)}$ — всего $${xs.length}$.`,
        `Жақшаларды ашамыз: $${poly([k - j, -k * a - j * b])} ${o} ${d}$, $${mono(k - j)} ${o} ${(k - j) * x0 - t}$, $x ${o} ${frac((k - j) * x0 - t, k - j)}$. Натурал шешімдері: $${list(xs)}$ — барлығы $${xs.length}$.`])
  }),
  c(TL, n => {
    const k = rnd(2, 5), m = rnd(-5, 9), lo = rnd(-9, 3), hi = lo + rnd(2, 10), o1 = pick(LE), o2 = pick(LE)
    const mid = m === 0 ? `-${k}x` : `${m} - ${k}x`
    const R = seg(ef(m - hi, k), ef(m - lo, k), o2 === '\\le', o1 === '\\le')
    return TA(solveQ(`${lo} ${o1} ${mid} ${o2} ${hi}`), R, [seg(ef(m - hi, k), ef(m - lo, k), o1 === '\\le', o2 === '\\le'), seg(ef(lo - m, k), ef(hi - m, k), o1 === '\\le', o2 === '\\le'), seg(ef(lo - m, k), ef(hi - m, k), o2 === '\\le', o1 === '\\le')], n,
      [`Переносим число в крайние части: $${lo - m} ${o1} ${mono(-k)} ${o2} ${hi - m}$. Делим на $${-k} < 0$, знаки неравенства меняются: $${frac(m - hi, k)} ${o2} x ${o1} ${frac(m - lo, k)}$, то есть $${ins(R)}$.`,
        `Санды шеткі бөліктерге көшіреміз: $${lo - m} ${o1} ${mono(-k)} ${o2} ${hi - m}$. $${-k} < 0$ санына бөлеміз, теңсіздік таңбалары өзгереді: $${frac(m - hi, k)} ${o2} x ${o1} ${frac(m - lo, k)}$, яғни $${ins(R)}$.`])
  }),
  h(TL, n => {
    let a = 0, b = 0
    while (b === 0 || a + b <= 0) { a = rnd(1, 6); b = rnd(-3, 6) }
    const X = rnd(-5, 5), K = -2 * (a + b), C0 = a * a - b * b, m = C0 + K * X, o = pick(OPS)
    return TA(solveQ(`(${xm(a)})^2 - (${xm(-b)})^2 ${o} ${m}`), ray(en(X), flip(o)), [ray(en(X), o), ray(en(-X), flip(o)), ray(en(-X), o)], n,
      [`Раскроем скобки, $x^2$ сокращается: $${poly([K, C0])} ${o} ${m}$, $${mono(K)} ${o} ${K * X}$. Делим на отрицательное число $${K}$ и меняем знак неравенства: $x ${flip(o)} ${X}$.`,
        `Жақшаларды ашамыз, $x^2$ қысқарады: $${poly([K, C0])} ${o} ${m}$, $${mono(K)} ${o} ${K * X}$. Теріс $${K}$ санына бөлеміз, теңсіздік таңбасы өзгереді: $x ${flip(o)} ${X}$.`])
  }),
  c(TL, n => {
    const [p, q] = pick([[2, 3], [2, 5], [3, 4], [3, 6], [2, 6], [4, 6], [3, 5], [4, 5]]), r = rnd(1, 3), o = pick(LE), g = gcd(p + q, p * q)
    const xs = range(1, 300).filter(x => cmp(x * (p + q) - r * p * q, o)), s = sum(xs), last = xs[xs.length - 1]
    const nu = (p + q) / g
    return N(natSumQ(`\\frac{x}{${p}} + \\frac{x}{${q}} ${o} ${r}`), s, [s + last + 1, s - last, xs.length, s + 1], n, '',
      [`Приведём к общему знаменателю: $\\frac{${nu === 1 ? '' : nu}x}{${(p * q) / g}} ${o} ${r}$, $x ${o} ${frac(r * p * q, p + q)}$. Натуральные решения: $${list(xs)}$, их сумма $${s}$.`,
        `Ортақ бөлімге келтіреміз: $\\frac{${nu === 1 ? '' : nu}x}{${(p * q) / g}} ${o} ${r}$, $x ${o} ${frac(r * p * q, p + q)}$. Натурал шешімдері: $${list(xs)}$, олардың қосындысы $${s}$.`])
  }),

  // ---------- Квадратные неравенства ----------
  c(TQ, n => {
    const [p, r] = two(), a = pick([1, 1, -1, 2, -2, 3]), o = pick(OPS), sg = Math.sign(a)
    const R = chart([[en(p), 1], [en(r), 1]], [], sg, o)
    return TA(solveQ(`${poly([a, -a * (p + r), a * p * r])} ${o} 0`), R, [chart([[en(p), 1], [en(r), 1]], [], -sg, o), chart([[en(-r), 1], [en(-p), 1]], [], sg, o), comp(R)], n,
      [`Корни трёхчлена: $x_1 = ${p}$, $x_2 = ${r}$. Ветви параболы направлены ${a > 0 ? 'вверх' : 'вниз'}, поэтому ответ: $${ins(R)}$.`,
        `Үшмүшенің түбірлері: $x_1 = ${p}$, $x_2 = ${r}$. Парабола тармақтары ${a > 0 ? 'жоғары' : 'төмен'} бағытталған, сондықтан жауабы: $${ins(R)}$.`])
  }),
  c(TQ, n => {
    const p = rnd(-7, 3), r = p + rnd(2, 9), o = pick(LE), R = chart([[en(p), 1], [en(r), 1]], [], 1, o), k = intsOf(R).length
    return N(cntQ(`${poly([1, -(p + r), p * r])} ${o} 0`), k, [r - p, r - p + 1, r - p - 1, r - p + 2], n, '',
      [`Корни трёхчлена $${p}$ и $${r}$; решения: $${ins(R)}$, целых решений $${k}$.`, `Үшмүшенің түбірлері $${p}$ және $${r}$; шешімдері: $${ins(R)}$, бүтін шешімдер саны $${k}$.`])
  }),
  c(TQ, n => {
    const q = pick([2, 3, 5]); let p = 0; while (p % q === 0) p = rnd(-7, 7)
    const r = rnd(-5, 5), o = pick(OPS), D = (q * r - p) ** 2, R = chart([[ef(p, q), 1], [en(r), 1]], [], 1, o)
    return TA(solveQ(`${poly([q, -(q * r + p), p * r])} ${o} 0`), R, [chart([[ef(q, p), 1], [en(r), 1]], [], 1, o), chart([[ef(-p, q), 1], [en(-r), 1]], [], 1, o), comp(R)], n,
      [`$D = ${D}$, корни: $x_1 = ${frac(p, q)}$, $x_2 = ${r}$. Старший коэффициент положителен, ветви параболы направлены вверх. Ответ: $${ins(R)}$.`,
        `$D = ${D}$, түбірлері: $x_1 = ${frac(p, q)}$, $x_2 = ${r}$. Бас коэффициент оң, парабола тармақтары жоғары бағытталған. Жауабы: $${ins(R)}$.`])
  }),
  h(TQ, n => {
    const o = pick(OPS), all: S = [{ a: null, b: null, l: false, r: false }]
    if (coin()) {
      const k = nz(-5, 5), f = poly([1, -2 * k, k * k]), R = chart([[en(k), 2]], [], 1, o), A = ans(R)
      return TA(solveQ(`${f} ${o} 0`), R, [all, [], [{ a: en(k), b: en(k), l: true, r: true }], comp([{ a: en(k), b: en(k), l: true, r: true }]), ray(en(k), '\\ge'), ray(en(k), '<')], n,
        [`$${f} = ${sq(k)}$. Квадрат неотрицателен и равен нулю только при $x = ${k}$. Ответ: ${A[0]}.`, `$${f} = ${sq(k)}$. Квадрат теріс емес және тек $x = ${k}$ болғанда нөлге тең. Жауабы: ${A[1]}.`])
    }
    const m = rnd(-4, 4), d = rnd(1, 6), s = pick([1, -1]), f = poly([s, 2 * m * s, s * (m * m + d)]), R = build([], () => cmp(s, o)), A = ans(R)
    return TA(solveQ(`${f} ${o} 0`), R, [all, [], [{ a: en(-m), b: en(-m), l: true, r: true }], comp([{ a: en(-m), b: en(-m), l: true, r: true }]), seg(en(-m - 1), en(-m + 1), true, true)], n,
      [`$D = ${-4 * d} < 0$, поэтому трёхчлен $${f}$ при всех $x$ ${s > 0 ? 'положителен' : 'отрицателен'}. Ответ: ${A[0]}.`, `$D = ${-4 * d} < 0$, сондықтан $${f}$ үшмүшесі барлық $x$ үшін ${s > 0 ? 'оң' : 'теріс'}. Жауабы: ${A[1]}.`])
  }),
  c(TQ, n => {
    let [p, r] = two(); while (r - p < 2 || r - p > 9) [p, r] = two()
    const o = pick(LE), b = -(p + r), R = chart([[en(p), 1], [en(r), 1]], [], 1, o), xs = intsOf(R), s = sum(xs)
    const other = sum(intsOf(chart([[en(p), 1], [en(r), 1]], [], 1, o === '<' ? '\\le' : '<')))
    return N(sumQ(`x(${xm(-b)}) ${o} ${-p * r}`), s, [other, -s, p + r, xs.length], n, '',
      [`$${poly([1, b, p * r])} ${o} 0$, корни $${p}$ и $${r}$. Целые решения: $${list(xs)}$, их сумма $${s}$.`, `$${poly([1, b, p * r])} ${o} 0$, түбірлері $${p}$ және $${r}$. Бүтін шешімдері: $${list(xs)}$, олардың қосындысы $${s}$.`])
  }),
  h(TQ, n => {
    const d = pick([2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19]), m = rnd(-4, 5), o = pick(LE), fl = Math.floor(Math.sqrt(d))
    const xs = range(-300, 300).filter(x => cmp(x * x - 2 * m * x + m * m - d, o)), rt = m === 0 ? `\\pm \\sqrt{${d}}` : `${m} \\pm \\sqrt{${d}}`
    return N(cntQ(`${poly([1, -2 * m, m * m - d])} ${o} 0`), xs.length, [2 * fl, 2 * fl + 2, 2 * fl + 3, fl + 1], n, '',
      [`Корни трёхчлена: $x = ${rt}$. Так как $${fl} < \\sqrt{${d}} < ${fl + 1}$, целые решения: $${xs[0]} \\le x \\le ${xs[xs.length - 1]}$ — всего $${xs.length}$.`,
        `Үшмүшенің түбірлері: $x = ${rt}$. $${fl} < \\sqrt{${d}} < ${fl + 1}$ болғандықтан, бүтін шешімдері: $${xs[0]} \\le x \\le ${xs[xs.length - 1]}$ — барлығы $${xs.length}$.`])
  }),

  // ---------- Рациональные неравенства ----------
  c(TR, n => {
    const set = new Set<number>(); while (set.size < 3) set.add(rnd(-6, 6))
    const pts = [...set].sort((a, b) => a - b), o = pick(OPS), pos = pts.filter(x => x > 0), fl = pos.length && coin() ? pick(pos) : null
    const lead = fl === null ? 1 : -1, R = chart(pts.map(x => [en(x), 1] as F), [], lead, o)
    const shown = [...pts.filter(x => x === 0), ...pts.filter(x => x !== 0)].map(x => (x === fl ? `(${x} - x)` : fac(x))).join('')
    return TA(solveQ(`${shown} ${o} 0`), R, [chart(pts.map(x => [en(x), 1] as F), [], -lead, o), chart(pts.map(x => [en(-x), 1] as F), [], lead, o), comp(R)], n,
      [`Нули левой части: $${pts.join(';\\ ')}$. ` + (fl === null ? '' : `Запишем $(${fl} - x) = -(${xm(fl)})$ и поменяем знак неравенства: $${prod(pts)} ${flip(o)} 0$. `) + `По методу интервалов (справа от наибольшего нуля знак «+», далее знаки чередуются): $${ins(R)}$.`,
        `Сол жағының нөлдері: $${pts.join(';\\ ')}$. ` + (fl === null ? '' : `$(${fl} - x) = -(${xm(fl)})$ деп жазып, теңсіздік таңбасын өзгертеміз: $${prod(pts)} ${flip(o)} 0$. `) + `Интервалдар әдісі бойынша (ең үлкен нөлдің оң жағында «+», әрі қарай таңбалар кезектеседі): $${ins(R)}$.`])
  }),
  c(TR, n => {
    const a = rnd(-7, 7); let b = rnd(-7, 7); while (b === a) b = rnd(-7, 7)
    const o = pick(OPS), R = chart([[en(a), 1]], [[en(b), 1]], 1, o)
    return TA(solveQ(`\\frac{${xm(a)}}{${xm(b)}} ${o} 0`), R, [chart([[en(a), 1], [en(b), 1]], [], 1, o), chart([[en(b), 1]], [[en(a), 1]], 1, o), comp(R), chart([[en(-a), 1]], [[en(-b), 1]], 1, o)], n,
      [`Нуль числителя: $x = ${a}$; знаменатель равен нулю при $x = ${b}$, эта точка всегда выколота. Метод интервалов: $${ins(R)}$.`,
        `Алымының нөлі: $x = ${a}$; бөлімі $x = ${b}$ болғанда нөлге тең, бұл нүкте әрқашан шығарылады. Интервалдар әдісі: $${ins(R)}$.`])
  }),
  c(TR, n => {
    const k = rnd(1, 3), b = rnd(-5, 5), a = b + pick([-1, 1]) * rnd(2, 7), q = -a - k * b, m = k + 1, o = pick(LE)
    const R = chart([[en(a), 1]], [[en(b), 1]], 1, o), cnt = intsOf(R).length, kk = k === 1 ? '' : String(k)
    return N(cntQ(`\\frac{${poly([m, q])}}{${xm(b)}} ${o} ${k}`), cnt, [cnt + 1, cnt - 1, cnt + 2, Math.abs(a - b) + 1], n, '',
      [`Перенесём $${k}$ в левую часть: $\\frac{${poly([m, q])} - ${kk}${fac(b)}}{${xm(b)}} = \\frac{${xm(a)}}{${xm(b)}} ${o} 0$. Решение: $${ins(R)}$, целых чисел в нём $${cnt}$.`,
        `$${k}$ санын сол жаққа көшіреміз: $\\frac{${poly([m, q])} - ${kk}${fac(b)}}{${xm(b)}} = \\frac{${xm(a)}}{${xm(b)}} ${o} 0$. Шешімі: $${ins(R)}$, ондағы бүтін сандар саны $${cnt}$.`])
  }),
  h(TR, n => {
    const set = new Set<number>(); while (set.size < 3) set.add(nz(-6, 6))
    const [a, b, m] = [...set], o = pick(OPS), R = chart([[en(a), 2], [en(b), 1]], [[en(m), 1]], 1, o)
    return TA(solveQ(`\\frac{${sq(a)}${fac(b)}}{${xm(m)}} ${o} 0`), R, [chart([[en(a), 1], [en(b), 1]], [[en(m), 1]], 1, o), togglePt(R, a), chart([[en(a), 2], [en(b), 1], [en(m), 1]], [], 1, o), comp(R)], n,
      [`Нули числителя: $${a}$ (кратности 2) и $${b}$; знаменатель обращается в нуль при $x = ${m}$. При переходе через $${a}$ знак не меняется. Ответ: $${ins(R)}$.`,
        `Алымының нөлдері: $${a}$ (еселігі 2) және $${b}$; бөлімі $x = ${m}$ болғанда нөлге айналады. $${a}$ нүктесі арқылы өткенде таңба өзгермейді. Жауабы: $${ins(R)}$.`])
  }),
  c(TR, n => {
    const p = rnd(-6, 3), r = p + rnd(2, 7), k = rnd(1, 9), o = pick(LE), f = poly([1, -(p + r), p * r])
    const R = chart([[en(p), 1], [en(r), 1]], [], 1, o), xs = intsOf(R), s = sum(xs)
    const other = sum(intsOf(chart([[en(p), 1], [en(r), 1]], [], 1, o === '<' ? '\\le' : '<')))
    return N(sumQ(`\\frac{${f}}{x^2 + ${k}} ${o} 0`), s, [other, -s, p + r, xs.length], n, '',
      [`Знаменатель $x^2 + ${k} > 0$ при всех $x$, поэтому $${f} ${o} 0$, корни $${p}$ и $${r}$. Целые решения: $${list(xs)}$, их сумма $${s}$.`,
        `Бөлімі барлық $x$ үшін $x^2 + ${k} > 0$, сондықтан $${f} ${o} 0$, түбірлері $${p}$ және $${r}$. Бүтін шешімдері: $${list(xs)}$, олардың қосындысы $${s}$.`])
  }),
  h(TR, n => {
    const a = rnd(-6, 6); let b = rnd(-6, 6); while (b === a) b = rnd(-6, 6)
    const o = pick(OPS), sg = Math.sign(a - b), R = chart([], [[en(a), 1], [en(b), 1]], sg, o), lo = Math.min(a, b), hi = Math.max(a, b)
    return TA(solveQ(`\\frac{1}{${xm(a)}} ${o} \\frac{1}{${xm(b)}}`), R, [chart([], [[en(a), 1], [en(b), 1]], -sg, o), seg(en(lo), en(hi), true, true), ray(en(hi), '>'), chart([[en(a), 1], [en(b), 1]], [], sg, o)], n,
      [`Перенесём всё в левую часть: $\\frac{1}{${xm(a)}} - \\frac{1}{${xm(b)}} = \\frac{${a - b}}{${prod([a, b])}} ${o} 0$. Числитель ${sg > 0 ? 'положителен, поэтому знак дроби совпадает со знаком' : 'отрицателен, поэтому знак дроби противоположен знаку'} знаменателя; точки $${a}$ и $${b}$ выколоты. Ответ: $${ins(R)}$.`,
        `Барлығын сол жаққа көшіреміз: $\\frac{1}{${xm(a)}} - \\frac{1}{${xm(b)}} = \\frac{${a - b}}{${prod([a, b])}} ${o} 0$. Алымы ${sg > 0 ? 'оң, сондықтан бөлшектің таңбасы бөлімінің таңбасымен бірдей' : 'теріс, сондықтан бөлшектің таңбасы бөлімінің таңбасына қарама-қарсы'}; $${a}$ және $${b}$ нүктелері шығарылады. Жауабы: $${ins(R)}$.`])
  }),

  // ---------- Иррациональные неравенства ----------
  c(TI, n => {
    const a = rnd(-6, 8), k = rnd(1, 5), o = pick(LE), cl = o === '\\le', R = seg(en(a), en(a + k * k), true, cl)
    return TA(solveQ(`\\sqrt{${xm(a)}} ${o} ${k}`), R, [[{ a: null, b: en(a + k * k), l: false, r: cl }], seg(en(a), en(a + k), true, cl), seg(en(a), en(a + k * k), false, cl), ray(en(a + k * k), '\\ge')], n,
      [`ОДЗ: $x \\ge ${a}$. Обе части неотрицательны, возводим в квадрат: $${xm(a)} ${o} ${k * k}$, $x ${o} ${a + k * k}$. С учётом ОДЗ: $${ins(R)}$.`,
        `Анықталу облысы: $x \\ge ${a}$. Екі жағы да теріс емес, квадраттаймыз: $${xm(a)} ${o} ${k * k}$, $x ${o} ${a + k * k}$. Анықталу облысын ескерсек: $${ins(R)}$.`])
  }),
  c(TI, n => {
    const p = rnd(3, 15), k = rnd(1, 3), o = pick(GE), xs = range(-300, p).filter(x => cmp(p - x - k * k, o)), a1 = Math.max(...xs)
    return N(maxQ(`\\sqrt{${p} - x} ${o} ${k}`), a1, [p - k, p, a1 + 1, a1 - 1], n, '',
      [`Обе части неотрицательны, возводим в квадрат: $${p} - x ${o} ${k * k}$, $x ${flip(o)} ${p - k * k}$; при этом $${p} - x > 0$, так что ОДЗ выполнена. Наибольшее целое решение: $${a1}$.`,
        `Екі жағы да теріс емес, квадраттаймыз: $${p} - x ${o} ${k * k}$, $x ${flip(o)} ${p - k * k}$; бұл жағдайда $${p} - x > 0$, яғни анықталу облысы ескерілген. Ең үлкен бүтін шешімі: $${a1}$.`])
  }),
  h(TI, n => {
    const b = rnd(-3, 4), t = rnd(1, 4), r = b + t, a = t * t - r, r2 = b + 1 - t, o = pick(GE), cl = o === '\\ge', o2: Op = cl ? '\\le' : '<'
    const R = build([en(-a), en(b), en(r), en(r2)], x => x + a >= 0 && (x - b < 0 || cmp(x + a - (x - b) ** 2, o)))
    const qd = poly([1, -(2 * b + 1), b * b - a]), case1 = -a < b
    return TA(solveQ(`\\sqrt{${xm(-a)}} ${o} ${xm(b)}`), R, [seg(en(r2), en(r), cl, cl), seg(en(b), en(r), true, cl), ray(en(-a), '\\ge'), [{ a: null, b: en(r), l: false, r: cl }]], n,
      [`ОДЗ: $x \\ge ${-a}$. ` + (case1 ? `1) Если $${xm(b)} < 0$, т. е. $${-a} \\le x < ${b}$, неравенство верно: корень неотрицателен. ` : `1) Случай $${xm(b)} < 0$ решений из ОДЗ не даёт. `) +
        `2) Если $x \\ge ${b}$, возводим в квадрат: $${xm(-a)} ${o} ${sq(b)}$, $${qd} ${o2} 0$, $${r2} ${o2} x ${o2} ${r}$; с условием $x \\ge ${b}$ получаем $${b} \\le x ${o2} ${r}$. Объединяя: $${ins(R)}$.`,
        `Анықталу облысы: $x \\ge ${-a}$. ` + (case1 ? `1) Егер $${xm(b)} < 0$, яғни $${-a} \\le x < ${b}$ болса, теңсіздік орындалады: түбір теріс емес. ` : `1) $${xm(b)} < 0$ жағдайы анықталу облысынан шешім бермейді. `) +
        `2) Егер $x \\ge ${b}$ болса, квадраттаймыз: $${xm(-a)} ${o} ${sq(b)}$, $${qd} ${o2} 0$, $${r2} ${o2} x ${o2} ${r}$; $x \\ge ${b}$ шартымен $${b} \\le x ${o2} ${r}$. Біріктірсек: $${ins(R)}$.`])
  }),
  h(TI, n => {
    const a = rnd(-6, 4), m = a + rnd(1, 6), o = pick(OPS)
    const R = build([en(a), en(m)], x => x >= a && cmp(Math.sign(x - m) * (x === a ? 0 : 1), o)), noDom = chart([[en(m), 1]], [], 1, o), A = ans(R)
    return TA(solveQ(`${fac(m)}\\sqrt{${xm(a)}} ${o} 0`), R, [noDom, inter(noDom, ray(en(a), '>')), inter(noDom, ray(en(a), '\\ge')), ray(en(a), '\\ge'), uni(noDom, [{ a: en(a), b: en(a), l: true, r: true }])], n,
      [`ОДЗ: $x \\ge ${a}$. При $x = ${a}$ левая часть равна нулю. При $x > ${a}$ корень положителен, и знак левой части совпадает со знаком $${xm(m)}$. Ответ: ${A[0]}.`,
        `Анықталу облысы: $x \\ge ${a}$. $x = ${a}$ болғанда сол жағы нөлге тең. $x > ${a}$ болғанда түбір оң, сондықтан сол жақтың таңбасы $${xm(m)}$ өрнегінің таңбасымен бірдей. Жауабы: ${A[1]}.`])
  }),
  c(TI, n => {
    const b = rnd(1, 10), a = b - rnd(2, 10), o = pick(OPS), m = ef(a + b, 2)
    const R = build([en(a), m, en(b)], x => x >= a && x <= b && cmp(x - a - (b - x), o)), dom = seg(en(a), en(b), true, true)
    return TA(solveQ(`\\sqrt{${xm(a)}} ${o} \\sqrt{${b} - x}`), R, [ray(m, o), dom, build([en(a), m, en(b)], x => inS(dom, x) && !inS(R, x)), inter(ray(m, o), ray(en(a), '>'))], n,
      [`ОДЗ: $${a} \\le x \\le ${b}$. Обе части неотрицательны, возводим в квадрат: $${xm(a)} ${o} ${b} - x$, $2x ${o} ${a + b}$, $x ${o} ${m.s}$. С учётом ОДЗ: $${ins(R)}$.`,
        `Анықталу облысы: $${a} \\le x \\le ${b}$. Екі жағы да теріс емес, квадраттаймыз: $${xm(a)} ${o} ${b} - x$, $2x ${o} ${a + b}$, $x ${o} ${m.s}$. Анықталу облысын ескерсек: $${ins(R)}$.`])
  }),
  c(TI, n => {
    const o = pick(LE), st = o === '<', b = rnd(-3, 4), t = st ? rnd(1, 4) : rnd(2, 4), r = b + t, a = t * t - r, r2 = b + 1 - t
    const xs = range(-a, 300).filter(x => (st ? x - b > 0 && x + a < (x - b) ** 2 : x - b >= 0 && x + a <= (x - b) ** 2)), a1 = Math.min(...xs)
    const g: Op = st ? '>' : '\\ge'
    return N(minQ(`\\sqrt{${xm(-a)}} ${o} ${xm(b)}`), a1, [r2, b + 1, st ? r : r + 1, a1 + 2, -a], n, '',
      [`Правая часть должна быть ${st ? 'положительной' : 'неотрицательной'}: $x ${g} ${b}$. Возводим в квадрат: $${xm(-a)} ${o} ${sq(b)}$, $${poly([1, -(2 * b + 1), b * b - a])} ${g} 0$, корни $${r2}$ и $${r}$. С учётом условия $x ${g} ${b}$ получаем $x ${g} ${r}$. Наименьшее целое решение: $${a1}$.`,
        `Оң жағы ${st ? 'оң' : 'теріс емес'} болуы керек: $x ${g} ${b}$. Квадраттаймыз: $${xm(-a)} ${o} ${sq(b)}$, $${poly([1, -(2 * b + 1), b * b - a])} ${g} 0$, түбірлері $${r2}$ және $${r}$. $x ${g} ${b}$ шартын ескерсек, $x ${g} ${r}$. Ең кіші бүтін шешімі: $${a1}$.`])
  }),

  // ---------- Показательные неравенства ----------
  c(TE, n => {
    const a = pick([2, 3, 5]), p = pick([2, 3, -1, -2]), q = rnd(-3, 3), m = a === 5 ? rnd(-2, 2) : rnd(-3, 3), o = pick(OPS)
    const X = ef(m - q, p), o2 = p > 0 ? o : flip(o)
    return TA(solveQ(`${a}^{${poly([p, q])}} ${o} ${pw(a, m)}`), ray(X, o2), [ray(X, flip(o2)), ray(ef(m + q, p), o2), ray(ef(q - m, p), o2), ray(X, o)], n,
      [`$${pw(a, m)} = ${a}^{${m}}$. Основание $${a} > 1$, поэтому $${poly([p, q])} ${o} ${m}$, $${mono(p)} ${o} ${m - q}$` + (p < 0 ? `; делим на $${p}$ и меняем знак` : '') + `: $x ${o2} ${X.s}$.`,
        `$${pw(a, m)} = ${a}^{${m}}$. Негізі $${a} > 1$, сондықтан $${poly([p, q])} ${o} ${m}$, $${mono(p)} ${o} ${m - q}$` + (p < 0 ? `; $${p}$ санына бөлеміз, таңба өзгереді` : '') + `: $x ${o2} ${X.s}$.`])
  }),
  c(TE, n => {
    const [p, q] = pick([[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [3, 5], [4, 5]]), a = rnd(-4, 5), b = rnd(1, 4), o = pick(OPS)
    const rhs = p === 1 ? `${q}^{${b}}` : `\\left(\\frac{${q}}{${p}}\\right)^{${b}}`, base = `\\left(\\frac{${p}}{${q}}\\right)`
    return TA(solveQ(`${base}^{${xm(a)}} ${o} ${rhs}`), ray(en(a - b), flip(o)), [ray(en(a - b), o), ray(en(a + b), flip(o)), ray(en(a + b), o)], n,
      [`$${rhs} = ${base}^{-${b}}$. Основание $\\frac{${p}}{${q}} < 1$, показательная функция убывает, поэтому знак неравенства меняется: $${xm(a)} ${flip(o)} -${b}$, $x ${flip(o)} ${a - b}$.`,
        `$${rhs} = ${base}^{-${b}}$. Негізі $\\frac{${p}}{${q}} < 1$, көрсеткіштік функция кемімелі, сондықтан теңсіздік таңбасы өзгереді: $${xm(a)} ${flip(o)} -${b}$, $x ${flip(o)} ${a - b}$.`])
  }),
  c(TE, n => {
    const a = pick([3, 5]), o = pick(LE), g = o === '<' ? 2 : 1, jm = a === 3 ? 3 : 2, i = rnd(0, jm - g), j = rnd(i + g, jm)
    const xs = range(i, j).filter(x => o === '\\le' || (x > i && x < j)), s = sum(xs)
    return N(sumQ(`${a}^{2x} - ${a ** i + a ** j} \\cdot ${a}^x + ${a ** (i + j)} ${o} 0`), s, [a ** i + a ** j, sum(range(i, j)), sum(range(i + 1, j - 1)), j, i + j + 1], n, '',
      [`Пусть $t = ${a}^x > 0$: $t^2 - ${a ** i + a ** j}t + ${a ** (i + j)} ${o} 0$, $${a ** i} ${o} t ${o} ${a ** j}$, то есть $${i} ${o} x ${o} ${j}$. Целые решения: $${list(xs)}$, их сумма $${s}$.`,
        `$t = ${a}^x > 0$ деп белгілейміз: $t^2 - ${a ** i + a ** j}t + ${a ** (i + j)} ${o} 0$, $${a ** i} ${o} t ${o} ${a ** j}$, яғни $${i} ${o} x ${o} ${j}$. Бүтін шешімдері: $${list(xs)}$, олардың қосындысы $${s}$.`])
  }),
  c(TE, n => {
    const a = pick([2, 3]), k = pick([1, 2]), sg = a === 2 && k === 1 ? 1 : pick([1, -1]), F = a ** k + sg, m = rnd(0, 3), C = F * a ** m, o = pick(OPS), pm = sg > 0 ? '+' : '-'
    return TA(solveQ(`${a}^{x + ${k}} ${pm} ${a}^x ${o} ${C}`), ray(en(m), o), [ray(en(m), flip(o)), ray(en(m + k), o), ray(en(m - k), o), ray(en(m + 1), o)], n,
      [`Вынесем $${a}^x$ за скобки: $${a}^x(${a}^{${k}} ${pm} 1) = ${F} \\cdot ${a}^x ${o} ${C}$, откуда $${a}^x ${o} ${a ** m}$, $x ${o} ${m}$.`,
        `$${a}^x$ көбейткішін жақша сыртына шығарамыз: $${a}^x(${a}^{${k}} ${pm} 1) = ${F} \\cdot ${a}^x ${o} ${C}$, бұдан $${a}^x ${o} ${a ** m}$, $x ${o} ${m}$.`])
  }),
  h(TE, n => {
    const [p, r] = two(-4, 4), a = pick([2, 3]), b = -(p + r), m = p * r, o = pick(OPS), E0 = poly([1, b, 0])
    const R = chart([[en(p), 1], [en(r), 1]], [], 1, flip(o))
    return TA(solveQ(`\\left(\\frac{1}{${a}}\\right)^{${E0}} ${o} ${a}^{${m}}`), R, [chart([[en(p), 1], [en(r), 1]], [], 1, o), chart([[en(-r), 1], [en(-p), 1]], [], 1, flip(o)), comp(R)], n,
      [`$\\left(\\frac{1}{${a}}\\right)^{${E0}} = ${a}^{-(${E0})}$. Основание $${a} > 1$: $-(${E0}) ${o} ${m}$, то есть $${poly([1, b, m])} ${flip(o)} 0$. Корни $${p}$ и $${r}$, ответ: $${ins(R)}$.`,
        `$\\left(\\frac{1}{${a}}\\right)^{${E0}} = ${a}^{-(${E0})}$. Негізі $${a} > 1$: $-(${E0}) ${o} ${m}$, яғни $${poly([1, b, m])} ${flip(o)} 0$. Түбірлері $${p}$ және $${r}$, жауабы: $${ins(R)}$.`])
  }),
  c(TE, n => {
    const [a, b] = pick([[2, 3], [2, 5], [3, 5], [2, 7]]), ab = a * b, m = rnd(-2, 2), o = pick(OPS)
    const rhs = m >= 0 ? String(ab ** m) : ab === 10 ? (m === -1 ? '0{,}1' : '0{,}01') : `\\frac{1}{${ab ** -m}}`
    return TA(solveQ(`${a}^x \\cdot ${b}^x ${o} ${rhs}`), ray(en(m), o), [ray(en(-m), o), ray(en(m), flip(o)), ray(en(m + 1), o), ray(en(-m), flip(o))], n,
      [`$${a}^x \\cdot ${b}^x = ${ab}^x$, $${rhs} = ${ab}^{${m}}$. Основание $${ab} > 1$, поэтому $x ${o} ${m}$.`,
        `$${a}^x \\cdot ${b}^x = ${ab}^x$, $${rhs} = ${ab}^{${m}}$. Негізі $${ab} > 1$, сондықтан $x ${o} ${m}$.`])
  }),

  // ---------- Логарифмические неравенства ----------
  c(TG, n => {
    const a = pick([2, 3, 5]), p = pick([2, 3]), q = rnd(-5, 5), m = rnd(0, a === 2 ? 4 : a === 3 ? 3 : 2), o = pick(LE), cl = o === '\\le'
    const lo = ef(-q, p), hi = ef(a ** m - q, p), R = seg(lo, hi, false, cl), f = poly([p, q])
    const ws: S[] = [[{ a: null, b: hi, l: false, r: cl }], seg(lo, hi, true, cl), ray(hi, cl ? '>' : '\\ge')]
    if (a * m !== a ** m && a * m > 0) ws.push(seg(lo, ef(a * m - q, p), false, cl))
    return TA(solveQ(`${lg(String(a), f)} ${o} ${m}`), R, ws, n,
      [`ОДЗ: $${f} > 0$, $x > ${lo.s}$. Основание $${a} > 1$: $${f} ${o} ${a}^{${m}} = ${a ** m}$, $x ${o} ${hi.s}$. С учётом ОДЗ: $${ins(R)}$.`,
        `Анықталу облысы: $${f} > 0$, $x > ${lo.s}$. Негізі $${a} > 1$: $${f} ${o} ${a}^{${m}} = ${a ** m}$, $x ${o} ${hi.s}$. Анықталу облысын ескерсек: $${ins(R)}$.`])
  }),
  h(TG, n => {
    const [a, p, r, k] = pick([[2, 1, 3, 3], [2, 3, 5, 4], [2, 2, 6, 5], [3, 1, 2, 1], [3, 4, 5, 2], [3, 3, 6, 3], [2, 7, 9, 5]]), o = pick(GE), o2: Op = o === '\\ge' ? '\\le' : '<', cl = o2 === '\\le'
    const R = build([-r, -p, p, r].map(en), x => x * x - p * p > 0 && cmp(x * x - r * r, o2))
    return TA(solveQ(`${lg(`\\frac{1}{${a}}`, `x^2 - ${p * p}`)} ${o} -${k}`), R, [seg(en(-r), en(r), cl, cl), chart([[en(-r), 1], [en(r), 1]], [], 1, flip(o2)), seg(en(p), en(r), false, cl), comp(R)], n,
      [`ОДЗ: $x^2 - ${p * p} > 0$. Основание $\\frac{1}{${a}} < 1$, знак неравенства меняется: $x^2 - ${p * p} ${o2} \\left(\\frac{1}{${a}}\\right)^{-${k}} = ${a ** k}$, то есть $x^2 ${o2} ${r * r}$. Вместе с ОДЗ: $${p * p} < x^2 ${o2} ${r * r}$, откуда $${ins(R)}$.`,
        `Анықталу облысы: $x^2 - ${p * p} > 0$. Негізі $\\frac{1}{${a}} < 1$, теңсіздік таңбасы өзгереді: $x^2 - ${p * p} ${o2} \\left(\\frac{1}{${a}}\\right)^{-${k}} = ${a ** k}$, яғни $x^2 ${o2} ${r * r}$. Анықталу облысымен бірге: $${p * p} < x^2 ${o2} ${r * r}$, бұдан $${ins(R)}$.`])
  }),
  h(TG, n => {
    const a = pick([2, 3, 5, 7]), b = rnd(-5, 3), m = b + rnd(1, 4), r = m + rnd(1, 4), M = (r - b) * (r - m), r2 = b + m - r, o = pick(OPS)
    const R = build([b, m, r, r2].map(en), x => x > m && cmp((x - b) * (x - m) - M, o)), noDom = chart([[en(r2), 1], [en(r), 1]], [], 1, o)
    return TA(solveQ(`${lg(String(a), xm(b))} + ${lg(String(a), xm(m))} ${o} \\log_{${a}} ${M}`), R, [noDom, inter(noDom, ray(en(b), '>')), ray(en(m), '>'), comp(R)], n,
      [`ОДЗ: $x > ${b}$ и $x > ${m}$, то есть $x > ${m}$. Сумма логарифмов равна логарифму произведения; основание $${a} > 1$: $${prod([b, m])} ${o} ${M}$, $${poly([1, -(b + m), b * m - M])} ${o} 0$, корни $${r2}$ и $${r}$. С учётом ОДЗ: $${ins(R)}$.`,
        `Анықталу облысы: $x > ${b}$ және $x > ${m}$, яғни $x > ${m}$. Логарифмдердің қосындысы көбейтіндінің логарифміне тең; негізі $${a} > 1$: $${prod([b, m])} ${o} ${M}$, $${poly([1, -(b + m), b * m - M])} ${o} 0$, түбірлері $${r2}$ және $${r}$. Анықталу облысын ескерсек: $${ins(R)}$.`])
  }),
  c(TG, n => {
    const [bs, dir] = pick([['2', 1], ['3', 1], ['0{,}5', -1], ['\\frac{1}{3}', -1]] as [string, number][]), o = pick(GE), o2 = dir > 0 ? o : flip(o)
    let p = 0, q = 0; while (p + q < 4) { p = rnd(-3, 4); q = rnd(1, 8) }
    const R = build([en(-p), ef(q - p, 2), en(q)], x => x > -p && x < q && cmp(dir * (2 * x + p - q), o)), k = intsOf(R).length
    const half = build([en(-p), ef(q - p, 2), en(q)], x => x > -p && x < q && !inS(R, x))
    return N(cntQ(`${lg(bs, xm(-p))} ${o} ${lg(bs, `${q} - x`)}`), k, [k + 1, k - 1, q + p - 1, intsOf(half).length], n, '',
      [`ОДЗ: $${-p} < x < ${q}$. ` + (dir > 0 ? 'Основание больше 1, знак сохраняется' : 'Основание меньше 1, знак меняется') + `: $${xm(-p)} ${o2} ${q} - x$, $x ${o2} ${frac(q - p, 2)}$. Решение: $${ins(R)}$, целых решений $${k}$.`,
        `Анықталу облысы: $${-p} < x < ${q}$. ` + (dir > 0 ? 'Негізі 1-ден үлкен, таңба сақталады' : 'Негізі 1-ден кіші, таңба өзгереді') + `: $${xm(-p)} ${o2} ${q} - x$, $x ${o2} ${frac(q - p, 2)}$. Шешімі: $${ins(R)}$, бүтін шешімдер саны $${k}$.`])
  }),
  c(TG, n => {
    const a = pick([2, 3]), o = pick(OPS), jm = a === 2 ? 3 : 2, i = rnd(-1, 1), j = rnd(i + 1, jm)
    const Ei = i < 0 ? ef(1, a ** -i) : en(a ** i), Ej = en(a ** j)
    const t = (x: number) => (x === Ei.v ? i : x === Ej.v ? j : Math.log(x) / Math.log(a))
    const R = build([en(0), Ei, Ej], x => x > 0 && cmp((t(x) - i) * (t(x) - j), o)), L0 = `\\log_{${a}}`
    return TA(solveQ(`${L0}^2 x${tm(-(i + j), `${L0} x`)}${tc(i * j)} ${o} 0`), R, [chart([[en(i), 1], [en(j), 1]], [], 1, o), chart([[Ei, 1], [Ej, 1]], [], 1, o), seg(en(0), Ej, false, true), comp(R)], n,
      [`Пусть $t = ${L0} x$, где $x > 0$: $t^2${tm(-(i + j), 't')}${tc(i * j)} ${o} 0$, корни $t = ${i}$ и $t = ${j}$. Возвращаемся к $x$ (основание $${a} > 1$, $x > 0$): $${ins(R)}$.`,
        `$t = ${L0} x$ деп белгілейміз, мұнда $x > 0$: $t^2${tm(-(i + j), 't')}${tc(i * j)} ${o} 0$, түбірлері $t = ${i}$ және $t = ${j}$. $x$ айнымалысына қайта ораламыз (негізі $${a} > 1$, $x > 0$): $${ins(R)}$.`])
  }),
  c(TG, n => {
    const [bs, dir] = pick([['2', 1], ['5', 1], ['0{,}5', -1], ['\\frac{1}{3}', -1]] as [string, number][]), o = pick(GE), p = pick([2, 3])
    let X = 0, s = 0, q = 0, R: S = []
    do {
      X = rnd(1, 6); s = rnd(0, 5); q = (p - 1) * X - s
      R = build([en(X), ef(q, p), en(-s)], x => p * x - q > 0 && x + s > 0 && cmp(dir * (p * x - q - x - s), o))
    } while (!intsOf(R).length)
    const xs = intsOf(R), f = poly([p, -q]), Q0 = `${lg(bs, f)} ${o} ${lg(bs, xm(-s))}`
    if (dir > 0) {
      const a1 = Math.min(...xs)
      return N(minQ(Q0), a1, [X, X + 1, X - 1, a1 + 2], n, '',
        [`Основание больше 1: $${f} ${o} ${xm(-s)}$, $${mono(p - 1)} ${o} ${(p - 1) * X}$, $x ${o} ${X}$; при таких $x$ оба логарифма определены. Наименьшее целое решение: $${a1}$.`,
          `Негізі 1-ден үлкен: $${f} ${o} ${xm(-s)}$, $${mono(p - 1)} ${o} ${(p - 1) * X}$, $x ${o} ${X}$; мұндай $x$ үшін екі логарифм де анықталған. Ең кіші бүтін шешімі: $${a1}$.`])
    }
    const D = q / p > -s ? ef(q, p) : en(-s), k = xs.length
    return N(cntQ(Q0), k, [k + 1, k - 1, X + s, k + 2], n, '',
      [`ОДЗ: $${f} > 0$ и $${xm(-s)} > 0$, то есть $x > ${D.s}$. Основание меньше 1, знак меняется: $${f} ${flip(o)} ${xm(-s)}$, $x ${flip(o)} ${X}$. Решение: $${ins(R)}$, целых решений $${k}$.`,
        `Анықталу облысы: $${f} > 0$ және $${xm(-s)} > 0$, яғни $x > ${D.s}$. Негізі 1-ден кіші, таңба өзгереді: $${f} ${flip(o)} ${xm(-s)}$, $x ${flip(o)} ${X}$. Шешімі: $${ins(R)}$, бүтін шешімдер саны $${k}$.`])
  }),

  // ---------- Системы неравенств ----------
  c(TS, n => {
    const u = rnd(-6, 3), v = u + rnd(1, 6)
    const mk = (bound: number, lower: boolean) => {
      const a = pick([-4, -3, -2, -1, 1, 2, 3, 4]), b = rnd(-8, 8), o0: Op = lower ? pick(GE) : pick(LE), o = a > 0 ? o0 : flip(o0)
      return { s: `${poly([a, b])} ${o} ${a * bound + b}`, o0 }
    }
    const L1 = mk(u, true), U1 = mk(v, false), lc = L1.o0 === '\\ge', rc = U1.o0 === '\\le', R = seg(en(u), en(v), lc, rc)
    return TA(sysQ(coin() ? sys(L1.s, U1.s) : sys(U1.s, L1.s)), R, [[{ a: null, b: en(u), l: false, r: !lc }], ray(en(v), flip(U1.o0)), [{ a: null, b: en(v), l: false, r: rc }], ray(en(u), L1.o0)], n,
      [`Решим каждое неравенство (при делении на отрицательное число знак меняется): $x ${L1.o0} ${u}$ и $x ${U1.o0} ${v}$. Пересечение: $${ins(R)}$.`,
        `Әр теңсіздікті шешеміз (теріс санға бөлгенде таңба өзгереді): $x ${L1.o0} ${u}$ және $x ${U1.o0} ${v}$. Қиылысуы: $${ins(R)}$.`])
  }),
  c(TS, n => {
    const k1 = rnd(2, 5), k2 = rnd(2, 5), m1 = rnd(-15, 5), L0 = m1 / k1, m2 = Math.ceil((L0 + 1.5 + rnd(0, 5)) * k2), b1 = rnd(-6, 6), b2 = rnd(-6, 6)
    const o1 = pick(GE), o2 = pick(LE), R = seg(ef(m1, k1), ef(m2, k2), o1 === '\\ge', o2 === '\\le'), xs = intsOf(R)
    const wide = intsOf(seg(ef(m1, k1), ef(m2, k2), true, true)).length
    return N(sysCnt(sys(`${poly([k1, b1])} ${o1} ${m1 + b1}`, `${poly([-k2, b2])} ${flip(o2)} ${b2 - m2}`)), xs.length, [xs.length + 1, xs.length - 1, wide + 1, xs.length + 2], n, '',
      [`Из первого неравенства $x ${o1} ${frac(m1, k1)}$, из второго (делим на $${-k2}$ и меняем знак) $x ${o2} ${frac(m2, k2)}$. Решение системы: $${ins(R)}$; целые решения: $${list(xs)}$ — всего $${xs.length}$.`,
        `Бірінші теңсіздіктен $x ${o1} ${frac(m1, k1)}$, екіншісінен ($${-k2}$ санына бөліп, таңбаны өзгертеміз) $x ${o2} ${frac(m2, k2)}$. Жүйенің шешімі: $${ins(R)}$; бүтін шешімдері: $${list(xs)}$ — барлығы $${xs.length}$.`])
  }),
  c(TS, n => {
    const p = rnd(-6, 2), r = p + rnd(3, 8), k = rnd(p + 1, r - 1), m = rnd(2, 4), b = rnd(-5, 5), o1 = pick(LE), o = pick(OPS)
    const A = chart([[en(p), 1], [en(r), 1]], [], 1, o1), Bs = ray(en(k), o), R = inter(A, Bs)
    return TA(sysQ(sys(`${poly([1, -(p + r), p * r])} ${o1} 0`, `${poly([m, b])} ${o} ${m * k + b}`)), R, [A, inter(A, comp(Bs)), inter(chart([[en(p), 1], [en(r), 1]], [], 1, flip(o1)), Bs), uni(A, Bs)], n,
      [`Первое неравенство: $${ins(A)}$. Второе: $${mono(m)} ${o} ${m * k}$, $x ${o} ${k}$. Пересечение: $${ins(R)}$.`,
        `Бірінші теңсіздік: $${ins(A)}$. Екіншісі: $${mono(m)} ${o} ${m * k}$, $x ${o} ${k}$. Қиылысуы: $${ins(R)}$.`])
  }),
  h(TS, n => {
    let p = 0, r = 0, a = 0, b = 0, o2: Op = '<', A: S = [], Bs: S = [], R: S = []
    do {
      p = rnd(-5, 1); r = p + rnd(4, 8); a = rnd(p - 1, r + 1); b = rnd(p - 1, r + 1); o2 = pick(OPS)
      A = chart([[en(p), 1], [en(r), 1]], [], 1, '\\le'); Bs = chart([[en(a), 1]], [[en(b), 1]], 1, o2); R = inter(A, Bs)
    } while (a === b || !intsOf(R).length)
    const xs = intsOf(R), s = sum(xs)
    return N(sysSum(sys(`${poly([1, -(p + r), p * r])} \\le 0`, `\\frac{${xm(a)}}{${xm(b)}} ${o2} 0`)), s, [sum(intsOf(A)), sum(intsOf(inter(A, chart([[en(a), 1], [en(b), 1]], [], 1, o2)))), sum(intsOf(inter(A, comp(Bs)))), s + b], n, '',
      [`Первое неравенство: $${ins(A)}$. Второе (метод интервалов, $x \\ne ${b}$): $${ins(Bs)}$. Пересечение: $${ins(R)}$; целые решения: $${list(xs)}$, их сумма $${s}$.`,
        `Бірінші теңсіздік: $${ins(A)}$. Екіншісі (интервалдар әдісі, $x \\ne ${b}$): $${ins(Bs)}$. Қиылысуы: $${ins(R)}$; бүтін шешімдері: $${list(xs)}$, олардың қосындысы $${s}$.`])
  }),
  c(TS, n => {
    let a = 2, u = 0, bb = 2, m = 1, s = 0, U = 0, o1: Op = '>', o2: Op = '<', R: S = []
    do {
      a = pick([2, 3]); u = rnd(-3, 1); bb = pick([2, 3]); m = rnd(1, bb === 2 ? 3 : 2); s = rnd(0, 3); U = bb ** m - s; o1 = pick(GE); o2 = pick(LE)
      R = inter(ray(en(u), o1), seg(en(-s), en(U), false, o2 === '\\le'))
    } while (!intsOf(R).length)
    const k = intsOf(R).length, noDom = intsOf(inter(ray(en(u), o1), [{ a: null, b: en(U), l: false, r: o2 === '\\le' }])).length
    return N(sysCnt(sys(`${a}^x ${o1} ${pw(a, u)}`, `${lg(String(bb), xm(-s))} ${o2} ${m}`)), k, [noDom, k + 1, k - 1, k + 2], n, '',
      [`Первое: $${a}^x ${o1} ${a}^{${u}}$, $x ${o1} ${u}$. Второе: $0 < ${xm(-s)} ${o2} ${bb}^{${m}} = ${bb ** m}$, то есть $${-s} < x ${o2} ${U}$. Решение системы: $${ins(R)}$, целых решений $${k}$.`,
        `Біріншісі: $${a}^x ${o1} ${a}^{${u}}$, $x ${o1} ${u}$. Екіншісі: $0 < ${xm(-s)} ${o2} ${bb}^{${m}} = ${bb ** m}$, яғни $${-s} < x ${o2} ${U}$. Жүйенің шешімі: $${ins(R)}$, бүтін шешімдер саны $${k}$.`])
  }),
  c(TS, n => {
    const l = rnd(-6, 2), a0 = pick([-3, -2, -1, 1, 2, 3]), b0 = rnd(-6, 6), o0: Op = pick(GE), oo0 = a0 > 0 ? o0 : flip(o0)
    const k1 = rnd(2, 5), k2 = rnd(2, 5), m1 = Math.ceil((l + 1.5 + rnd(0, 4)) * k1), m2 = Math.ceil((l + 1.5 + rnd(0, 4)) * k2)
    const b1 = rnd(-6, 6), b2 = rnd(-6, 6), o1 = pick(LE), o2 = pick(LE)
    const xs = range(-300, 300).filter(x => cmp(a0 * (x - l), oo0) && cmp(k1 * x - m1, o1) && cmp(m2 - k2 * x, flip(o2))), a1 = Math.max(...xs)
    const U1 = m1 / k1, U2 = m2 / k2
    const R = seg(en(l), U1 < U2 ? ef(m1, k1) : ef(m2, k2), o0 === '\\ge', U1 < U2 ? o1 === '\\le' : U2 < U1 ? o2 === '\\le' : o1 === '\\le' && o2 === '\\le')
    return N(sysMax(sys(`${poly([a0, b0])} ${oo0} ${a0 * l + b0}`, `${poly([k1, b1])} ${o1} ${m1 + b1}`, `${poly([-k2, b2])} ${flip(o2)} ${b2 - m2}`)), a1, [a1 + 1, a1 - 1, Math.floor(Math.max(U1, U2)), l + 1], n, '',
      [`Решения неравенств: $x ${o0} ${l}$, $x ${o1} ${frac(m1, k1)}$, $x ${o2} ${frac(m2, k2)}$. Из двух верхних границ берём меньшую: $${ins(R)}$. Наибольшее целое решение: $${a1}$.`,
        `Теңсіздіктердің шешімдері: $x ${o0} ${l}$, $x ${o1} ${frac(m1, k1)}$, $x ${o2} ${frac(m2, k2)}$. Екі жоғарғы шекараның кішісін аламыз: $${ins(R)}$. Ең үлкен бүтін шешімі: $${a1}$.`])
  }),
]
