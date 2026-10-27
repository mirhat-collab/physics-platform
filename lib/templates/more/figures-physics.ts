import type { Template } from '../helpers'
import { tr } from '../helpers'
import { lt, calc, hardCalc, num, pick, rnd, fx, PI } from './common'
import { axis, circuitParallelSeries, circuitSeriesParallel, plot, type Pt } from '../figures'

// Задачи по рисунку: графики, схемы. На ЕНТ таких много — нужно уметь
// снять данные с графика и прочитать схему.

const withFig = (g: ReturnType<typeof num>, figure: string) => ({ ...g, figure })

export const PHYSICS_FIGURES: Template[] = [
  calc('Графики движения', n => {
    const v = pick([4, 6, 8, 10]), t1 = rnd(1, 3), t2 = rnd(1, 4), t3 = rnd(1, 3), T = t1 + t2 + t3
    const s = v * (t1 / 2 + t2 + t3 / 2)
    const fig = plot({ x: [0, T + 1, 1], y: [0, v + 2, 2], xLabel: axis('t', 'с'), yLabel: axis('v', 'м/с'), lines: [{ pts: [[0, 0], [t1, v], [t1 + t2, v], [T, 0]] }] })
    return withFig(num(lt`По графику зависимости скорости тела от времени найдите путь, пройденный телом за ${T} с.`,
      s, [v * T, v * T / 2, v * t2], n, 'м',
      lt`Путь равен площади под графиком $v(t)$ — трапеции: $\\frac{${t1}}{2} \\cdot ${v} + ${t2} \\cdot ${v} + \\frac{${t3}}{2} \\cdot ${v} = ${fx(s)}$ м.`), fig)
  }),
  calc('Графики движения', n => {
    const v0 = pick([2, 4, 6]), v1 = v0 + pick([4, 6, 8]), t1 = pick([2, 4]), t2 = pick([2, 3, 4]), T = t1 + t2
    const a = v1 / t2
    const fig = plot({ x: [0, T + 1, 1], y: [0, v1 + 2, 2], xLabel: axis('t', 'с'), yLabel: axis('v', 'м/с'), lines: [{ pts: [[0, v0], [t1, v1], [T, 0]] }] })
    return withFig(num(lt`По графику скорости найдите модуль ускорения тела на последнем участке движения.`,
      a, [(v1 - v0) / t1, v1 / T, v1 * t2], n, 'м/с²',
      lt`На последнем участке скорость падает от ${v1} м/с до 0 за ${t2} с: $|a| = \\frac{${v1}}{${t2}} = ${fx(a)}$ м/с².`), fig)
  }),
  calc('Графики движения', n => {
    // Встреча — в узле сетки, чтобы её можно было снять с графика
    const x1 = pick([0, 10]), v1 = pick([2, 4, 5]), v2 = pick([2, 3, 5]), tm = pick([4, 5, 6])
    const x2 = x1 + (v1 + v2) * tm, xm = x1 + v1 * tm
    const T = Math.ceil(tm) + 2
    const fig = plot({ x: [0, T, 1], y: [0, Math.ceil((x2 + 10) / 10) * 10, 10], xLabel: axis('t', 'с'), yLabel: axis('x', 'м'),
      lines: [{ pts: [[0, x1], [T, x1 + v1 * T]], label: '1' }, { pts: [[0, x2], [T, x2 - v2 * T]], accent: false, label: '2' }] })
    return withFig(num(lt`На рисунке графики координат двух тел. Найдите координату места их встречи.`,
      xm, [tm, x2 / 2, (x1 + x2) / 2 === xm ? xm + 10 : (x1 + x2) / 2], n, 'м',
      lt`С графиков: $x_1 = ${x1} + ${v1}t$, $x_2 = ${x2} - ${v2}t$. Встреча при $x_1 = x_2$: $t = \\frac{${x2 - x1}}{${v1 + v2}} = ${fx(tm)}$ с, $x = ${fx(xm)}$ м.`), fig)
  }),
  calc('Закон Ома для участка цепи. Соединения проводников', n => {
    const [R2, R3, R23] = pick([[6, 3, 2], [4, 4, 2], [12, 6, 4], [10, 10, 5], [20, 5, 4]]), R1 = pick([2, 4, 6, 8]), U = pick([12, 24, 36])
    const I = U / (R1 + R23)
    const fig = circuitSeriesParallel([`R₁ = ${R1} ${tr('Ом')}`, `R₂ = ${R2} ${tr('Ом')}`, `R₃ = ${R3} ${tr('Ом')}`], `${U} ${tr('В')}`)
    return withFig(num(lt`Найдите силу тока в неразветвлённой части цепи, схема которой показана на рисунке.`,
      I, [U / (R1 + R2 + R3), U / R1, U / R23], n, 'А',
      lt`$R_{23} = \\frac{${R2} \\cdot ${R3}}{${R2 + R3}} = ${R23}$ Ом, $R = ${R1} + ${R23} = ${R1 + R23}$ Ом, $I = \\frac{U}{R} = \\frac{${U}}{${R1 + R23}} = ${fx(I)}$ А.`), fig)
  }),
  calc('Закон Ома для участка цепи. Соединения проводников', n => {
    const [R1, R2, R12] = pick([[6, 3, 2], [4, 4, 2], [12, 6, 4], [10, 10, 5], [20, 5, 4]]), R3 = pick([2, 4, 6, 10]), U = pick([12, 18, 24, 36])
    const I = U / (R12 + R3), U3 = I * R3
    const fig = circuitParallelSeries([`R₁ = ${R1} ${tr('Ом')}`, `R₂ = ${R2} ${tr('Ом')}`, `R₃ = ${R3} ${tr('Ом')}`], `${U} ${tr('В')}`)
    return withFig(num(lt`Найдите напряжение на резисторе $R_3$ в цепи, показанной на рисунке.`,
      U3, [U - U3, U * R3 / (R1 + R2 + R3), U / 2], n, 'В',
      lt`$R_{12} = \\frac{${R1} \\cdot ${R2}}{${R1 + R2}} = ${R12}$ Ом, $I = \\frac{${U}}{${R12} + ${R3}} = ${fx(I)}$ А, $U_3 = IR_3 = ${fx(U3)}$ В.`), fig)
  }),
  hardCalc('Первый закон термодинамики. Адиабатный процесс', n => {
    const p1 = pick([100, 200]), p2 = p1 + pick([100, 200, 300]), V1 = pick([1, 2]), V2 = V1 + pick([2, 3, 4])
    const A = (p2 - p1) * (V2 - V1)
    const fig = plot({ x: [0, V2 + 1, 1], y: [0, p2 + 100, 100], xLabel: axis('V', 'л'), yLabel: axis('p', 'кПа'),
      lines: [{ pts: [[V1, p1], [V1, p2], [V2, p2], [V2, p1], [V1, p1]] }] })
    return withFig(num(lt`Идеальный газ совершает цикл, показанный на рисунке. Какую работу совершает газ за цикл?`,
      A, [p2 * (V2 - V1), (p2 - p1) * V2, A * 1000], n, 'Дж',
      lt`Работа за цикл равна площади цикла на $pV$-диаграмме: $(${p2} - ${p1})$ кПа $\\cdot (${V2} - ${V1})$ л $= ${p2 - p1} \\cdot 10^3 \\cdot ${V2 - V1} \\cdot 10^{-3} = ${A}$ Дж.`), fig)
  }),
  calc('Первый закон термодинамики. Адиабатный процесс', n => {
    const p = pick([100, 200, 300]), V1 = pick([1, 2]), V2 = V1 + pick([2, 3, 4])
    const A = p * (V2 - V1), Q = 2.5 * A
    const fig = plot({ x: [0, V2 + 1, 1], y: [0, p + 100, 100], xLabel: axis('V', 'л'), yLabel: axis('p', 'кПа'), lines: [{ pts: [[V1, p], [V2, p]] }], dots: [[V1, p], [V2, p]] })
    return withFig(num(lt`Одноатомный идеальный газ переходит из состояния 1 в состояние 2 (см. график). Какое количество теплоты получил газ?`,
      Q, [A, 1.5 * A, 4 * A], n, 'Дж',
      lt`Процесс изобарный: $A = p\\Delta V = ${p} \\cdot 10^3 \\cdot ${V2 - V1} \\cdot 10^{-3} = ${A}$ Дж, $\\Delta U = \\frac{3}{2}p\\Delta V = ${fx(1.5 * A)}$ Дж, $Q = \\Delta U + A = ${fx(Q)}$ Дж.`), fig)
  }),
  calc('Гармонические колебания. Амплитуда, период, частота', n => {
    const A = pick([2, 4, 5, 10]), T = pick([0.4, 2, 4])
    const pts: Pt[] = Array.from({ length: 61 }, (_, i) => { const t = (i / 60) * 2 * T; return [t, A * Math.sin((2 * PI * t) / T)] })
    const vmax = (A / 100) * 2 * PI / T
    const fig = plot({ x: [0, 2 * T, T / 2], y: [-A - 2, A + 2, A], xLabel: axis('t', 'с'), yLabel: axis('x', 'см'), lines: [{ pts }] })
    return withFig(num(lt`По графику колебаний найдите максимальную скорость тела. ($\\pi = 3{,}14$)`,
      vmax, [A / 100 / T, vmax * 100, (A / 100) * PI / T], n, 'м/с',
      lt`С графика: амплитуда $A = ${A}$ см, период $T = ${fx(T)}$ с. $v_{max} = A\\omega = A\\frac{2\\pi}{T} = ${fx(A / 100)} \\cdot \\frac{6{,}28}{${fx(T)}} = ${fx(vmax)}$ м/с.`), fig)
  }),
  calc('Закон Гука. Механическое напряжение', n => {
    const xm = pick([4, 5, 10]), F = pick([20, 40, 50, 100]), x0 = pick([2, 3, 4].filter(v => v < xm))
    const k = F / (xm / 100), E = k * (x0 / 100) ** 2 / 2
    const fig = plot({ x: [0, xm + 2, xm >= 10 ? 2 : 1], y: [0, F * 1.2, F / 2], xLabel: axis('x', 'см'), yLabel: axis('F', 'Н'), lines: [{ pts: [[0, 0], [xm, F]] }], dots: [[xm, F]] })
    return withFig(num(lt`По графику зависимости силы упругости от удлинения пружины найдите потенциальную энергию пружины при удлинении ${x0} см.`,
      E, [k * x0 / 100 / 2, k * (x0 / 100) ** 2, F * x0 / 100], n, 'Дж',
      lt`Жёсткость $k = \\frac{F}{x} = \\frac{${F}}{${fx(xm / 100)}} = ${fx(k)}$ Н/м. $E = \\frac{kx^2}{2} = \\frac{${fx(k)} \\cdot ${fx((x0 / 100) ** 2)}}{2} = ${fx(E)}$ Дж.`), fig)
  }),
  calc('Фотоэффект. Уравнение Эйнштейна', n => {
    const nu0 = pick([4, 5, 6]), nu1 = nu0 + pick([4, 6])
    const A = 6.63e-34 * nu0 * 1e14 / 1.6e-19, E1 = 6.63e-34 * (nu1 - nu0) * 1e14 / 1.6e-19
    const fig = plot({ x: [0, nu1 + 2, 2], y: [0, Math.ceil(E1) + 1, 1], xLabel: axis('ν', '10¹⁴ Гц'), yLabel: axis('Eₖ', 'эВ'), lines: [{ pts: [[nu0, 0], [nu1, E1]] }], dots: [[nu0, 0]] })
    return withFig(num(lt`На рисунке график зависимости максимальной кинетической энергии фотоэлектронов от частоты света. Найдите работу выхода электронов из металла. ($h = 6{,}63 \\cdot 10^{-34}$ Дж·с)`,
      A, [E1, A * 2, 6.63e-34 * nu1 * 1e14 / 1.6e-19], n, 'эВ',
      lt`График пересекает ось частот в красной границе $\\nu_0 = ${nu0} \\cdot 10^{14}$ Гц. $A = h\\nu_0 = ${fx(6.63e-34 * nu0 * 1e14)}$ Дж $= ${fx(A)}$ эВ.`), fig)
  }),
]
