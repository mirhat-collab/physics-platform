// Чертежи пространственных тел для задач «на готовых чертежах»: точки
// задаются в пространстве (x — вправо, y — вглубь, z — вверх) и рисуются во
// фронтальной косоугольной проекции, как в учебниках. Невидимые линии —
// пунктиром. Рисунок сам подгоняется под размер.

export type P3 = [number, number, number]
type P2 = [number, number]

const K = 0.5, ANG = (35 * Math.PI) / 180
const proj = ([x, y, z]: P3): P2 => [x + K * y * Math.cos(ANG), -(z + K * y * Math.sin(ANG))]

const ACC = 'var(--accent, #8b7cf6)'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export type Seg = { a: P3; b: P3; dashed?: boolean; accent?: boolean }
export type Solid = {
  segs: Seg[]
  // Окружности в горизонтальной плоскости: задняя половина — пунктиром (если back)
  circles?: { c: P3; r: number; back?: 'dashed' | 'solid'; accent?: boolean }[]
  // Контур шара (окружность на экране)
  sphere?: { c: P3; r: number }
  points?: { at: P3; name: string; dx?: number; dy?: number }[]
  labels?: { a: P3; b: P3; text: string; dx?: number; dy?: number }[]
  fill?: P3[] // закрашенный многоугольник (сечение)
}

const circlePts = (c: P3, r: number, from: number, to: number): P3[] =>
  Array.from({ length: 33 }, (_, i) => { const t = from + ((to - from) * i) / 32; return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t), c[2]] as P3 })

