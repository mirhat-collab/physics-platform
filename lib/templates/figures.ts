// Рисунки к заданиям (SVG): графики, электрические схемы, фигуры на клетках,
// окружности. Линии и подписи — currentColor, выделение — var(--accent),
// поэтому рисунок подстраивается под тему сайта. Подписи — символы и числа,
// единицы проходят через tr().
import { tr } from './helpers'

export type Pt = [number, number]

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const num = (v: number) => String(Number(v.toPrecision(4))).replace('.', ',')
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;display:block" font-family="inherit" font-size="12">${body}</svg>`
const text = (x: number, y: number, s: string, anchor = 'middle', extra = '') =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" fill="currentColor" ${extra}>${esc(s)}</text>`
const line = (a: Pt, b: Pt, extra = '') =>
  `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" ${extra.includes('stroke=') ? '' : 'stroke="currentColor"'} ${extra}/>`

export type PlotLine = { pts: Pt[]; accent?: boolean; dashed?: boolean; label?: string }

// График в осях с сеткой: x и y — [от, до, шаг сетки]
export function plot(o: {
  x: [number, number, number]; y: [number, number, number]
  xLabel: string; yLabel: string; lines: PlotLine[]; dots?: Pt[]
}): string {
  const W = 340, H = 230, L = 44, R = 18, T = 18, B = 34
  const [x0, x1, dx] = o.x, [y0, y1, dy] = o.y
  const px = (x: number) => L + ((x - x0) / (x1 - x0)) * (W - L - R)
  const py = (y: number) => H - B - ((y - y0) / (y1 - y0)) * (H - T - B)
  let body = ''
  for (let x = x0; x <= x1 + 1e-9; x += dx) {
    body += line([px(x), py(y0)], [px(x), py(y1)], 'stroke-opacity="0.15"')
    body += text(px(x), py(Math.max(y0, 0)) + 15, num(x))
  }
  for (let y = y0; y <= y1 + 1e-9; y += dy) {
    body += line([px(x0), py(y)], [px(x1), py(y)], 'stroke-opacity="0.15"')
    if (Math.abs(y) > 1e-9) body += text(px(Math.max(x0, 0)) - 6, py(y) + 4, num(y), 'end')
  }
  // Оси со стрелками
  const ax = py(Math.max(y0, Math.min(0, y1))), ay = px(Math.max(x0, Math.min(0, x1)))
  body += line([px(x0), ax], [px(x1) + 10, ax], 'stroke-width="1.5"') + `<path d="M${px(x1) + 10},${ax} l-7,-4 v8 z" fill="currentColor"/>`
  body += line([ay, py(y0)], [ay, py(y1) - 10], 'stroke-width="1.5"') + `<path d="M${ay},${py(y1) - 10} l-4,7 h8 z" fill="currentColor"/>`
  body += text(px(x1) + 6, ax - 8, o.xLabel, 'end', 'font-style="italic"')
  body += text(ay + 8, py(y1) - 2, o.yLabel, 'start', 'font-style="italic"')
  for (const l of o.lines) {
    const d = l.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ')
    body += `<path d="${d}" fill="none" stroke="${l.accent === false ? 'currentColor' : 'var(--accent, #8b7cf6)'}" stroke-width="2.5" ${l.dashed ? 'stroke-dasharray="6 4"' : ''} stroke-linejoin="round"/>`
    if (l.label) {
      const [x, y] = l.pts[l.pts.length - 1]
      body += text(px(x) - 4, py(y) - 8, l.label, 'end', 'font-weight="700"')
    }
  }
  for (const [x, y] of o.dots ?? []) body += `<circle cx="${px(x)}" cy="${py(y)}" r="3.5" fill="var(--accent, #8b7cf6)"/>`
  return svg(W, H, body)
}

// Резистор на схеме: прямоугольник между точками и подпись над ним
function resistor(a: Pt, b: Pt, label: string): string {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
  const horiz = a[1] === b[1]
  const w = horiz ? 40 : 14, h = horiz ? 14 : 40
  return line(a, [horiz ? mx - w / 2 : a[0], horiz ? a[1] : my - h / 2], 'stroke-width="1.5"') +
    line([horiz ? mx + w / 2 : b[0], horiz ? b[1] : my + h / 2], b, 'stroke-width="1.5"') +
    `<rect x="${mx - w / 2}" y="${my - h / 2}" width="${w}" height="${h}" fill="none" stroke="var(--accent, #8b7cf6)" stroke-width="2"/>` +
    (horiz ? text(mx, my - 12, label) : text(mx + 12, my + 4, label, 'start'))
}

const wire = (pts: Pt[]) => `<path d="${pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="1.5"/>`
const node = ([x, y]: Pt) => `<circle cx="${x}" cy="${y}" r="3" fill="currentColor"/>`
const terminal = ([x, y]: Pt) => `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>`

// Схема: R1 последовательно с параллельными R2 и R3, к клеммам подано U
export function circuitSeriesParallel(r: [string, string, string], u: string): string {
  let b = terminal([20, 90]) + resistor([24, 90], [120, 90], r[0]) + node([120, 90])
  b += wire([[120, 90], [120, 45], [150, 45]]) + resistor([150, 45], [240, 45], r[1]) + wire([[240, 45], [270, 45], [270, 90]])
  b += wire([[120, 90], [120, 135], [150, 135]]) + resistor([150, 135], [240, 135], r[2]) + wire([[240, 135], [270, 135], [270, 90]])
  b += node([270, 90]) + wire([[270, 90], [306, 90]]) + terminal([310, 90])
  b += text(165, 178, `U = ${u}`, 'middle', 'font-weight="700"')
  return svg(330, 190, b)
}

