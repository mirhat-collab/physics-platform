// Рисунки к заданиям: диаграммы, таблицы и шкалы измерительных приборов (SVG).
// Как и в figures.ts: линии и подписи — currentColor, выделение — var(--accent),
// поэтому рисунок подстраивается под светлую и тёмную тему. Только простые
// теги и атрибуты — рисунок проходит проверку lib/safe-figure.ts.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (v: number) => v.toFixed(1)
const num = (v: number) => String(Number(v.toPrecision(6))).replace('.', ',')
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;display:block" font-family="inherit" font-size="12">${body}</svg>`
const text = (x: number, y: number, s: string, anchor = 'middle', extra = '') =>
  `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" fill="currentColor" ${extra}>${esc(s)}</text>`
const line = (x1: number, y1: number, x2: number, y2: number, extra = '') =>
  `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" ${extra.includes('stroke=') ? '' : 'stroke="currentColor"'} ${extra}/>`
const ACCENT = 'var(--accent, #8b7cf6)'

// Столбчатая диаграмма: подписи столбцов и значения (ось от 0 до max с шагом step)
export function barChart(o: { labels: string[]; values: number[]; step: number; max?: number; yLabel?: string; showValues?: boolean }): string {
  const W = Math.max(260, 70 + o.labels.length * 52), H = 220, L = 40, B = 34, T = 22
  const max = o.max ?? Math.ceil(Math.max(...o.values) / o.step) * o.step
  const py = (v: number) => H - B - (v / max) * (H - B - T)
  let b = ''
  for (let v = 0; v <= max + 1e-9; v += o.step) {
    b += line(L, py(v), W - 10, py(v), 'stroke-opacity="0.15"') + text(L - 6, py(v) + 4, num(v), 'end')
  }
  const slot = (W - L - 10) / o.labels.length
  o.values.forEach((v, i) => {
    const x = L + slot * i + slot * 0.2, w = slot * 0.6
    b += `<rect x="${f1(x)}" y="${f1(py(v))}" width="${f1(w)}" height="${f1(py(0) - py(v))}" fill="${ACCENT}" fill-opacity="0.75"/>`
    b += text(x + w / 2, H - B + 16, o.labels[i])
    if (o.showValues) b += text(x + w / 2, py(v) - 5, num(v), 'middle', 'font-weight="700"')
  })
  b += line(L, py(0), W - 10, py(0), 'stroke-width="1.5"') + line(L, py(0), L, T - 6, 'stroke-width="1.5"')
  if (o.yLabel) b += text(L + 4, T - 8, o.yLabel, 'start', 'font-style="italic"')
  return svg(W, H, b)
}

// Круговая диаграмма: доли (в процентах, сумма 100) и подписи в легенде
export function pieChart(o: { labels: string[]; percents: number[] }): string {
  const R = 78, cx = 95, cy = 100, H = 200
  const W = 236 + Math.max(...o.labels.map(l => l.length + 6)) * 7.5
  const shades = [1, 0.65, 0.4, 0.22, 0.1, 0.5]
  let a = -Math.PI / 2, b = ''
  o.percents.forEach((p, i) => {
    const a2 = a + (p / 100) * 2 * Math.PI
    const [x1, y1, x2, y2] = [cx + R * Math.cos(a), cy + R * Math.sin(a), cx + R * Math.cos(a2), cy + R * Math.sin(a2)]
    const large = a2 - a > Math.PI ? 1 : 0
    b += `<path d="M${cx},${cy} L${f1(x1)},${f1(y1)} A${R},${R} 0 ${large} 1 ${f1(x2)},${f1(y2)} Z" fill="${ACCENT}" fill-opacity="${shades[i % shades.length]}" stroke="currentColor" stroke-width="1"/>`
    const ly = 34 + i * 26
    b += `<rect x="200" y="${ly - 11}" width="14" height="14" fill="${ACCENT}" fill-opacity="${shades[i % shades.length]}" stroke="currentColor" stroke-width="1"/>`
    b += text(222, ly, `${o.labels[i]} — ${num(p)}%`, 'start')
    a = a2
  })
  return svg(W, H, b)
}

// Таблица: заголовок строки и значения по столбцам
export function tableFigure(rows: string[][], opts: { header?: boolean } = { header: true }): string {
  const cols = rows[0].length
  const widths = Array.from({ length: cols }, (_, c) => Math.max(40, ...rows.map(r => r[c].length * 7.5 + 16)))
  const W = widths.reduce((s, x) => s + x, 0) + 2, rh = 28, H = rows.length * rh + 2
  let b = '', y = 1
  rows.forEach((r, ri) => {
    let x = 1
    r.forEach((cell, ci) => {
      const head = (opts.header !== false && ri === 0) || ci === 0
      b += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(widths[ci])}" height="${rh}" fill="${head ? ACCENT : 'none'}" fill-opacity="${head ? 0.12 : 0}" stroke="currentColor" stroke-opacity="0.5"/>`
      b += text(x + widths[ci] / 2, y + 18, cell, 'middle', head ? 'font-weight="700"' : '')
      x += widths[ci]
    })
    y += rh
  })
  return svg(W, H, b)
}

