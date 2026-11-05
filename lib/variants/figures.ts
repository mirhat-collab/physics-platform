// Рисунки к готовым вариантам ЕНТ. Данные на рисунках подобраны так, чтобы
// совпадать с ответами заданий. Цвета — currentColor и var(--accent), как у
// рисунков шаблонов, поэтому подстраиваются под тему.
import { plot, type Pt } from '../templates/figures'

const ACC = 'var(--accent, #8b7cf6)'
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;display:block" font-family="inherit" font-size="12">${body}</svg>`
const text = (x: number, y: number, s: string, anchor = 'middle', extra = '') =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" fill="currentColor" ${extra}>${s}</text>`
const line = (a: Pt, b: Pt, extra = 'stroke="currentColor" stroke-width="1.5"') =>
  `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" ${extra}/>`
const dot = ([x, y]: Pt, fill = 'currentColor') => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="${fill}"/>`
const bold = 'font-weight="700"'

const sine = (amp: number, period: number, to: number): Pt[] =>
  Array.from({ length: 121 }, (_, i) => { const t = (to * i) / 120; return [t, amp * Math.sin((2 * Math.PI * t) / period)] as Pt })

// Вольт-амперная характеристика газового разряда: OA — закон Ома,
// AB — переход к насыщению, BC — ток насыщения, CD — самостоятельный разряд
export function gasDischarge(): string {
  const O: Pt = [44, 196], A: Pt = [110, 120], B: Pt = [168, 92], C: Pt = [246, 90], D: Pt = [282, 22]
  let b = line([O[0], O[1]], [300, O[1]]) + `<path d="M300,${O[1]} l-7,-4 v8 z" fill="currentColor"/>`
  b += line([O[0], O[1]], [O[0], 14]) + `<path d="M${O[0]},14 l-4,7 h8 z" fill="currentColor"/>`
  b += `<path d="M${O.join(',')} L${A.join(',')} Q${140},${94} ${B.join(',')} L${C.join(',')} Q${266},${86} ${D.join(',')}" fill="none" stroke="${ACC}" stroke-width="2.5" stroke-linejoin="round"/>`
  for (const p of [A, B, C, D]) b += dot(p)
  b += text(O[0] - 8, O[1] + 14, 'O', 'middle', bold) + text(A[0] + 10, A[1] + 14, 'A', 'start', bold)
  b += text(B[0] - 4, B[1] - 9, 'B', 'middle', bold) + text(C[0] + 4, C[1] + 16, 'C', 'middle', bold)
  b += text(D[0] + 9, D[1] + 4, 'D', 'start', bold)
  b += text(296, O[1] - 8, 'U', 'end', 'font-style="italic"') + text(O[0] + 8, 22, 'I', 'start', 'font-style="italic"')
  return svg(320, 220, b)
}

// p–T: 1 → 2 при постоянном давлении, 2 → 3 — давление растёт в 1,5 раза
export function isoPT(): string {
  const p1: Pt = [200, 200], p2: Pt = [400, 200], p3: Pt = [200, 300]
  return plot({
    x: [0, 500, 100], y: [0, 400, 100], xLabel: 'T, К', yLabel: 'p, кПа',
    lines: [{ pts: [p1, p2] }, { pts: [p2, p3] }], dots: [p1, p2, p3],
    marks: [{ at: p1, label: '1' }, { at: p2, label: '2' }, { at: p3, label: '3' }],
  })
}

// x(t) с амплитудой 10 см и периодом 2 с
export function harmonic(): string {
  return plot({ x: [0, 4, 0.5], y: [-15, 15, 5], xLabel: 't, с', yLabel: 'x, см', lines: [{ pts: sine(10, 2, 4) }] })
}

// Колебания точки поверхности воды: период 2 с
export function waterWave(): string {
  return plot({ x: [0, 6, 1], y: [-3, 3, 1], xLabel: 't, с', yLabel: 'x, см', lines: [{ pts: sine(2, 2, 6) }] })
}

// F(x) пружины: 4 Н при 8 см
export function springLaw(): string {
  return plot({ x: [0, 10, 2], y: [0, 5, 1], xLabel: 'x, см', yLabel: 'F, Н', lines: [{ pts: [[0, 0], [8, 4]] }], dots: [[2, 1], [4, 2], [6, 3], [8, 4]] })
}

// V–T: 1 → 2 → 3, давление p ~ T/V: 1 — 100, 2 — 50, 3 — 80 (в условных единицах)
export function cycleVT(): string {
  const a: Pt = [300, 3], b: Pt = [400, 8], c: Pt = [200, 2.5]
  return plot({
    x: [0, 500, 100], y: [0, 9, 1], xLabel: 'T, К', yLabel: 'V, л',
    lines: [{ pts: [a, b] }, { pts: [b, c] }], dots: [a, b, c],
    marks: [{ at: a, label: '1' }, { at: b, label: '2' }, { at: c, label: '3' }],
  })
}

// Тетрадный лист со стрелками и линза над ним: в линзе клетки и стрелка
// вдвое больше (увеличение 2, изображение прямое)
export function lensGrid(): string {
  const c = 20, W = 15 * c, H = 9 * c, cx = 10 * c, cy = 4.5 * c, R = 3.4 * c
  let paper = ''
  for (let i = 0; i <= 15; i++) paper += line([i * c, 0], [i * c, H], 'stroke="currentColor" stroke-opacity="0.2"')
  for (let j = 0; j <= 9; j++) paper += line([0, j * c], [W, j * c], 'stroke="currentColor" stroke-opacity="0.2"')
  // Стрелка длиной 2 клетки (1 см)
  const arrow = (x: number, y: number, len: number, w: number) =>
    `<line x1="${x}" y1="${y}" x2="${x + len - w * 4}" y2="${y}" stroke="${ACC}" stroke-width="${w}"/><path d="M${x + len},${y} l-${w * 5},-${w * 2.6} v${w * 5.2} z" fill="${ACC}"/>`
  let outside = ''
  for (const [x, y] of [[1, 2], [1, 4], [1, 6], [4, 3], [4, 5]]) outside += arrow(x * c, y * c, 2 * c, 2.5)
  // В линзе — то же место листа, увеличенное в 2 раза относительно центра
  const k = 2
  let inside = ''
  for (let i = -6; i <= 6; i++) {
    inside += line([cx + i * c * k - 0.5 * c * k, cy - R], [cx + i * c * k - 0.5 * c * k, cy + R], 'stroke="currentColor" stroke-opacity="0.2"')
    inside += line([cx - R, cy + i * c * k], [cx + R, cy + i * c * k], 'stroke="currentColor" stroke-opacity="0.2"')
  }
  inside += arrow(cx - 1.5 * c * k, cy, 2 * c * k, 5)
  return svg(W, H,
    `<defs><clipPath id="lens-in"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>` +
    `<rect width="${W}" height="${H}" fill="currentColor" fill-opacity="0.03"/>` + paper + outside +
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--bg, #fff)"/>` +
    `<g clip-path="url(#lens-in)">${inside}</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${ACC}" fill-opacity="0.06" stroke="currentColor" stroke-width="3"/>`)
}