// Схема: параллельные R1 и R2, затем последовательно R3
export function circuitParallelSeries(r: [string, string, string], u: string): string {
  let b = terminal([20, 90]) + wire([[24, 90], [50, 90]]) + node([50, 90])
  b += wire([[50, 90], [50, 45], [70, 45]]) + resistor([70, 45], [160, 45], r[0]) + wire([[160, 45], [180, 45], [180, 90]])
  b += wire([[50, 90], [50, 135], [70, 135]]) + resistor([70, 135], [160, 135], r[1]) + wire([[160, 135], [180, 135], [180, 90]])
  b += node([180, 90]) + resistor([180, 90], [290, 90], r[2]) + wire([[290, 90], [306, 90]]) + terminal([310, 90])
  b += text(165, 178, `U = ${u}`, 'middle', 'font-weight="700"')
  return svg(330, 190, b)
}

// Фигура на клетчатой бумаге: вершины в узлах сетки, клетка 1 × 1
export function gridFigure(poly: Pt[], cells: [number, number], names = 'ABCDEF'): string {
  const c = 26, pad = 20, W = cells[0] * c + pad * 2, H = cells[1] * c + pad * 2
  const p = ([x, y]: Pt): Pt => [pad + x * c, H - pad - y * c]
  let b = ''
  for (let i = 0; i <= cells[0]; i++) b += line(p([i, 0]), p([i, cells[1]]), 'stroke-opacity="0.18"')
  for (let j = 0; j <= cells[1]; j++) b += line(p([0, j]), p([cells[0], j]), 'stroke-opacity="0.18"')
  b += `<polygon points="${poly.map(v => p(v).join(',')).join(' ')}" fill="var(--accent, #8b7cf6)" fill-opacity="0.18" stroke="var(--accent, #8b7cf6)" stroke-width="2.5" stroke-linejoin="round"/>`
  const cx = poly.reduce((s, v) => s + v[0], 0) / poly.length, cy = poly.reduce((s, v) => s + v[1], 0) / poly.length
  poly.forEach((v, i) => {
    const [x, y] = p(v), dx = v[0] - cx, dy = v[1] - cy, len = Math.hypot(dx, dy) || 1
    b += text(x + (dx / len) * 12, y - (dy / len) * 12 + 4, names[i], 'middle', 'font-weight="700"')
  })
  return svg(W, H, b)
}

// Векторы на клетках: стрелки из заданных точек
export function gridVectors(vs: { from: Pt; to: Pt; name: string }[], cells: [number, number]): string {
  const c = 24, pad = 12, W = cells[0] * c + pad * 2, H = cells[1] * c + pad * 2
  const p = ([x, y]: Pt): Pt => [pad + x * c, H - pad - y * c]
  let b = '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent, #8b7cf6)"/></marker></defs>'
  for (let i = 0; i <= cells[0]; i++) b += line(p([i, 0]), p([i, cells[1]]), 'stroke-opacity="0.18"')
  for (let j = 0; j <= cells[1]; j++) b += line(p([0, j]), p([cells[0], j]), 'stroke-opacity="0.18"')
  for (const v of vs) {
    const a = p(v.from), z = p(v.to)
    b += `<line x1="${a[0]}" y1="${a[1]}" x2="${z[0]}" y2="${z[1]}" stroke="var(--accent, #8b7cf6)" stroke-width="2.5" marker-end="url(#ar)"/>`
    b += text((a[0] + z[0]) / 2 - 8, (a[1] + z[1]) / 2 - 6, v.name, 'middle', 'font-weight="700" font-style="italic"')
  }
  return svg(W, H, b)
}

// Окружность с точками на ней (углы в градусах от оси x) и отрезками между ними
export function circleFigure(points: { deg: number; name: string }[], chords: [number, number][], opts: { center?: boolean; arcLabel?: { from: number; to: number; text: string } } = {}): string {
  const W = 240, H = 240, R = 90, cx = 120, cy = 120
  const at = (d: number): Pt => [cx + R * Math.cos((d * Math.PI) / 180), cy - R * Math.sin((d * Math.PI) / 180)]
  let b = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="currentColor" stroke-width="1.5"/>`
  const pos = (name: string): Pt => (name === 'O' ? [cx, cy] : at(points.find(p => p.name === name)!.deg))
  const names = points.map(p => p.name).concat(opts.center ? ['O'] : [])
  for (const [i, j] of chords) b += line(pos(names[i]), pos(names[j]), 'stroke="var(--accent, #8b7cf6)" stroke-width="2"')
  if (opts.arcLabel) {
    const m = (opts.arcLabel.from + opts.arcLabel.to) / 2, [x, y] = [cx + (R + 16) * Math.cos((m * Math.PI) / 180), cy - (R + 16) * Math.sin((m * Math.PI) / 180)]
    b += text(x, y + 4, opts.arcLabel.text, 'middle', 'font-weight="700"')
  }
  for (const p of points) {
    const [x, y] = at(p.deg)
    b += node([x, y]) + text(cx + (R + 14) * Math.cos((p.deg * Math.PI) / 180), cy - (R + 14) * Math.sin((p.deg * Math.PI) / 180) + 4, p.name, 'middle', 'font-weight="700"')
  }
  if (opts.center) b += node([cx, cy]) + text(cx + 10, cy + 14, 'O', 'start', 'font-weight="700"')
  return svg(W, H, b)
}

// Подпись оси с единицей: «v, м/с»
export const axis = (sym: string, unit: string) => `${sym}, ${tr(unit)}`