// Стрелочный прибор (амперметр, вольтметр): шкала от 0 до max, крупные деления
// с подписями через major, мелкие — через minor; стрелка на value
export function dialGauge(o: { symbol: string; max: number; major: number; minor: number; value: number; unit?: string }): string {
  const W = 280, H = 170, cx = 140, cy = 150, R = 110
  const ang = (v: number) => Math.PI * (1 - v / o.max) // от 180° (0) до 0° (max)
  const pt = (v: number, r: number): [number, number] => [cx + r * Math.cos(ang(v)), cy - r * Math.sin(ang(v))]
  let b = `<path d="M${cx - R - 14},${cy + 6} A${R + 14},${R + 14} 0 0 1 ${cx + R + 14},${cy + 6}" fill="none" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.5"/>`
  const steps = Math.round(o.max / o.minor)
  for (let i = 0; i <= steps; i++) {
    const v = i * o.minor, big = Math.abs(v / o.major - Math.round(v / o.major)) < 1e-9
    const [x1, y1] = pt(v, R), [x2, y2] = pt(v, big ? R - 14 : R - 7)
    b += line(x1, y1, x2, y2, `stroke-width="${big ? 2 : 1}"`)
    if (big) { const [tx, ty] = pt(v, R - 26); b += text(tx, ty + 4, num(v)) }
  }
  const [nx, ny] = pt(o.value, R - 4)
  b += line(cx, cy, nx, ny, `stroke="${ACCENT}" stroke-width="3" stroke-linecap="round"`)
  b += `<circle cx="${cx}" cy="${cy}" r="6" fill="${ACCENT}"/>`
  b += text(cx, cy - 34, o.symbol, 'middle', 'font-size="22" font-weight="700"')
  return svg(W, H, b)
}

// Вертикальная шкала: мензурка (уровень жидкости), термометр, динамометр.
// from..to — значения шкалы снизу вверх; value — уровень
export function verticalScale(o: { kind: 'beaker' | 'thermometer' | 'dynamometer'; from: number; to: number; major: number; minor: number; value: number; unit: string; body?: boolean }): string {
  const W = 170, H = 280, top = 30, bottom = 250, x = 70
  // У динамометра шкала идёт сверху вниз: 0 у верхнего края
  const py = (v: number) => o.kind === 'dynamometer'
    ? top + ((v - o.from) / (o.to - o.from)) * (bottom - top)
    : bottom - ((v - o.from) / (o.to - o.from)) * (bottom - top)
  let b = ''
  if (o.kind === 'beaker') {
    b += `<path d="M${x - 30},${top - 16} L${x - 30},${bottom + 12} Q${x - 30},${bottom + 20} ${x - 22},${bottom + 20} L${x + 22},${bottom + 20} Q${x + 30},${bottom + 20} ${x + 30},${bottom + 12} L${x + 30},${top - 16}" fill="none" stroke="currentColor" stroke-width="2"/>`
    b += `<rect x="${x - 29}" y="${f1(py(o.value))}" width="58" height="${f1(bottom + 19 - py(o.value))}" fill="${ACCENT}" fill-opacity="0.25"/>`
    b += line(x - 29, py(o.value), x + 29, py(o.value), `stroke="${ACCENT}" stroke-width="2"`)
    if (o.body) b += `<rect x="${x - 12}" y="${f1(bottom - 6)}" width="24" height="24" fill="currentColor" fill-opacity="0.55"/>`
  } else if (o.kind === 'thermometer') {
    b += `<rect x="${x - 7}" y="${top - 16}" width="14" height="${bottom - top + 26}" rx="7" fill="none" stroke="currentColor" stroke-width="2"/>`
    b += `<circle cx="${x}" cy="${bottom + 20}" r="13" fill="${ACCENT}" fill-opacity="0.85" stroke="currentColor" stroke-width="2"/>`
    b += `<rect x="${x - 3}" y="${f1(py(o.value))}" width="6" height="${f1(bottom + 10 - py(o.value))}" fill="${ACCENT}"/>`
  } else {
    b += `<rect x="${x - 22}" y="${top - 18}" width="44" height="${bottom - top + 30}" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>`
    b += line(x, top - 28, x, top - 18, 'stroke-width="2"')
    b += `<polygon points="${x - 26},${f1(py(o.value))} ${x - 14},${f1(py(o.value) - 5)} ${x - 14},${f1(py(o.value) + 5)}" fill="${ACCENT}"/>`
    b += line(x - 14, py(o.value), x - 4, py(o.value), `stroke="${ACCENT}" stroke-width="2"`)
    b += line(x, bottom + 12, x, bottom + 34, 'stroke-width="2"') + `<circle cx="${x}" cy="${bottom + 30}" r="5" fill="none" stroke="currentColor" stroke-width="2"/>`
  }
  const steps = Math.round((o.to - o.from) / o.minor)
  const right = o.kind === 'beaker' ? x + 30 : o.kind === 'thermometer' ? x + 9 : x + 4
  for (let i = 0; i <= steps; i++) {
    const v = o.from + i * o.minor, big = Math.abs((v - o.from) / o.major - Math.round((v - o.from) / o.major)) < 1e-9
    b += line(right, py(v), right + (big ? 14 : 7), py(v), `stroke-width="${big ? 1.6 : 1}"`)
    if (big) b += text(right + 18, py(v) + 4, num(v), 'start')
  }
  b += text(W - 8, top - 18, o.unit, 'end', 'font-weight="700"')
  return svg(W, H + 20, b)
}