// Конус: высота 4, радиус основания 3
export function cone(): string {
  const cx = 130, top = 24, base = 184, rx = 84, ry = 22
  let b = `<path d="M${cx - rx},${base} L${cx},${top} L${cx + rx},${base}" fill="none" stroke="currentColor" stroke-width="2"/>`
  b += `<path d="M${cx - rx},${base} A${rx},${ry} 0 0 0 ${cx + rx},${base}" fill="none" stroke="currentColor" stroke-width="2"/>`
  b += `<path d="M${cx - rx},${base} A${rx},${ry} 0 0 1 ${cx + rx},${base}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>`
  b += line([cx, top], [cx, base], `stroke="${ACC}" stroke-width="2" stroke-dasharray="5 4"`)
  b += line([cx, base], [cx + rx, base], `stroke="${ACC}" stroke-width="2"`)
  b += `<path d="M${cx},${base - 10} h10 v10" fill="none" stroke="currentColor" stroke-width="1.2"/>` + dot([cx, base])
  b += text(cx - 8, (top + base) / 2, '4', 'end', bold) + text(cx + rx / 2, base - 7, '3', 'middle', bold)
  return svg(260, 220, b)
}

// Треугольник ABC: ∠A = 50°, ∠C = 65°, β — внешний угол при вершине B
export function exteriorAngle(): string {
  const A: Pt = [40, 170], B: Pt = [200, 170], C: Pt = [142.8, 47.4], D: Pt = [272, 170]
  let b = `<polygon points="${[A, B, C].map(p => p.join(',')).join(' ')}" fill="${ACC}" fill-opacity="0.1" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`
  b += line(B, D, 'stroke="currentColor" stroke-width="2"')
  const arc = (o: Pt, r: number, a1: number, a2: number) => {
    const p = (a: number) => `${(o[0] + r * Math.cos((a * Math.PI) / 180)).toFixed(1)},${(o[1] - r * Math.sin((a * Math.PI) / 180)).toFixed(1)}`
    return `<path d="M${p(a1)} A${r},${r} 0 0 0 ${p(a2)}" fill="none" stroke="${ACC}" stroke-width="2"/>`
  }
  b += arc(A, 26, 0, 50) + arc(C, 22, 230, 295) + arc(B, 22, 0, 115)
  b += text(A[0] + 36, A[1] - 9, '50°') + text(C[0] + 2, C[1] + 38, '65°')
  b += text(B[0] + 22, B[1] - 26, 'β', 'middle', 'font-weight="700" font-style="italic" font-size="14"')
  b += text(A[0] - 8, A[1] + 16, 'A', 'middle', bold) + text(B[0], B[1] + 18, 'B', 'middle', bold) + text(C[0], C[1] - 8, 'C', 'middle', bold)
  return svg(290, 196, b)
}