export function drawSolid(s: Solid, W = 260, H = 220): string {
  // Все точки для подгонки масштаба
  const all: P2[] = []
  for (const g of s.segs) all.push(proj(g.a), proj(g.b))
  for (const c of s.circles ?? []) all.push(...circlePts(c.c, c.r, 0, 2 * Math.PI).map(proj))
  if (s.sphere) { const [x, y] = proj(s.sphere.c); all.push([x - s.sphere.r, y - s.sphere.r], [x + s.sphere.r, y + s.sphere.r]) }
  const xs = all.map(p => p[0]), ys = all.map(p => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const pad = 26, sc = Math.min((W - 2 * pad) / (x1 - x0 || 1), (H - 2 * pad) / (y1 - y0 || 1))
  const ox = (W - sc * (x1 - x0)) / 2 - sc * x0, oy = (H - sc * (y1 - y0)) / 2 - sc * y0
  const to = (p: P3): P2 => { const [x, y] = proj(p); return [ox + sc * x, oy + sc * y] }
  const f = (n: number) => n.toFixed(1)
  const stroke = (accent?: boolean, dashed?: boolean) =>
    `stroke="${accent ? ACC : 'currentColor'}" stroke-width="${accent ? 2.2 : 1.5}" ${dashed ? 'stroke-dasharray="5 4"' : ''} fill="none"`
  const path = (pts: P3[], accent?: boolean, dashed?: boolean) =>
    `<path d="${pts.map((p, i) => { const [x, y] = to(p); return `${i ? 'L' : 'M'}${f(x)},${f(y)}` }).join(' ')}" ${stroke(accent, dashed)}/>`

  let b = ''
  if (s.fill) b += `<polygon points="${s.fill.map(p => to(p).map(f).join(',')).join(' ')}" fill="${ACC}" fill-opacity="0.18" stroke="none"/>`
  if (s.sphere) { const [x, y] = to(s.sphere.c); b += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s.sphere.r * sc)}" ${stroke()}/>` }
  for (const c of s.circles ?? []) {
    // Ближняя половина (y < 0) — сплошная, дальняя — как задано
    b += path(circlePts(c.c, c.r, Math.PI, 2 * Math.PI), c.accent)
    b += path(circlePts(c.c, c.r, 0, Math.PI), c.accent, (c.back ?? 'dashed') === 'dashed')
  }
  for (const g of s.segs) b += path([g.a, g.b], g.accent, g.dashed)
  // Подписи длин — у середины отрезка
  for (const l of s.labels ?? []) {
    const [ax, ay] = to(l.a), [bx, by] = to(l.b)
    b += `<text x="${f((ax + bx) / 2 + (l.dx ?? 0))}" y="${f((ay + by) / 2 + (l.dy ?? 0) + 4)}" text-anchor="middle" fill="currentColor" font-weight="700">${esc(l.text)}</text>`
  }
  for (const p of s.points ?? []) {
    const [x, y] = to(p.at)
    b += `<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="currentColor"/>`
    b += `<text x="${f(x + (p.dx ?? -10))}" y="${f(y + (p.dy ?? -6))}" text-anchor="middle" fill="currentColor" font-weight="700" font-size="12">${esc(p.name)}</text>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block" font-family="inherit" font-size="12">${b}</svg>`
}

// ---------- Готовые тела ----------

// Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ (D — дальний левый угол основания)
export function boxPts(a: number, b: number, c: number) {
  const A: P3 = [0, 0, 0], B: P3 = [a, 0, 0], C: P3 = [a, b, 0], D: P3 = [0, b, 0]
  const up = (p: P3): P3 => [p[0], p[1], c]
  return { A, B, C, D, A1: up(A), B1: up(B), C1: up(C), D1: up(D) }
}
export function boxSegs(p: ReturnType<typeof boxPts>): Seg[] {
  const { A, B, C, D, A1, B1, C1, D1 } = p
  return [
    { a: A, b: B }, { a: B, b: C }, { a: C, b: D, dashed: true }, { a: D, b: A, dashed: true },
    { a: A1, b: B1 }, { a: B1, b: C1 }, { a: C1, b: D1 }, { a: D1, b: A1 },
    { a: A, b: A1 }, { a: B, b: B1 }, { a: C, b: C1 }, { a: D, b: D1, dashed: true },
  ]
}
export const boxNames = (p: ReturnType<typeof boxPts>) => [
  { at: p.A, name: 'A', dx: -8, dy: 12 }, { at: p.B, name: 'B', dx: 8, dy: 12 }, { at: p.C, name: 'C', dx: 10, dy: 4 }, { at: p.D, name: 'D', dx: -10, dy: -4 },
  { at: p.A1, name: 'A₁', dx: -12, dy: 0 }, { at: p.B1, name: 'B₁', dx: 12, dy: 4 }, { at: p.C1, name: 'C₁', dx: 10, dy: -6 }, { at: p.D1, name: 'D₁', dx: -8, dy: -8 },
]

// Правильная четырёхугольная пирамида SABCD с центром основания O и
// серединой M ребра AB
export function quadPyramid(a: number, h: number) {
  const A: P3 = [0, 0, 0], B: P3 = [a, 0, 0], C: P3 = [a, a, 0], D: P3 = [0, a, 0]
  const O: P3 = [a / 2, a / 2, 0], S: P3 = [a / 2, a / 2, h], M: P3 = [a / 2, 0, 0]
  const segs: Seg[] = [
    { a: A, b: B }, { a: B, b: C }, { a: C, b: D, dashed: true }, { a: D, b: A, dashed: true },
    { a: S, b: A }, { a: S, b: B }, { a: S, b: C }, { a: S, b: D, dashed: true },
    { a: S, b: O, dashed: true },
  ]
  const points = [
    { at: S, name: 'S', dx: 0, dy: -8 }, { at: A, name: 'A', dx: -8, dy: 12 }, { at: B, name: 'B', dx: 8, dy: 12 },
    { at: C, name: 'C', dx: 10, dy: 2 }, { at: D, name: 'D', dx: -10, dy: -2 }, { at: O, name: 'O', dx: 8, dy: 12 },
  ]
  return { A, B, C, D, O, S, M, segs, points }
}

// Правильная треугольная пирамида SABC с центром основания O
export function triPyramid(a: number, h: number) {
  const A: P3 = [0, 0, 0], B: P3 = [a, 0, 0], C: P3 = [a / 2, (a * Math.sqrt(3)) / 2, 0]
  const O: P3 = [a / 2, (a * Math.sqrt(3)) / 6, 0], S: P3 = [O[0], O[1], h]
  const segs: Seg[] = [
    { a: A, b: B }, { a: B, b: C, dashed: true }, { a: C, b: A, dashed: true },
    { a: S, b: A }, { a: S, b: B }, { a: S, b: C }, { a: S, b: O, dashed: true },
  ]
  const points = [
    { at: S, name: 'S', dx: 0, dy: -8 }, { at: A, name: 'A', dx: -8, dy: 12 }, { at: B, name: 'B', dx: 8, dy: 12 },
    { at: C, name: 'C', dx: 10, dy: -2 }, { at: O, name: 'O', dx: 8, dy: 12 },
  ]
  return { A, B, C, O, S, segs, points }
}

// Конус с вершиной S, центром основания O и точкой B на окружности основания
export function cone(r: number, h: number) {
  const O: P3 = [0, 0, 0], S: P3 = [0, 0, h], L: P3 = [-r, 0, 0], B: P3 = [r, 0, 0]
  return {
    O, S, B,
    solid: {
      segs: [{ a: S, b: L }, { a: S, b: B }, { a: S, b: O, dashed: true }, { a: O, b: B, accent: true }],
      circles: [{ c: O, r }],
      points: [{ at: S, name: 'S', dx: 0, dy: -8 }, { at: O, name: 'O', dx: -8, dy: 14 }, { at: B, name: 'B', dx: 10, dy: 4 }],
    } as Solid,
  }
}
