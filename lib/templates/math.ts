import { type Template, tl, tr, num, txt, rnd, pick, fx, frac, signed, term, lead, pi, distinct } from './helpers'

// Пифагоровы тройки — чтобы ответы получались целыми
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25], [9, 12, 15], [12, 16, 20]]

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
      return txt(tl('Упростите выражение $\\sqrt{⟪0⟫} + \\sqrt{⟪1⟫}$.', [a1 * a1 * b, a2 * a2 * b]),
        `$${r}\\sqrt{${b}}$`, [`$\\sqrt{${(a1 * a1 + a2 * a2) * b}}$`, `$${r * b}$`, `$${a1 * a2}\\sqrt{${b}}$`, `$${r}\\sqrt{${b * 2}}$`], n,
        tl('$\\sqrt{⟪0⟫} = ⟪1⟫\\sqrt{⟪2⟫}$, $\\sqrt{⟪3⟫} = ⟪4⟫\\sqrt{⟪5⟫}$, сумма $⟪6⟫\\sqrt{⟪7⟫}$.', [a1 * a1 * b, a1, b, a2 * a2 * b, a2, b, r, b]))
    },
  },
  {
    topic: 'Квадратные корни. Преобразование выражений с корнями',
    gen: n => {
      const a = pick([2, 3, 5, 6, 7]), b = pick([1, 2, 3])
      if (a === b * b) return num('Вычислите $(\\sqrt{7} - 2)(\\sqrt{7} + 2)$.', 3, [5, 11, 9], n, '', 'Разность квадратов: $7 - 4 = 3$.')
      return num(tl('Вычислите $(\\sqrt{⟪0⟫} - ⟪1⟫)(\\sqrt{⟪2⟫} + ⟪3⟫)$.', [a, b, a, b]),
        a - b * b, [a + b * b, a - b, a * a - b * b], n, '',
        tl('Разность квадратов: $(\\sqrt{⟪0⟫})^2 - ⟪1⟫^2 = ⟪2⟫ - ⟪3⟫ = ⟪4⟫$.', [a, b, a, b * b, a - b * b]))
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
      return num(tl('Найдите модуль комплексного числа $z = ⟪0⟫ ⟪1⟫$.', [s1 * a, term(s2 * b, 'i')]),
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
      return txt(tl('Вычислите $(⟪0⟫ + ⟪1⟫i)(⟪2⟫ + ⟪3⟫i)$.', [a, b, c, d]),
        show(re, im), [show(a * c + b * d, im), show(a * c, b * d), show(re, a * d - b * c), show(a + c, b + d)], n,
        tl('$(⟪0⟫ + ⟪1⟫i)(⟪2⟫ + ⟪3⟫i) = ⟪4⟫ + ⟪5⟫i + ⟪6⟫i + ⟪7⟫i^2 = ⟪8⟫ ⟪9⟫$, так как $i^2 = -1$.', [a, b, c, d, a * c, a * d, b * c, b * d, re, term(im, 'i')]))
    },
  },
  {
    topic: 'Комплексные числа',
    gen: n => {
      const a = rnd(1, 6), b = rnd(1, 6)
      return txt(tl('Найдите число, сопряжённое к $z = ⟪0⟫ - ⟪1⟫i$.', [a, b]),
        `$${a} + ${b}i$`, [`$-${a} + ${b}i$`, `$-${a} - ${b}i$`, `$${b} - ${a}i$`, `$${a} - ${b}i$`], n,
        'У сопряжённого числа меняется знак мнимой части.')
    },
  },
  {
    topic: 'Свойства степени',
    gen: n => {
      const a = pick([2, 3, 5]), m = rnd(3, 7), k = rnd(2, 5), l = rnd(1, m + k - 1)
      const e = m + k - l
      return num(tl('Вычислите $\\frac{⟪0⟫^{⟪1⟫} \\cdot ⟪2⟫^{⟪3⟫}}{⟪4⟫^{⟪5⟫}}$.', [a, m, a, k, a, l]),
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
      return txt(tl('Вычислите $⟪0⟫^{\\frac{⟪1⟫}{⟪2⟫}}$.', [b, q, p]),
        `$${base ** q}$`, [`$${base ** (q + 1)}$`, `$${base ** p}$`, `$${base * q}$`, `$${b * q}$`, `$${b ** 2}$`, `$${base ** q + base}$`, `$${base ** q * 2}$`], n,
        `$${b}^{\\frac{${q}}{${p}}} = (${base}^{${p}})^{\\frac{${q}}{${p}}} = ${base}^{${q}} = ${base ** q}$.`)
    },
  },
  {
    topic: 'Модуль числа',
    gen: n => {
      const a = rnd(-9, -2), b = rnd(3, 9), c = rnd(-7, 7)
      const r = Math.abs(a) - Math.abs(b - 12) + Math.abs(c)
      return num(tl('Вычислите $|⟪0⟫| - |⟪1⟫ - 12| + |⟪2⟫|$.', [a, b, c]),
        r, [a - (b - 12) + c, Math.abs(a) + Math.abs(b - 12) + Math.abs(c), -r], n, '',
        tl('$|⟪0⟫| = ⟪1⟫$, $|⟪2⟫| = ⟪3⟫$, $|⟪4⟫| = ⟪5⟫$. Итого $⟪6⟫$.', [a, Math.abs(a), b - 12, Math.abs(b - 12), c, Math.abs(c), r]))
    },
  },
  {
    topic: 'Формулы сокращённого умножения',
    gen: n => {
      const a = pick([51, 101, 201, 31, 49]), b = a + pick([2, -2])
      const [x, y] = a > b ? [a, b] : [b, a]
      return num(tl('Вычислите $⟪0⟫^2 - ⟪1⟫^2$.', [x, y]),
        x * x - y * y, [(x - y) ** 2, x - y, (x + y) ** 2], n, '',
        tl('Разность квадратов: $(⟪0⟫ - ⟪1⟫)(⟪2⟫ + ⟪3⟫) = ⟪4⟫ \\cdot ⟪5⟫ = ⟪6⟫$.', [x, y, x, y, x - y, x + y, x * x - y * y]))
    },
  },
  {
    topic: 'Формулы сокращённого умножения',
    gen: n => {
      const a = rnd(2, 5), b = rnd(1, 7)
      return txt(tl('Раскройте скобки: $(⟪0⟫x - ⟪1⟫)^2$.', [a, b]),
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
      return txt(tl('Разложите на множители: $x^2 ⟪0⟫ ⟪1⟫$.', [term(B, 'x'), signed(C)]),
        `$${f(p)}${f(q)}$`, [`$${f(-p)}${f(-q)}$`, `$${f(p)}${f(-q)}$`, `$${f(-p)}${f(q)}$`, `$(x ${signed(B)})(x ${signed(C)})$`], n,
        tl('Корни трёхчлена: $x_1 = ⟪0⟫$, $x_2 = ⟪1⟫$ (по теореме Виета сумма $⟪2⟫$, произведение $⟪3⟫$). $ax^2 + bx + c = a(x - x_1)(x - x_2)$.', [p, q, p + q, C]))
    },
  },

  // ---------- Тригонометрия ----------
  {
    topic: 'Радианная мера угла',
    gen: n => {
      const deg = pick([30, 45, 60, 120, 135, 150, 210, 240, 270, 300, 330])
      const wrongs = Object.entries(RAD).filter(([d]) => Number(d) !== deg).map(([, r]) => `$${r}$`)
      return txt(tl('Переведите ⟪0⟫° в радианы.', [deg]), `$${RAD[deg]}$`, [...wrongs].sort(() => Math.random() - 0.5), n,
        `$${deg}° = ${deg} \\cdot \\frac{\\pi}{180} = ${RAD[deg]}$.`)
    },
  },
  {
    topic: 'Радианная мера угла',
    gen: n => {
      const deg = pick([30, 45, 60, 120, 135, 150, 210, 270, 300])
      return num(tl('Сколько градусов в угле $⟪0⟫$ рад?', [RAD[deg]]), deg, [deg / 2, 180 - deg, deg * 2, 360 - deg], n, '°',
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
      return txt(tl('Вычислите $⟪0⟫$.', [it.e]), `$${it.v}$`, [...it.w, '$-1$'], n,
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
      return txt(tl('Известно, что $\\sin\\alpha = ⟪0⟫$, $\\cos\\alpha = ⟪1⟫$. Найдите $⟪2⟫$.', [fx(s), fx(c), it.e]),
        f(it.v), [f(-it.v), f(it.v === s || it.v === -s ? c : s), f(it.v === s || it.v === -s ? -c : -s)], n,
        tl('Формула приведения: ⟪0⟫.', [it.why]))
    },
  },
  {
    topic: 'Формулы двойного и половинного аргумента',
    gen: n => {
      const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17]])
      const ask = pick(['sin', 'cos'])
      const v = ask === 'sin' ? frac(2 * a * b, c * c) : frac(b * b - a * a, c * c)
      return txt(tl('Известно, что $\\sin\\alpha = \\frac{⟪0⟫}{⟪1⟫}$ и $\\alpha$ — острый угол. Найдите $\\⟪2⟫ 2\\alpha$.', [a, c, ask]),
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
      return txt(tl('Вычислите $⟪0⟫$.', [it.e]), `$${it.v}$`, [...it.w.map(x => `$${x}$`), '$0$'], n, `$${it.e} = ${it.s} = ${it.v}$.`)
    },
  },
  {
    topic: 'Тождественные преобразования',
    gen: n => {
      const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17]])
      const quarter = pick([2, 4])
      const sinSign = quarter === 2 ? '' : '-'
      return txt(tl('Известно, что $\\cos\\alpha = ⟪0⟫\\frac{⟪1⟫}{⟪2⟫}$, $\\alpha$ лежит в ⟪3⟫ четверти. Найдите $\\sin\\alpha$.', [quarter === 2 ? '-' : '', b, c, quarter === 2 ? 'II' : 'IV']),
        `$${sinSign}\\frac{${a}}{${c}}$`, [`$${sinSign ? '' : '-'}\\frac{${a}}{${c}}$`, `$\\frac{${b}}{${c}}$`, `$-\\frac{${b}}{${a}}$`, `$\\frac{${a}}{${b}}$`], n,
        tl('$\\sin^2\\alpha = 1 - \\cos^2\\alpha = \\frac{⟪0⟫}{⟪1⟫}$, $|\\sin\\alpha| = \\frac{⟪2⟫}{⟪3⟫}$. В ⟪4⟫.', [a * a, c * c, a, c, quarter === 2 ? 'II четверти синус положителен' : 'IV четверти синус отрицателен']))
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
      return txt(tl('Вычислите $⟪0⟫$.', [it.e]), `$${it.v}$`, pool.filter(x => x !== it.v).sort(() => Math.random() - 0.5).map(x => `$${x}$`), n,
        'Помним области значений: $\\arcsin x \\in [-\\frac{\\pi}{2}; \\frac{\\pi}{2}]$, $\\arccos x \\in [0; \\pi]$, $\\mathrm{arctg}\\,x \\in (-\\frac{\\pi}{2}; \\frac{\\pi}{2})$.')
    },
  },

  // ---------- Уравнения ----------
  {
    topic: 'Линейные уравнения',
    gen: n => {
      const x = rnd(-6, 9), a = rnd(2, 9), c = rnd(1, a - 1), b = rnd(-10, 10)
      const d = a * x + b - c * x
      return num(tl('Решите уравнение $⟪0⟫x ⟪1⟫ = ⟪2⟫x ⟪3⟫$.', [a, signed(b), c, signed(d)]),
        x, [-x, (d + b) / (a - c), (d - b) / (a + c), x + 1], n, '',
        `$${a}x - ${c}x = ${d} - (${b})$, $${a - c}x = ${d - b}$, $x = ${x}$.`)
    },
  },
  {
    topic: 'Уравнения с модулем',
    gen: n => {
      const a = rnd(-5, 8), b = rnd(1, 9)
      return num(tl('Найдите сумму корней уравнения $|x ⟪0⟫| = ⟪1⟫$.', [signed(-a), b]),
        2 * a, [a + b, b, 2 * b, a], n, '',
        tl('$x - ⟪0⟫ = \\pm ⟪1⟫$: $x_1 = ⟪2⟫$, $x_2 = ⟪3⟫$. Сумма $⟪4⟫$.', [a, b, a + b, a - b, 2 * a]))
    },
  },
  {
    topic: 'Квадратные уравнения',
    gen: n => {
      const [r1, r2] = distinct(2, -8, 9)
      const B = -(r1 + r2), C = r1 * r2
      return num(tl('Найдите больший корень уравнения $x^2 ⟪0⟫ ⟪1⟫ = 0$.', [term(B, 'x'), signed(C)]),
        Math.max(r1, r2), [Math.min(r1, r2), -Math.max(r1, r2), r1 + r2, -Math.min(r1, r2)], n, '',
        tl('$D = ⟪0⟫ - 4 \\cdot ⟪1⟫ = ⟪2⟫$, $x = \\frac{⟪3⟫ \\pm ⟪4⟫}{2}$: корни ⟪5⟫ и ⟪6⟫.', [B * B, C, B * B - 4 * C, -B, Math.abs(r1 - r2), r1, r2]))
    },
  },
  {
    topic: 'Квадратные уравнения',
    gen: n => {
      const a = pick([1, 2, 3]), b = rnd(-6, 6), c = rnd(-6, 6)
      const D = b * b - 4 * a * c
      const cnt = D > 0 ? 2 : D === 0 ? 1 : 0
      return num(tl('Сколько корней имеет уравнение $⟪0⟫x^2 ⟪1⟫ ⟪2⟫ = 0$?', [a === 1 ? '' : a, term(b, 'x'), signed(c)]),
        cnt, [0, 1, 2, 3].filter(x => x !== cnt), n, '',
        `$D = b^2 - 4ac = ${b * b} - ${4 * a * c} = ${D}$ — ${tr(D > 0 ? 'положителен, два корня' : D === 0 ? 'ноль, один корень' : 'отрицателен, корней нет')}.`)
    },
  },
  {
    topic: 'Теорема Виета',
    gen: n => {
      const p = rnd(-7, 7) || 3, q = rnd(-9, 9) || -4
      const s = p * p - 2 * q
      return num(tl('$x_1$ и $x_2$ — корни уравнения $x^2 ⟪0⟫ ⟪1⟫ = 0$. Найдите $x_1^2 + x_2^2$.', [term(p, 'x'), signed(q)]),
        s, [p * p + 2 * q, p * p, q * q - 2 * p], n, '',
        tl('По теореме Виета $x_1 + x_2 = ⟪0⟫$, $x_1x_2 = ⟪1⟫$. $x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1x_2 = ⟪2⟫ - ⟪3⟫ = ⟪4⟫$.', [-p, q, p * p, 2 * q, s]))
    },
  },
  {
    topic: 'Теорема Виета',
    gen: n => {
      const pair = distinct(2, 1, 8)
      const r1 = pair[0]
      let r2 = -pair[1]
      if (r1 + r2 === 0) r2 -= 1
      return txt(tl('Составьте приведённое квадратное уравнение с корнями ⟪0⟫ и ⟪1⟫.', [r1, r2]),
        `$x^2 ${term(-(r1 + r2), 'x')} ${signed(r1 * r2)} = 0$`,
        [`$x^2 ${term(r1 + r2, 'x')} ${signed(r1 * r2)} = 0$`, `$x^2 ${term(-(r1 + r2), 'x')} ${signed(-r1 * r2)} = 0$`, `$x^2 ${term(r1 * r2, 'x')} ${signed(r1 + r2)} = 0$`, `$x^2 ${term(r1 + r2, 'x')} ${signed(-r1 * r2)} = 0$`], n,
        tl('По теореме Виета: $p = -(x_1 + x_2) = ⟪0⟫$, $q = x_1x_2 = ⟪1⟫$.', [-(r1 + r2), r1 * r2]))
    },
  },
  {
    topic: 'Дробно-рациональные уравнения',
    gen: n => {
      const x = rnd(-5, 9), b = rnd(1, 6), c = pick([2, 3, -1, -2])
      if (x === b) return num('Решите уравнение $\\frac{x + 1}{x - 2} = 4$.', 3, [-3, 2, 1], n, '', '$x + 1 = 4x - 8$, $x = 3$; $x \\ne 2$.')
      const a = c * (x - b) - x
      return num(tl('Решите уравнение $\\frac{x ⟪0⟫}{x ⟪1⟫} = ⟪2⟫$.', [signed(a), signed(-b), c]),
        x, [b, -x, x + c], n, '',
        tl('ОДЗ: $x \\ne ⟪0⟫$. $x ⟪1⟫ = ⟪2⟫(x - ⟪3⟫)$ $\\Rightarrow$ $x = ⟪4⟫$ — удовлетворяет ОДЗ.', [b, signed(a), c, b, x]))
    },
  },
  {
    topic: 'Биквадратные уравнения',
    gen: n => {
      const [p, q] = distinct(2, 1, 5)
      const B = p * p + q * q, C = p * p * q * q
      return num(tl('Найдите произведение всех корней уравнения $x^4 - ⟪0⟫x^2 + ⟪1⟫ = 0$.', [B, C]),
        C, [-C, p * q, B, 0], n, '',
        tl('Замена $t = x^2$: $t^2 - ⟪0⟫t + ⟪1⟫ = 0$, $t = ⟪2⟫$ или $t = ⟪3⟫$. Корни $\\pm⟪4⟫$, $\\pm⟪5⟫$; произведение $(⟪6⟫)(-⟪7⟫)(⟪8⟫)(-⟪9⟫) = ⟪10⟫$.', [B, C, p * p, q * q, p, q, p, p, q, q, C]))
    },
  },
  {
    topic: 'Биквадратные уравнения',
    gen: n => {
      const p = rnd(1, 5), q = rnd(1, 5)
      return num(tl('Сколько действительных корней имеет уравнение $x^4 ⟪0⟫ ⟪1⟫ = 0$?', [term(-(p * p - q), 'x^2'), signed(-p * p * q)]),
        2, [4, 0, 1, 3], n, '',
        tl('Замена $t = x^2 \\ge 0$: $(t - ⟪0⟫)(t + ⟪1⟫) = 0$. Подходит только $t = ⟪2⟫$, значит $x = \\pm ⟪3⟫$ — два корня.', [p * p, q, p * p, p]))
    },
  },
  {
    topic: 'Иррациональные уравнения',
    gen: n => {
      const b = rnd(2, 6), a = rnd(-9, 9)
      const x = b * b - a
      return num(tl('Решите уравнение $\\sqrt{x ⟪0⟫} = ⟪1⟫$.', [signed(a), b]),
        x, [b - a, b * b + a, Math.sqrt(Math.abs(b - a)) * b], n, '',
        tl('Возведём в квадрат: $x ⟪0⟫ = ⟪1⟫$, $x = ⟪2⟫$. Проверка: $\\sqrt{⟪3⟫} = ⟪4⟫$ ✓.', [signed(a), b * b, x, b * b, b]))
    },
  },
  {
    topic: 'Иррациональные уравнения',
    gen: n => {
      const r = rnd(2, 6) // корень
      const a = r * r - r // x + a = x²
      return num(tl('Решите уравнение $\\sqrt{x + ⟪0⟫} = x$.', [a]),
        r, [1 - r, -r, r * r], n, '',
        tl('$x + ⟪0⟫ = x^2$, $x^2 - x - ⟪1⟫ = 0$: $x = ⟪2⟫$ или $x = ⟪3⟫$. Так как $\\sqrt{\\ } \\ge 0$, нужно $x \\ge 0$: подходит только $x = ⟪4⟫$.', [a, a, r, 1 - r, r]))
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
      return txt(tl('Решите уравнение $⟪0⟫$ ($k \\in \\mathbb{Z}$).', [it.e]), `$${it.v}$`, [...it.w.map(w => `$${w}$`), '$\\pi k$'], n,
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
      return num(tl('Сколько корней имеет уравнение $⟪0⟫$?', [it.e]), Number(it.v), [1, 2, 3, 4, 5].filter(x => x !== Number(it.v)), n, '', it.s)
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
      return txt(tl('Решите уравнение $⟪0⟫$ ($k \\in \\mathbb{Z}$).', [it.e]), `$${it.v}$`, [...it.w.map(w => `$${w}$`), '$\\pi k$'], n, it.s)
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
      return txt(tl('Решите неравенство $⟪0⟫$ ($k \\in \\mathbb{Z}$).', [it.e]), `$${it.v}$`, [...it.w.map(w => `$${w}$`), '$\\varnothing$'], n,
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
      return num(tl('Вычислите $⟪0⟫$.', [it.e]), it.v, [-it.v, it.v + 1, it.v * 2, it.v - 1], n, '',
        'Свойства: $\\log_a a^k = k$, $a^{\\log_a b} = b$, $\\log_a x - \\log_a y = \\log_a\\frac{x}{y}$.')
    },
  },
  {
    topic: 'Показательные уравнения',
    gen: n => {
      const a = pick([2, 3, 5]), k = rnd(1, 3), x = rnd(-2, 4), m = rnd(-3, 3)
      const p = k * x + m
      if (p < 0 || p > 6) return num('Решите уравнение $2^{x + 1} = 16$.', 3, [4, 8, 7], n, '', '$2^{x+1} = 2^4$, $x + 1 = 4$, $x = 3$.')
      return num(tl('Решите уравнение $⟪0⟫^{⟪1⟫x ⟪2⟫} = ⟪3⟫$.', [a, k === 1 ? '' : k, signed(m), a ** p]),
        x, [p, (p + m) / k, x + 1], n, '',
        tl('$⟪0⟫ = ⟪1⟫^{⟪2⟫}$, значит $⟪3⟫x ⟪4⟫ = ⟪5⟫$, $x = ⟪6⟫$.', [a ** p, a, p, k === 1 ? '' : k, signed(m), p, x]))
    },
  },
  {
    topic: 'Показательные уравнения',
    gen: n => {
      const t = pick([2, 4, 8]), s = t === 2 ? 1 : t === 4 ? 2 : 3
      const b = -(t + 1), c = t
      return num(tl('Найдите сумму корней уравнения $4^x ⟪0⟫ \\cdot 2^x ⟪1⟫ = 0$.', [signed(b), signed(c)]),
        s, [t + 1, t, s + 1], n, '',
        tl('Замена $t = 2^x > 0$: $t^2 ⟪0⟫t ⟪1⟫ = 0$, $t = 1$ или $t = ⟪2⟫$. Тогда $x = 0$ или $x = ⟪3⟫$; сумма $⟪4⟫$.', [signed(b), signed(c), t, s, s]))
    },
  },
  {
    topic: 'Логарифмические уравнения',
    gen: n => {
      const a = pick([2, 3, 5]), c = rnd(1, 3), b = rnd(-5, 5)
      const x = a ** c - b
      return num(tl('Решите уравнение $\\log_{⟪0⟫}(x ⟪1⟫) = ⟪2⟫$.', [a, signed(b), c]),
        x, [a * c - b, a ** c + b, c ** a - b], n, '',
        tl('По определению логарифма $x ⟪0⟫ = ⟪1⟫^{⟪2⟫} = ⟪3⟫$, $x = ⟪4⟫$. ОДЗ: $x ⟪5⟫ > 0$ — выполнено.', [signed(b), a, c, a ** c, x, signed(b)]))
    },
  },
  {
    topic: 'Логарифмические уравнения',
    gen: n => {
      const r = pick([2, 3, 4])
      return num(tl('Решите уравнение $\\log_2 x + \\log_2(x + ⟪0⟫) = \\log_2 ⟪1⟫$.', [r * r - r > 0 ? 1 : 1, r * (r + 1)]),
        r, [-(r + 1), r + 1, r * (r + 1)], n, '',
        tl('$\\log_2(x(x + 1)) = \\log_2 ⟪0⟫$, $x^2 + x - ⟪1⟫ = 0$: $x = ⟪2⟫$ или $x = ⟪3⟫$. По ОДЗ $x > 0$, ответ $⟪4⟫$.', [r * (r + 1), r * (r + 1), r, -(r + 1), r]))
    },
  },
  {
    topic: 'Показательные неравенства',
    gen: n => {
      const flip = Math.random() < 0.5
      const k = rnd(1, 4)
      if (flip) {
        return txt(tl('Решите неравенство $\\left(\\frac{1}{3}\\right)^x < 3^{⟪0⟫}$.', [k]),
          interval(`-${k}`, '+\\infty', '(', ')'), [interval('-\\infty', `-${k}`, '(', ')'), interval(`${k}`, '+\\infty', '(', ')'), interval('-\\infty', `${k}`, '(', ')')], n,
          tl('$3^{-x} < 3^{⟪0⟫}$, основание больше 1: $-x < ⟪1⟫$, $x > -⟪2⟫$.', [k, k, k]))
      }
      return txt(tl('Решите неравенство $2^x > ⟪0⟫$.', [2 ** k]),
        interval(`${k}`, '+\\infty', '(', ')'), [interval('-\\infty', `${k}`, '(', ')'), interval(`${2 ** k}`, '+\\infty', '(', ')'), interval(`${k}`, '+\\infty', '[', ')')], n,
        tl('$2^x > 2^{⟪0⟫}$, основание $2 > 1$, знак сохраняется: $x > ⟪1⟫$.', [k, k]))
    },
  },
  {
    topic: 'Логарифмические неравенства',
    gen: n => {
      const a = rnd(-3, 4), c = rnd(1, 3)
      const up = a + 2 ** c
      return txt(tl('Решите неравенство $\\log_2(x ⟪0⟫) < ⟪1⟫$.', [signed(-a), c]),
        interval(`${a}`, `${up}`, '(', ')'), [interval('-\\infty', `${up}`, '(', ')'), interval(`${a}`, `${a + 2 * c}`, '(', ')'), interval(`${up}`, '+\\infty', '(', ')'), interval(`${a}`, `${up}`, '[', ']'), interval(`${a}`, `${up + 1}`, '(', ')')], n,
        tl('ОДЗ: $x > ⟪0⟫$. $x - ⟪1⟫ < 2^{⟪2⟫} = ⟪3⟫$, $x < ⟪4⟫$. Ответ: $(⟪5⟫; ⟪6⟫)$.', [a, a, c, 2 ** c, up, a, up]))
    },
  },

  // ---------- Системы уравнений ----------
  {
    topic: 'Системы линейных уравнений',
    gen: n => {
      const x = rnd(-4, 6), y = rnd(-4, 6), a = rnd(1, 4), b = rnd(1, 4), c = rnd(1, 4), d = -rnd(1, 4)
      return num(tl('Решите систему $\\begin{cases} ⟪0⟫x + ⟪1⟫y = ⟪2⟫ \\\\ ⟪3⟫x ⟪4⟫ = ⟪5⟫ \\end{cases}$. В ответе укажите $x + y$.', [a, b, a * x + b * y, c, term(d, 'y'), c * x + d * y]),
        x + y, [x - y, x * y, x + y + 1], n, '',
        tl('Решение системы: $x = ⟪0⟫$, $y = ⟪1⟫$ (метод подстановки или сложения). $x + y = ⟪2⟫$.', [x, y, x + y]))
    },
  },
  {
    topic: 'Системы нелинейных уравнений',
    gen: n => {
      const [x, y] = distinct(2, 1, 7)
      const s = x + y, p = x * y
      return num(tl('Известно, что $x + y = ⟪0⟫$ и $xy = ⟪1⟫$. Найдите $x^2 + y^2$.', [s, p]),
        s * s - 2 * p, [s * s + 2 * p, s * s, s * s - p], n, '',
        `$x^2 + y^2 = (x + y)^2 - 2xy = ${s * s} - ${2 * p} = ${s * s - 2 * p}$.`)
    },
  },
  {
    topic: 'Системы показательных и логарифмических уравнений',
    gen: n => {
      const x = rnd(1, 5), y = rnd(0, 4)
      return num(tl('Решите систему $\\begin{cases} 2^x \\cdot 2^y = ⟪0⟫ \\\\ x - y = ⟪1⟫ \\end{cases}$. В ответе укажите $xy$.', [2 ** (x + y), x - y]),
        x * y, [x + y, x * y + 1, (x + y) * (x - y)], n, '',
        tl('$2^{x+y} = 2^{⟪0⟫}$, значит $x + y = ⟪1⟫$. Вместе с $x - y = ⟪2⟫$: $x = ⟪3⟫$, $y = ⟪4⟫$, $xy = ⟪5⟫$.', [x + y, x + y, x - y, x, y, x * y]))
    },
  },

  // ---------- Неравенства ----------
  {
    topic: 'Числовые промежутки: объединение и пересечение',
    gen: n => {
      const [a, b, c, d] = [rnd(-6, 0), rnd(2, 6), rnd(-2, 3), rnd(7, 10)].sort((p, q) => p - q)
      return txt(tl('Найдите пересечение промежутков $[⟪0⟫; ⟪1⟫]$ и $(⟪2⟫; ⟪3⟫)$.', [a, c, b, d]),
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
      return txt(tl('Решите неравенство $⟪0⟫x ⟪1⟫ > ⟪2⟫$.', [a, signed(b), c]),
        interval('-\\infty', `${x0}`, '(', ')'), [interval(`${x0}`, '+\\infty', '(', ')'), interval('-\\infty', `${-x0}`, '(', ')'), interval(`${x0}`, '+\\infty', '[', ')'), interval('-\\infty', `${x0}`, '(', ']'), interval('-\\infty', `${x0 + 1}`, '(', ')')], n,
        tl('$⟪0⟫x > ⟪1⟫$. Делим на отрицательное число $⟪2⟫$ — знак меняется: $x < ⟪3⟫$.', [a, c - b, a, x0]))
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
      return txt(tl('Решите неравенство $x^2 ⟪0⟫ ⟪1⟫ ⟪2⟫ 0$.', [term(B, 'x'), signed(C), less ? '<' : '>']),
        less ? inside : outside, [less ? outside : inside, interval(`${-r2}`, `${-r1}`, '(', ')'), interval(`${r1}`, `${r2}`, '[', ']'), `$(-\\infty; ${r1}] \\cup [${r2}; +\\infty)$`, interval(`${r1}`, '+\\infty', '(', ')')], n,
        tl('Корни $⟪0⟫$ и $⟪1⟫$, ветви параболы вверх: ⟪2⟫.', [r1, r2, less ? 'отрицательна между корнями' : 'положительна вне отрезка между корнями']))
    },
  },
  {
    topic: 'Рациональные неравенства. Метод интервалов',
    gen: n => {
      const [a, b] = distinct(2, -5, 6).sort((p, q) => p - q)
      const cnt = b - a // целые в [a; b)
      return num(tl('Сколько целых решений имеет неравенство $\\frac{x ⟪0⟫}{x ⟪1⟫} \\le 0$?', [signed(-a), signed(-b)]),
        cnt, [cnt + 1, cnt - 1, b - a - 2 > 0 ? b - a - 2 : cnt + 2], n, '',
        tl('Метод интервалов: дробь $\\le 0$ на $[⟪0⟫; ⟪1⟫)$ — точку $⟪2⟫$ исключаем (знаменатель). Целые: от $⟪3⟫$ до $⟪4⟫$, их $⟪5⟫$.', [a, b, b, a, b - 1, cnt]))
    },
  },
  {
    topic: 'Иррациональные неравенства',
    gen: n => {
      const a = rnd(-4, 4), b = rnd(1, 4)
      return txt(tl('Решите неравенство $\\sqrt{x ⟪0⟫} < ⟪1⟫$.', [signed(-a), b]),
        interval(`${a}`, `${a + b * b}`, '[', ')'), [interval('-\\infty', `${a + b * b}`, '(', ')'), interval(`${a}`, `${a + b}`, '[', ')'), interval(`${a}`, `${a + b * b}`, '(', ')'), interval(`${a + b * b}`, '+\\infty', '(', ')'), interval(`${a}`, `${a + b * b}`, '[', ']')], n,
        tl('Условие существования: $x \\ge ⟪0⟫$. Возводим в квадрат: $x - ⟪1⟫ < ⟪2⟫$, $x < ⟪3⟫$.', [a, a, b * b, a + b * b]))
    },
  },
  {
    topic: 'Системы неравенств',
    gen: n => {
      const a = rnd(-5, 2), b = a + rnd(3, 7)
      return num(tl('Сколько целых решений имеет система $\\begin{cases} 2x ⟪0⟫ \\ge 0 \\\\ x < ⟪1⟫ \\end{cases}$?', [signed(-2 * a), b]),
        b - a, [b - a + 1, b - a - 1, b], n, '',
        tl('Первое неравенство: $x \\ge ⟪0⟫$. Вместе: $⟪1⟫ \\le x < ⟪2⟫$. Целых чисел $⟪3⟫$.', [a, a, b, b - a]))
    },
  },

  // ---------- Прогрессии ----------
  {
    topic: 'Арифметическая прогрессия',
    gen: n => {
      const a1 = rnd(-10, 10), d = pick([-3, -2, 2, 3, 4, 5]), k = rnd(8, 25)
      const ak = a1 + (k - 1) * d
      return num(tl('В арифметической прогрессии $a_1 = ⟪0⟫$, $d = ⟪1⟫$. Найдите $a_{⟪2⟫}$.', [a1, d, k]),
        ak, [a1 + k * d, a1 * d * k, a1 + (k - 2) * d], n, '',
        `$a_n = a_1 + (n - 1)d = ${a1} + ${k - 1} \\cdot (${d}) = ${ak}$.`)
    },
  },
  {
    topic: 'Арифметическая прогрессия',
    gen: n => {
      const a1 = rnd(1, 10), d = rnd(1, 5), k = pick([10, 12, 15, 20])
      const S = (2 * a1 + (k - 1) * d) * k / 2
      return num(tl('Найдите сумму первых ⟪0⟫ членов арифметической прогрессии, у которой $a_1 = ⟪1⟫$, $d = ⟪2⟫$.', [k, a1, d]),
        S, [(2 * a1 + k * d) * k / 2, (a1 + (k - 1) * d) * k, S / 2], n, '',
        `$S_n = \\frac{2a_1 + (n - 1)d}{2} \\cdot n = \\frac{${2 * a1} + ${(k - 1) * d}}{2} \\cdot ${k} = ${S}$.`)
    },
  },
  {
    topic: 'Арифметическая прогрессия',
    gen: n => {
      const a = rnd(1, 20), d = rnd(2, 9)
      return num(tl('Числа $⟪0⟫$, $x$, $⟪1⟫$ образуют арифметическую прогрессию. Найдите $x$.', [a, a + 2 * d]),
        a + d, [Math.sqrt(a * (a + 2 * d)), a + 2 * d - a, d], n, '',
        tl('Характеристическое свойство: $x = \\frac{⟪0⟫ + ⟪1⟫}{2} = ⟪2⟫$.', [a, a + 2 * d, a + d]))
    },
  },
  {
    topic: 'Геометрическая прогрессия',
    gen: n => {
      const b1 = pick([1, 2, 3, -2]), q = pick([2, 3, -2]), k = rnd(4, 7)
      const bk = b1 * q ** (k - 1)
      return num(tl('В геометрической прогрессии $b_1 = ⟪0⟫$, $q = ⟪1⟫$. Найдите $b_{⟪2⟫}$.', [b1, q, k]),
        bk, [b1 * q ** k, b1 * q * (k - 1), -bk], n, '',
        `$b_n = b_1q^{n-1} = ${b1} \\cdot (${q})^{${k - 1}} = ${bk}$.`)
    },
  },
  {
    topic: 'Геометрическая прогрессия',
    gen: n => {
      const b1 = pick([1, 2, 3]), q = pick([2, 3]), k = rnd(4, 6)
      const S = b1 * (q ** k - 1) / (q - 1)
      return num(tl('Найдите сумму первых ⟪0⟫ членов геометрической прогрессии с $b_1 = ⟪1⟫$ и $q = ⟪2⟫$.', [k, b1, q]),
        S, [b1 * q ** (k - 1), b1 * (q ** (k + 1) - 1) / (q - 1), b1 * q * k], n, '',
        `$S_n = \\frac{b_1(q^n - 1)}{q - 1} = \\frac{${b1}(${q ** k} - 1)}{${q - 1}} = ${S}$.`)
    },
  },
  {
    topic: 'Бесконечно убывающая геометрическая прогрессия',
    gen: n => {
      const b1 = pick([3, 6, 8, 12, 24]), k = pick([2, 3, 4])
      const S = b1 / (1 - 1 / k)
      return num(tl('Найдите сумму бесконечно убывающей геометрической прогрессии с $b_1 = ⟪0⟫$ и $q = \\frac{1}{⟪1⟫}$.', [b1, k]),
        S, [b1 / (1 + 1 / k), b1 * k, b1 + b1 / k], n, '',
        `$S = \\frac{b_1}{1 - q} = \\frac{${b1}}{1 - \\frac{1}{${k}}} = ${fx(S)}$.`)
    },
  },

  // ---------- Функции и графики ----------
  {
    topic: 'Область определения функции',
    gen: n => {
      const a = rnd(-5, 5), b = a + rnd(1, 6)
      return txt(tl('Найдите область определения функции $y = \\sqrt{x ⟪0⟫} + \\frac{1}{x ⟪1⟫}$.', [signed(-a), signed(-b)]),
        `$[${a}; ${b}) \\cup (${b}; +\\infty)$`, [interval(`${a}`, '+\\infty', '[', ')'), `$(${a}; ${b}) \\cup (${b}; +\\infty)$`, interval('-\\infty', `${a}`, '(', ']')], n,
        tl('Под корнем: $x \\ge ⟪0⟫$; знаменатель не ноль: $x \\ne ⟪1⟫$.', [a, b]))
    },
  },
  {
    topic: 'Область определения функции',
    gen: n => {
      const a = rnd(1, 6)
      return txt(tl('Найдите область определения функции $y = \\log_2(⟪0⟫ - x^2)$.', [a * a]),
        interval(`-${a}`, `${a}`, '(', ')'), [interval(`-${a}`, `${a}`, '[', ']'), `$(-\\infty; -${a}) \\cup (${a}; +\\infty)$`, interval('0', `${a}`, '(', ')')], n,
        tl('Аргумент логарифма положителен: $⟪0⟫ - x^2 > 0$, $|x| < ⟪1⟫$.', [a * a, a]))
    },
  },
  {
    topic: 'Множество значений функции',
    gen: n => {
      const a = rnd(2, 5) * pick([1, -1]), b = rnd(-4, 4)
      const lo = b - Math.abs(a), hi = b + Math.abs(a)
      return txt(tl('Найдите множество значений функции $y = ⟪0⟫ ⟪1⟫$.', [lead(a, '\\sin x'), signed(b)]),
        interval(`${lo}`, `${hi}`, '[', ']'), [interval(`${-Math.abs(a)}`, `${Math.abs(a)}`, '[', ']'), interval(`${b - 1}`, `${b + 1}`, '[', ']'), interval(`${lo}`, `${hi}`, '(', ')'), interval(`${b}`, `${hi}`, '[', ']'), interval(`${lo - 1}`, `${hi + 1}`, '[', ']')], n,
        tl('$\\sin x \\in [-1; 1]$, поэтому $⟪0⟫\\sin x \\in [⟪1⟫; ⟪2⟫]$ и $y \\in [⟪3⟫; ⟪4⟫]$.', [a, -Math.abs(a), Math.abs(a), lo, hi]))
    },
  },
  {
    topic: 'Множество значений функции',
    gen: n => {
      const p = rnd(-4, 4), q = rnd(-5, 5)
      return txt(tl('Найдите множество значений функции $y = (x ⟪0⟫)^2 ⟪1⟫$.', [signed(-p), signed(q)]),
        interval(`${q}`, '+\\infty', '[', ')'), [interval(`${p}`, '+\\infty', '[', ')'), interval('-\\infty', `${q}`, '(', ']'), interval(`${q}`, '+\\infty', '(', ')'), interval(`${-q}`, '+\\infty', '[', ')'), interval(`${q + p + 1}`, '+\\infty', '[', ')'), '$(-\\infty;\\ +\\infty)$'], n,
        tl('$(x - ⟪0⟫)^2 \\ge 0$, наименьшее значение $⟪1⟫$ при $x = ⟪2⟫$.', [p, q, p]))
    },
  },
  {
    topic: 'Нули функции. Пересечение с осями',
    gen: n => {
      const [r1, r2] = distinct(2, -6, 6)
      const B = -(r1 + r2), C = r1 * r2
      return num(tl('Найдите сумму нулей функции $y = x^2 ⟪0⟫ ⟪1⟫$.', [term(B, 'x'), signed(C)]),
        r1 + r2, [B, C, r1 * r2 + 1], n, '',
        tl('Нули — корни уравнения $x^2 ⟪0⟫ ⟪1⟫ = 0$: $⟪2⟫$ и $⟪3⟫$, сумма $⟪4⟫$.', [term(B, 'x'), signed(C), r1, r2, r1 + r2]))
    },
  },
  {
    topic: 'Нули функции. Пересечение с осями',
    gen: n => {
      const a = rnd(1, 4), b = rnd(-6, 6), c = rnd(-9, 9)
      return num(tl('В какой точке график функции $y = ⟪0⟫x^2 ⟪1⟫ ⟪2⟫$ пересекает ось $Oy$? Укажите ординату.', [a, term(b, 'x'), signed(c)]),
        c, [a, b, a + b + c], n, '',
        tl('На оси $Oy$ $x = 0$, значит $y = ⟪0⟫$.', [c]))
    },
  },
  {
    topic: 'Квадратичная функция',
    gen: n => {
      const a = pick([1, 2, -1, 3]), x0 = rnd(-4, 4), y0 = rnd(-6, 6)
      const b = -2 * a * x0, c = a * x0 * x0 + y0
      return txt(tl('Найдите координаты вершины параболы $y = ⟪0⟫x^2 ⟪1⟫ ⟪2⟫$.', [a === 1 ? '' : a === -1 ? '-' : a, term(b, 'x'), signed(c)]),
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
      return txt(tl('Найдите функцию, обратную к $y = ⟪0⟫x ⟪1⟫$.', [a, signed(b)]),
        `$y = \\frac{x ${signed(-b)}}{${a}}$`, [`$y = \\frac{x ${signed(b)}}{${a}}$`, `$y = ${a}x ${signed(-b)}$`, `$y = \\frac{1}{${a}x ${signed(b)}}$`, `$y = \\frac{x}{${a}} ${signed(b)}$`], n,
        tl('Выразим $x$: $x = \\frac{y ⟪0⟫}{⟪1⟫}$, затем поменяем $x$ и $y$ местами.', [signed(-b), a]))
    },
  },
  {
    topic: 'Обратная и сложная функция',
    gen: n => {
      const a = rnd(1, 3), b = rnd(-3, 3), x0 = rnd(-2, 3)
      const g = a * x0 + b
      return num(tl('Даны $f(x) = x^2 + 1$ и $g(x) = ⟪0⟫x ⟪1⟫$. Найдите $f(g(⟪2⟫))$.', [a, signed(b), x0]),
        g * g + 1, [a * (x0 * x0 + 1) + b, g * g, (x0 * x0 + 1) * g], n, '',
        `$g(${x0}) = ${g}$, $f(${g}) = ${g * g} + 1 = ${g * g + 1}$.`)
    },
  },
  {
    topic: 'Пределы и асимптоты',
    gen: n => {
      const a = rnd(1, 6), b = rnd(1, 6), c = rnd(-5, 5), d = rnd(-5, 5)
      return txt(tl('Найдите $\\lim\\limits_{x \\to \\infty} \\frac{⟪0⟫x^2 ⟪1⟫ + 1}{⟪2⟫x^2 ⟪3⟫}$.', [a, term(c, 'x'), b, signed(d)]),
        `$${frac(a, b)}$`, [`$${frac(b, a)}$`, '$\\infty$', '$0$', `$${frac(c, d || 1)}$`, `$${frac(a + 1, b)}$`, `$-${frac(a, b)}$`], n,
        tl('Делим числитель и знаменатель на $x^2$: предел равен отношению старших коэффициентов $\\frac{⟪0⟫}{⟪1⟫}$.', [a, b]))
    },
  },
  {
    topic: 'Пределы и асимптоты',
    gen: n => {
      const a = rnd(1, 7)
      return num(tl('Найдите $\\lim\\limits_{x \\to ⟪0⟫} \\frac{x^2 - ⟪1⟫}{x - ⟪2⟫}$.', [a, a * a, a]),
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
      return num(tl('Найдите $f\'(⟪0⟫)$, если $f(x) = ⟪1⟫x^{⟪2⟫} ⟪3⟫ ⟪4⟫$.', [x0, a === 1 ? '' : a, k, term(b, 'x'), signed(rnd(-9, 9))]),
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
      return txt(tl('Найдите производную функции $f(x) = ⟪0⟫$.', [it.f]), `$${it.d}$`, it.w.map(w => `$${w}$`), n,
        'Правила: $(uv)\' = u\'v + uv\'$, $\\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}$; табличные производные.')
    },
  },
  {
    topic: 'Производная сложной функции',
    gen: n => {
      const k = rnd(2, 4), m = rnd(-3, 3), p = rnd(2, 4), x0 = rnd(0, 2)
      const inner = k * x0 + m
      const v = p * k * inner ** (p - 1)
      return num(tl('Найдите $f\'(⟪0⟫)$, если $f(x) = (⟪1⟫x ⟪2⟫)^{⟪3⟫}$.', [x0, k, signed(m), p]),
        v, [p * inner ** (p - 1), p * k * inner ** p, k * inner ** (p - 1)], n, '',
        tl('$f\'(x) = ⟪0⟫(⟪1⟫x ⟪2⟫)^{⟪3⟫} \\cdot ⟪4⟫$. При $x = ⟪5⟫$: $⟪6⟫ \\cdot ⟪7⟫^{⟪8⟫} \\cdot ⟪9⟫ = ⟪10⟫$.', [p, k, signed(m), p - 1, k, x0, p, inner, p - 1, k, v]))
    },
  },
  {
    topic: 'Уравнение касательной',
    gen: n => {
      const a = rnd(1, 3), b = rnd(-4, 4), x0 = rnd(-2, 3)
      const k = 2 * a * x0 + b
      return num(tl('Найдите угловой коэффициент касательной к графику $y = ⟪0⟫x^2 ⟪1⟫$ в точке $x_0 = ⟪2⟫$.', [a === 1 ? '' : a, term(b, 'x'), x0]),
        k, [a * x0 * x0 + b * x0, 2 * a * x0, a * x0 + b], n, '',
        tl('Угловой коэффициент касательной равен производной: $y\' = ⟪0⟫x ⟪1⟫$, $y\'(⟪2⟫) = ⟪3⟫$.', [2 * a, signed(b), x0, k]))
    },
  },
  {
    topic: 'Уравнение касательной',
    gen: n => {
      const x0 = pick([-2, -1, 1, 2, 3])
      const y0 = x0 * x0, k = 2 * x0
      const bb = y0 - k * x0
      return txt(tl('Составьте уравнение касательной к графику $y = x^2$ в точке $x_0 = ⟪0⟫$.', [x0]),
        `$y = ${lead(k, 'x')} ${signed(bb)}$`, [`$y = ${lead(k, 'x')} ${signed(y0)}$`, `$y = ${lead(x0, 'x')} ${signed(bb)}$`, `$y = ${lead(-k, 'x')} ${signed(bb)}$`, `$y = ${lead(y0, 'x')} ${signed(k)}$`, `$y = ${lead(k, 'x')} ${signed(2 * bb)}$`], n,
        `$y = f(x_0) + f'(x_0)(x - x_0) = ${y0} + ${k}(x - ${x0}) = ${k}x ${signed(bb)}$.`)
    },
  },
  {
    topic: 'Возрастание, убывание, экстремумы',
    gen: n => {
      const a = rnd(1, 4)
      return num(tl('Найдите точку максимума функции $y = x^3 - ⟪0⟫x$.', [3 * a * a]),
        -a, [a, 0, -2 * a * a * a, 3 * a * a], n, '',
        tl('$y\' = 3x^2 - ⟪0⟫ = 0 \\Rightarrow x = \\pm ⟪1⟫$. Производная меняет знак с «+» на «−» в точке $x = -⟪2⟫$ — это максимум.', [3 * a * a, a, a]))
    },
  },
  {
    topic: 'Возрастание, убывание, экстремумы',
    gen: n => {
      const p = rnd(-4, 4)
      return txt(tl('Найдите промежуток убывания функции $y = x^2 ⟪0⟫ + 5$.', [term(-2 * p, 'x')]),
        interval('-\\infty', `${p}`, '(', ']'), [interval(`${p}`, '+\\infty', '[', ')'), interval('-\\infty', `${-p}`, '(', ']'), interval('-\\infty', '+\\infty', '(', ')'), interval('-\\infty', `${p + 2}`, '(', ']'), interval(`${p - 2}`, '+\\infty', '[', ')')], n,
        tl('$y\' = 2x ⟪0⟫ \\le 0$ при $x \\le ⟪1⟫$.', [signed(-2 * p), p]))
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
      return num(tl('Найдите ⟪0⟫ значение функции $y = x^3 - ⟪1⟫x$ на отрезке $[0; ⟪2⟫]$.', [askMin ? 'наименьшее' : 'наибольшее', 3 * a * a, R]),
        askMin ? min : max, [askMin ? max : min, f(R), a, -a], n, '',
        tl('$y\' = 3x^2 - ⟪0⟫ = 0$, на отрезке лежит $x = ⟪1⟫$. $y(0) = 0$, $y(⟪2⟫) = ⟪3⟫$, $y(⟪4⟫) = ⟪5⟫$. ⟪6⟫: $⟪7⟫$.', [3 * a * a, a, a, f(a), R, f(R), askMin ? 'Наименьшее' : 'Наибольшее', askMin ? min : max]))
    },
  },
  {
    topic: 'Физический смысл производной',
    gen: n => {
      const a = rnd(1, 3), b = rnd(2, 5), c = rnd(1, 8), t = rnd(1, 4)
      const v = 3 * a * t * t + 2 * b * t + c
      return num(tl('Точка движется по закону $s(t) = ⟪0⟫t^3 + ⟪1⟫t^2 + ⟪2⟫t$ (м). Найдите её скорость в момент $t = ⟪3⟫$ с.', [a === 1 ? '' : a, b, c, t]),
        v, [a * t ** 3 + b * t * t + c * t, 6 * a * t + 2 * b, 3 * a * t + 2 * b + c], n, 'м/с',
        tl('$v(t) = s\'(t) = ⟪0⟫t^2 + ⟪1⟫t + ⟪2⟫$, $v(⟪3⟫) = ⟪4⟫$ м/с.', [3 * a, 2 * b, c, t, v]))
    },
  },
  {
    topic: 'Физический смысл производной',
    gen: n => {
      const a = rnd(1, 3), b = rnd(2, 5), t = rnd(1, 4)
      const acc = 6 * a * t + 2 * b
      return num(tl('Точка движется по закону $s(t) = ⟪0⟫t^3 + ⟪1⟫t^2$ (м). Найдите её ускорение в момент $t = ⟪2⟫$ с.', [a === 1 ? '' : a, b, t]),
        acc, [3 * a * t * t + 2 * b * t, 6 * a + 2 * b, 6 * a * t], n, 'м/с²',
        tl('$a(t) = s\'\'(t) = ⟪0⟫t + ⟪1⟫$, $a(⟪2⟫) = ⟪3⟫$ м/с².', [6 * a, 2 * b, t, acc]))
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
      return txt(tl('Найдите общий вид первообразных для функции $f(x) = ⟪0⟫$.', [it.f]), `$${it.F}$`, it.w.map(w => `$${w}$`), n,
        'Проверка: производная первообразной должна давать исходную функцию.')
    },
  },
  {
    topic: 'Определённый интеграл',
    gen: n => {
      const k = rnd(1, 3), a = 0, b = rnd(1, 3), c = rnd(1, 5)
      const v = k * b ** 3 + c * b - (k * a ** 3 + c * a)
      return num(tl('Вычислите $\\int\\limits_{⟪0⟫}^{⟪1⟫} (⟪2⟫x^2 + ⟪3⟫)\\,dx$.', [a, b, 3 * k, c]),
        v, [6 * k * b, k * b ** 3, 3 * k * b ** 3 + c * b], n, '',
        tl('Первообразная $⟪0⟫x^3 + ⟪1⟫x$. По формуле Ньютона — Лейбница: $⟪2⟫ - 0 = ⟪3⟫$.', [k === 1 ? '' : k, c, k * b ** 3 + c * b, v]))
    },
  },
  {
    topic: 'Площадь криволинейной трапеции',
    gen: n => {
      const a = pick([3, 6])
      return num(tl('Найдите площадь фигуры, ограниченной линиями $y = x^2$, $y = 0$, $x = ⟪0⟫$.', [a]),
        a ** 3 / 3, [a ** 3, a * a / 2, a ** 3 / 2], n, '',
        `$S = \\int\\limits_0^{${a}} x^2\\,dx = \\frac{x^3}{3}\\Big|_0^{${a}} = ${a ** 3 / 3}$.`)
    },
  },
  {
    topic: 'Площадь криволинейной трапеции',
    gen: n => {
      const k = pick([2, 3, 6])
      return num(tl('Найдите площадь фигуры, ограниченной параболой $y = x^2$ и прямой $y = ⟪0⟫x$.', [k]),
        k ** 3 / 6, [k ** 3 / 3, k ** 3 / 2, k * k / 2], n, '',
        tl('Точки пересечения $x = 0$ и $x = ⟪0⟫$. $S = \\int\\limits_0^{⟪1⟫} (⟪2⟫x - x^2)\\,dx = \\frac{⟪3⟫x^2}{2} - \\frac{x^3}{3}\\Big|_0^{⟪4⟫} = ⟪5⟫$.', [k, k, k, k, k, fx(k ** 3 / 6)]))
    },
  },
  {
    topic: 'Объём тела вращения',
    gen: n => {
      const a = pick([2, 4, 6])
      return txt(tl('Найдите объём тела, полученного вращением вокруг оси $Ox$ фигуры, ограниченной линиями $y = \\sqrt{x}$, $y = 0$, $x = ⟪0⟫$.', [a]),
        `$${pi(a * a / 2)}$`, [`$${pi(a * a)}$`, `$${pi(Math.round(2 * a * Math.sqrt(a) / 3))}$`, `$${pi(a / 2)}$`, `$${pi(a ** 3 / 3)}$`], n,
        `$V = \\pi\\int\\limits_0^{${a}} (\\sqrt{x})^2\\,dx = \\pi\\frac{x^2}{2}\\Big|_0^{${a}} = ${a * a / 2}\\pi$.`)
    },
  },
  {
    topic: 'Дифференциальные уравнения',
    gen: n => {
      const k = rnd(2, 5), c = rnd(1, 6)
      return txt(tl('Найдите решение уравнения $y\' = ⟪0⟫y$, удовлетворяющее условию $y(0) = ⟪1⟫$.', [k, c]),
        `$y = ${c}e^{${k}x}$`, [`$y = ${k}e^{${c}x}$`, `$y = e^{${k}x} + ${c}$`, `$y = ${c}x^{${k}}$`, `$y = ${c * k}x$`], n,
        tl('Общее решение $y = Ce^{⟪0⟫x}$. Из $y(0) = C = ⟪1⟫$.', [k, c]))
    },
  },
  {
    topic: 'Дифференциальные уравнения',
    gen: n => {
      const w = rnd(2, 5)
      return txt(tl('Укажите общее решение уравнения $y\'\' + ⟪0⟫y = 0$.', [w * w]),
        `$y = C_1\\cos ${w}x + C_2\\sin ${w}x$`, [`$y = C_1e^{${w}x} + C_2e^{-${w}x}$`, `$y = C_1\\cos ${w * w}x + C_2\\sin ${w * w}x$`, `$y = (C_1 + C_2x)e^{${w}x}$`, `$y = C\\cos ${w}x$`], n,
        tl('Характеристическое уравнение $k^2 + ⟪0⟫ = 0$, $k = \\pm ⟪1⟫i$, поэтому решение через синус и косинус с частотой ⟪2⟫.', [w * w, w, w]))
    },
  },

  // ---------- Планиметрия ----------
  {
    topic: 'Углы. Смежные и вертикальные углы',
    gen: n => {
      const d = pick([20, 30, 40, 50, 60, 80])
      const small = (180 - d) / 2
      return num(tl('Один из смежных углов на ⟪0⟫° больше другого. Найдите больший угол.', [d]),
        small + d, [small, 180 - d, 90 + d], n, '°',
        tl('$x + (x + ⟪0⟫) = 180°$, $x = ⟪1⟫°$, больший угол $⟪2⟫°$.', [d, small, small + d]))
    },
  },
  {
    topic: 'Углы. Смежные и вертикальные углы',
    gen: n => {
      const s = pick([100, 140, 160, 220, 260])
      return num(tl('Сумма двух вертикальных углов равна ⟪0⟫°. Найдите угол, смежный с каждым из них.', [s]),
        180 - s / 2, [s / 2, 180 - s, 360 - s], n, '°',
        tl('Вертикальные углы равны: каждый $⟪0⟫°$. Смежный с ним $180° - ⟪1⟫° = ⟪2⟫°$.', [s / 2, s / 2, 180 - s / 2]))
    },
  },
  {
    topic: 'Треугольники. Сумма углов. Внешний угол',
    gen: n => {
      const [p, q, r] = pick([[1, 2, 3], [2, 3, 4], [1, 1, 2], [3, 4, 5], [2, 3, 5], [1, 3, 5]])
      const k = 180 / (p + q + r)
      return num(tl('Углы треугольника относятся как ⟪0⟫:⟪1⟫:⟪2⟫. Найдите наибольший угол.', [p, q, r]),
        r * k, [p * k, q * k, r * 20], n, '°',
        tl('$⟪0⟫x + ⟪1⟫x + ⟪2⟫x = 180°$, $x = ⟪3⟫°$, наибольший угол $⟪4⟫ \\cdot ⟪5⟫° = ⟪6⟫°$.', [p, q, r, fx(k), r, fx(k), fx(r * k)]))
    },
  },
  {
    topic: 'Треугольники. Сумма углов. Внешний угол',
    gen: n => {
      const a = rnd(30, 70), b = rnd(30, 70)
      return num(tl('Два угла треугольника равны ⟪0⟫° и ⟪1⟫°. Найдите внешний угол при третьей вершине.', [a, b]),
        a + b, [180 - a - b, 180 - a, Math.abs(a - b)], n, '°',
        tl('Внешний угол равен сумме двух внутренних, не смежных с ним: $⟪0⟫° + ⟪1⟫° = ⟪2⟫°$.', [a, b, a + b]))
    },
  },
  {
    topic: 'Прямоугольный треугольник. Теорема Пифагора',
    gen: n => {
      const [a, b, c] = pick(TRIPLES)
      const askHyp = Math.random() < 0.5
      return askHyp
        ? num(tl('Катеты прямоугольного треугольника равны ⟪0⟫ и ⟪1⟫. Найдите гипотенузу.', [a, b]), c, [a + b, Math.abs(b - a), a * b / 2], n, '',
          `$c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}} = ${c}$.`)
        : num(tl('Гипотенуза прямоугольного треугольника ⟪0⟫, один из катетов ⟪1⟫. Найдите другой катет.', [c, a]), b, [c - a, Math.sqrt(c * c + a * a), c + a], n, '',
          `$b = \\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}} = ${b}$.`)
    },
  },
  {
    topic: 'Прямоугольный треугольник. Теорема Пифагора',
    gen: n => {
      const [a, b, c] = pick(TRIPLES)
      return txt(tl('В прямоугольном треугольнике катеты ⟪0⟫ и ⟪1⟫. Найдите синус угла, противолежащего катету ⟪2⟫.', [a, b, a]),
        `$${frac(a, c)}$`, [`$${frac(b, c)}$`, `$${frac(a, b)}$`, `$${frac(b, a)}$`, `$${frac(c, a)}$`], n,
        tl('Гипотенуза $⟪0⟫$, $\\sin = \\frac{\\text{противолежащий катет}}{\\text{гипотенуза}} = \\frac{⟪1⟫}{⟪2⟫}$.', [c, a, c]))
    },
  },
  {
    topic: 'Подобие треугольников',
    gen: n => {
      const k = pick([2, 3, 4]), S = pick([5, 6, 8, 10])
      return num(tl('Стороны одного треугольника в ⟪0⟫ раза больше соответствующих сторон подобного ему треугольника площадью ⟪1⟫. Найдите площадь большего треугольника.', [k, S]),
        S * k * k, [S * k, S * 2 * k, S + k], n, '',
        tl('Отношение площадей подобных фигур равно квадрату коэффициента подобия: $S = ⟪0⟫ \\cdot ⟪1⟫^2 = ⟪2⟫$.', [S, k, S * k * k]))
    },
  },
  {
    topic: 'Подобие треугольников',
    gen: n => {
      const AB = pick([6, 8, 10, 12]), k = pick([2, 3, 4])
      return num(tl('В треугольнике $ABC$ проведена прямая $MN \\parallel AC$, причём $BM : MA = 1 : ⟪0⟫$. Найдите $MN$, если $AC = ⟪1⟫$.', [k - 1, AB * k]),
        AB, [AB * k / (k - 1), AB * (k - 1), AB * k / 2], n, '',
        tl('Треугольники $MBN$ и $ABC$ подобны с коэффициентом $\\frac{BM}{BA} = \\frac{1}{⟪0⟫}$. $MN = \\frac{⟪1⟫}{⟪2⟫} = ⟪3⟫$.', [k, AB * k, k, AB]))
    },
  },
  {
    topic: 'Медианы, биссектрисы, высоты',
    gen: n => {
      const [a, b, c] = pick(TRIPLES)
      return num(tl('Катеты прямоугольного треугольника ⟪0⟫ и ⟪1⟫. Найдите медиану, проведённую к гипотенузе.', [a, b]),
        c / 2, [c, (a + b) / 2, a * b / c], n, '',
        tl('Медиана к гипотенузе равна половине гипотенузы: $\\frac{⟪0⟫}{2} = ⟪1⟫$.', [c, fx(c / 2)]))
    },
  },
  {
    topic: 'Медианы, биссектрисы, высоты',
    gen: n => {
      const m = pick([6, 9, 12, 15])
      return num(tl('Медиана треугольника равна ⟪0⟫. На каком расстоянии от вершины находится точка пересечения медиан?', [m]),
        2 * m / 3, [m / 3, m / 2, 3 * m / 4], n, '',
        'Точка пересечения медиан делит каждую медиану в отношении $2 : 1$, считая от вершины.')
    },
  },
  {
    topic: 'Медианы, биссектрисы, высоты',
    gen: n => {
      const [a, b, c] = pick(TRIPLES)
      return num(tl('Катеты прямоугольного треугольника ⟪0⟫ и ⟪1⟫. Найдите высоту, проведённую к гипотенузе.', [a, b]),
        a * b / c, [c / 2, (a + b) / 2, a * b / 2], n, '',
        tl('Площадь двумя способами: $\\frac{ab}{2} = \\frac{ch}{2} \\Rightarrow h = \\frac{⟪0⟫ \\cdot ⟪1⟫}{⟪2⟫} = ⟪3⟫$.', [a, b, c, fx(a * b / c)]))
    },
  },
  {
    topic: 'Четырёхугольники. Средние линии',
    gen: n => {
      const a = rnd(4, 15), b = a + rnd(2, 10)
      return num(tl('Основания трапеции равны ⟪0⟫ и ⟪1⟫. Найдите её среднюю линию.', [a, b]),
        (a + b) / 2, [a + b, b - a, (b - a) / 2], n, '',
        tl('Средняя линия трапеции равна полусумме оснований: $\\frac{⟪0⟫ + ⟪1⟫}{2} = ⟪2⟫$.', [a, b, fx((a + b) / 2)]))
    },
  },
  {
    topic: 'Четырёхугольники. Средние линии',
    gen: n => {
      const d1 = pick([6, 8, 10, 12, 16]), d2 = pick([6, 8, 10, 12, 30])
      return num(tl('Диагонали ромба равны ⟪0⟫ и ⟪1⟫. Найдите его площадь.', [d1, d2]),
        d1 * d2 / 2, [d1 * d2, (d1 + d2) / 2, d1 * d2 / 4], n, '',
        `$S = \\frac{d_1d_2}{2} = \\frac{${d1} \\cdot ${d2}}{2} = ${d1 * d2 / 2}$.`)
    },
  },
  {
    topic: 'Четырёхугольники. Средние линии',
    gen: n => {
      const [a, b, c] = pick([[6, 8, 10], [5, 12, 13], [9, 12, 15]])
      return num(tl('Ромб имеет диагонали ⟪0⟫ и ⟪1⟫. Найдите сторону ромба.', [2 * a, 2 * b]),
        c, [a + b, 2 * c, (2 * a + 2 * b) / 2], n, '',
        tl('Диагонали ромба перпендикулярны и делятся пополам: сторона $= \\sqrt{⟪0⟫^2 + ⟪1⟫^2} = ⟪2⟫$.', [a, b, c]))
    },
  },
  {
    topic: 'Окружность. Центральные и вписанные углы',
    gen: n => {
      const c = pick([60, 80, 100, 120, 140])
      return num(tl('Центральный угол равен ⟪0⟫°. Найдите вписанный угол, опирающийся на ту же дугу.', [c]),
        c / 2, [c, 2 * c, 180 - c], n, '°',
        'Вписанный угол равен половине центрального угла, опирающегося на ту же дугу.')
    },
  },
  {
    topic: 'Окружность. Центральные и вписанные углы',
    gen: n => {
      const a = pick([70, 80, 100, 110, 120])
      return num(tl('Четырёхугольник $ABCD$ вписан в окружность, $\\angle A = ⟪0⟫°$. Найдите $\\angle C$.', [a]),
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
      return num(tl('Из внешней точки к окружности проведены касательная и секущая. Внешняя часть секущей равна ⟪0⟫, вся секущая — ⟪1⟫. Найдите длину касательной.', [ext, whole]),
        t, [ext * whole, (ext + whole) / 2, whole - ext], n, '',
        tl('Теорема о касательной и секущей: $t^2 = ⟪0⟫ \\cdot ⟪1⟫ = ⟪2⟫$, $t = ⟪3⟫$.', [ext, whole, ext * whole, t]))
    },
  },
  {
    topic: 'Касательная и секущая',
    gen: n => {
      const [r, t, d] = pick(TRIPLES)
      return num(tl('Радиус окружности ⟪0⟫, расстояние от точки до центра ⟪1⟫. Найдите длину касательной, проведённой из этой точки.', [r, d]),
        t, [d - r, d + r, Math.sqrt(d * d + r * r)], n, '',
        tl('Радиус перпендикулярен касательной: $t = \\sqrt{⟪0⟫^2 - ⟪1⟫^2} = ⟪2⟫$.', [d, r, t]))
    },
  },
  {
    topic: 'Длина дуги. Площадь сектора',
    gen: n => {
      const R = pick([3, 6, 9, 12]), a = pick([60, 90, 120, 30])
      const k = R * a / 180
      return txt(tl('Найдите длину дуги окружности радиусом ⟪0⟫, соответствующей центральному углу ⟪1⟫°.', [R, a]),
        `$${pi((k))}$`, [`$${pi((R * R * a / 360))}$`, `$${pi((2 * k))}$`, `$${pi((k / 2))}$`, `$${pi((R * a / 360))}$`], n,
        `$l = \\frac{\\pi R\\alpha}{180°} = \\frac{\\pi \\cdot ${R} \\cdot ${a}}{180} = ${fx(k)}\\pi$.`)
    },
  },
  {
    topic: 'Длина дуги. Площадь сектора',
    gen: n => {
      const R = pick([2, 3, 6, 12]), a = pick([30, 60, 90, 120])
      const k = R * R * a / 360
      return txt(tl('Найдите площадь сектора круга радиусом ⟪0⟫ с центральным углом ⟪1⟫°.', [R, a]),
        `$${pi((k))}$`, [`$${pi((R * a / 180))}$`, `$${pi((2 * k))}$`, `$${pi((R * R))}$`, `$${pi((k / 2))}$`], n,
        `$S = \\frac{\\pi R^2\\alpha}{360°} = \\frac{\\pi \\cdot ${R * R} \\cdot ${a}}{360} = ${fx(k)}\\pi$.`)
    },
  },
  {
    topic: 'Площади фигур',
    gen: n => {
      const a = pick([4, 6, 8, 10]), b = pick([5, 6, 7, 12]), ang = pick([30, 150])
      return num(tl('Две стороны треугольника равны ⟪0⟫ и ⟪1⟫, угол между ними ⟪2⟫°. Найдите площадь треугольника.', [a, b, ang]),
        a * b / 4, [a * b / 2, a * b, a * b * 0.87 / 2], n, '',
        `$S = \\frac{1}{2}ab\\sin\\gamma = \\frac{1}{2} \\cdot ${a} \\cdot ${b} \\cdot \\frac{1}{2} = ${fx(a * b / 4)}$.`)
    },
  },
  {
    topic: 'Площади фигур',
    gen: n => {
      const [a, b, c, S] = pick([[13, 14, 15, 84], [5, 5, 6, 12], [10, 10, 12, 48], [5, 12, 13, 30], [17, 10, 21, 84]])
      return num(tl('Найдите площадь треугольника со сторонами ⟪0⟫, ⟪1⟫ и ⟪2⟫.', [a, b, c]),
        S, [a * b / 2, (a + b + c) / 2, S * 2], n, '',
        tl('Формула Герона: $p = ⟪0⟫$, $S = \\sqrt{p(p - a)(p - b)(p - c)} = ⟪1⟫$.', [(a + b + c) / 2, S]))
    },
  },
  {
    topic: 'Площади фигур',
    gen: n => {
      const a = rnd(3, 10), b = a + rnd(2, 8), h = rnd(3, 9)
      return num(tl('Основания трапеции ⟪0⟫ и ⟪1⟫, высота ⟪2⟫. Найдите площадь трапеции.', [a, b, h]),
        (a + b) * h / 2, [(a + b) * h, a * b * h / 2, (b - a) * h / 2], n, '',
        `$S = \\frac{a + b}{2} \\cdot h = \\frac{${a} + ${b}}{2} \\cdot ${h} = ${fx((a + b) * h / 2)}$.`)
    },
  },
  {
    topic: 'Теоремы синусов и косинусов',
    gen: n => {
      const [a, b, ang, c] = pick([[3, 5, 120, 7], [5, 8, 60, 7], [3, 8, 60, 7], [5, 3, 120, 7], [7, 8, 120, 13], [8, 15, 60, 13]])
      return num(tl('Две стороны треугольника ⟪0⟫ и ⟪1⟫, угол между ними ⟪2⟫°. Найдите третью сторону.', [a, b, ang]),
        c, [Math.round(Math.sqrt(a * a + b * b)), a + b, Math.abs(b - a)], n, '',
        tl('Теорема косинусов: $c^2 = ⟪0⟫ + ⟪1⟫ - 2 \\cdot ⟪2⟫ \\cdot ⟪3⟫ \\cdot \\cos ⟪4⟫° = ⟪5⟫$, $c = ⟪6⟫$.', [a * a, b * b, a, b, ang, c * c, c]))
    },
  },
  {
    topic: 'Теоремы синусов и косинусов',
    gen: n => {
      const R = pick([3, 4, 5, 6, 7])
      return num(tl('В треугольнике сторона $a$ лежит против угла 30°. Радиус описанной окружности ⟪0⟫. Найдите $a$.', [R]),
        R, [2 * R, R / 2, R * Math.sqrt(3)], n, '',
        tl('Теорема синусов: $\\frac{a}{\\sin A} = 2R \\Rightarrow a = 2 \\cdot ⟪0⟫ \\cdot \\frac{1}{2} = ⟪1⟫$.', [R, R]))
    },
  },
  {
    topic: 'Правильные многоугольники. Вписанные и описанные',
    gen: n => {
      const k = pick([5, 6, 8, 9, 10, 12])
      const ang = 180 * (k - 2) / k
      return num(tl('Найдите внутренний угол правильного ⟪0⟫-угольника.', [k]),
        ang, [360 / k, 180 - ang / 2, 180 * k / (k + 2)], n, '°',
        tl('Сумма углов $180°(n - 2) = ⟪0⟫°$, один угол $\\frac{⟪1⟫°}{⟪2⟫} = ⟪3⟫°$.', [180 * (k - 2), 180 * (k - 2), k, fx(ang)]))
    },
  },
  {
    topic: 'Правильные многоугольники. Вписанные и описанные',
    gen: n => {
      const a = pick([2, 4, 6, 8])
      return num(tl('Сторона правильного шестиугольника равна ⟪0⟫. Найдите радиус описанной около него окружности.', [a]),
        a, [a / 2, 2 * a, a * Math.sqrt(3) / 2], n, '',
        'Правильный шестиугольник состоит из шести равносторонних треугольников, поэтому $R = a$.')
    },
  },

  // ---------- Стереометрия ----------
  {
    topic: 'Призма и параллелепипед',
    gen: n => {
      const [a, b, c, d] = pick([[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9], [2, 10, 11, 15]])
      return num(tl('Измерения прямоугольного параллелепипеда ⟪0⟫, ⟪1⟫ и ⟪2⟫. Найдите его диагональ.', [a, b, c]),
        d, [a + b + c, Math.sqrt(a * a + b * b), a * b * c], n, '',
        `$d = \\sqrt{a^2 + b^2 + c^2} = \\sqrt{${a * a + b * b + c * c}} = ${d}$.`)
    },
  },
  {
    topic: 'Призма и параллелепипед',
    gen: n => {
      const a = pick([2, 3, 4, 5]), h = pick([5, 6, 10])
      return num(tl('Найдите площадь боковой поверхности правильной четырёхугольной призмы со стороной основания ⟪0⟫ и высотой ⟪1⟫.', [a, h]),
        4 * a * h, [a * a * h, 4 * a * h + 2 * a * a, 2 * a * h], n, '',
        tl('$S_{бок} = P_{осн} \\cdot h = 4 \\cdot ⟪0⟫ \\cdot ⟪1⟫ = ⟪2⟫$.', [a, h, 4 * a * h]))
    },
  },
  {
    topic: 'Пирамида и усечённая пирамида',
    gen: n => {
      const a = pick([3, 6, 9]), h = pick([4, 5, 10])
      return num(tl('Найдите объём правильной четырёхугольной пирамиды со стороной основания ⟪0⟫ и высотой ⟪1⟫.', [a, h]),
        a * a * h / 3, [a * a * h, a * a * h / 2, a * h / 3], n, '',
        tl('$V = \\frac{1}{3}S_{осн}h = \\frac{1}{3} \\cdot ⟪0⟫ \\cdot ⟪1⟫ = ⟪2⟫$.', [a * a, h, fx(a * a * h / 3)]))
    },
  },
  {
    topic: 'Пирамида и усечённая пирамида',
    gen: n => {
      const [hh, half, ap] = pick([[4, 3, 5], [12, 5, 13], [8, 6, 10]])
      const a = 2 * half
      return num(tl('Высота правильной четырёхугольной пирамиды ⟪0⟫, сторона основания ⟪1⟫. Найдите апофему (высоту боковой грани).', [hh, a]),
        ap, [Math.round(Math.sqrt(hh * hh + a * a)), hh + half, hh], n, '',
        tl('Апофема — гипотенуза прямоугольного треугольника с катетами $h = ⟪0⟫$ и $\\frac{a}{2} = ⟪1⟫$: $\\sqrt{⟪2⟫ + ⟪3⟫} = ⟪4⟫$.', [hh, half, hh * hh, half * half, ap]))
    },
  },
  {
    topic: 'Пирамида и усечённая пирамида',
    gen: n => {
      const S1 = pick([4, 9, 16]), S2 = pick([25, 36, 49]), h = pick([3, 6])
      const V = h / 3 * (S1 + S2 + Math.sqrt(S1 * S2))
      return num(tl('Площади оснований усечённой пирамиды ⟪0⟫ и ⟪1⟫, высота ⟪2⟫. Найдите её объём.', [S1, S2, h]),
        V, [h * (S1 + S2) / 2, h / 3 * (S1 + S2), h * (S1 + S2)], n, '',
        `$V = \\frac{h}{3}(S_1 + S_2 + \\sqrt{S_1S_2}) = \\frac{${h}}{3}(${S1} + ${S2} + ${Math.sqrt(S1 * S2)}) = ${fx(V)}$.`)
    },
  },
  {
    topic: 'Цилиндр',
    gen: n => {
      const r = pick([2, 3, 4, 5]), h = pick([3, 5, 6, 10])
      return txt(tl('Найдите объём цилиндра с радиусом основания ⟪0⟫ и высотой ⟪1⟫.', [r, h]),
        `$${pi(r * r * h)}$`, [`$${pi(2 * r * h)}$`, `$${pi(r * h)}$`, `$${pi((r * r * h / 3))}$`, `$${pi(2 * r * r * h)}$`], n,
        `$V = \\pi r^2h = \\pi \\cdot ${r * r} \\cdot ${h} = ${r * r * h}\\pi$.`)
    },
  },
  {
    topic: 'Цилиндр',
    gen: n => {
      const r = pick([2, 3, 4, 5]), h = pick([3, 5, 6, 10])
      return txt(tl('Найдите площадь боковой поверхности цилиндра с радиусом основания ⟪0⟫ и высотой ⟪1⟫.', [r, h]),
        `$${pi(2 * r * h)}$`, [`$${pi(r * r * h)}$`, `$${pi(r * h)}$`, `$${pi(2 * r * h + 2 * r * r)}$`, `$${pi(2 * r * r)}$`, `$${pi(4 * r * h)}$`, `$${pi(r * r)}$`], n,
        tl('$S_{бок} = 2\\pi rh = 2\\pi \\cdot ⟪0⟫ \\cdot ⟪1⟫ = ⟪2⟫\\pi$.', [r, h, 2 * r * h]))
    },
  },
  {
    topic: 'Конус и усечённый конус',
    gen: n => {
      const [r, h, l] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10]])
      return txt(tl('Радиус основания конуса ⟪0⟫, высота ⟪1⟫. Найдите площадь боковой поверхности.', [r, h]),
        `$${pi(r * l)}$`, [`$${pi(r * h)}$`, `$${pi(r * l + r * r)}$`, `$${pi((r * r * h / 3))}$`, `$${pi(2 * r * l)}$`], n,
        tl('Образующая $l = \\sqrt{⟪0⟫ + ⟪1⟫} = ⟪2⟫$. $S_{бок} = \\pi rl = ⟪3⟫\\pi$.', [r * r, h * h, l, r * l]))
    },
  },
  {
    topic: 'Конус и усечённый конус',
    gen: n => {
      const r = pick([3, 6, 9]), h = pick([2, 4, 5, 10])
      return txt(tl('Найдите объём конуса с радиусом основания ⟪0⟫ и высотой ⟪1⟫.', [r, h]),
        `$${pi(r * r * h / 3)}$`, [`$${pi(r * r * h)}$`, `$${pi(r * h / 3)}$`, `$${pi((r * r * h / 2))}$`, `$${pi(2 * r * h)}$`], n,
        `$V = \\frac{1}{3}\\pi r^2h = \\frac{1}{3}\\pi \\cdot ${r * r} \\cdot ${h} = ${r * r * h / 3}\\pi$.`)
    },
  },
  {
    topic: 'Шар и сфера',
    gen: n => {
      const R = pick([3, 6])
      return txt(tl('Найдите объём шара радиусом ⟪0⟫.', [R]),
        `$${pi(4 * R ** 3 / 3)}$`, [`$${pi(4 * R * R)}$`, `$${pi(R ** 3)}$`, `$${pi((4 * R ** 3))}$`, `$${pi((R ** 3 / 3))}$`], n,
        `$V = \\frac{4}{3}\\pi R^3 = \\frac{4}{3}\\pi \\cdot ${R ** 3} = ${4 * R ** 3 / 3}\\pi$.`)
    },
  },
  {
    topic: 'Шар и сфера',
    gen: n => {
      const k = pick([2, 3])
      return txt(tl('Во сколько раз увеличится объём шара, если его радиус увеличить в ⟪0⟫ раза?', [k]),
        tl('в ⟪0⟫ раз', [k ** 3]), [tl('в ⟪0⟫ раза', [k]), tl('в ⟪0⟫ раз⟪1⟫', [k * k, k * k < 5 ? 'а' : '']), tl('в ⟪0⟫ раз', [2 * k]), tl('в ⟪0⟫ раз', [k ** 3 * 2])], n,
        tl('$V \\sim R^3$: объём вырастет в $⟪0⟫^3 = ⟪1⟫$ раз.', [k, k ** 3]))
    },
  },
  {
    topic: 'Шар и сфера',
    gen: n => {
      const R = pick([2, 3, 5, 6])
      return txt(tl('Найдите площадь поверхности сферы радиусом ⟪0⟫.', [R]),
        `$${pi(4 * R * R)}$`, [`$${pi(R * R)}$`, `$${pi((4 * R ** 3 / 3))}$`, `$${pi(2 * R * R)}$`, `$${pi(4 * R)}$`], n,
        `$S = 4\\pi R^2 = 4\\pi \\cdot ${R * R} = ${4 * R * R}\\pi$.`)
    },
  },
  {
    topic: 'Многогранники. Сечения. Двугранный угол',
    gen: n => {
      const k = rnd(4, 10)
      const prism = Math.random() < 0.5
      return num(tl('Сколько рёбер у ⟪0⟫?', [prism ? tl('⟪0⟫-угольной призмы', [k]) : tl('⟪0⟫-угольной пирамиды', [k])]),
        prism ? 3 * k : 2 * k, prism ? [2 * k, k + 2, 4 * k] : [k + 1, 3 * k, k], n, '',
        prism ? tl('У призмы по $⟪0⟫$ рёбер в двух основаниях и $⟪1⟫$ боковых: $3n = ⟪2⟫$.', [k, k, 3 * k]) : tl('У пирамиды $⟪0⟫$ рёбер основания и $⟪1⟫$ боковых: $2n = ⟪2⟫$.', [k, k, 2 * k]))
    },
  },
  {
    topic: 'Многогранники. Сечения. Двугранный угол',
    gen: n => {
      const [V, F] = pick([[8, 6], [6, 8], [12, 20], [20, 12], [4, 4]])
      const E = V + F - 2
      return num(tl('У выпуклого многогранника ⟪0⟫ вершин и ⟪1⟫ граней. Сколько у него рёбер?', [V, F]),
        E, [V + F, V + F + 2, V * F / 2], n, '',
        tl('Формула Эйлера: $В - Р + Г = 2 \\Rightarrow Р = ⟪0⟫ + ⟪1⟫ - 2 = ⟪2⟫$.', [V, F, E]))
    },
  },

  // ---------- Векторы и координаты ----------
  {
    topic: 'Координаты и длина вектора',
    gen: n => {
      const [a, b, c, d] = pick([[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9]])
      const s = () => pick([1, -1])
      return num(tl('Найдите длину вектора $\\vec{a} = (⟪0⟫; ⟪1⟫; ⟪2⟫)$.', [s() * a, s() * b, s() * c]),
        d, [a + b + c, a * a + b * b + c * c, Math.sqrt(a * a + b * b)], n, '',
        `$|\\vec{a}| = \\sqrt{${a * a} + ${b * b} + ${c * c}} = \\sqrt{${d * d}} = ${d}$.`)
    },
  },
  {
    topic: 'Координаты и длина вектора',
    gen: n => {
      const x1 = rnd(-5, 5), y1 = rnd(-5, 5), x2 = rnd(-5, 5), y2 = rnd(-5, 5)
      return txt(tl('Найдите координаты вектора $\\overrightarrow{AB}$, если $A(⟪0⟫; ⟪1⟫)$, $B(⟪2⟫; ⟪3⟫)$.', [x1, y1, x2, y2]),
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
      return txt(tl('Даны $\\vec{a} = (⟪0⟫; ⟪1⟫)$ и $\\vec{b} = (⟪2⟫; ⟪3⟫)$. Найдите координаты вектора $⟪4⟫\\vec{a} - ⟪5⟫\\vec{b}$.', [a[0], a[1], b[0], b[1], p, q === 1 ? '' : q]),
        `$(${r[0]}; ${r[1]})$`, [`$(${p * a[0] + q * b[0]}; ${p * a[1] + q * b[1]})$`, `$(${a[0] - b[0]}; ${a[1] - b[1]})$`, `$(${r[1]}; ${r[0]})$`, `$(${p * a[0] - b[0]}; ${p * a[1] - b[1]})$`, `$(${r[0] + 1}; ${r[1]})$`, `$(${r[0]}; ${r[1] - 1})$`], n,
        `$(${p} \\cdot ${a[0]} - ${q} \\cdot ${b[0]};\\ ${p} \\cdot ${a[1]} - ${q} \\cdot ${b[1]}) = (${r[0]}; ${r[1]})$.`)
    },
  },
  {
    topic: 'Скалярное произведение. Угол между векторами',
    gen: n => {
      const a = [rnd(-5, 5), rnd(-5, 5), rnd(-3, 3)], b = [rnd(-5, 5), rnd(-5, 5), rnd(-3, 3)]
      const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
      return num(tl('Найдите скалярное произведение векторов $\\vec{a} = (⟪0⟫)$ и $\\vec{b} = (⟪1⟫)$.', [a.join('; '), b.join('; ')]),
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
      return num(tl('Найдите угол между векторами $\\vec{a} = ⟪0⟫$ и $\\vec{b} = ⟪1⟫$.', [it.a, it.b]),
        it.v, [180 - it.v || 90, it.v / 2 || 45, 90 + it.v / 2], n, '°',
        '$\\cos\\varphi = \\frac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}||\\vec{b}|}$, затем находим угол по табличному значению косинуса.')
    },
  },
  {
    topic: 'Коллинеарные и перпендикулярные векторы',
    gen: n => {
      const a = rnd(1, 4), b = rnd(1, 4), k = pick([2, 3, -2])
      return num(tl('При каком $m$ векторы $\\vec{a} = (⟪0⟫; m)$ и $\\vec{b} = (⟪1⟫; ⟪2⟫)$ коллинеарны?', [a, a * k, b * k]),
        b, [-b, b * k, a * k], n, '',
        tl('Координаты коллинеарных векторов пропорциональны: $\\frac{⟪0⟫}{⟪1⟫} = \\frac{m}{⟪2⟫} \\Rightarrow m = ⟪3⟫$.', [a, a * k, b * k, b]))
    },
  },
  {
    topic: 'Коллинеарные и перпендикулярные векторы',
    gen: n => {
      const a = rnd(1, 5), b = rnd(-4, 4) || 2, c = rnd(1, 5)
      // a·c + b·m = 0 → m = -ac/b
      const m = -a * c / b
      return num(tl('При каком $m$ векторы $\\vec{a} = (⟪0⟫; ⟪1⟫)$ и $\\vec{b} = (⟪2⟫; m)$ перпендикулярны?', [a, b, c]),
        m, [-m, a * c / b + 1, b * c / a], n, '',
        tl('Скалярное произведение равно нулю: $⟪0⟫ \\cdot ⟪1⟫ + ⟪2⟫m = 0 \\Rightarrow m = ⟪3⟫$.', [a, c, b, fx(m)]))
    },
  },
  {
    topic: 'Уравнение окружности и прямой',
    gen: n => {
      const a = rnd(1, 5) * pick([1, -1]), b = rnd(1, 5) * pick([1, -1]), r = rnd(2, 6)
      const sx = a === 0 ? 'x^2' : `(x ${signed(-a)})^2`, sy = b === 0 ? 'y^2' : `(y ${signed(-b)})^2`
      return txt(tl('Найдите центр и радиус окружности $⟪0⟫ + ⟪1⟫ = ⟪2⟫$.', [sx, sy, r * r]),
        tl('центр $(⟪0⟫; ⟪1⟫)$, $R = ⟪2⟫$', [a, b, r]), [tl('центр $(⟪0⟫; ⟪1⟫)$, $R = ⟪2⟫$', [-a, -b, r]), tl('центр $(⟪0⟫; ⟪1⟫)$, $R = ⟪2⟫$', [a, b, r * r]), tl('центр $(⟪0⟫; ⟪1⟫)$, $R = ⟪2⟫$', [-a, -b, r * r]), tl('центр $(⟪0⟫; ⟪1⟫)$, $R = ⟪2⟫$', [b, a, r])], n,
        'Уравнение окружности: $(x - a)^2 + (y - b)^2 = R^2$, центр $(a; b)$.')
    },
  },
  {
    topic: 'Уравнение окружности и прямой',
    gen: n => {
      const x1 = rnd(-4, 2), y1 = rnd(-4, 4), dx = rnd(1, 3), k = pick([-3, -2, 2, 3])
      const x2 = x1 + dx, y2 = y1 + k * dx
      const b = y1 - k * x1
      return txt(tl('Составьте уравнение прямой, проходящей через точки $A(⟪0⟫; ⟪1⟫)$ и $B(⟪2⟫; ⟪3⟫)$.', [x1, y1, x2, y2]),
        `$y = ${k}x ${signed(b)}$`, [`$y = ${-k}x ${signed(b)}$`, `$y = ${k}x ${signed(-b || 1)}$`, `$y = ${k + (k > 0 ? 1 : -1)}x ${signed(b)}$`, `$y = ${k}x ${signed(b + 2)}$`, `$y = ${-k}x ${signed(-b || 2)}$`], n,
        tl('Угловой коэффициент $k = \\frac{⟪0⟫ - ⟪1⟫}{⟪2⟫ - ⟪3⟫} = ⟪4⟫$, $b = y_1 - kx_1 = ⟪5⟫$.', [y2, y1, x2, x1, k, b]))
    },
  },
  {
    topic: 'Уравнения сферы и плоскости. Расстояния',
    gen: n => {
      const [A, B, C, L] = pick([[1, 2, 2, 3], [2, 3, 6, 7], [2, -1, 2, 3], [6, 2, 3, 7]])
      const x = rnd(-3, 3), y = rnd(-3, 3), z = rnd(-3, 3), dist = rnd(1, 4)
      const D = dist * L - (A * x + B * y + C * z)
      return num(tl('Найдите расстояние от точки $M(⟪0⟫; ⟪1⟫; ⟪2⟫)$ до плоскости $⟪3⟫x ⟪4⟫ ⟪5⟫ ⟪6⟫ = 0$.', [x, y, z, A, term(B, 'y'), term(C, 'z'), signed(D)]),
        dist, [dist * L, Math.abs(A * x + B * y + C * z), dist + 1], n, '',
        `$d = \\frac{|${A} \\cdot ${x} ${signed(B)} \\cdot ${y} ${signed(C)} \\cdot ${z} ${signed(D)}|}{\\sqrt{${A * A} + ${B * B} + ${C * C}}} = \\frac{${dist * L}}{${L}} = ${dist}$.`)
    },
  },
  {
    topic: 'Уравнения сферы и плоскости. Расстояния',
    gen: n => {
      const a = rnd(-4, 4), b = rnd(-4, 4), c = rnd(-4, 4), r = rnd(1, 5)
      return num(tl('Найдите радиус сферы $(x ⟪0⟫)^2 + (y ⟪1⟫)^2 + (z ⟪2⟫)^2 = ⟪3⟫$.', [signed(-a), signed(-b), signed(-c), r * r]),
        r, [r * r, 2 * r, r * r / 2], n, '',
        tl('Уравнение сферы $(x - a)^2 + (y - b)^2 + (z - c)^2 = R^2$, $R = \\sqrt{⟪0⟫} = ⟪1⟫$.', [r * r, r]))
    },
  },
]
