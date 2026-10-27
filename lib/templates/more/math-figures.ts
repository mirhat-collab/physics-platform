import type { Template } from '../helpers'
import { lt, calc, hardCalc, num, pick, rnd, fx } from './common'
import { circleFigure, gridFigure, gridVectors, plot, type Pt } from '../figures'

// Задачи по рисунку: фигуры на клетках, графики функций и производной,
// углы в окружности, векторы на клетках.

const withFig = (g: ReturnType<typeof num>, figure: string) => ({ ...g, figure })

// Площадь многоугольника по координатам вершин (формула шнурования)
const area = (p: Pt[]) => Math.abs(p.reduce((s, [x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return s + x * y2 - x2 * y }, 0)) / 2

export const MATH_FIGURES: Template[] = [
  calc('Площади фигур', n => {
    let tri: Pt[] = [], S = 0
    while (S < 4 || S > 18) {
      tri = [[rnd(0, 2), rnd(0, 2)], [rnd(5, 8), rnd(0, 3)], [rnd(1, 7), rnd(4, 6)]]
      S = area(tri)
    }
    const box = (Math.max(...tri.map(v => v[0])) - Math.min(...tri.map(v => v[0]))) * (Math.max(...tri.map(v => v[1])) - Math.min(...tri.map(v => v[1])))
    return withFig(num(lt`Найдите площадь треугольника $ABC$, изображённого на клетчатой бумаге с размером клетки $1 \\times 1$.`,
      S, [2 * S, box, S + 1], n, '',
      lt`Достроим треугольник до прямоугольника со сторонами по линиям сетки (площадь ${box}) и вычтем площади прямоугольных треугольников по углам. Получается ${fx(S)}.`), gridFigure(tri, [8, 6]))
  }),
  calc('Площади фигур', n => {
    const y0 = rnd(0, 1), h = rnd(3, 5), a = rnd(5, 8), b = rnd(2, a - 1), x0 = rnd(0, 8 - a), sh = rnd(0, a - b)
    const tr: Pt[] = [[x0, y0], [x0 + a, y0], [x0 + sh + b, y0 + h], [x0 + sh, y0 + h]]
    const S = (a + b) * h / 2
    return withFig(num(lt`Найдите площадь трапеции $ABCD$, изображённой на клетчатой бумаге с размером клетки $1 \\times 1$.`,
      S, [(a + b) * h, a * h, b * h], n, '',
      lt`По рисунку основания $AB = ${a}$ и $CD = ${b}$, высота ${h}. $S = \\frac{a + b}{2}h = \\frac{${a} + ${b}}{2} \\cdot ${h} = ${fx(S)}$.`), gridFigure(tr, [8, 6]))
  }),
  calc('Квадратичная функция', n => {
    const a = pick([1, -1]), h = rnd(-2, 2), k = a > 0 ? rnd(-4, -1) : rnd(1, 4), x0 = h + pick([4, 5, -4, -5])
    const f = (x: number) => a * (x - h) ** 2 + k
    const pts: Pt[] = Array.from({ length: 41 }, (_, i) => { const x = h - 3 + (6 * i) / 40; return [x, f(x)] })
    const fig = plot({ x: [h - 4, h + 4, 1], y: [Math.min(k, f(h + 3)) - 1, Math.max(k, f(h + 3)) + 1, 1], xLabel: 'x', yLabel: 'y', lines: [{ pts }], dots: [[h, k]] })
    return withFig(num(lt`На рисунке график функции $y = ax^2 + bx + c$ ($a = ${a}$). Найдите значение функции при $x = ${x0}$.`,
      f(x0), [f(x0) + 2 * k || f(x0) + 1, -f(x0), a * x0 * x0 + k], n, '',
      lt`Вершина параболы по графику — $(${h};\\ ${k})$, значит $y = ${a === 1 ? '' : '-'}(x ${h < 0 ? '+' : '-'} ${Math.abs(h)})^2 ${k < 0 ? '-' : '+'} ${Math.abs(k)}$. При $x = ${x0}$: $y = ${f(x0)}$.`), fig)
  }),
  calc('Квадратичная функция', n => {
    const a = pick([1, -1]), h = rnd(-2, 2), k = a > 0 ? rnd(-4, -1) : rnd(1, 4)
    const c = pick([k, k + a * rnd(1, 3), k - a * rnd(1, 3)])
    const cnt = c === k ? 1 : (c - k) * a > 0 ? 2 : 0
    const f = (x: number) => a * (x - h) ** 2 + k
    const pts: Pt[] = Array.from({ length: 41 }, (_, i) => { const x = h - 3 + (6 * i) / 40; return [x, f(x)] })
    const fig = plot({ x: [h - 4, h + 4, 1], y: [Math.min(k, f(h + 3), c) - 1, Math.max(k, f(h + 3), c) + 1, 1], xLabel: 'x', yLabel: 'y', lines: [{ pts }] })
    return withFig(num(lt`По графику функции $y = f(x)$ определите, сколько корней имеет уравнение $f(x) = ${c}$.`,
      cnt || 0, [0, 1, 2, 3, 4].filter(v => v !== cnt), n, '',
      lt`Проводим прямую $y = ${c}$ и считаем точки пересечения с параболой (вершина в точке $(${h};\\ ${k})$): ${cnt}.`), fig)
  }),
  hardCalc('Возрастание, убывание, экстремумы', n => {
    const z1 = rnd(-4, -2), z2 = rnd(-1, 1), z3 = rnd(2, 4), sgn = pick([1, -1])
    const d = (x: number) => sgn * (x - z1) * (x - z2) * (x - z3) / 6
    const pts: Pt[] = Array.from({ length: 61 }, (_, i) => { const x = z1 - 1 + ((z3 - z1 + 2) * i) / 60; return [x, d(x)] })
    const ymax = Math.ceil(Math.max(...pts.map(p => Math.abs(p[1]))))
    const maxima = sgn > 0 ? 1 : 2
    const fig = plot({ x: [z1 - 1, z3 + 1, 1], y: [-ymax, ymax, Math.max(1, Math.round(ymax / 3))], xLabel: 'x', yLabel: "y = f′(x)", lines: [{ pts }] })
    return withFig(num(lt`На рисунке изображён график производной функции $f(x)$ на отрезке $[${z1 - 1};\\ ${z3 + 1}]$. Сколько точек максимума у функции $f(x)$ на этом отрезке?`,
      maxima, [3 - maxima, 3, 0, 4], n, '',
      lt`Точка максимума — там, где производная меняет знак с «+» на «−». Нули производной: $${z1}$, $${z2}$, $${z3}$; смена знака с плюса на минус ${maxima === 1 ? lt`в одной точке` : lt`в двух точках`}.`), fig)
  }),
  calc('Окружность. Центральные и вписанные углы', n => {
    const c = pick([60, 80, 100, 120, 140]), a0 = rnd(200, 250)
    const fig = circleFigure([{ deg: a0, name: 'A' }, { deg: a0 + c, name: 'B' }, { deg: a0 + c / 2 + 180, name: 'C' }], [[0, 3], [1, 3], [2, 0], [2, 1]], { center: true })
    return withFig(num(lt`Точка $O$ — центр окружности, $\\angle AOB = ${c}°$ (см. рисунок). Найдите угол $ACB$.`,
      c / 2, [c, 180 - c / 2, 180 - c], n, '°',
      lt`Вписанный угол $ACB$ опирается на ту же дугу $AB$, что и центральный $AOB$, и равен его половине: $${c / 2}°$.`), fig)
  }),
  calc('Координаты и длина вектора', n => {
    const [u, w, L] = pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13]])
    const ax = rnd(1, u - 1), ay = rnd(-2, w), bx = u - ax, by = w - ay
    const A0: Pt = [1, Math.max(1, 1 - Math.min(ay, 0))], B0: Pt = [Math.max(A0[0] + ax, 1) + 2, Math.max(1, 1 - Math.min(by, 0))]
    const cells: [number, number] = [B0[0] + bx + 1, Math.max(A0[1] + Math.max(ay, 0), B0[1] + Math.max(by, 0)) + 1]
    const fig = gridVectors([{ from: A0, to: [A0[0] + ax, A0[1] + ay], name: 'a' }, { from: B0, to: [B0[0] + bx, B0[1] + by], name: 'b' }], cells)
    return withFig(num(lt`На клетчатой бумаге (клетка $1 \\times 1$) изображены векторы $\\vec{a}$ и $\\vec{b}$. Найдите длину вектора $\\vec{a} + \\vec{b}$.`,
      L, [Math.hypot(ax, ay) + Math.hypot(bx, by), u + w, L * L], n, '',
      lt`По клеткам: $\\vec{a}(${ax};\\ ${ay})$, $\\vec{b}(${bx};\\ ${by})$. $\\vec{a} + \\vec{b} = (${u};\\ ${w})$, длина $\\sqrt{${u * u} + ${w * w}} = ${L}$.`), fig)
  }),
]
