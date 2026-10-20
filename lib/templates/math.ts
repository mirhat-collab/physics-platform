import { type Template, num, txt, rnd, pick, fmt, fx, frac, signed, term, lead, pi, distinct } from './helpers'

// Пифагоровы тройки — чтобы ответы получались целыми
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25], [9, 12, 15], [12, 16, 20]]

// Табличные значения: угол в градусах → значение в LaTeX и числом
const SIN: Record<number, [string, number]> = {
  0: ['0', 0], 30: ['\\frac{1}{2}', 0.5], 45: ['\\frac{\\sqrt{2}}{2}', Math.SQRT1_2], 60: ['\\frac{\\sqrt{3}}{2}', Math.sqrt(3) / 2], 90: ['1', 1],
}
const RAD: Record<number, string> = {
  30: '\\frac{\\pi}{6}', 45: '\\frac{\\pi}{4}', 60: '\\frac{\\pi}{3}', 90: '\\frac{\\pi}{2}', 120: '\\frac{2\\pi}{3}', 135: '\\frac{3\\pi}{4}',
  150: '\\frac{5\\pi}{6}', 180: '\\pi', 210: '\\frac{7\\pi}{6}', 225: '\\frac{5\\pi}{4}', 240: '\\frac{4\\pi}{3}', 270: '\\frac{3\\pi}{2}',
  300: '\\frac{5\\pi}{3}', 315: '\\frac{7\\pi}{4}', 330: '\\frac{11\\pi}{6}', 360: '2\\pi',
}

function interval(a: string, b: string, left: '(' | '[', right: ')' | ']'): string {
  return `$${left}${a};\\ ${b}${right}$`
}