// Прямоугольный треугольник ACB (∠C = 90°), CE — высота, O — середина AB
export function skatingTriangle(): string {
  const C: Pt = [40, 200], A: Pt = [40, 80], B: Pt = [200, 200], E: Pt = [97.6, 123.2], O: Pt = [120, 140]
  let b = `<polygon points="${[A, B, C].map(p => p.join(',')).join(' ')}" fill="${ACC}" fill-opacity="0.08" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`
  b += `<path d="M${C[0]},${C[1] - 12} h12 v12" fill="none" stroke="currentColor" stroke-width="1.2"/>`
  b += line(C, E, `stroke="${ACC}" stroke-width="2"`) + line(C, O, 'stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"')
  // Прямой угол при E: вдоль AB и вдоль EC
  const u: Pt = [0.8 * 9, 0.6 * 9], v: Pt = [-0.6 * 9, 0.8 * 9]
  b += `<path d="M${E[0] + u[0]},${E[1] + u[1]} l${v[0]},${v[1]} l${-u[0]},${-u[1]}" fill="none" stroke="currentColor" stroke-width="1.2"/>`
  for (const p of [A, B, C, E, O]) b += dot(p)
  b += text(A[0] - 10, A[1] + 4, 'A', 'end', bold) + text(B[0] + 10, B[1] + 4, 'B', 'start', bold) + text(C[0] - 10, C[1] + 14, 'C', 'end', bold)
  b += text(E[0] + 2, E[1] - 9, 'E', 'start', bold) + text(O[0] + 8, O[1] - 6, 'O', 'start', bold)
  b += text(A[0] - 8, 145, '12 м', 'end') + text(120, 218, '16 м')
  return svg(250, 230, b)
}