export const MATH_TEMPLATES: Template[] = [
  // ---------- Числа и выражения ----------
  {
    topic: 'Квадратные корни. Преобразование выражений с корнями',
    gen: n => {
      const b = pick([2, 3, 5]), a1 = rnd(2, 5), a2 = rnd(1, 4)
      const r = a1 + a2
      return txt(`Упростите выражение $\\sqrt{${a1 * a1 * b}} + \\sqrt{${a2 * a2 * b}}$.`,
        `$${r}\\sqrt{${b}}$`, [`$\\sqrt{${(a1 * a1 + a2 * a2) * b}}$`, `$${r * b}$`, `$${a1 * a2}\\sqrt{${b}}$`, `$${r}\\sqrt{${b * 2}}$`], n,
        `$\\sqrt{${a1 * a1 * b}} = ${a1}\\sqrt{${b}}$, $\\sqrt{${a2 * a2 * b}} = ${a2}\\sqrt{${b}}$, сумма $${r}\\sqrt{${b}}$.`)
    },
  },
  {
    topic: 'Квадратные корни. Преобразование выражений с корнями',
    gen: n => {
      const a = pick([2, 3, 5, 6, 7]), b = pick([1, 2, 3])
      if (a === b * b) return num('Вычислите $(\\sqrt{7} - 2)(\\sqrt{7} + 2)$.', 3, [5, 11, 9], n, '', 'Разность квадратов: $7 - 4 = 3$.')
      return num(`Вычислите $(\\sqrt{${a}} - ${b})(\\sqrt{${a}} + ${b})$.`,
        a - b * b, [a + b * b, a - b, a * a - b * b], n, '',
        `Разность квадратов: $(\\sqrt{${a}})^2 - ${b}^2 = ${a} - ${b * b} = ${a - b * b}$.`)
    },
  },
  {
    topic: 'Действительные и иррациональные числа',
    gen: n => txt('Какое из чисел является иррациональным?',
      pick(['$\\sqrt{2}$', '$\\pi$', '$\\sqrt{5}$', '$\\sqrt{3} + 1$']),
      ['$\\sqrt{16}$', '$0{,}(3)$', '$-\\frac{7}{3}$', '$\\sqrt{0{,}25}$', '$1{,}5$'], n,
      'Иррациональное число нельзя записать в виде дроби $\\frac{p}{q}$: его десятичная запись бесконечна и непериодична. $\\sqrt{16} = 4$, $0{,}(3) = \\frac{1}{3}$, $\\sqrt{0{,}25} = 0{,}5$ — рациональные.'),
  },
  {
    topic: 'Комплексные числа',
    gen: n => {
      const [a, b, c] = pick(TRIPLES)
      const s1 = pick([1, -1]), s2 = pick([1, -1])
      return num(`Найдите модуль комплексного числа $z = ${s1 * a} ${term(s2 * b, 'i')}$.`,
        c, [a + b, Math.abs(a - b), a * a + b * b], n, '',
        `$|z| = \\sqrt{a^2 + b^2} = \\sqrt{${a * a} + ${b * b}} = ${c}$.`)
    },
  },
  {
    topic: 'Комплексные числа',
    gen: n => {
      const a = rnd(1, 4), b = rnd(1, 4), c = rnd(1, 4), d = rnd(1, 4)
      const re = a * c - b * d, im = a * d + b * c
      const show = (x: number, y: number) => `$${x} ${term(y, 'i')}$`
      return txt(`Вычислите $(${a} + ${b}i)(${c} + ${d}i)$.`,
        show(re, im), [show(a * c + b * d, im), show(a * c, b * d), show(re, a * d - b * c), show(a + c, b + d)], n,
        `$(${a} + ${b}i)(${c} + ${d}i) = ${a * c} + ${a * d}i + ${b * c}i + ${b * d}i^2 = ${re} ${term(im, 'i')}$, так как $i^2 = -1$.`)
    },
  },
  {
    topic: 'Комплексные числа',
    gen: n => {
      const a = rnd(1, 6), b = rnd(1, 6)
      return txt(`Найдите число, сопряжённое к $z = ${a} - ${b}i$.`,
        `$${a} + ${b}i$`, [`$-${a} + ${b}i$`, `$-${a} - ${b}i$`, `$${b} - ${a}i$`, `$${a} - ${b}i$`], n,
        'У сопряжённого числа меняется знак мнимой части.')
    },
  },
  {
    topic: 'Свойства степени',
    gen: n => {
      const a = pick([2, 3, 5]), m = rnd(3, 7), k = rnd(2, 5), l = rnd(1, m + k - 1)
      const e = m + k - l
      return num(`Вычислите $\\frac{${a}^{${m}} \\cdot ${a}^{${k}}}{${a}^{${l}}}$.`,
        a ** e, [a ** (m * k - l), a ** (m + k + l), a ** (e - 1)], n, '',
        `$${a}^{${m} + ${k} - ${l}} = ${a}^{${e}} = ${a ** e}$.`)
    },
  },
  {
    topic: 'Свойства степени',
    gen: n => {
      const b = pick([4, 8, 9, 16, 27, 25])
      const map: Record<number, [number, number]> = { 4: [2, 2], 8: [2, 3], 9: [3, 2], 16: [2, 4], 27: [3, 3], 25: [5, 2] }
      const [base, p] = map[b]
      const q = pick([2, 3].filter(x => x !== p))
      return txt(`Вычислите $${b}^{\\frac{${q}}{${p}}}$.`,
        `$${base ** q}$`, [`$${base ** (q + 1)}$`, `$${base ** p}$`, `$${base * q}$`, `$${b * q}$`, `$${b ** 2}$`, `$${base ** q + base}$`, `$${base ** q * 2}$`], n,
        `$${b}^{\\frac{${q}}{${p}}} = (${base}^{${p}})^{\\frac{${q}}{${p}}} = ${base}^{${q}} = ${base ** q}$.`)
    },
  },
  {
    topic: 'Модуль числа',
    gen: n => {
      const a = rnd(-9, -2), b = rnd(3, 9), c = rnd(-7, 7)
      const r = Math.abs(a) - Math.abs(b - 12) + Math.abs(c)
      return num(`Вычислите $|${a}| - |${b} - 12| + |${c}|$.`,
        r, [a - (b - 12) + c, Math.abs(a) + Math.abs(b - 12) + Math.abs(c), -r], n, '',
        `$|${a}| = ${Math.abs(a)}$, $|${b - 12}| = ${Math.abs(b - 12)}$, $|${c}| = ${Math.abs(c)}$. Итого $${r}$.`)
    },
  },
  {
    topic: 'Формулы сокращённого умножения',
    gen: n => {
      const a = pick([51, 101, 201, 31, 49]), b = a + pick([2, -2])
      const [x, y] = a > b ? [a, b] : [b, a]
      return num(`Вычислите $${x}^2 - ${y}^2$.`,
        x * x - y * y, [(x - y) ** 2, x - y, (x + y) ** 2], n, '',
        `Разность квадратов: $(${x} - ${y})(${x} + ${y}) = ${x - y} \\cdot ${x + y} = ${x * x - y * y}$.`)
    },
  },
  {
    topic: 'Формулы сокращённого умножения',
    gen: n => {
      const a = rnd(2, 5), b = rnd(1, 7)
      return txt(`Раскройте скобки: $(${a}x - ${b})^2$.`,
        `$${a * a}x^2 - ${2 * a * b}x + ${b * b}$`, [`$${a * a}x^2 - ${b * b}$`, `$${a * a}x^2 + ${b * b}$`, `$${a * a}x^2 - ${a * b}x + ${b * b}$`, `$${a}x^2 - ${2 * a * b}x + ${b * b}$`], n,
        `$(a - b)^2 = a^2 - 2ab + b^2$: $(${a}x)^2 - 2 \\cdot ${a}x \\cdot ${b} + ${b}^2$.`)
    },
  },
  {
    topic: 'Разложение на множители',
    gen: n => {
      const [p, q] = distinct(2, -7, 7).filter(Boolean).length === 2 ? distinct(2, 1, 8).map((x, i) => (i ? -x : x)) : [2, -3]
      const B = -(p + q), C = p * q
      const f = (r: number) => (r > 0 ? `(x - ${r})` : `(x + ${-r})`)
      return txt(`Разложите на множители: $x^2 ${term(B, 'x')} ${signed(C)}$.`,
        `$${f(p)}${f(q)}$`, [`$${f(-p)}${f(-q)}$`, `$${f(p)}${f(-q)}$`, `$${f(-p)}${f(q)}$`, `$(x ${signed(B)})(x ${signed(C)})$`], n,
        `Корни трёхчлена: $x_1 = ${p}$, $x_2 = ${q}$ (по теореме Виета сумма $${p + q}$, произведение $${C}$). $ax^2 + bx + c = a(x - x_1)(x - x_2)$.`)
    },
  },

  // ---------- Тригонометрия ----------
  {
    topic: 'Радианная мера угла',
    gen: n => {
      const deg = pick([30, 45, 60, 120, 135, 150, 210, 240, 270, 300, 330])
      const wrongs = Object.entries(RAD).filter(([d]) => Number(d) !== deg).map(([, r]) => `$${r}$`)
      return txt(`Переведите ${deg}° в радианы.`, `$${RAD[deg]}$`, [...wrongs].sort(() => Math.random() - 0.5), n,
        `$${deg}° = ${deg} \\cdot \\frac{\\pi}{180} = ${RAD[deg]}$.`)
    },
  },
  {
    topic: 'Радианная мера угла',
    gen: n => {
      const deg = pick([30, 45, 60, 120, 135, 150, 210, 270, 300])
      return num(`Сколько градусов в угле $${RAD[deg]}$ рад?`, deg, [deg / 2, 180 - deg, deg * 2, 360 - deg], n, '°',
        `$${RAD[deg]} \\cdot \\frac{180°}{\\pi} = ${deg}°$.`)
    },
  },
  {
    topic: 'Табличные значения тригонометрических функций',
    gen: n => {
      const items = [
        { e: '\\sin 30° + \\cos 60°', v: '1', w: ['$\\frac{1}{2}$', '$\\sqrt{3}$', '$0$'] },
        { e: '2\\sin 45° \\cdot \\cos 45°', v: '1', w: ['$\\sqrt{2}$', '$\\frac{1}{2}$', '$2$'] },
        { e: '\\mathrm{tg}\\, 45° + \\mathrm{ctg}\\, 45°', v: '2', w: ['$1$', '$0$', '$\\sqrt{2}$'] },
        { e: '\\sin^2 60° - \\cos^2 60°', v: '\\frac{1}{2}', w: ['$1$', '$0$', '$\\frac{\\sqrt{3}}{2}$'] },
        { e: '4\\sin 30° \\cdot \\cos 0°', v: '2', w: ['$4$', '$1$', '$0$'] },
        { e: '\\mathrm{tg}\\, 60° \\cdot \\mathrm{ctg}\\, 30°', v: '3', w: ['$1$', '$\\sqrt{3}$', '$\\frac{1}{3}$'] },
        { e: '\\cos 180° + \\sin 90°', v: '0', w: ['$2$', '$-2$', '$1$'] },
        { e: '2\\cos^2 45° + \\mathrm{tg}^2 60°', v: '4', w: ['$3$', '$2$', '$5$'] },
      ]
      const it = pick(items)
      return txt(`Вычислите $${it.e}$.`, `$${it.v}$`, [...it.w, '$-1$'], n,
        'Используем табличные значения: $\\sin 30° = \\cos 60° = \\frac{1}{2}$, $\\sin 45° = \\cos 45° = \\frac{\\sqrt{2}}{2}$, $\\sin 60° = \\frac{\\sqrt{3}}{2}$, $\\mathrm{tg}\\, 45° = 1$, $\\mathrm{tg}\\, 60° = \\sqrt{3}$.')
    },
  },
  {
    topic: 'Формулы приведения',
    gen: n => {
      const [s, c] = pick([[0.6, 0.8], [0.8, 0.6], [0.28, 0.96]])
      const items = [
        { e: '\\sin(180° - \\alpha)', v: s, why: 'sin(180° − α) = sin α' },
        { e: '\\cos(180° - \\alpha)', v: -c, why: 'cos(180° − α) = −cos α' },
        { e: '\\cos(90° + \\alpha)', v: -s, why: 'cos(90° + α) = −sin α' },
        { e: '\\sin(90° + \\alpha)', v: c, why: 'sin(90° + α) = cos α' },
        { e: '\\sin(\\pi + \\alpha)', v: -s, why: 'sin(π + α) = −sin α' },
        { e: '\\cos\\left(\\frac{3\\pi}{2} - \\alpha\\right)', v: -s, why: 'cos(3π/2 − α) = −sin α' },
      ]
      const it = pick(items)
      const f = (x: number) => `$${fx(x)}$`
      return txt(`Известно, что $\\sin\\alpha = ${fx(s)}$, $\\cos\\alpha = ${fx(c)}$. Найдите $${it.e}$.`,
        f(it.v), [f(-it.v), f(it.v === s || it.v === -s ? c : s), f(it.v === s || it.v === -s ? -c : -s)], n,
        `Формула приведения: ${it.why}.`)
    },
  },
  {
    topic: 'Формулы двойного и половинного аргумента',
    gen: n => {
      const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17]])
      const ask = pick(['sin', 'cos'])
      const v = ask === 'sin' ? frac(2 * a * b, c * c) : frac(b * b - a * a, c * c)
      return txt(`Известно, что $\\sin\\alpha = \\frac{${a}}{${c}}$ и $\\alpha$ — острый угол. Найдите $\\${ask} 2\\alpha$.`,
        `$${v}$`, [`$${frac(2 * a, c)}$`, `$${frac(a * b, c * c)}$`, `$${frac(a * a - b * b, c * c)}$`, `$${frac(2 * b * b, c * c)}$`], n,
        `$\\cos\\alpha = \\frac{${b}}{${c}}$. ${ask === 'sin' ? `$\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha = ${v}$` : `$\\cos 2\\alpha = \\cos^2\\alpha - \\sin^2\\alpha = ${v}$`}.`)
    },
  },
  {
    topic: 'Формулы суммы и разности углов',
    gen: n => {
      const items = [
        { e: '\\sin 75°', v: '\\frac{\\sqrt{6} + \\sqrt{2}}{4}', w: ['\\frac{\\sqrt{6} - \\sqrt{2}}{4}', '\\frac{\\sqrt{3} + 1}{2}', '\\frac{\\sqrt{2}}{2}'], s: '\\sin(45° + 30°)' },
        { e: '\\cos 75°', v: '\\frac{\\sqrt{6} - \\sqrt{2}}{4}', w: ['\\frac{\\sqrt{6} + \\sqrt{2}}{4}', '\\frac{\\sqrt{3} - 1}{2}', '\\frac{1}{2}'], s: '\\cos(45° + 30°)' },
        { e: '\\sin 15°', v: '\\frac{\\sqrt{6} - \\sqrt{2}}{4}', w: ['\\frac{\\sqrt{6} + \\sqrt{2}}{4}', '\\frac{\\sqrt{2}}{4}', '\\frac{1}{4}'], s: '\\sin(45° - 30°)' },
        { e: '\\sin 50°\\cos 10° + \\cos 50°\\sin 10°', v: '\\frac{\\sqrt{3}}{2}', w: ['\\frac{1}{2}', '1', '\\frac{\\sqrt{2}}{2}'], s: '\\sin(50° + 10°) = \\sin 60°' },
        { e: '\\cos 70°\\cos 10° + \\sin 70°\\sin 10°', v: '\\frac{1}{2}', w: ['\\frac{\\sqrt{3}}{2}', '0', '1'], s: '\\cos(70° - 10°) = \\cos 60°' },
      ]
      const it = pick(items)
      return txt(`Вычислите $${it.e}$.`, `$${it.v}$`, [...it.w.map(x => `$${x}$`), '$0$'], n, `$${it.e} = ${it.s} = ${it.v}$.`)
    },
  },
  {
    topic: 'Тождественные преобразования',
    gen: n => {
      const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17]])
      const quarter = pick([2, 4])
      const sinSign = quarter === 2 ? '' : '-'
      return txt(`Известно, что $\\cos\\alpha = ${quarter === 2 ? '-' : ''}\\frac{${b}}{${c}}$, $\\alpha$ лежит в ${quarter === 2 ? 'II' : 'IV'} четверти. Найдите $\\sin\\alpha$.`,
        `$${sinSign}\\frac{${a}}{${c}}$`, [`$${sinSign ? '' : '-'}\\frac{${a}}{${c}}$`, `$\\frac{${b}}{${c}}$`, `$-\\frac{${b}}{${a}}$`, `$\\frac{${a}}{${b}}$`], n,
        `$\\sin^2\\alpha = 1 - \\cos^2\\alpha = \\frac{${a * a}}{${c * c}}$, $|\\sin\\alpha| = \\frac{${a}}{${c}}$. В ${quarter === 2 ? 'II четверти синус положителен' : 'IV четверти синус отрицателен'}.`)
    },
  },
  {
    topic: 'Тождественные преобразования',
    gen: n => txt('Упростите выражение $\\frac{1 - \\cos^2\\alpha}{\\sin\\alpha \\cdot \\cos\\alpha}$.',
      '$\\mathrm{tg}\\,\\alpha$', ['$\\mathrm{ctg}\\,\\alpha$', '$\\sin\\alpha$', '$1$', '$\\cos\\alpha$'], n,
      '$1 - \\cos^2\\alpha = \\sin^2\\alpha$, тогда $\\frac{\\sin^2\\alpha}{\\sin\\alpha\\cos\\alpha} = \\frac{\\sin\\alpha}{\\cos\\alpha} = \\mathrm{tg}\\,\\alpha$.'),
  },
  {
    topic: 'Обратные тригонометрические функции',
    gen: n => {
      const items = [
        { e: '\\arcsin\\frac{1}{2} + \\arccos\\frac{1}{2}', v: '\\frac{\\pi}{2}' },
        { e: '\\arcsin\\left(-\\frac{\\sqrt{2}}{2}\\right)', v: '-\\frac{\\pi}{4}' },
        { e: '\\arccos\\left(-\\frac{1}{2}\\right)', v: '\\frac{2\\pi}{3}' },
        { e: '\\mathrm{arctg}\\,1 + \\mathrm{arctg}\\,\\sqrt{3}', v: '\\frac{7\\pi}{12}' },
        { e: '\\mathrm{arctg}(-\\sqrt{3})', v: '-\\frac{\\pi}{3}' },
        { e: '\\arccos 0 - \\arcsin 1', v: '0' },
      ]
      const it = pick(items)
      const pool = ['\\frac{\\pi}{2}', '-\\frac{\\pi}{4}', '\\frac{3\\pi}{4}', '\\frac{2\\pi}{3}', '\\frac{\\pi}{3}', '-\\frac{\\pi}{3}', '\\frac{7\\pi}{12}', '0', '\\pi', '\\frac{\\pi}{6}']
      return txt(`Вычислите $${it.e}$.`, `$${it.v}$`, pool.filter(x => x !== it.v).sort(() => Math.random() - 0.5).map(x => `$${x}$`), n,
        'Помним области значений: $\\arcsin x \\in [-\\frac{\\pi}{2}; \\frac{\\pi}{2}]$, $\\arccos x \\in [0; \\pi]$, $\\mathrm{arctg}\\,x \\in (-\\frac{\\pi}{2}; \\frac{\\pi}{2})$.')
    },
  },

  // ---------- Уравнения ----------
  {
    topic: 'Линейные уравнения',
    gen: n => {
      const x = rnd(-6, 9), a = rnd(2, 9), c = rnd(1, a - 1), b = rnd(-10, 10)
      const d = a * x + b - c * x
      return num(`Решите уравнение $${a}x ${signed(b)} = ${c}x ${signed(d)}$.`,
        x, [-x, (d + b) / (a - c), (d - b) / (a + c), x + 1], n, '',
        `$${a}x - ${c}x = ${d} - (${b})$, $${a - c}x = ${d - b}$, $x = ${x}$.`)
    },
  },
  {
    topic: 'Уравнения с модулем',
    gen: n => {
      const a = rnd(-5, 8), b = rnd(1, 9)
      return num(`Найдите сумму корней уравнения $|x ${signed(-a)}| = ${b}$.`,
        2 * a, [a + b, b, 2 * b, a], n, '',
        `$x - ${a} = \\pm ${b}$: $x_1 = ${a + b}$, $x_2 = ${a - b}$. Сумма $${2 * a}$.`)
    },
  },
  {
    topic: 'Квадратные уравнения',
    gen: n => {
      const [r1, r2] = distinct(2, -8, 9)
      const B = -(r1 + r2), C = r1 * r2
      return num(`Найдите больший корень уравнения $x^2 ${term(B, 'x')} ${signed(C)} = 0$.`,
        Math.max(r1, r2), [Math.min(r1, r2), -Math.max(r1, r2), r1 + r2, -Math.min(r1, r2)], n, '',
        `$D = ${B * B} - 4 \\cdot ${C} = ${B * B - 4 * C}$, $x = \\frac{${-B} \\pm ${Math.abs(r1 - r2)}}{2}$: корни ${r1} и ${r2}.`)
    },
  },
  {
    topic: 'Квадратные уравнения',
    gen: n => {
      const a = pick([1, 2, 3]), b = rnd(-6, 6), c = rnd(-6, 6)
      const D = b * b - 4 * a * c
      const cnt = D > 0 ? 2 : D === 0 ? 1 : 0
      return num(`Сколько корней имеет уравнение $${a === 1 ? '' : a}x^2 ${term(b, 'x')} ${signed(c)} = 0$?`,
        cnt, [0, 1, 2, 3].filter(x => x !== cnt), n, '',
        `$D = b^2 - 4ac = ${b * b} - ${4 * a * c} = ${D}$ — ${D > 0 ? 'положителен, два корня' : D === 0 ? 'ноль, один корень' : 'отрицателен, корней нет'}.`)
    },
  },
  {
    topic: 'Теорема Виета',
    gen: n => {
      const p = rnd(-7, 7) || 3, q = rnd(-9, 9) || -4
      const s = p * p - 2 * q
      return num(`$x_1$ и $x_2$ — корни уравнения $x^2 ${term(p, 'x')} ${signed(q)} = 0$. Найдите $x_1^2 + x_2^2$.`,
        s, [p * p + 2 * q, p * p, q * q - 2 * p], n, '',
        `По теореме Виета $x_1 + x_2 = ${-p}$, $x_1x_2 = ${q}$. $x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1x_2 = ${p * p} - ${2 * q} = ${s}$.`)
    },
  },
  {
    topic: 'Теорема Виета',
    gen: n => {
      let [r1, r2] = distinct(2, 1, 8).map((x, i) => (i ? -x : x))
      if (r1 + r2 === 0) r2 -= 1
      return txt(`Составьте приведённое квадратное уравнение с корнями ${r1} и ${r2}.`,
        `$x^2 ${term(-(r1 + r2), 'x')} ${signed(r1 * r2)} = 0$`,
        [`$x^2 ${term(r1 + r2, 'x')} ${signed(r1 * r2)} = 0$`, `$x^2 ${term(-(r1 + r2), 'x')} ${signed(-r1 * r2)} = 0$`, `$x^2 ${term(r1 * r2, 'x')} ${signed(r1 + r2)} = 0$`, `$x^2 ${term(r1 + r2, 'x')} ${signed(-r1 * r2)} = 0$`], n,
        `По теореме Виета: $p = -(x_1 + x_2) = ${-(r1 + r2)}$, $q = x_1x_2 = ${r1 * r2}$.`)
    },
  },
  {
    topic: 'Дробно-рациональные уравнения',
    gen: n => {
      const x = rnd(-5, 9), b = rnd(1, 6), c = pick([2, 3, -1, -2])
      if (x === b) return num('Решите уравнение $\\frac{x + 1}{x - 2} = 4$.', 3, [-3, 2, 1], n, '', '$x + 1 = 4x - 8$, $x = 3$; $x \\ne 2$.')
      const a = c * (x - b) - x
      return num(`Решите уравнение $\\frac{x ${signed(a)}}{x ${signed(-b)}} = ${c}$.`,
        x, [b, -x, x + c], n, '',
        `ОДЗ: $x \\ne ${b}$. $x ${signed(a)} = ${c}(x - ${b})$ $\\Rightarrow$ $x = ${x}$ — удовлетворяет ОДЗ.`)
    },
  },
  {
    topic: 'Биквадратные уравнения',
    gen: n => {
      const [p, q] = distinct(2, 1, 5)
      const B = p * p + q * q, C = p * p * q * q
      return num(`Найдите произведение всех корней уравнения $x^4 - ${B}x^2 + ${C} = 0$.`,
        C, [-C, p * q, B, 0], n, '',
        `Замена $t = x^2$: $t^2 - ${B}t + ${C} = 0$, $t = ${p * p}$ или $t = ${q * q}$. Корни $\\pm${p}$, $\\pm${q}$; произведение $(${p})(-${p})(${q})(-${q}) = ${C}$.`)
    },
  },
  {
    topic: 'Биквадратные уравнения',
    gen: n => {
      const p = rnd(1, 5), q = rnd(1, 5)
      return num(`Сколько действительных корней имеет уравнение $x^4 ${term(-(p * p - q), 'x^2')} ${signed(-p * p * q)} = 0$?`,
        2, [4, 0, 1, 3], n, '',
        `Замена $t = x^2 \\ge 0$: $(t - ${p * p})(t + ${q}) = 0$. Подходит только $t = ${p * p}$, значит $x = \\pm ${p}$ — два корня.`)
    },
  },
  {
    topic: 'Иррациональные уравнения',
    gen: n => {
      const b = rnd(2, 6), a = rnd(-9, 9)
      const x = b * b - a
      return num(`Решите уравнение $\\sqrt{x ${signed(a)}} = ${b}$.`,
        x, [b - a, b * b + a, Math.sqrt(Math.abs(b - a)) * b], n, '',
        `Возведём в квадрат: $x ${signed(a)} = ${b * b}$, $x = ${x}$. Проверка: $\\sqrt{${b * b}} = ${b}$ ✓.`)
    },
  },
  {
    topic: 'Иррациональные уравнения',
    gen: n => {
      const r = rnd(2, 6) // корень
      const a = r * r - r // x + a = x²
      return num(`Решите уравнение $\\sqrt{x + ${a}} = x$.`,
        r, [1 - r, -r, r * r], n, '',
        `$x + ${a} = x^2$, $x^2 - x - ${a} = 0$: $x = ${r}$ или $x = ${1 - r}$. Так как $\\sqrt{\\ } \\ge 0$, нужно $x \\ge 0$: подходит только $x = ${r}$.`)
    },
  },

  // ---------- Тригонометрические уравнения и неравенства ----------
  {
    topic: 'Простейшие тригонометрические уравнения',
    gen: n => {
      const items = [
        { e: '\\sin x = \\frac{1}{2}', v: '(-1)^k\\frac{\\pi}{6} + \\pi k', w: ['\\pm\\frac{\\pi}{6} + 2\\pi k', '\\frac{\\pi}{6} + \\pi k', '(-1)^k\\frac{\\pi}{3} + \\pi k'] },
        { e: '\\cos x = \\frac{\\sqrt{2}}{2}', v: '\\pm\\frac{\\pi}{4} + 2\\pi k', w: ['(-1)^k\\frac{\\pi}{4} + \\pi k', '\\frac{\\pi}{4} + \\pi k', '\\pm\\frac{\\pi}{4} + \\pi k'] },
        { e: '\\mathrm{tg}\\, x = \\sqrt{3}', v: '\\frac{\\pi}{3} + \\pi k', w: ['\\frac{\\pi}{6} + \\pi k', '\\pm\\frac{\\pi}{3} + 2\\pi k', '\\frac{\\pi}{3} + 2\\pi k'] },
        { e: '\\cos x = 0', v: '\\frac{\\pi}{2} + \\pi k', w: ['\\pi k', '2\\pi k', '\\frac{\\pi}{2} + 2\\pi k'] },
        { e: '\\sin x = -1', v: '-\\frac{\\pi}{2} + 2\\pi k', w: ['\\frac{\\pi}{2} + 2\\pi k', '\\pi + 2\\pi k', '-\\frac{\\pi}{2} + \\pi k'] },
        { e: '2\\cos x = -1', v: '\\pm\\frac{2\\pi}{3} + 2\\pi k', w: ['\\pm\\frac{\\pi}{3} + 2\\pi k', '(-1)^k\\frac{2\\pi}{3} + \\pi k', '\\pm\\frac{2\\pi}{3} + \\pi k'] },
      ]
      const it = pick(items)
      return txt(`Решите уравнение $${it.e}$ ($k \\in \\mathbb{Z}$).`, `$${it.v}$`, [...it.w.map(w => `$${w}$`), '$\\pi k$'], n,
        'Формулы: $\\sin x = a \\Rightarrow x = (-1)^k\\arcsin a + \\pi k$; $\\cos x = a \\Rightarrow x = \\pm\\arccos a + 2\\pi k$; $\\mathrm{tg}\\, x = a \\Rightarrow x = \\mathrm{arctg}\\, a + \\pi k$.')
    },
  },
  {
    topic: 'Тригонометрические уравнения: разложение на множители',
    gen: n => {
      const items = [
        { e: '\\sin 2x - \\sin x = 0 \\ \\text{на}\\ [0; \\pi]', v: '3', s: '$\\sin x(2\\cos x - 1) = 0$: $x = 0, \\pi, \\frac{\\pi}{3}$.' },
        { e: '\\sin x \\cos x = 0 \\ \\text{на}\\ [0; 2\\pi)', v: '4', s: '$\\sin x = 0$ или $\\cos x = 0$: $0, \\frac{\\pi}{2}, \\pi, \\frac{3\\pi}{2}$.' },
        { e: '2\\sin^2 x - \\sin x = 0 \\ \\text{на}\\ [0; \\pi]', v: '4', s: '$\\sin x(2\\sin x - 1) = 0$: $0, \\pi, \\frac{\\pi}{6}, \\frac{5\\pi}{6}$.' },
        { e: '\\cos 2x + \\cos x = 0 \\ \\text{на}\\ [0; \\pi]', v: '2', s: '$2\\cos^2 x + \\cos x - 1 = 0$: $\\cos x = \\frac{1}{2}$ или $-1$: $\\frac{\\pi}{3}, \\pi$.' },
      ]
      const it = pick(items)
      return num(`Сколько корней имеет уравнение $${it.e}$?`, Number(it.v), [1, 2, 3, 4, 5].filter(x => x !== Number(it.v)), n, '', it.s)
    },
  },
  {
    topic: 'Однородные уравнения. Метод вспомогательного угла',
    gen: n => {
      const items = [
        { e: '\\sin x - \\sqrt{3}\\cos x = 0', v: '\\frac{\\pi}{3} + \\pi k', w: ['\\frac{\\pi}{6} + \\pi k', '-\\frac{\\pi}{3} + \\pi k', '\\pm\\frac{\\pi}{3} + 2\\pi k'], s: 'Делим на $\\cos x \\ne 0$: $\\mathrm{tg}\\, x = \\sqrt{3}$.' },
        { e: '\\sin x + \\cos x = 0', v: '-\\frac{\\pi}{4} + \\pi k', w: ['\\frac{\\pi}{4} + \\pi k', '\\pm\\frac{\\pi}{4} + 2\\pi k', '\\frac{3\\pi}{4} + 2\\pi k'], s: 'Делим на $\\cos x$: $\\mathrm{tg}\\, x = -1$.' },
        { e: '\\sin x + \\cos x = \\sqrt{2}', v: '\\frac{\\pi}{4} + 2\\pi k', w: ['\\frac{\\pi}{4} + \\pi k', '-\\frac{\\pi}{4} + 2\\pi k', '\\frac{\\pi}{2} + 2\\pi k'], s: '$\\sqrt{2}\\sin(x + \\frac{\\pi}{4}) = \\sqrt{2}$, $\\sin(x + \\frac{\\pi}{4}) = 1$.' },
        { e: '\\sqrt{3}\\sin x + \\cos x = 2', v: '\\frac{\\pi}{3} + 2\\pi k', w: ['\\frac{\\pi}{6} + 2\\pi k', '\\frac{\\pi}{3} + \\pi k', '-\\frac{\\pi}{3} + 2\\pi k'], s: '$2\\sin(x + \\frac{\\pi}{6}) = 2$, $x + \\frac{\\pi}{6} = \\frac{\\pi}{2} + 2\\pi k$.' },
      ]
      const it = pick(items)
      return txt(`Решите уравнение $${it.e}$ ($k \\in \\mathbb{Z}$).`, `$${it.v}$`, [...it.w.map(w => `$${w}$`), '$\\pi k$'], n, it.s)
    },
  },
  {
    topic: 'Тригонометрические неравенства',
    gen: n => {
      const items = [
        { e: '\\sin x > \\frac{1}{2}', v: '\\left(\\frac{\\pi}{6} + 2\\pi k;\\ \\frac{5\\pi}{6} + 2\\pi k\\right)', w: ['\\left(-\\frac{\\pi}{6} + 2\\pi k;\\ \\frac{\\pi}{6} + 2\\pi k\\right)', '\\left(\\frac{\\pi}{3} + 2\\pi k;\\ \\frac{2\\pi}{3} + 2\\pi k\\right)', '\\left(\\frac{\\pi}{6} + \\pi k;\\ \\frac{5\\pi}{6} + \\pi k\\right)'] },
        { e: '\\cos x \\ge \\frac{1}{2}', v: '\\left[-\\frac{\\pi}{3} + 2\\pi k;\\ \\frac{\\pi}{3} + 2\\pi k\\right]', w: ['\\left[\\frac{\\pi}{3} + 2\\pi k;\\ \\frac{5\\pi}{3} + 2\\pi k\\right]', '\\left[-\\frac{\\pi}{6} + 2\\pi k;\\ \\frac{\\pi}{6} + 2\\pi k\\right]', '\\left[-\\frac{\\pi}{3} + \\pi k;\\ \\frac{\\pi}{3} + \\pi k\\right]'] },
        { e: '\\mathrm{tg}\\, x < 1', v: '\\left(-\\frac{\\pi}{2} + \\pi k;\\ \\frac{\\pi}{4} + \\pi k\\right)', w: ['\\left(\\frac{\\pi}{4} + \\pi k;\\ \\frac{\\pi}{2} + \\pi k\\right)', '\\left(-\\frac{\\pi}{4} + \\pi k;\\ \\frac{\\pi}{4} + \\pi k\\right)', '\\left(0 + \\pi k;\\ \\frac{\\pi}{4} + \\pi k\\right)'] },
      ]
      const it = pick(items)
      return txt(`Решите неравенство $${it.e}$ ($k \\in \\mathbb{Z}$).`, `$${it.v}$`, [...it.w.map(w => `$${w}$`), '$\\varnothing$'], n,
        'Удобно решать по единичной окружности (для tg — по графику), отмечая дугу, где выполняется неравенство, и добавляя период.')
    },
  },

  // ---------- Показательные и логарифмические ----------
  {
    topic: 'Свойства логарифмов',
    gen: n => {
      const items = [
        () => { const a = pick([2, 3, 5]), k = rnd(2, 5); return { e: `\\log_{${a}} ${a ** k}`, v: k } },
        () => { const a = pick([2, 3]), k = rnd(1, 4); return { e: `\\log_{${a}} \\frac{1}{${a ** k}}`, v: -k } },
        () => { const a = pick([2, 3, 5]), b = rnd(2, 9); return { e: `${a}^{\\log_{${a}} ${b}}`, v: b } },
        () => { const k = rnd(1, 4); return { e: `\\lg 10^{${k}} + \\log_2 8`, v: k + 3 } },
        () => { const a = pick([2, 3]), x = rnd(2, 5), y = a ** rnd(2, 4); return { e: `\\log_{${a}} ${x * y} - \\log_{${a}} ${x}`, v: Math.round(Math.log(y) / Math.log(a)) } },
        () => { const k = rnd(2, 4); return { e: `\\log_{4} ${2 ** (2 * k)} + \\log_{9} 3`, v: k + 0.5 } },
      ]
      const it = pick(items)()
      return num(`Вычислите $${it.e}$.`, it.v, [-it.v, it.v + 1, it.v * 2, it.v - 1], n, '',
        'Свойства: $\\log_a a^k = k$, $a^{\\log_a b} = b$, $\\log_a x - \\log_a y = \\log_a\\frac{x}{y}$.')
    },
  },
  {
    topic: 'Показательные уравнения',
    gen: n => {
      const a = pick([2, 3, 5]), k = rnd(1, 3), x = rnd(-2, 4), m = rnd(-3, 3)
      const p = k * x + m
      if (p < 0 || p > 6) return num('Решите уравнение $2^{x + 1} = 16$.', 3, [4, 8, 7], n, '', '$2^{x+1} = 2^4$, $x + 1 = 4$, $x = 3$.')
      return num(`Решите уравнение $${a}^{${k === 1 ? '' : k}x ${signed(m)}} = ${a ** p}$.`,
        x, [p, (p + m) / k, x + 1], n, '',
        `$${a ** p} = ${a}^{${p}}$, значит $${k === 1 ? '' : k}x ${signed(m)} = ${p}$, $x = ${x}$.`)
    },
  },
  {
    topic: 'Показательные уравнения',
    gen: n => {
      const t = pick([2, 4, 8]), s = t === 2 ? 1 : t === 4 ? 2 : 3
      const b = -(t + 1), c = t
      return num(`Найдите сумму корней уравнения $4^x ${signed(b)} \\cdot 2^x ${signed(c)} = 0$.`,
        s, [t + 1, t, s + 1], n, '',
        `Замена $t = 2^x > 0$: $t^2 ${signed(b)}t ${signed(c)} = 0$, $t = 1$ или $t = ${t}$. Тогда $x = 0$ или $x = ${s}$; сумма $${s}$.`)
    },
  },
  {
    topic: 'Логарифмические уравнения',
    gen: n => {
      const a = pick([2, 3, 5]), c = rnd(1, 3), b = rnd(-5, 5)
      const x = a ** c - b
      return num(`Решите уравнение $\\log_{${a}}(x ${signed(b)}) = ${c}$.`,
        x, [a * c - b, a ** c + b, c ** a - b], n, '',
        `По определению логарифма $x ${signed(b)} = ${a}^{${c}} = ${a ** c}$, $x = ${x}$. ОДЗ: $x ${signed(b)} > 0$ — выполнено.`)
    },
  },
  {
    topic: 'Логарифмические уравнения',
    gen: n => {
      const r = pick([2, 3, 4])
      return num(`Решите уравнение $\\log_2 x + \\log_2(x + ${r * r - r > 0 ? 1 : 1}) = \\log_2 ${r * (r + 1)}$.`,
        r, [-(r + 1), r + 1, r * (r + 1)], n, '',
        `$\\log_2(x(x + 1)) = \\log_2 ${r * (r + 1)}$, $x^2 + x - ${r * (r + 1)} = 0$: $x = ${r}$ или $x = ${-(r + 1)}$. По ОДЗ $x > 0$, ответ $${r}$.`)
    },
  },
  {
    topic: 'Показательные неравенства',
    gen: n => {
      const flip = Math.random() < 0.5
      const k = rnd(1, 4)
      if (flip) {
        return txt(`Решите неравенство $\\left(\\frac{1}{3}\\right)^x < 3^{${k}}$.`,
          interval(`-${k}`, '+\\infty', '(', ')'), [interval('-\\infty', `-${k}`, '(', ')'), interval(`${k}`, '+\\infty', '(', ')'), interval('-\\infty', `${k}`, '(', ')')], n,
          `$3^{-x} < 3^{${k}}$, основание больше 1: $-x < ${k}$, $x > -${k}$.`)
      }
      return txt(`Решите неравенство $2^x > ${2 ** k}$.`,
        interval(`${k}`, '+\\infty', '(', ')'), [interval('-\\infty', `${k}`, '(', ')'), interval(`${2 ** k}`, '+\\infty', '(', ')'), interval(`${k}`, '+\\infty', '[', ')')], n,
        `$2^x > 2^{${k}}$, основание $2 > 1$, знак сохраняется: $x > ${k}$.`)
    },
  },
  {
    topic: 'Логарифмические неравенства',
    gen: n => {
      const a = rnd(-3, 4), c = rnd(1, 3)
      const up = a + 2 ** c
      return txt(`Решите неравенство $\\log_2(x ${signed(-a)}) < ${c}$.`,
        interval(`${a}`, `${up}`, '(', ')'), [interval('-\\infty', `${up}`, '(', ')'), interval(`${a}`, `${a + 2 * c}`, '(', ')'), interval(`${up}`, '+\\infty', '(', ')'), interval(`${a}`, `${up}`, '[', ']'), interval(`${a}`, `${up + 1}`, '(', ')')], n,
        `ОДЗ: $x > ${a}$. $x - ${a} < 2^{${c}} = ${2 ** c}$, $x < ${up}$. Ответ: $(${a}; ${up})$.`)
    },
  },

  // ---------- Системы уравнений ----------
  {
    topic: 'Системы линейных уравнений',
    gen: n => {
      const x = rnd(-4, 6), y = rnd(-4, 6), a = rnd(1, 4), b = rnd(1, 4), c = rnd(1, 4), d = -rnd(1, 4)
      return num(`Решите систему $\\begin{cases} ${a}x + ${b}y = ${a * x + b * y} \\\\ ${c}x ${term(d, 'y')} = ${c * x + d * y} \\end{cases}$. В ответе укажите $x + y$.`,
        x + y, [x - y, x * y, x + y + 1], n, '',
        `Решение системы: $x = ${x}$, $y = ${y}$ (метод подстановки или сложения). $x + y = ${x + y}$.`)
    },
  },
  {
    topic: 'Системы нелинейных уравнений',
    gen: n => {
      const [x, y] = distinct(2, 1, 7)
      const s = x + y, p = x * y
      return num(`Известно, что $x + y = ${s}$ и $xy = ${p}$. Найдите $x^2 + y^2$.`,
        s * s - 2 * p, [s * s + 2 * p, s * s, s * s - p], n, '',
        `$x^2 + y^2 = (x + y)^2 - 2xy = ${s * s} - ${2 * p} = ${s * s - 2 * p}$.`)
    },
  },
  {
    topic: 'Системы показательных и логарифмических уравнений',
    gen: n => {
      const x = rnd(1, 5), y = rnd(0, 4)
      return num(`Решите систему $\\begin{cases} 2^x \\cdot 2^y = ${2 ** (x + y)} \\\\ x - y = ${x - y} \\end{cases}$. В ответе укажите $xy$.`,
        x * y, [x + y, x * y + 1, (x + y) * (x - y)], n, '',
        `$2^{x+y} = 2^{${x + y}}$, значит $x + y = ${x + y}$. Вместе с $x - y = ${x - y}$: $x = ${x}$, $y = ${y}$, $xy = ${x * y}$.`)
    },
  },

  // ---------- Неравенства ----------
  {
    topic: 'Числовые промежутки: объединение и пересечение',
    gen: n => {
      const [a, b, c, d] = [rnd(-6, 0), rnd(2, 6), rnd(-2, 3), rnd(7, 10)].sort((p, q) => p - q)
      return txt(`Найдите пересечение промежутков $[${a}; ${c}]$ и $(${b}; ${d})$.`,
        b < c ? interval(`${b}`, `${c}`, '(', ']') : '$\\varnothing$',
        [interval(`${a}`, `${d}`, '[', ')'), interval(`${b}`, `${c}`, '[', ')'), interval(`${a}`, `${b}`, '[', ']'), '$\\varnothing$'], n,
        'Пересечение — точки, которые принадлежат обоим промежуткам. Скобку берём от того промежутка, чья граница строже.')
    },
  },
  {
    topic: 'Линейные неравенства',
    gen: n => {
      const a = -rnd(2, 5), x0 = rnd(-4, 5), b = rnd(-8, 8)
      const c = a * x0 + b
      return txt(`Решите неравенство $${a}x ${signed(b)} > ${c}$.`,
        interval('-\\infty', `${x0}`, '(', ')'), [interval(`${x0}`, '+\\infty', '(', ')'), interval('-\\infty', `${-x0}`, '(', ')'), interval(`${x0}`, '+\\infty', '[', ')'), interval('-\\infty', `${x0}`, '(', ']'), interval('-\\infty', `${x0 + 1}`, '(', ')')], n,
        `$${a}x > ${c - b}$. Делим на отрицательное число $${a}$ — знак меняется: $x < ${x0}$.`)
    },
  },
  {
    topic: 'Квадратные неравенства',
    gen: n => {
      const [r1, r2] = distinct(2, -6, 7).sort((p, q) => p - q)
      const B = -(r1 + r2), C = r1 * r2
      const less = Math.random() < 0.5
      const inside = interval(`${r1}`, `${r2}`, '(', ')')
      const outside = `$(-\\infty; ${r1}) \\cup (${r2}; +\\infty)$`
      return txt(`Решите неравенство $x^2 ${term(B, 'x')} ${signed(C)} ${less ? '<' : '>'} 0$.`,
        less ? inside : outside, [less ? outside : inside, interval(`${-r2}`, `${-r1}`, '(', ')'), interval(`${r1}`, `${r2}`, '[', ']'), `$(-\\infty; ${r1}] \\cup [${r2}; +\\infty)$`, interval(`${r1}`, '+\\infty', '(', ')')], n,
        `Корни $${r1}$ и $${r2}$, ветви параболы вверх: ${less ? 'отрицательна между корнями' : 'положительна вне отрезка между корнями'}.`)
    },
  },
  {
    topic: 'Рациональные неравенства. Метод интервалов',
    gen: n => {
      const [a, b] = distinct(2, -5, 6).sort((p, q) => p - q)
      const cnt = b - a // целые в [a; b)
      return num(`Сколько целых решений имеет неравенство $\\frac{x ${signed(-a)}}{x ${signed(-b)}} \\le 0$?`,
        cnt, [cnt + 1, cnt - 1, b - a - 2 > 0 ? b - a - 2 : cnt + 2], n, '',
        `Метод интервалов: дробь $\\le 0$ на $[${a}; ${b})$ — точку $${b}$ исключаем (знаменатель). Целые: от $${a}$ до $${b - 1}$, их $${cnt}$.`)
    },
  },
  {
    topic: 'Иррациональные неравенства',
    gen: n => {
      const a = rnd(-4, 4), b = rnd(1, 4)
      return txt(`Решите неравенство $\\sqrt{x ${signed(-a)}} < ${b}$.`,
        interval(`${a}`, `${a + b * b}`, '[', ')'), [interval('-\\infty', `${a + b * b}`, '(', ')'), interval(`${a}`, `${a + b}`, '[', ')'), interval(`${a}`, `${a + b * b}`, '(', ')'), interval(`${a + b * b}`, '+\\infty', '(', ')'), interval(`${a}`, `${a + b * b}`, '[', ']')], n,
        `Условие существования: $x \\ge ${a}$. Возводим в квадрат: $x - ${a} < ${b * b}$, $x < ${a + b * b}$.`)
    },
  },
  {
    topic: 'Системы неравенств',
    gen: n => {
      const a = rnd(-5, 2), b = a + rnd(3, 7)
      return num(`Сколько целых решений имеет система $\\begin{cases} 2x ${signed(-2 * a)} \\ge 0 \\\\ x < ${b} \\end{cases}$?`,
        b - a, [b - a + 1, b - a - 1, b], n, '',
        `Первое неравенство: $x \\ge ${a}$. Вместе: $${a} \\le x < ${b}$. Целых чисел $${b - a}$.`)
    },
  },

  // ---------- Прогрессии ----------
  {
    topic: 'Арифметическая прогрессия',
    gen: n => {
      const a1 = rnd(-10, 10), d = pick([-3, -2, 2, 3, 4, 5]), k = rnd(8, 25)
      const ak = a1 + (k - 1) * d
      return num(`В арифметической прогрессии $a_1 = ${a1}$, $d = ${d}$. Найдите $a_{${k}}$.`,
        ak, [a1 + k * d, a1 * d * k, a1 + (k - 2) * d], n, '',
        `$a_n = a_1 + (n - 1)d = ${a1} + ${k - 1} \\cdot (${d}) = ${ak}$.`)
    },
  },
  {
    topic: 'Арифметическая прогрессия',
    gen: n => {
      const a1 = rnd(1, 10), d = rnd(1, 5), k = pick([10, 12, 15, 20])
      const S = (2 * a1 + (k - 1) * d) * k / 2
      return num(`Найдите сумму первых ${k} членов арифметической прогрессии, у которой $a_1 = ${a1}$, $d = ${d}$.`,
        S, [(2 * a1 + k * d) * k / 2, (a1 + (k - 1) * d) * k, S / 2], n, '',
        `$S_n = \\frac{2a_1 + (n - 1)d}{2} \\cdot n = \\frac{${2 * a1} + ${(k - 1) * d}}{2} \\cdot ${k} = ${S}$.`)
    },
  },
  {
    topic: 'Арифметическая прогрессия',
    gen: n => {
      const a = rnd(1, 20), d = rnd(2, 9)
      return num(`Числа $${a}$, $x$, $${a + 2 * d}$ образуют арифметическую прогрессию. Найдите $x$.`,
        a + d, [Math.sqrt(a * (a + 2 * d)), a + 2 * d - a, d], n, '',
        `Характеристическое свойство: $x = \\frac{${a} + ${a + 2 * d}}{2} = ${a + d}$.`)
    },
  },
  {
    topic: 'Геометрическая прогрессия',
    gen: n => {
      const b1 = pick([1, 2, 3, -2]), q = pick([2, 3, -2]), k = rnd(4, 7)
      const bk = b1 * q ** (k - 1)
      return num(`В геометрической прогрессии $b_1 = ${b1}$, $q = ${q}$. Найдите $b_{${k}}$.`,
        bk, [b1 * q ** k, b1 * q * (k - 1), -bk], n, '',
        `$b_n = b_1q^{n-1} = ${b1} \\cdot (${q})^{${k - 1}} = ${bk}$.`)
    },
  },
  {
    topic: 'Геометрическая прогрессия',
    gen: n => {
      const b1 = pick([1, 2, 3]), q = pick([2, 3]), k = rnd(4, 6)
      const S = b1 * (q ** k - 1) / (q - 1)
      return num(`Найдите сумму первых ${k} членов геометрической прогрессии с $b_1 = ${b1}$ и $q = ${q}$.`,
        S, [b1 * q ** (k - 1), b1 * (q ** (k + 1) - 1) / (q - 1), b1 * q * k], n, '',
        `$S_n = \\frac{b_1(q^n - 1)}{q - 1} = \\frac{${b1}(${q ** k} - 1)}{${q - 1}} = ${S}$.`)
    },
  },
  {
    topic: 'Бесконечно убывающая геометрическая прогрессия',
    gen: n => {
      const b1 = pick([3, 6, 8, 12, 24]), k = pick([2, 3, 4])
      const S = b1 / (1 - 1 / k)
      return num(`Найдите сумму бесконечно убывающей геометрической прогрессии с $b_1 = ${b1}$ и $q = \\frac{1}{${k}}$.`,
        S, [b1 / (1 + 1 / k), b1 * k, b1 + b1 / k], n, '',
        `$S = \\frac{b_1}{1 - q} = \\frac{${b1}}{1 - \\frac{1}{${k}}} = ${fx(S)}$.`)
    },
  },

  // ---------- Функции и графики ----------
  {
    topic: 'Область определения функции',
    gen: n => {
      const a = rnd(-5, 5), b = a + rnd(1, 6)
      return txt(`Найдите область определения функции $y = \\sqrt{x ${signed(-a)}} + \\frac{1}{x ${signed(-b)}}$.`,
        `$[${a}; ${b}) \\cup (${b}; +\\infty)$`, [interval(`${a}`, '+\\infty', '[', ')'), `$(${a}; ${b}) \\cup (${b}; +\\infty)$`, interval('-\\infty', `${a}`, '(', ']')], n,
        `Под корнем: $x \\ge ${a}$; знаменатель не ноль: $x \\ne ${b}$.`)
    },
  },
  {
    topic: 'Область определения функции',
    gen: n => {
      const a = rnd(1, 6)
      return txt(`Найдите область определения функции $y = \\log_2(${a * a} - x^2)$.`,
        interval(`-${a}`, `${a}`, '(', ')'), [interval(`-${a}`, `${a}`, '[', ']'), `$(-\\infty; -${a}) \\cup (${a}; +\\infty)$`, interval('0', `${a}`, '(', ')')], n,
        `Аргумент логарифма положителен: $${a * a} - x^2 > 0$, $|x| < ${a}$.`)
    },
  },
  {
    topic: 'Множество значений функции',
    gen: n => {
      const a = rnd(2, 5) * pick([1, -1]), b = rnd(-4, 4)
      const lo = b - Math.abs(a), hi = b + Math.abs(a)
      return txt(`Найдите множество значений функции $y = ${lead(a, '\\sin x')} ${signed(b)}$.`,
        interval(`${lo}`, `${hi}`, '[', ']'), [interval(`${-Math.abs(a)}`, `${Math.abs(a)}`, '[', ']'), interval(`${b - 1}`, `${b + 1}`, '[', ']'), interval(`${lo}`, `${hi}`, '(', ')'), interval(`${b}`, `${hi}`, '[', ']'), interval(`${lo - 1}`, `${hi + 1}`, '[', ']')], n,
        `$\\sin x \\in [-1; 1]$, поэтому $${a}\\sin x \\in [${-Math.abs(a)}; ${Math.abs(a)}]$ и $y \\in [${lo}; ${hi}]$.`)
    },
  },
  {
    topic: 'Множество значений функции',
    gen: n => {
      const p = rnd(-4, 4), q = rnd(-5, 5)
      return txt(`Найдите множество значений функции $y = (x ${signed(-p)})^2 ${signed(q)}$.`,
        interval(`${q}`, '+\\infty', '[', ')'), [interval(`${p}`, '+\\infty', '[', ')'), interval('-\\infty', `${q}`, '(', ']'), interval(`${q}`, '+\\infty', '(', ')'), interval(`${-q}`, '+\\infty', '[', ')'), interval(`${q + p + 1}`, '+\\infty', '[', ')'), '$(-\\infty;\\ +\\infty)$'], n,
        `$(x - ${p})^2 \\ge 0$, наименьшее значение $${q}$ при $x = ${p}$.`)
    },
  },
  {
    topic: 'Нули функции. Пересечение с осями',
    gen: n => {
      const [r1, r2] = distinct(2, -6, 6)
      const B = -(r1 + r2), C = r1 * r2
      return num(`Найдите сумму нулей функции $y = x^2 ${term(B, 'x')} ${signed(C)}$.`,
        r1 + r2, [B, C, r1 * r2 + 1], n, '',
        `Нули — корни уравнения $x^2 ${term(B, 'x')} ${signed(C)} = 0$: $${r1}$ и $${r2}$, сумма $${r1 + r2}$.`)
    },
  },
  {
    topic: 'Нули функции. Пересечение с осями',
    gen: n => {
      const a = rnd(1, 4), b = rnd(-6, 6), c = rnd(-9, 9)
      return num(`В какой точке график функции $y = ${a}x^2 ${term(b, 'x')} ${signed(c)}$ пересекает ось $Oy$? Укажите ординату.`,
        c, [a, b, a + b + c], n, '',
        `На оси $Oy$ $x = 0$, значит $y = ${c}$.`)
    },
  },
  {
    topic: 'Квадратичная функция',
    gen: n => {
      const a = pick([1, 2, -1, 3]), x0 = rnd(-4, 4), y0 = rnd(-6, 6)
      const b = -2 * a * x0, c = a * x0 * x0 + y0
      return txt(`Найдите координаты вершины параболы $y = ${a === 1 ? '' : a === -1 ? '-' : a}x^2 ${term(b, 'x')} ${signed(c)}$.`,
        `$(${x0}; ${y0})$`, [`$(${-x0}; ${y0})$`, `$(${x0}; ${c})$`, `$(${y0}; ${x0})$`, `$(${-x0}; ${-y0})$`, `$(${x0 + 1}; ${y0})$`, `$(${x0}; ${y0 + 1})$`, `$(${x0 - 1}; ${y0 - 1})$`], n,
        `$x_0 = -\\frac{b}{2a} = ${x0}$, $y_0 = y(${x0}) = ${y0}$.`)
    },
  },
  {
    topic: 'Чётность и периодичность',
    gen: n => {
      const items = [
        { q: 'Какая из функций чётная?', v: 'y = x^4 - 3x^2', w: ['y = x^3 + x', 'y = x^2 + x', 'y = \\sin x', 'y = 2^x'] },
        { q: 'Какая из функций нечётная?', v: 'y = x^3 - \\sin x', w: ['y = \\cos x', 'y = x^2 + 1', 'y = |x|', 'y = x^3 + 1'] },
        { q: 'Найдите наименьший положительный период функции $y = \\sin 3x$.', v: '\\frac{2\\pi}{3}', w: ['2\\pi', '3\\pi', '\\frac{\\pi}{3}', '6\\pi'] },
        { q: 'Найдите наименьший положительный период функции $y = \\mathrm{tg}\\, 2x$.', v: '\\frac{\\pi}{2}', w: ['\\pi', '2\\pi', '\\frac{\\pi}{4}', '4\\pi'] },
        { q: 'Найдите наименьший положительный период функции $y = \\cos\\frac{x}{2}$.', v: '4\\pi', w: ['\\pi', '2\\pi', '\\frac{\\pi}{2}', '8\\pi'] },
      ]
      const it = pick(items)
      return txt(it.q, `$${it.v}$`, it.w.map(w => `$${w}$`), n,
        'Чётная: $f(-x) = f(x)$, нечётная: $f(-x) = -f(x)$. Период $\\sin kx$ и $\\cos kx$ равен $\\frac{2\\pi}{|k|}$, у $\\mathrm{tg}\\, kx$ — $\\frac{\\pi}{|k|}$.')
    },
  },
  {
    topic: 'Обратная и сложная функция',
    gen: n => {
      const a = pick([2, 3, 4, 5]), b = pick([-5, -3, -2, -1, 1, 2, 3, 5])
      return txt(`Найдите функцию, обратную к $y = ${a}x ${signed(b)}$.`,
        `$y = \\frac{x ${signed(-b)}}{${a}}$`, [`$y = \\frac{x ${signed(b)}}{${a}}$`, `$y = ${a}x ${signed(-b)}$`, `$y = \\frac{1}{${a}x ${signed(b)}}$`, `$y = \\frac{x}{${a}} ${signed(b)}$`], n,
        `Выразим $x$: $x = \\frac{y ${signed(-b)}}{${a}}$, затем поменяем $x$ и $y$ местами.`)
    },
  },
  {
    topic: 'Обратная и сложная функция',
    gen: n => {
      const a = rnd(1, 3), b = rnd(-3, 3), x0 = rnd(-2, 3)
      const g = a * x0 + b
      return num(`Даны $f(x) = x^2 + 1$ и $g(x) = ${a}x ${signed(b)}$. Найдите $f(g(${x0}))$.`,
        g * g + 1, [a * (x0 * x0 + 1) + b, g * g, (x0 * x0 + 1) * g], n, '',
        `$g(${x0}) = ${g}$, $f(${g}) = ${g * g} + 1 = ${g * g + 1}$.`)
    },
  },
  {
    topic: 'Пределы и асимптоты',
    gen: n => {
      const a = rnd(1, 6), b = rnd(1, 6), c = rnd(-5, 5), d = rnd(-5, 5)
      return txt(`Найдите $\\lim\\limits_{x \\to \\infty} \\frac{${a}x^2 ${term(c, 'x')} + 1}{${b}x^2 ${signed(d)}}$.`,
        `$${frac(a, b)}$`, [`$${frac(b, a)}$`, '$\\infty$', '$0$', `$${frac(c, d || 1)}$`, `$${frac(a + 1, b)}$`, `$-${frac(a, b)}$`], n,
        `Делим числитель и знаменатель на $x^2$: предел равен отношению старших коэффициентов $\\frac{${a}}{${b}}$.`)
    },
  },
  {
    topic: 'Пределы и асимптоты',
    gen: n => {
      const a = rnd(1, 7)
      return num(`Найдите $\\lim\\limits_{x \\to ${a}} \\frac{x^2 - ${a * a}}{x - ${a}}$.`,
        2 * a, [a, 0, a * a], n, '',
        `$\\frac{(x - ${a})(x + ${a})}{x - ${a}} = x + ${a} \\to ${2 * a}$.`)
    },
  },

  // ---------- Производная ----------
  {
    topic: 'Производная элементарных функций',
    gen: n => {
      const a = rnd(1, 5), k = rnd(2, 4), b = rnd(-6, 6), x0 = rnd(-2, 3)
      const v = a * k * x0 ** (k - 1) + b
      return num(`Найдите $f'(${x0})$, если $f(x) = ${a === 1 ? '' : a}x^{${k}} ${term(b, 'x')} ${signed(rnd(-9, 9))}$.`,
        v, [a * x0 ** k + b * x0, a * k * x0 ** k + b, a * k * x0 ** (k - 1)], n, '',
        `$f'(x) = ${a * k}x^{${k - 1}} ${signed(b)}$, $f'(${x0}) = ${a * k} \\cdot ${x0 ** (k - 1)} ${signed(b)} = ${v}$.`)
    },
  },
  {
    topic: 'Производная элементарных функций',
    gen: n => {
      const items = [
        { f: 'x\\sin x', d: '\\sin x + x\\cos x', w: ['\\cos x', 'x\\cos x', '\\sin x - x\\cos x'] },
        { f: 'e^x \\cos x', d: 'e^x(\\cos x - \\sin x)', w: ['-e^x\\sin x', 'e^x(\\cos x + \\sin x)', 'e^x\\cos x'] },
        { f: 'x^2 \\ln x', d: '2x\\ln x + x', w: ['\\frac{2x}{x}', '2x\\ln x', '2\\ln x + x'] },
        { f: '\\frac{\\ln x}{x}', d: '\\frac{1 - \\ln x}{x^2}', w: ['\\frac{1}{x^2}', '\\frac{\\ln x - 1}{x^2}', '\\frac{1 + \\ln x}{x^2}'] },
        { f: '\\mathrm{tg}\\, x', d: '\\frac{1}{\\cos^2 x}', w: ['-\\frac{1}{\\sin^2 x}', '\\frac{1}{\\sin^2 x}', '\\mathrm{ctg}\\, x'] },
        { f: '\\arcsin x', d: '\\frac{1}{\\sqrt{1 - x^2}}', w: ['-\\frac{1}{\\sqrt{1 - x^2}}', '\\frac{1}{1 + x^2}', '\\sqrt{1 - x^2}'] },
      ]
      const it = pick(items)
      return txt(`Найдите производную функции $f(x) = ${it.f}$.`, `$${it.d}$`, it.w.map(w => `$${w}$`), n,
        'Правила: $(uv)\' = u\'v + uv\'$, $\\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}$; табличные производные.')
    },
  },
  {
    topic: 'Производная сложной функции',
    gen: n => {
      const k = rnd(2, 4), m = rnd(-3, 3), p = rnd(2, 4), x0 = rnd(0, 2)
      const inner = k * x0 + m
      const v = p * k * inner ** (p - 1)
      return num(`Найдите $f'(${x0})$, если $f(x) = (${k}x ${signed(m)})^{${p}}$.`,
        v, [p * inner ** (p - 1), p * k * inner ** p, k * inner ** (p - 1)], n, '',
        `$f'(x) = ${p}(${k}x ${signed(m)})^{${p - 1}} \\cdot ${k}$. При $x = ${x0}$: $${p} \\cdot ${inner}^{${p - 1}} \\cdot ${k} = ${v}$.`)
    },
  },
  {
    topic: 'Уравнение касательной',
    gen: n => {
      const a = rnd(1, 3), b = rnd(-4, 4), x0 = rnd(-2, 3)
      const k = 2 * a * x0 + b
      return num(`Найдите угловой коэффициент касательной к графику $y = ${a === 1 ? '' : a}x^2 ${term(b, 'x')}$ в точке $x_0 = ${x0}$.`,
        k, [a * x0 * x0 + b * x0, 2 * a * x0, a * x0 + b], n, '',
        `Угловой коэффициент касательной равен производной: $y' = ${2 * a}x ${signed(b)}$, $y'(${x0}) = ${k}$.`)
    },
  },
  {
    topic: 'Уравнение касательной',
    gen: n => {
      const x0 = pick([-2, -1, 1, 2, 3])
      const y0 = x0 * x0, k = 2 * x0
      const bb = y0 - k * x0
      return txt(`Составьте уравнение касательной к графику $y = x^2$ в точке $x_0 = ${x0}$.`,
        `$y = ${lead(k, 'x')} ${signed(bb)}$`, [`$y = ${lead(k, 'x')} ${signed(y0)}$`, `$y = ${lead(x0, 'x')} ${signed(bb)}$`, `$y = ${lead(-k, 'x')} ${signed(bb)}$`, `$y = ${lead(y0, 'x')} ${signed(k)}$`, `$y = ${lead(k, 'x')} ${signed(2 * bb)}$`], n,
        `$y = f(x_0) + f'(x_0)(x - x_0) = ${y0} + ${k}(x - ${x0}) = ${k}x ${signed(bb)}$.`)
    },
  },
  {
    topic: 'Возрастание, убывание, экстремумы',
    gen: n => {
      const a = rnd(1, 4)
      return num(`Найдите точку максимума функции $y = x^3 - ${3 * a * a}x$.`,
        -a, [a, 0, -2 * a * a * a, 3 * a * a], n, '',
        `$y' = 3x^2 - ${3 * a * a} = 0 \\Rightarrow x = \\pm ${a}$. Производная меняет знак с «+» на «−» в точке $x = -${a}$ — это максимум.`)
    },
  },
  {
    topic: 'Возрастание, убывание, экстремумы',
    gen: n => {
      const p = rnd(-4, 4)
      return txt(`Найдите промежуток убывания функции $y = x^2 ${term(-2 * p, 'x')} + 5$.`,
        interval('-\\infty', `${p}`, '(', ']'), [interval(`${p}`, '+\\infty', '[', ')'), interval('-\\infty', `${-p}`, '(', ']'), interval('-\\infty', '+\\infty', '(', ')'), interval('-\\infty', `${p + 2}`, '(', ']'), interval(`${p - 2}`, '+\\infty', '[', ')')], n,
        `$y' = 2x ${signed(-2 * p)} \\le 0$ при $x \\le ${p}$.`)
    },
  },
  {
    topic: 'Наибольшее и наименьшее значение на отрезке',
    gen: n => {
      const a = rnd(1, 3), R = a + rnd(1, 2)
      const f = (x: number) => x ** 3 - 3 * a * a * x
      const vals = [f(0), f(a), f(R)]
      const min = Math.min(...vals), max = Math.max(...vals)
      const askMin = Math.random() < 0.5
      return num(`Найдите ${askMin ? 'наименьшее' : 'наибольшее'} значение функции $y = x^3 - ${3 * a * a}x$ на отрезке $[0; ${R}]$.`,
        askMin ? min : max, [askMin ? max : min, f(R), a, -a], n, '',
        `$y' = 3x^2 - ${3 * a * a} = 0$, на отрезке лежит $x = ${a}$. $y(0) = 0$, $y(${a}) = ${f(a)}$, $y(${R}) = ${f(R)}$. ${askMin ? 'Наименьшее' : 'Наибольшее'}: $${askMin ? min : max}$.`)
    },
  },
  {
    topic: 'Физический смысл производной',
    gen: n => {
      const a = rnd(1, 3), b = rnd(2, 5), c = rnd(1, 8), t = rnd(1, 4)
      const v = 3 * a * t * t + 2 * b * t + c
      return num(`Точка движется по закону $s(t) = ${a === 1 ? '' : a}t^3 + ${b}t^2 + ${c}t$ (м). Найдите её скорость в момент $t = ${t}$ с.`,
        v, [a * t ** 3 + b * t * t + c * t, 6 * a * t + 2 * b, 3 * a * t + 2 * b + c], n, 'м/с',
        `$v(t) = s'(t) = ${3 * a}t^2 + ${2 * b}t + ${c}$, $v(${t}) = ${v}$ м/с.`)
    },
  },
  {
    topic: 'Физический смысл производной',
    gen: n => {
      const a = rnd(1, 3), b = rnd(2, 5), t = rnd(1, 4)
      const acc = 6 * a * t + 2 * b
      return num(`Точка движется по закону $s(t) = ${a === 1 ? '' : a}t^3 + ${b}t^2$ (м). Найдите её ускорение в момент $t = ${t}$ с.`,
        acc, [3 * a * t * t + 2 * b * t, 6 * a + 2 * b, 6 * a * t], n, 'м/с²',
        `$a(t) = s''(t) = ${6 * a}t + ${2 * b}$, $a(${t}) = ${acc}$ м/с².`)
    },
  },

  // ---------- Интеграл ----------
  {
    topic: 'Первообразная. Табличные интегралы',
    gen: n => {
      const items = [
        { f: '3x^2 + 2x', F: 'x^3 + x^2 + C', w: ['6x + 2 + C', 'x^3 + 2x^2 + C', '3x^3 + x^2 + C'] },
        { f: '\\cos x', F: '\\sin x + C', w: ['-\\sin x + C', '\\cos x + C', '-\\cos x + C'] },
        { f: 'e^{2x}', F: '\\frac{1}{2}e^{2x} + C', w: ['2e^{2x} + C', 'e^{2x} + C', 'e^{x} + C'] },
        { f: '\\frac{1}{x}', F: '\\ln|x| + C', w: ['-\\frac{1}{x^2} + C', 'x + C', '\\frac{1}{x^2} + C'] },
        { f: '\\sin 3x', F: '-\\frac{1}{3}\\cos 3x + C', w: ['\\frac{1}{3}\\cos 3x + C', '-3\\cos 3x + C', '\\cos 3x + C'] },
        { f: '\\frac{1}{\\cos^2 x}', F: '\\mathrm{tg}\\, x + C', w: ['\\mathrm{ctg}\\, x + C', '-\\mathrm{tg}\\, x + C', '\\sin x + C'] },
      ]
      const it = pick(items)
      return txt(`Найдите общий вид первообразных для функции $f(x) = ${it.f}$.`, `$${it.F}$`, it.w.map(w => `$${w}$`), n,
        'Проверка: производная первообразной должна давать исходную функцию.')
    },
  },
  {
    topic: 'Определённый интеграл',
    gen: n => {
      const k = rnd(1, 3), a = 0, b = rnd(1, 3), c = rnd(1, 5)
      const v = k * b ** 3 + c * b - (k * a ** 3 + c * a)
      return num(`Вычислите $\\int\\limits_{${a}}^{${b}} (${3 * k}x^2 + ${c})\\,dx$.`,
        v, [6 * k * b, k * b ** 3, 3 * k * b ** 3 + c * b], n, '',
        `Первообразная $${k === 1 ? '' : k}x^3 + ${c}x$. По формуле Ньютона — Лейбница: $${k * b ** 3 + c * b} - 0 = ${v}$.`)
    },
  },
  {
    topic: 'Площадь криволинейной трапеции',
    gen: n => {
      const a = pick([3, 6])
      return num(`Найдите площадь фигуры, ограниченной линиями $y = x^2$, $y = 0$, $x = ${a}$.`,
        a ** 3 / 3, [a ** 3, a * a / 2, a ** 3 / 2], n, '',
        `$S = \\int\\limits_0^{${a}} x^2\\,dx = \\frac{x^3}{3}\\Big|_0^{${a}} = ${a ** 3 / 3}$.`)
    },
  },
  {
    topic: 'Площадь криволинейной трапеции',
    gen: n => {
      const k = pick([2, 3, 6])
      return num(`Найдите площадь фигуры, ограниченной параболой $y = x^2$ и прямой $y = ${k}x$.`,
        k ** 3 / 6, [k ** 3 / 3, k ** 3 / 2, k * k / 2], n, '',
        `Точки пересечения $x = 0$ и $x = ${k}$. $S = \\int\\limits_0^{${k}} (${k}x - x^2)\\,dx = \\frac{${k}x^2}{2} - \\frac{x^3}{3}\\Big|_0^{${k}} = ${fx(k ** 3 / 6)}$.`)
    },
  },
  {
    topic: 'Объём тела вращения',
    gen: n => {
      const a = pick([2, 4, 6])
      return txt(`Найдите объём тела, полученного вращением вокруг оси $Ox$ фигуры, ограниченной линиями $y = \\sqrt{x}$, $y = 0$, $x = ${a}$.`,
        `$${pi(a * a / 2)}$`, [`$${pi(a * a)}$`, `$${pi(Math.round(2 * a * Math.sqrt(a) / 3))}$`, `$${pi(a / 2)}$`, `$${pi(a ** 3 / 3)}$`], n,
        `$V = \\pi\\int\\limits_0^{${a}} (\\sqrt{x})^2\\,dx = \\pi\\frac{x^2}{2}\\Big|_0^{${a}} = ${a * a / 2}\\pi$.`)
    },
  },
  {
    topic: 'Дифференциальные уравнения',
    gen: n => {
      const k = rnd(2, 5), c = rnd(1, 6)
      return txt(`Найдите решение уравнения $y' = ${k}y$, удовлетворяющее условию $y(0) = ${c}$.`,
        `$y = ${c}e^{${k}x}$`, [`$y = ${k}e^{${c}x}$`, `$y = e^{${k}x} + ${c}$`, `$y = ${c}x^{${k}}$`, `$y = ${c * k}x$`], n,
        `Общее решение $y = Ce^{${k}x}$. Из $y(0) = C = ${c}$.`)
    },
  },
  {
    topic: 'Дифференциальные уравнения',
    gen: n => {
      const w = rnd(2, 5)
      return txt(`Укажите общее решение уравнения $y'' + ${w * w}y = 0$.`,
        `$y = C_1\\cos ${w}x + C_2\\sin ${w}x$`, [`$y = C_1e^{${w}x} + C_2e^{-${w}x}$`, `$y = C_1\\cos ${w * w}x + C_2\\sin ${w * w}x$`, `$y = (C_1 + C_2x)e^{${w}x}$`, `$y = C\\cos ${w}x$`], n,
        `Характеристическое уравнение $k^2 + ${w * w} = 0$, $k = \\pm ${w}i$, поэтому решение через синус и косинус с частотой ${w}.`)
    },
  },

  // ---------- Планиметрия ----------
  {
    topic: 'Углы. Смежные и вертикальные углы',
    gen: n => {
      const d = pick([20, 30, 40, 50, 60, 80])
      const small = (180 - d) / 2
      return num(`Один из смежных углов на ${d}° больше другого. Найдите больший угол.`,
        small + d, [small, 180 - d, 90 + d], n, '°',
        `$x + (x + ${d}) = 180°$, $x = ${small}°$, больший угол $${small + d}°$.`)
    },
  },
  {
    topic: 'Углы. Смежные и вертикальные углы',
    gen: n => {
      const s = pick([100, 140, 160, 220, 260])
      return num(`Сумма двух вертикальных углов равна ${s}°. Найдите угол, смежный с каждым из них.`,
        180 - s / 2, [s / 2, 180 - s, 360 - s], n, '°',
        `Вертикальные углы равны: каждый $${s / 2}°$. Смежный с ним $180° - ${s / 2}° = ${180 - s / 2}°$.`)
    },
  },
  {
    topic: 'Треугольники. Сумма углов. Внешний угол',
    gen: n => {
      const [p, q, r] = pick([[1, 2, 3], [2, 3, 4], [1, 1, 2], [3, 4, 5], [2, 3, 5], [1, 3, 5]])
      const k = 180 / (p + q + r)
      return num(`Углы треугольника относятся как ${p}:${q}:${r}. Найдите наибольший угол.`,
        r * k, [p * k, q * k, r * 20], n, '°',
        `$${p}x + ${q}x + ${r}x = 180°$, $x = ${fx(k)}°$, наибольший угол $${r} \\cdot ${fx(k)}° = ${fx(r * k)}°$.`)
    },
  },
  {
    topic: 'Треугольники. Сумма углов. Внешний угол',
    gen: n => {
      const a = rnd(30, 70), b = rnd(30, 70)
      return num(`Два угла треугольника равны ${a}° и ${b}°. Найдите внешний угол при третьей вершине.`,
        a + b, [180 - a - b, 180 - a, Math.abs(a - b)], n, '°',
        `Внешний угол равен сумме двух внутренних, не смежных с ним: $${a}° + ${b}° = ${a + b}°$.`)
    },
  },
  {
    topic: 'Прямоугольный треугольник. Теорема Пифагора',
    gen: n => {
      const [a, b, c] = pick(TRIPLES)
      const askHyp = Math.random() < 0.5
      return askHyp
        ? num(`Катеты прямоугольного треугольника равны ${a} и ${b}. Найдите гипотенузу.`, c, [a + b, Math.abs(b - a), a * b / 2], n, '',
          `$c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}} = ${c}$.`)
        : num(`Гипотенуза прямоугольного треугольника ${c}, один из катетов ${a}. Найдите другой катет.`, b, [c - a, Math.sqrt(c * c + a * a), c + a], n, '',
          `$b = \\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}} = ${b}$.`)
    },
  },
  {
    topic: 'Прямоугольный треугольник. Теорема Пифагора',
    gen: n => {
      const [a, b, c] = pick(TRIPLES)
      return txt(`В прямоугольном треугольнике катеты ${a} и ${b}. Найдите синус угла, противолежащего катету ${a}.`,
        `$${frac(a, c)}$`, [`$${frac(b, c)}$`, `$${frac(a, b)}$`, `$${frac(b, a)}$`, `$${frac(c, a)}$`], n,
        `Гипотенуза $${c}$, $\\sin = \\frac{\\text{противолежащий катет}}{\\text{гипотенуза}} = \\frac{${a}}{${c}}$.`)
    },
  },
  {
    topic: 'Подобие треугольников',
    gen: n => {
      const k = pick([2, 3, 4]), S = pick([5, 6, 8, 10])
      return num(`Стороны одного треугольника в ${k} раза больше соответствующих сторон подобного ему треугольника площадью ${S}. Найдите площадь большего треугольника.`,
        S * k * k, [S * k, S * 2 * k, S + k], n, '',
        `Отношение площадей подобных фигур равно квадрату коэффициента подобия: $S = ${S} \\cdot ${k}^2 = ${S * k * k}$.`)
    },
  },
  {
    topic: 'Подобие треугольников',
    gen: n => {
      const AB = pick([6, 8, 10, 12]), k = pick([2, 3, 4])
      return num(`В треугольнике $ABC$ проведена прямая $MN \\parallel AC$, причём $BM : MA = 1 : ${k - 1}$. Найдите $MN$, если $AC = ${AB * k}$.`,
        AB, [AB * k / (k - 1), AB * (k - 1), AB * k / 2], n, '',
        `Треугольники $MBN$ и $ABC$ подобны с коэффициентом $\\frac{BM}{BA} = \\frac{1}{${k}}$. $MN = \\frac{${AB * k}}{${k}} = ${AB}$.`)
    },
  },
  {
    topic: 'Медианы, биссектрисы, высоты',
    gen: n => {
      const [a, b, c] = pick(TRIPLES)
      return num(`Катеты прямоугольного треугольника ${a} и ${b}. Найдите медиану, проведённую к гипотенузе.`,
        c / 2, [c, (a + b) / 2, a * b / c], n, '',
        `Медиана к гипотенузе равна половине гипотенузы: $\\frac{${c}}{2} = ${fx(c / 2)}$.`)
    },
  },
  {
    topic: 'Медианы, биссектрисы, высоты',
    gen: n => {
      const m = pick([6, 9, 12, 15])
      return num(`Медиана треугольника равна ${m}. На каком расстоянии от вершины находится точка пересечения медиан?`,
        2 * m / 3, [m / 3, m / 2, 3 * m / 4], n, '',
        'Точка пересечения медиан делит каждую медиану в отношении $2 : 1$, считая от вершины.')
    },
  },
  {
    topic: 'Медианы, биссектрисы, высоты',
    gen: n => {
      const [a, b, c] = pick(TRIPLES)
      return num(`Катеты прямоугольного треугольника ${a} и ${b}. Найдите высоту, проведённую к гипотенузе.`,
        a * b / c, [c / 2, (a + b) / 2, a * b / 2], n, '',
        `Площадь двумя способами: $\\frac{ab}{2} = \\frac{ch}{2} \\Rightarrow h = \\frac{${a} \\cdot ${b}}{${c}} = ${fx(a * b / c)}$.`)
    },
  },
  {
    topic: 'Четырёхугольники. Средние линии',
    gen: n => {
      const a = rnd(4, 15), b = a + rnd(2, 10)
      return num(`Основания трапеции равны ${a} и ${b}. Найдите её среднюю линию.`,
        (a + b) / 2, [a + b, b - a, (b - a) / 2], n, '',
        `Средняя линия трапеции равна полусумме оснований: $\\frac{${a} + ${b}}{2} = ${fx((a + b) / 2)}$.`)
    },
  },
  {
    topic: 'Четырёхугольники. Средние линии',
    gen: n => {
      const d1 = pick([6, 8, 10, 12, 16]), d2 = pick([6, 8, 10, 12, 30])
      return num(`Диагонали ромба равны ${d1} и ${d2}. Найдите его площадь.`,
        d1 * d2 / 2, [d1 * d2, (d1 + d2) / 2, d1 * d2 / 4], n, '',
        `$S = \\frac{d_1d_2}{2} = \\frac{${d1} \\cdot ${d2}}{2} = ${d1 * d2 / 2}$.`)
    },
  },
  {
    topic: 'Четырёхугольники. Средние линии',
    gen: n => {
      const [a, b, c] = pick([[6, 8, 10], [5, 12, 13], [9, 12, 15]])
      return num(`Ромб имеет диагонали ${2 * a} и ${2 * b}. Найдите сторону ромба.`,
        c, [a + b, 2 * c, (2 * a + 2 * b) / 2], n, '',
        `Диагонали ромба перпендикулярны и делятся пополам: сторона $= \\sqrt{${a}^2 + ${b}^2} = ${c}$.`)
    },
  },
  {
    topic: 'Окружность. Центральные и вписанные углы',
    gen: n => {
      const c = pick([60, 80, 100, 120, 140])
      return num(`Центральный угол равен ${c}°. Найдите вписанный угол, опирающийся на ту же дугу.`,
        c / 2, [c, 2 * c, 180 - c], n, '°',
        'Вписанный угол равен половине центрального угла, опирающегося на ту же дугу.')
    },
  },
  {
    topic: 'Окружность. Центральные и вписанные углы',
    gen: n => {
      const a = pick([70, 80, 100, 110, 120])
      return num(`Четырёхугольник $ABCD$ вписан в окружность, $\\angle A = ${a}°$. Найдите $\\angle C$.`,
        180 - a, [a, 360 - a, 90], n, '°',
        'У вписанного четырёхугольника сумма противоположных углов равна 180°.')
    },
  },
  {
    topic: 'Касательная и секущая',
    gen: n => {
      const ext = pick([2, 3, 4]), whole = ext * pick([4, 9, 16])
      const t = Math.sqrt(ext * whole)
      if (!Number.isInteger(t)) return num('Из точки к окружности проведены касательная и секущая. Внешняя часть секущей 4, вся секущая 9. Найдите касательную.', 6, [13, 5, 36], n, '', '$t^2 = 4 \\cdot 9 = 36$, $t = 6$.')
      return num(`Из внешней точки к окружности проведены касательная и секущая. Внешняя часть секущей равна ${ext}, вся секущая — ${whole}. Найдите длину касательной.`,
        t, [ext * whole, (ext + whole) / 2, whole - ext], n, '',
        `Теорема о касательной и секущей: $t^2 = ${ext} \\cdot ${whole} = ${ext * whole}$, $t = ${t}$.`)
    },
  },
  {
    topic: 'Касательная и секущая',
    gen: n => {
      const [r, t, d] = pick(TRIPLES)
      return num(`Радиус окружности ${r}, расстояние от точки до центра ${d}. Найдите длину касательной, проведённой из этой точки.`,
        t, [d - r, d + r, Math.sqrt(d * d + r * r)], n, '',
        `Радиус перпендикулярен касательной: $t = \\sqrt{${d}^2 - ${r}^2} = ${t}$.`)
    },
  },
  {
    topic: 'Длина дуги. Площадь сектора',
    gen: n => {
      const R = pick([3, 6, 9, 12]), a = pick([60, 90, 120, 30])
      const k = R * a / 180
      return txt(`Найдите длину дуги окружности радиусом ${R}, соответствующей центральному углу ${a}°.`,
        `$${pi((k))}$`, [`$${pi((R * R * a / 360))}$`, `$${pi((2 * k))}$`, `$${pi((k / 2))}$`, `$${pi((R * a / 360))}$`], n,
        `$l = \\frac{\\pi R\\alpha}{180°} = \\frac{\\pi \\cdot ${R} \\cdot ${a}}{180} = ${fx(k)}\\pi$.`)
    },
  },
  {
    topic: 'Длина дуги. Площадь сектора',
    gen: n => {
      const R = pick([2, 3, 6, 12]), a = pick([30, 60, 90, 120])
      const k = R * R * a / 360
      return txt(`Найдите площадь сектора круга радиусом ${R} с центральным углом ${a}°.`,
        `$${pi((k))}$`, [`$${pi((R * a / 180))}$`, `$${pi((2 * k))}$`, `$${pi((R * R))}$`, `$${pi((k / 2))}$`], n,
        `$S = \\frac{\\pi R^2\\alpha}{360°} = \\frac{\\pi \\cdot ${R * R} \\cdot ${a}}{360} = ${fx(k)}\\pi$.`)
    },
  },
  {
    topic: 'Площади фигур',
    gen: n => {
      const a = pick([4, 6, 8, 10]), b = pick([5, 6, 7, 12]), ang = pick([30, 150])
      return num(`Две стороны треугольника равны ${a} и ${b}, угол между ними ${ang}°. Найдите площадь треугольника.`,
        a * b / 4, [a * b / 2, a * b, a * b * 0.87 / 2], n, '',
        `$S = \\frac{1}{2}ab\\sin\\gamma = \\frac{1}{2} \\cdot ${a} \\cdot ${b} \\cdot \\frac{1}{2} = ${fx(a * b / 4)}$.`)
    },
  },
  {
    topic: 'Площади фигур',
    gen: n => {
      const [a, b, c, S] = pick([[13, 14, 15, 84], [5, 5, 6, 12], [10, 10, 12, 48], [5, 12, 13, 30], [17, 10, 21, 84]])
      return num(`Найдите площадь треугольника со сторонами ${a}, ${b} и ${c}.`,
        S, [a * b / 2, (a + b + c) / 2, S * 2], n, '',
        `Формула Герона: $p = ${(a + b + c) / 2}$, $S = \\sqrt{p(p - a)(p - b)(p - c)} = ${S}$.`)
    },
  },
  {
    topic: 'Площади фигур',
    gen: n => {
      const a = rnd(3, 10), b = a + rnd(2, 8), h = rnd(3, 9)
      return num(`Основания трапеции ${a} и ${b}, высота ${h}. Найдите площадь трапеции.`,
        (a + b) * h / 2, [(a + b) * h, a * b * h / 2, (b - a) * h / 2], n, '',
        `$S = \\frac{a + b}{2} \\cdot h = \\frac{${a} + ${b}}{2} \\cdot ${h} = ${fx((a + b) * h / 2)}$.`)
    },
  },
  {
    topic: 'Теоремы синусов и косинусов',
    gen: n => {
      const [a, b, ang, c] = pick([[3, 5, 120, 7], [5, 8, 60, 7], [3, 8, 60, 7], [5, 3, 120, 7], [7, 8, 120, 13], [8, 15, 60, 13]])
      return num(`Две стороны треугольника ${a} и ${b}, угол между ними ${ang}°. Найдите третью сторону.`,
        c, [Math.round(Math.sqrt(a * a + b * b)), a + b, Math.abs(b - a)], n, '',
        `Теорема косинусов: $c^2 = ${a * a} + ${b * b} - 2 \\cdot ${a} \\cdot ${b} \\cdot \\cos ${ang}° = ${c * c}$, $c = ${c}$.`)
    },
  },
  {
    topic: 'Теоремы синусов и косинусов',
    gen: n => {
      const R = pick([3, 4, 5, 6, 7])
      return num(`В треугольнике сторона $a$ лежит против угла 30°. Радиус описанной окружности ${R}. Найдите $a$.`,
        R, [2 * R, R / 2, R * Math.sqrt(3)], n, '',
        `Теорема синусов: $\\frac{a}{\\sin A} = 2R \\Rightarrow a = 2 \\cdot ${R} \\cdot \\frac{1}{2} = ${R}$.`)
    },
  },
  {
    topic: 'Правильные многоугольники. Вписанные и описанные',
    gen: n => {
      const k = pick([5, 6, 8, 9, 10, 12])
      const ang = 180 * (k - 2) / k
      return num(`Найдите внутренний угол правильного ${k}-угольника.`,
        ang, [360 / k, 180 - ang / 2, 180 * k / (k + 2)], n, '°',
        `Сумма углов $180°(n - 2) = ${180 * (k - 2)}°$, один угол $\\frac{${180 * (k - 2)}°}{${k}} = ${fx(ang)}°$.`)
    },
  },
  {
    topic: 'Правильные многоугольники. Вписанные и описанные',
    gen: n => {
      const a = pick([2, 4, 6, 8])
      return num(`Сторона правильного шестиугольника равна ${a}. Найдите радиус описанной около него окружности.`,
        a, [a / 2, 2 * a, a * Math.sqrt(3) / 2], n, '',
        'Правильный шестиугольник состоит из шести равносторонних треугольников, поэтому $R = a$.')
    },
  },

  // ---------- Стереометрия ----------
  {
    topic: 'Призма и параллелепипед',
    gen: n => {
      const [a, b, c, d] = pick([[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9], [2, 10, 11, 15]])
      return num(`Измерения прямоугольного параллелепипеда ${a}, ${b} и ${c}. Найдите его диагональ.`,
        d, [a + b + c, Math.sqrt(a * a + b * b), a * b * c], n, '',
        `$d = \\sqrt{a^2 + b^2 + c^2} = \\sqrt{${a * a + b * b + c * c}} = ${d}$.`)
    },
  },
  {
    topic: 'Призма и параллелепипед',
    gen: n => {
      const a = pick([2, 3, 4, 5]), h = pick([5, 6, 10])
      return num(`Найдите площадь боковой поверхности правильной четырёхугольной призмы со стороной основания ${a} и высотой ${h}.`,
        4 * a * h, [a * a * h, 4 * a * h + 2 * a * a, 2 * a * h], n, '',
        `$S_{бок} = P_{осн} \\cdot h = 4 \\cdot ${a} \\cdot ${h} = ${4 * a * h}$.`)
    },
  },
  {
    topic: 'Пирамида и усечённая пирамида',
    gen: n => {
      const a = pick([3, 6, 9]), h = pick([4, 5, 10])
      return num(`Найдите объём правильной четырёхугольной пирамиды со стороной основания ${a} и высотой ${h}.`,
        a * a * h / 3, [a * a * h, a * a * h / 2, a * h / 3], n, '',
        `$V = \\frac{1}{3}S_{осн}h = \\frac{1}{3} \\cdot ${a * a} \\cdot ${h} = ${fx(a * a * h / 3)}$.`)
    },
  },
  {
    topic: 'Пирамида и усечённая пирамида',
    gen: n => {
      const [hh, half, ap] = pick([[4, 3, 5], [12, 5, 13], [8, 6, 10]])
      const a = 2 * half
      return num(`Высота правильной четырёхугольной пирамиды ${hh}, сторона основания ${a}. Найдите апофему (высоту боковой грани).`,
        ap, [Math.round(Math.sqrt(hh * hh + a * a)), hh + half, hh], n, '',
        `Апофема — гипотенуза прямоугольного треугольника с катетами $h = ${hh}$ и $\\frac{a}{2} = ${half}$: $\\sqrt{${hh * hh} + ${half * half}} = ${ap}$.`)
    },
  },
  {
    topic: 'Пирамида и усечённая пирамида',
    gen: n => {
      const S1 = pick([4, 9, 16]), S2 = pick([25, 36, 49]), h = pick([3, 6])
      const V = h / 3 * (S1 + S2 + Math.sqrt(S1 * S2))
      return num(`Площади оснований усечённой пирамиды ${S1} и ${S2}, высота ${h}. Найдите её объём.`,
        V, [h * (S1 + S2) / 2, h / 3 * (S1 + S2), h * (S1 + S2)], n, '',
        `$V = \\frac{h}{3}(S_1 + S_2 + \\sqrt{S_1S_2}) = \\frac{${h}}{3}(${S1} + ${S2} + ${Math.sqrt(S1 * S2)}) = ${fx(V)}$.`)
    },
  },
  {
    topic: 'Цилиндр',
    gen: n => {
      const r = pick([2, 3, 4, 5]), h = pick([3, 5, 6, 10])
      return txt(`Найдите объём цилиндра с радиусом основания ${r} и высотой ${h}.`,
        `$${pi(r * r * h)}$`, [`$${pi(2 * r * h)}$`, `$${pi(r * h)}$`, `$${pi((r * r * h / 3))}$`, `$${pi(2 * r * r * h)}$`], n,
        `$V = \\pi r^2h = \\pi \\cdot ${r * r} \\cdot ${h} = ${r * r * h}\\pi$.`)
    },
  },
  {
    topic: 'Цилиндр',
    gen: n => {
      const r = pick([2, 3, 4, 5]), h = pick([3, 5, 6, 10])
      return txt(`Найдите площадь боковой поверхности цилиндра с радиусом основания ${r} и высотой ${h}.`,
        `$${pi(2 * r * h)}$`, [`$${pi(r * r * h)}$`, `$${pi(r * h)}$`, `$${pi(2 * r * h + 2 * r * r)}$`, `$${pi(2 * r * r)}$`, `$${pi(4 * r * h)}$`, `$${pi(r * r)}$`], n,
        `$S_{бок} = 2\\pi rh = 2\\pi \\cdot ${r} \\cdot ${h} = ${2 * r * h}\\pi$.`)
    },
  },
  {
    topic: 'Конус и усечённый конус',
    gen: n => {
      const [r, h, l] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10]])
      return txt(`Радиус основания конуса ${r}, высота ${h}. Найдите площадь боковой поверхности.`,
        `$${pi(r * l)}$`, [`$${pi(r * h)}$`, `$${pi(r * l + r * r)}$`, `$${pi((r * r * h / 3))}$`, `$${pi(2 * r * l)}$`], n,
        `Образующая $l = \\sqrt{${r * r} + ${h * h}} = ${l}$. $S_{бок} = \\pi rl = ${r * l}\\pi$.`)
    },
  },
  {
    topic: 'Конус и усечённый конус',
    gen: n => {
      const r = pick([3, 6, 9]), h = pick([2, 4, 5, 10])
      return txt(`Найдите объём конуса с радиусом основания ${r} и высотой ${h}.`,
        `$${pi(r * r * h / 3)}$`, [`$${pi(r * r * h)}$`, `$${pi(r * h / 3)}$`, `$${pi((r * r * h / 2))}$`, `$${pi(2 * r * h)}$`], n,
        `$V = \\frac{1}{3}\\pi r^2h = \\frac{1}{3}\\pi \\cdot ${r * r} \\cdot ${h} = ${r * r * h / 3}\\pi$.`)
    },
  },
  {
    topic: 'Шар и сфера',
    gen: n => {
      const R = pick([3, 6])
      return txt(`Найдите объём шара радиусом ${R}.`,
        `$${pi(4 * R ** 3 / 3)}$`, [`$${pi(4 * R * R)}$`, `$${pi(R ** 3)}$`, `$${pi((4 * R ** 3))}$`, `$${pi((R ** 3 / 3))}$`], n,
        `$V = \\frac{4}{3}\\pi R^3 = \\frac{4}{3}\\pi \\cdot ${R ** 3} = ${4 * R ** 3 / 3}\\pi$.`)
    },
  },
  {
    topic: 'Шар и сфера',
    gen: n => {
      const k = pick([2, 3])
      return txt(`Во сколько раз увеличится объём шара, если его радиус увеличить в ${k} раза?`,
        `в ${k ** 3} раз`, [`в ${k} раза`, `в ${k * k} раз${k * k < 5 ? 'а' : ''}`, `в ${2 * k} раз`, `в ${k ** 3 * 2} раз`], n,
        `$V \\sim R^3$: объём вырастет в $${k}^3 = ${k ** 3}$ раз.`)
    },
  },
  {
    topic: 'Шар и сфера',
    gen: n => {
      const R = pick([2, 3, 5, 6])
      return txt(`Найдите площадь поверхности сферы радиусом ${R}.`,
        `$${pi(4 * R * R)}$`, [`$${pi(R * R)}$`, `$${pi((4 * R ** 3 / 3))}$`, `$${pi(2 * R * R)}$`, `$${pi(4 * R)}$`], n,
        `$S = 4\\pi R^2 = 4\\pi \\cdot ${R * R} = ${4 * R * R}\\pi$.`)
    },
  },
  {
    topic: 'Многогранники. Сечения. Двугранный угол',
    gen: n => {
      const k = rnd(4, 10)
      const prism = Math.random() < 0.5
      return num(`Сколько рёбер у ${prism ? `${k}-угольной призмы` : `${k}-угольной пирамиды`}?`,
        prism ? 3 * k : 2 * k, prism ? [2 * k, k + 2, 4 * k] : [k + 1, 3 * k, k], n, '',
        prism ? `У призмы по $${k}$ рёбер в двух основаниях и $${k}$ боковых: $3n = ${3 * k}$.` : `У пирамиды $${k}$ рёбер основания и $${k}$ боковых: $2n = ${2 * k}$.`)
    },
  },
  {
    topic: 'Многогранники. Сечения. Двугранный угол',
    gen: n => {
      const [V, F] = pick([[8, 6], [6, 8], [12, 20], [20, 12], [4, 4]])
      const E = V + F - 2
      return num(`У выпуклого многогранника ${V} вершин и ${F} граней. Сколько у него рёбер?`,
        E, [V + F, V + F + 2, V * F / 2], n, '',
        `Формула Эйлера: $В - Р + Г = 2 \\Rightarrow Р = ${V} + ${F} - 2 = ${E}$.`)
    },
  },

  // ---------- Векторы и координаты ----------
  {
    topic: 'Координаты и длина вектора',
    gen: n => {
      const [a, b, c, d] = pick([[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9]])
      const s = () => pick([1, -1])
      return num(`Найдите длину вектора $\\vec{a} = (${s() * a}; ${s() * b}; ${s() * c})$.`,
        d, [a + b + c, a * a + b * b + c * c, Math.sqrt(a * a + b * b)], n, '',
        `$|\\vec{a}| = \\sqrt{${a * a} + ${b * b} + ${c * c}} = \\sqrt{${d * d}} = ${d}$.`)
    },
  },
  {
    topic: 'Координаты и длина вектора',
    gen: n => {
      const x1 = rnd(-5, 5), y1 = rnd(-5, 5), x2 = rnd(-5, 5), y2 = rnd(-5, 5)
      return txt(`Найдите координаты вектора $\\overrightarrow{AB}$, если $A(${x1}; ${y1})$, $B(${x2}; ${y2})$.`,
        `$(${x2 - x1}; ${y2 - y1})$`, [`$(${x1 - x2}; ${y1 - y2})$`, `$(${x1 + x2}; ${y1 + y2})$`, `$(${y2 - y1}; ${x2 - x1})$`, `$(${x2 - x1}; ${y1 - y2})$`, `$(${x2 - x1 + 1}; ${y2 - y1})$`, `$(${x2 - x1}; ${y2 - y1 - 1})$`], n,
        'Из координат конца вычитаем координаты начала.')
    },
  },
  {
    topic: 'Действия над векторами',
    gen: n => {
      const nz = () => rnd(1, 4) * pick([1, -1])
      const a = [nz(), rnd(-4, 4)], b = [nz(), nz()], p = rnd(2, 3), q = rnd(1, 3)
      const r = [p * a[0] - q * b[0], p * a[1] - q * b[1]]
      return txt(`Даны $\\vec{a} = (${a[0]}; ${a[1]})$ и $\\vec{b} = (${b[0]}; ${b[1]})$. Найдите координаты вектора $${p}\\vec{a} - ${q === 1 ? '' : q}\\vec{b}$.`,
        `$(${r[0]}; ${r[1]})$`, [`$(${p * a[0] + q * b[0]}; ${p * a[1] + q * b[1]})$`, `$(${a[0] - b[0]}; ${a[1] - b[1]})$`, `$(${r[1]}; ${r[0]})$`, `$(${p * a[0] - b[0]}; ${p * a[1] - b[1]})$`, `$(${r[0] + 1}; ${r[1]})$`, `$(${r[0]}; ${r[1] - 1})$`], n,
        `$(${p} \\cdot ${a[0]} - ${q} \\cdot ${b[0]};\\ ${p} \\cdot ${a[1]} - ${q} \\cdot ${b[1]}) = (${r[0]}; ${r[1]})$.`)
    },
  },
  {
    topic: 'Скалярное произведение. Угол между векторами',
    gen: n => {
      const a = [rnd(-5, 5), rnd(-5, 5), rnd(-3, 3)], b = [rnd(-5, 5), rnd(-5, 5), rnd(-3, 3)]
      const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
      return num(`Найдите скалярное произведение векторов $\\vec{a} = (${a.join('; ')})$ и $\\vec{b} = (${b.join('; ')})$.`,
        dot, [dot + 2 * a[0] * b[0], a[0] * b[0] - a[1] * b[1] + a[2] * b[2], -dot, dot + 1], n, '',
        `$\\vec{a} \\cdot \\vec{b} = ${a[0]} \\cdot ${b[0]} + ${a[1]} \\cdot ${b[1]} + ${a[2]} \\cdot ${b[2]} = ${dot}$.`)
    },
  },
  {
    topic: 'Скалярное произведение. Угол между векторами',
    gen: n => {
      const items = [
        { a: '(1; 0)', b: '(1; 1)', v: 45 }, { a: '(1; 0)', b: '(-1; \\sqrt{3})', v: 120 }, { a: '(2; 0)', b: '(0; 5)', v: 90 },
        { a: '(1; 1)', b: '(-1; -1)', v: 180 }, { a: '(\\sqrt{3}; 1)', b: '(1; 0)', v: 30 }, { a: '(1; 0)', b: '(1; \\sqrt{3})', v: 60 },
      ]
      const it = pick(items)
      return num(`Найдите угол между векторами $\\vec{a} = ${it.a}$ и $\\vec{b} = ${it.b}$.`,
        it.v, [180 - it.v || 90, it.v / 2 || 45, 90 + it.v / 2], n, '°',
        '$\\cos\\varphi = \\frac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}||\\vec{b}|}$, затем находим угол по табличному значению косинуса.')
    },
  },
  {
    topic: 'Коллинеарные и перпендикулярные векторы',
    gen: n => {
      const a = rnd(1, 4), b = rnd(1, 4), k = pick([2, 3, -2])
      return num(`При каком $m$ векторы $\\vec{a} = (${a}; m)$ и $\\vec{b} = (${a * k}; ${b * k})$ коллинеарны?`,
        b, [-b, b * k, a * k], n, '',
        `Координаты коллинеарных векторов пропорциональны: $\\frac{${a}}{${a * k}} = \\frac{m}{${b * k}} \\Rightarrow m = ${b}$.`)
    },
  },
  {
    topic: 'Коллинеарные и перпендикулярные векторы',
    gen: n => {
      const a = rnd(1, 5), b = rnd(-4, 4) || 2, c = rnd(1, 5)
      // a·c + b·m = 0 → m = -ac/b
      const m = -a * c / b
      return num(`При каком $m$ векторы $\\vec{a} = (${a}; ${b})$ и $\\vec{b} = (${c}; m)$ перпендикулярны?`,
        m, [-m, a * c / b + 1, b * c / a], n, '',
        `Скалярное произведение равно нулю: $${a} \\cdot ${c} + ${b}m = 0 \\Rightarrow m = ${fx(m)}$.`)
    },
  },
  {
    topic: 'Уравнение окружности и прямой',
    gen: n => {
      const a = rnd(1, 5) * pick([1, -1]), b = rnd(1, 5) * pick([1, -1]), r = rnd(2, 6)
      const sx = a === 0 ? 'x^2' : `(x ${signed(-a)})^2`, sy = b === 0 ? 'y^2' : `(y ${signed(-b)})^2`
      return txt(`Найдите центр и радиус окружности $${sx} + ${sy} = ${r * r}$.`,
        `центр $(${a}; ${b})$, $R = ${r}$`, [`центр $(${-a}; ${-b})$, $R = ${r}$`, `центр $(${a}; ${b})$, $R = ${r * r}$`, `центр $(${-a}; ${-b})$, $R = ${r * r}$`, `центр $(${b}; ${a})$, $R = ${r}$`], n,
        'Уравнение окружности: $(x - a)^2 + (y - b)^2 = R^2$, центр $(a; b)$.')
    },
  },
  {
    topic: 'Уравнение окружности и прямой',
    gen: n => {
      const x1 = rnd(-4, 2), y1 = rnd(-4, 4), dx = rnd(1, 3), k = pick([-3, -2, 2, 3])
      const x2 = x1 + dx, y2 = y1 + k * dx
      const b = y1 - k * x1
      return txt(`Составьте уравнение прямой, проходящей через точки $A(${x1}; ${y1})$ и $B(${x2}; ${y2})$.`,
        `$y = ${k}x ${signed(b)}$`, [`$y = ${-k}x ${signed(b)}$`, `$y = ${k}x ${signed(-b || 1)}$`, `$y = ${k + (k > 0 ? 1 : -1)}x ${signed(b)}$`, `$y = ${k}x ${signed(b + 2)}$`, `$y = ${-k}x ${signed(-b || 2)}$`], n,
        `Угловой коэффициент $k = \\frac{${y2} - ${y1}}{${x2} - ${x1}} = ${k}$, $b = y_1 - kx_1 = ${b}$.`)
    },
  },
  {
    topic: 'Уравнения сферы и плоскости. Расстояния',
    gen: n => {
      const [A, B, C, L] = pick([[1, 2, 2, 3], [2, 3, 6, 7], [2, -1, 2, 3], [6, 2, 3, 7]])
      const x = rnd(-3, 3), y = rnd(-3, 3), z = rnd(-3, 3), dist = rnd(1, 4)
      const D = dist * L - (A * x + B * y + C * z)
      return num(`Найдите расстояние от точки $M(${x}; ${y}; ${z})$ до плоскости $${A}x ${term(B, 'y')} ${term(C, 'z')} ${signed(D)} = 0$.`,
        dist, [dist * L, Math.abs(A * x + B * y + C * z), dist + 1], n, '',
        `$d = \\frac{|${A} \\cdot ${x} ${signed(B)} \\cdot ${y} ${signed(C)} \\cdot ${z} ${signed(D)}|}{\\sqrt{${A * A} + ${B * B} + ${C * C}}} = \\frac{${dist * L}}{${L}} = ${dist}$.`)
    },
  },
  {
    topic: 'Уравнения сферы и плоскости. Расстояния',
    gen: n => {
      const a = rnd(-4, 4), b = rnd(-4, 4), c = rnd(-4, 4), r = rnd(1, 5)
      return num(`Найдите радиус сферы $(x ${signed(-a)})^2 + (y ${signed(-b)})^2 + (z ${signed(-c)})^2 = ${r * r}$.`,
        r, [r * r, 2 * r, r * r / 2], n, '',
        `Уравнение сферы $(x - a)^2 + (y - b)^2 + (z - c)^2 = R^2$, $R = \\sqrt{${r * r}} = ${r}$.`)
    },
  },
]
